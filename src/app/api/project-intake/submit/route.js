// Project Intake submission — V2a.
//
// Flow:
//   1. Validate the payload server-side (defence in depth).
//   2. Build the human-readable filecard summary.
//   3. Generate the Filecard PDF (pdf-lib) and upload it to Vercel Blob.
//   4. Create an Asana task in the intake project (its gid drives everything
//      downstream and makes the project appear in "Current").
//   5. Create the External Project Folder keyed on that gid, and copy the
//      Filecard PDF + all intake attachments into it.
//   6. Append the PDF link to the Asana task notes.
//   7. Best-effort fan-out to Power Automate (V2b) + email stub.
//
// Every integration is best-effort: missing config or a single failure is
// captured in the response, never fatal. Nothing is lost — the summary is
// always logged and returned.

import { NextResponse } from 'next/server';
import { put, copy } from '@vercel/blob';
import { buildFilecardSummary } from '../../../../lib/project-intake/payload';
import { buildFilecardPdf } from '../../../../lib/project-intake/filecard-pdf';
import { asanaConfigured, createIntakeTask, updateTaskNotes, buildTaskName } from '../../../../lib/project-intake/asana';
import {
  isConfigured as dbConfigured,
  createExternalFolder,
  recordExternalFolderFile,
} from '../../../../lib/external-folders/folders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Intake attachment group → External Folder category.
const GROUP_CATEGORY = {
  dwgFloorplan: '02-floorplans',
  pdfFloorplan: '02-floorplans',
  electricalPlan: '02-floorplans',
  photos: '06-photos',
  other: '01-brief',
};

function slugify(s) {
  return (
    String(s || 'project')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'project'
  );
}

function isIso(v) {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function validate(payload) {
  const errs = [];
  const pb = payload?.projectBasics || {};
  const pl = payload?.partnerLocation || {};
  const ct = payload?.contact || {};
  if (!pb.projectName) errs.push('Project name');
  if (!pb.yourName) errs.push('Your name');
  if (!pb.desiredOpeningDate) errs.push('Desired opening date');
  if (!pb.marketRegion) errs.push('Market / Region');
  if (!pl.partnerName) errs.push('Partner name');
  if (!ct.email) errs.push('Contact e-mail');
  return errs;
}

async function notifyEmail(summary, payload) {
  const to = process.env.PROJECT_INTAKE_EMAIL_TO;
  if (!to) return { sent: false, reason: 'PROJECT_INTAKE_EMAIL_TO not set' };
  // Provider not wired in V1/V2a. V2b sends the mail via Power Automate /
  // Outlook instead, so this stays a stub. We log so data is never lost.
  // eslint-disable-next-line no-console
  console.log('[project-intake] email summary (stub) →', to);
  return { sent: false, reason: 'provider_not_configured' };
}

async function notifyPowerAutomate(body) {
  const url = process.env.POWER_AUTOMATE_PROJECT_INTAKE_WEBHOOK;
  if (!url) return { sent: false, reason: 'webhook not set' };
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { sent: r.ok, status: r.status };
  } catch (e) {
    return { sent: false, reason: e.message };
  }
}

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const errs = validate(payload);
  if (errs.length) {
    return NextResponse.json({ error: `Missing required fields: ${errs.join(', ')}` }, { status: 400 });
  }

  const summary = buildFilecardSummary(payload);
  const softShop = Boolean(payload?.derivedFlags?.isSoftShopLikely);
  const projectName = payload.projectBasics.projectName;
  const slug = slugify(projectName);

  // Always capture server-side so nothing is lost if an integration fails.
  // eslint-disable-next-line no-console
  console.log('[project-intake] new submission\n', summary);

  const integrations = { pdf: null, asana: null, folder: null, filesCopied: 0, powerAutomate: null, email: null };

  // 1. Generate the Filecard PDF.
  let pdfBytes = null;
  try {
    pdfBytes = await buildFilecardPdf(payload);
  } catch (e) {
    integrations.pdf = { ok: false, reason: e.message };
  }

  // 2. Upload the PDF to a stable intake location so the rep always gets a link.
  let pdfUrl = null;
  if (pdfBytes) {
    try {
      const blob = await put(`project-intake/filecards/${slug}-${Date.now()}.pdf`, Buffer.from(pdfBytes), {
        access: 'public',
        contentType: 'application/pdf',
      });
      pdfUrl = blob.url;
      integrations.pdf = { ok: true, url: pdfUrl };
    } catch (e) {
      integrations.pdf = { ok: false, reason: e.message };
    }
  }

  // 3. Create the Asana task (its gid drives the folder + Current listing).
  let task = null;
  if (asanaConfigured()) {
    try {
      task = await createIntakeTask({
        name: buildTaskName(payload),
        notes: summary,
        dueOn: payload.projectBasics.desiredOpeningDate,
      });
      integrations.asana = { ok: true, gid: task.gid, url: task.url };
    } catch (e) {
      integrations.asana = { ok: false, reason: e.message };
    }
  } else {
    integrations.asana = { ok: false, reason: 'ASANA_TOKEN not set' };
  }

  // 4. Create the External Project Folder keyed on the task gid.
  let folder = null;
  if (task && dbConfigured()) {
    try {
      folder = await createExternalFolder({
        asanaProjectId: task.gid,
        projectName,
        projectType: softShop ? 'Soft Shop' : 'SIS',
        region: payload.projectBasics.marketRegion,
        dueDate: isIso(payload.projectBasics.desiredOpeningDate) ? payload.projectBasics.desiredOpeningDate : null,
      });
      integrations.folder = { ok: true, id: folder.id, slug: folder.folderUrlSlug };
    } catch (e) {
      integrations.folder = { ok: false, reason: e.message };
    }
  } else if (task && !dbConfigured()) {
    integrations.folder = { ok: false, reason: 'Supabase not configured' };
  }

  // 5. Copy the PDF + all intake attachments into the folder.
  if (folder) {
    if (pdfUrl) {
      try {
        const dest = `${folder.blobPrefix}01-brief/Filecard-${slug}.pdf`;
        const copied = await copy(pdfUrl, dest, { access: 'public' });
        await recordExternalFolderFile({
          folderId: folder.id,
          fileName: dest.split('/').pop(),
          originalName: `Filecard – ${projectName}.pdf`,
          fileType: 'application/pdf',
          fileSize: pdfBytes?.length || 0,
          blobUrl: copied.url,
          blobPath: copied.pathname,
          category: '01-brief',
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[project-intake] PDF copy failed:', e.message);
      }
    }
    for (const [group, meta] of Object.entries(payload.attachments || {})) {
      const cat = GROUP_CATEGORY[group] || '01-brief';
      for (const f of meta?.files || []) {
        if (!f?.url) continue;
        try {
          const safe = (f.originalName || 'file').replace(/[^a-zA-Z0-9._-]+/g, '_');
          const dest = `${folder.blobPrefix}${cat}/${Date.now()}-${safe}`;
          const copied = await copy(f.url, dest, { access: 'public' });
          await recordExternalFolderFile({
            folderId: folder.id,
            fileName: dest.split('/').pop(),
            originalName: f.originalName || safe,
            fileType: f.type || null,
            fileSize: f.size || 0,
            blobUrl: copied.url,
            blobPath: copied.pathname,
            category: cat,
          });
          integrations.filesCopied += 1;
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('[project-intake] attachment copy failed:', e.message);
        }
      }
    }
  }

  // 6. Append the PDF link to the Asana task notes.
  if (task && (folder || pdfUrl)) {
    const extra = ['', '— Selected Frame Command Space —'];
    if (pdfUrl) extra.push(`Filecard PDF: ${pdfUrl}`);
    if (folder) extra.push(`External Project Folder created (Command Space → External Folders → ${projectName}).`);
    try {
      await updateTaskNotes(task.gid, `${summary}\n${extra.join('\n')}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[project-intake] Asana notes update failed:', e.message);
    }
  }

  // 7. Best-effort fan-out (V2b wiring).
  integrations.powerAutomate = await notifyPowerAutomate({
    payload,
    summary,
    pdfUrl,
    asana: integrations.asana,
    folder: integrations.folder,
  });
  integrations.email = await notifyEmail(summary, payload);

  return NextResponse.json({ ok: true, summary, softShop, integrations });
}
