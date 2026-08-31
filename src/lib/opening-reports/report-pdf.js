// Server-side Opening Report PDF.
//
// The existing src/app/opening-reports/pdf.js opens a print window, which is
// right for a person wanting a copy but produces no file to upload — the same
// reason the quotation PDF is generated server-side. This one exists so an
// approved report can be filed into the project folder and OneDrive.
//
// Every drawText goes through safeText(): the StandardFonts encode WinAnsi
// only and throw on anything outside it, and these fields are free text typed
// on a shop floor.

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { safeText } from '../pdf-text';
import { CHECKPOINTS, isCheckpointApplicable, PHOTO_SLOTS } from './checkpoints';

const A4 = [595.28, 841.89];
const M = 48;                       // page margin
const INK = rgb(0.173, 0.173, 0.173);
const MUTED = rgb(0.42, 0.42, 0.42);
const RULE = rgb(0.925, 0.918, 0.898);
const OAK = rgb(0.769, 0.58, 0.29);
const GO = rgb(0.29, 0.486, 0.361);
const NOGO = rgb(0.78, 0.357, 0.29);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

/** ≥ is outside WinAnsi and would be dropped silently, taking the sense with it. */
const readable = (s) => String(s ?? '').replace(/≥/g, '>=').replace(/≤/g, '<=');

const RESULT_LABELS = { ok: 'OK', deviation: 'Deviation', na: 'N/A' };

export async function buildOpeningReportPdf({ report, checkpoints, photos }) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage(A4);
  let y = A4[1] - M;

  const width = () => A4[0] - M * 2;

  const need = (h) => {
    if (y - h < M + 24) {
      page = pdf.addPage(A4);
      y = A4[1] - M;
    }
  };

  const text = (s, { size = 10, f = font, colour = INK, x = M, gap = 0 } = {}) => {
    page.drawText(safeText(readable(s)), { x, y, size, font: f, color: colour });
    y -= size + gap;
  };

  /** Word-wraps within a width, returning the lines rather than drawing. */
  const wrap = (s, size, f, max) => {
    const words = safeText(readable(s)).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(next, size) > max && line) {
        lines.push(line);
        line = w;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  const paragraph = (s, { size = 10, f = font, colour = INK, x = M, max = width(), lead = 3 } = {}) => {
    for (const line of wrap(s, size, f, max)) {
      need(size + lead);
      page.drawText(line, { x, y, size, font: f, color: colour });
      y -= size + lead;
    }
  };

  const rule = (gap = 10) => {
    need(gap + 2);
    page.drawLine({ start: { x: M, y }, end: { x: A4[0] - M, y }, thickness: 0.7, color: RULE });
    y -= gap;
  };

  const heading = (s) => {
    need(30);
    y -= 8;
    text(String(s).toUpperCase(), { size: 8.5, f: bold, colour: MUTED, gap: 6 });
    rule(10);
  };

  // ── Masthead ───────────────────────────────────────────────────────────────
  page.drawRectangle({ x: M, y: y - 4, width: width(), height: 3, color: OAK });
  y -= 22;
  text('SELECTED FRAME  ·  OPENING REPORT', { size: 8.5, f: bold, colour: MUTED, gap: 10 });
  text(`${report.partnerName}, ${report.location}`, { size: 20, f: bold, gap: 6 });

  const approved = report.status === 'approved';
  text(approved ? 'Approved by Brand Spaces' : 'Submitted — awaiting Brand Spaces review', {
    size: 9.5,
    colour: approved ? GO : MUTED,
    gap: 14,
  });

  // ── Facts ──────────────────────────────────────────────────────────────────
  const facts = [
    ['Project', report.projectName || '—'],
    ['Region', report.projectRegion || '—'],
    ['Opening date', fmtDate(report.openingDate)],
    ['Sqm', report.sqm != null ? `${report.sqm} m²` : '—'],
    ['Completed by', report.completedByName],
    ['Submitted', fmtDate(report.submittedAt)],
  ];
  if (approved) {
    facts.push(['Approved by', report.approvedByName || '—']);
    facts.push(['Approved at', fmtDate(report.approvedAt)]);
  }

  rule(12);
  const colW = width() / 2;
  for (let i = 0; i < facts.length; i += 2) {
    need(26);
    const row = facts.slice(i, i + 2);
    const rowY = y;
    row.forEach(([label, value], col) => {
      const x = M + col * colW;
      page.drawText(safeText(label.toUpperCase()), { x, y: rowY, size: 7.5, font: bold, color: MUTED });
      page.drawText(safeText(readable(value)).slice(0, 60), { x, y: rowY - 13, size: 10.5, font, color: INK });
    });
    y = rowY - 30;
  }
  rule(6);

  // ── Checkpoints ────────────────────────────────────────────────────────────
  const byNo = new Map((checkpoints || []).map((c) => [c.checkpointNo, c]));

  for (const tier of [1, 2]) {
    heading(tier === 1 ? 'Tier 1 — must verify on site' : 'Tier 2 — note if visible');

    for (const def of CHECKPOINTS.filter((c) => c.tier === tier)) {
      const cp = byNo.get(def.no);
      const applicable = isCheckpointApplicable(def.no, report.sqm);
      const result = applicable ? (cp?.result || null) : 'na';

      need(30);
      const startY = y;

      // Result chip, right-aligned so the eye can run down the column.
      const label = result ? (RESULT_LABELS[result] || result) : 'Not answered';
      const chipColour = result === 'ok' ? GO : result === 'deviation' ? NOGO : MUTED;
      const chipW = bold.widthOfTextAtSize(safeText(label), 8) + 12;
      page.drawText(safeText(label), {
        x: A4[0] - M - chipW + 6,
        y: startY,
        size: 8,
        font: bold,
        color: chipColour,
      });

      page.drawText(safeText(String(def.no).padStart(2, '0')), {
        x: M, y: startY, size: 9, font: bold, color: MUTED,
      });

      const titleLines = wrap(def.title, 9.5, font, width() - 24 - chipW - 12);
      titleLines.forEach((line, i) => {
        page.drawText(line, { x: M + 22, y: startY - i * 12.5, size: 9.5, font, color: applicable ? INK : MUTED });
      });
      y = startY - titleLines.length * 12.5;

      if (cp?.comment) {
        y -= 2;
        paragraph(cp.comment, { size: 8.5, colour: MUTED, x: M + 22, max: width() - 22, lead: 2.5 });
      }
      if (!applicable) {
        y -= 2;
        paragraph('Not applicable below 50 m².', { size: 8.5, colour: MUTED, x: M + 22, max: width() - 22 });
      }
      y -= 8;
    }
  }

  // ── Handover ───────────────────────────────────────────────────────────────
  heading('Handover of responsibility');
  text('Shopfloor responsible', { size: 7.5, f: bold, colour: MUTED, gap: 4 });
  text(report.shopfloorResponsible || '—', { size: 10.5, gap: 10 });
  text('Contact', { size: 7.5, f: bold, colour: MUTED, gap: 4 });
  text(report.responsibleContact || '—', { size: 10.5, gap: 10 });
  text('Responsibility from', { size: 7.5, f: bold, colour: MUTED, gap: 4 });
  text(report.responsibilityWhen || '—', { size: 10.5, gap: 6 });

  if (report.followUpNeeded) {
    heading('Follow-up required');
    paragraph(
      `Owner: ${report.followUpOwner || '—'}    Deadline: ${fmtDate(report.followUpDeadline)}`,
      { size: 10 },
    );
  }

  if (approved && report.approvalNote) {
    heading('Approval note');
    paragraph(report.approvalNote, { size: 10 });
  }

  // ── Photos ─────────────────────────────────────────────────────────────────
  // pdf-lib embeds JPEG and PNG only. HEIC comes straight off an iPhone and
  // WebP off a Mac screenshot, so anything else is listed by name instead of
  // being dropped in silence — the original still goes to the folder.
  const slotLabel = Object.fromEntries(PHOTO_SLOTS.map((s) => [s.id, s.label]));
  const unembeddable = [];

  if (photos?.length) {
    heading('Photos');
    for (const photo of photos) {
      let image = null;
      try {
        const res = await fetch(photo.blobUrl);
        if (!res.ok) throw new Error(`fetch ${res.status}`);
        const bytes = new Uint8Array(await res.arrayBuffer());
        const name = String(photo.fileName || '').toLowerCase();
        if (/\.png$/.test(name)) image = await pdf.embedPng(bytes);
        else if (/\.jpe?g$/.test(name)) image = await pdf.embedJpg(bytes);
        else {
          // Trust the bytes over the extension: a JPEG starts FF D8 FF.
          if (bytes[0] === 0xff && bytes[1] === 0xd8) image = await pdf.embedJpg(bytes);
          else if (bytes[0] === 0x89 && bytes[1] === 0x50) image = await pdf.embedPng(bytes);
        }
      } catch {
        image = null;
      }

      if (!image) {
        unembeddable.push(photo);
        continue;
      }

      const maxW = width();
      const maxH = 300;
      const scale = Math.min(maxW / image.width, maxH / image.height, 1);
      const w = image.width * scale;
      const h = image.height * scale;

      need(h + 26);
      text(slotLabel[photo.slot] || photo.slot, { size: 7.5, f: bold, colour: MUTED, gap: 6 });
      y -= h;
      page.drawImage(image, { x: M, y, width: w, height: h });
      y -= 16;
    }
  }

  if (unembeddable.length) {
    heading('Photos not shown in this PDF');
    paragraph(
      'These are stored with the report and filed alongside it, but their format cannot be embedded in a PDF:',
      { size: 9, colour: MUTED },
    );
    y -= 4;
    for (const p of unembeddable) {
      need(14);
      text(`· ${p.fileName} (${slotLabel[p.slot] || p.slot})`, { size: 9, colour: MUTED, gap: 3 });
    }
  }

  return {
    bytes: await pdf.save(),
    embeddedPhotos: (photos?.length || 0) - unembeddable.length,
    skippedPhotos: unembeddable.length,
  };
}

/** `Opening Report - Magasin, Lyngby.pdf` */
export function openingReportPdfName(report) {
  const base = `Opening Report - ${report.partnerName}, ${report.location}`;
  return `${base.replace(/[\\/:*?"<>|]+/g, '-').slice(0, 120)}.pdf`;
}
