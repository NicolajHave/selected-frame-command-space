// PDF export for Opening Reports.
// Mirrors the Quotation Builder pattern (src/app/page.js, exportPDF):
// open a new window, inject inline HTML + CSS, and let the user use the
// browser's print → save-as-PDF. No headless renderer needed.

import { CHECKPOINTS, isCheckpointApplicable } from '../../lib/opening-reports/checkpoints';

const LOGO_BLACK = '/images/logo-black.png';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function resultBadge(result) {
  if (result === 'ok')        return '<span class="bdg ok">OK</span>';
  if (result === 'deviation') return '<span class="bdg dev">Deviation</span>';
  if (result === 'na')        return '<span class="bdg na">N/A</span>';
  return '<span class="bdg pend">Pending</span>';
}

export function openOpeningReportPdf({ report, checkpoints, photos }) {
  const isApproved = report.status === 'approved';
  const cpById = new Map(checkpoints.map((c) => [c.checkpointNo, c]));
  const visibleCps = CHECKPOINTS.filter((c) => isCheckpointApplicable(c.no, report.sqm));
  const tier1 = visibleCps.filter((c) => c.tier === 1);
  const tier2 = visibleCps.filter((c) => c.tier === 2);
  const deviations = visibleCps
    .map((c) => ({ meta: c, row: cpById.get(c.no) }))
    .filter(({ row }) => row?.result === 'deviation');

  const photoBySlot = new Map();
  for (const p of photos) {
    if (!photoBySlot.has(p.slot)) photoBySlot.set(p.slot, []);
    photoBySlot.get(p.slot).push(p);
  }

  const renderCheckpointRow = (cp) => {
    const row = cpById.get(cp.no);
    return `<tr>
      <td class="num">${cp.no}</td>
      <td>${escapeHtml(cp.title)}</td>
      <td class="r">${resultBadge(row?.result)}</td>
      <td class="cmt">${escapeHtml(row?.comment || '')}</td>
    </tr>`;
  };

  const photoBlock = (slotId, label) => {
    const list = photoBySlot.get(slotId) || [];
    if (!list.length) return '';
    return `<div class="phblock">
      <div class="phlbl">${escapeHtml(label)}</div>
      <div class="phgrid">
        ${list.map((p) => `<img src="${escapeHtml(p.blobUrl)}" alt="${escapeHtml(label)}"/>`).join('')}
      </div>
    </div>`;
  };

  const html = `<!DOCTYPE html><html><head>
<title>Opening Report – ${escapeHtml(report.partnerName)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'DM Sans',sans-serif;color:#2C2C2C;padding:40px 60px;max-width:920px;margin:0 auto;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .hd{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #1A1A1A}
  .logo-img{height:32px;width:auto;max-width:240px;object-fit:contain;margin-bottom:8px;display:block}
  .logo-tag{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#8A8D8F}
  .meta{text-align:right;font-size:12px;color:#6B6B6B}
  .meta strong{color:#2C2C2C;display:block;font-size:14px;margin-bottom:4px}
  .meta .row{margin-top:6px}
  .meta .lbl{display:inline-block;min-width:90px;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#8A8D8F}
  .status-pill{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;padding:3px 9px;border-radius:4px;margin-top:6px}
  .status-submitted{background:#FDF3E0;color:#C4944A;border:1px solid #C4944A55}
  .status-approved{background:#E8F2EA;color:#4A7C5C;border:1px solid #4A7C5C55}
  h2{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:400;margin:30px 0 14px;padding-bottom:8px;border-bottom:1px solid #ECEAE5}
  h3{font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#6B6B6B;margin:20px 0 8px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{text-align:left;padding:8px 12px;background:#F5F4F1;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#6B6B6B;border-bottom:1px solid #ECEAE5;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  td{padding:8px 12px;border-bottom:1px solid #F5F4F1;vertical-align:top}
  td.num{font-family:'DM Mono',monospace;color:#8A8D8F;width:32px}
  td.r{text-align:right;width:110px}
  td.cmt{color:#6B6B6B;font-size:11px;font-style:italic;width:28%}
  .bdg{display:inline-block;font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;padding:3px 8px;border-radius:4px}
  .bdg.ok{background:#E8F2EA;color:#4A7C5C}
  .bdg.dev{background:#FBE5E1;color:#C75B4A}
  .bdg.na{background:#F0F0F0;color:#6B6B6B}
  .bdg.pend{background:#FDF3E0;color:#C4944A}
  .meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:10px}
  .meta-grid .cell{padding:10px 14px;background:#F5F4F1;border-radius:6px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .meta-grid .cl{font-size:9px;font-weight:600;color:#8A8D8F;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
  .meta-grid .cv{font-size:13px;color:#2C2C2C}
  .dev-callout{margin-top:16px;padding:14px 18px;background:#FBE5E1;border-left:3px solid #C75B4A;border-radius:6px;font-size:12px;color:#2C2C2C;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .dev-callout strong{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#6B6B6B;margin-bottom:6px}
  .dev-list{margin:0;padding-left:18px}
  .dev-list li{margin-bottom:6px}
  .phblock{margin-top:14px}
  .phlbl{font-size:10px;font-weight:600;color:#6B6B6B;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
  .phgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
  .phgrid img{width:100%;height:auto;aspect-ratio:4 / 3;object-fit:cover;border-radius:6px;border:1px solid #ECEAE5}
  .confirm{margin-top:32px;padding:20px 22px;background:#1A1A1A;color:#fff;border-radius:8px;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
  .confirm .lbl{font-size:10px;color:#B8BBBE;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
  .confirm .val{font-size:15px;font-family:'Cormorant Garamond',serif}
  .confirm .row2{margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:18px}
  .confirm .note{margin-top:14px;font-size:12px;color:#B8BBBE;font-style:italic;line-height:1.5}
  .ft{margin-top:40px;padding-top:18px;border-top:1px solid #ECEAE5;font-size:10px;color:#8A8D8F;display:flex;justify-content:space-between}
  @media print{body{padding:20px 40px}button{display:none!important}.phgrid img{break-inside:avoid}.confirm{background:#1A1A1A!important;color:#fff!important}}
</style></head><body>

<div class="hd">
  <div>
    <img src="${LOGO_BLACK}" alt="Selected Frame" class="logo-img"/>
    <span class="logo-tag">[ Opening Report ]</span>
  </div>
  <div class="meta">
    <strong>${escapeHtml(report.partnerName)}</strong>
    ${escapeHtml(report.location)}
    <div class="row"><span class="lbl">Opening date</span> ${fmtDate(report.openingDate)}</div>
    ${report.sqm ? `<div class="row"><span class="lbl">Sqm</span> ${escapeHtml(report.sqm)} m²</div>` : ''}
    <div class="row"><span class="lbl">Submitted</span> ${fmtDate(report.submittedAt)}</div>
    <div><span class="status-pill ${isApproved ? 'status-approved' : 'status-submitted'}">${isApproved ? 'Approved' : 'Submitted'}</span></div>
  </div>
</div>

<button onclick="window.print()" style="background:#1A1A1A;color:#fff;border:none;padding:10px 24px;border-radius:6px;font-size:13px;cursor:pointer;margin-bottom:24px">Print / Save as PDF</button>

<h2>Responsibility</h2>
<div class="meta-grid">
  <div class="cell"><div class="cl">Completed by</div><div class="cv">${escapeHtml(report.completedByName)}</div></div>
  <div class="cell"><div class="cl">Shopfloor responsible</div><div class="cv">${escapeHtml(report.shopfloorResponsible || '—')}</div></div>
  <div class="cell"><div class="cl">Contact</div><div class="cv">${escapeHtml(report.responsibleContact || '—')}</div></div>
  <div class="cell"><div class="cl">Responsibility from</div><div class="cv">${report.responsibilityWhen === 'at_opening' ? 'At opening' : report.responsibilityWhen === 'at_first_visit' ? 'At first visit' : '—'}</div></div>
</div>

<h2>Compliance — Tier 1 (Must verify)</h2>
<table>
  <thead><tr><th>#</th><th>Checkpoint</th><th class="r">Result</th><th>Comment</th></tr></thead>
  <tbody>${tier1.map(renderCheckpointRow).join('')}</tbody>
</table>

<h2>Compliance — Tier 2 (Note if visible)</h2>
<table>
  <thead><tr><th>#</th><th>Checkpoint</th><th class="r">Result</th><th>Comment</th></tr></thead>
  <tbody>${tier2.map(renderCheckpointRow).join('')}</tbody>
</table>

${deviations.length ? `<div class="dev-callout">
  <strong>Deviations (${deviations.length})</strong>
  <ul class="dev-list">
    ${deviations.map(({ meta, row }) => `<li><strong style="font-style:normal;display:inline">#${meta.no}.</strong> ${escapeHtml(meta.title)}${row?.comment ? ` — <em>${escapeHtml(row.comment)}</em>` : ''}</li>`).join('')}
  </ul>
</div>` : ''}

${photos.length ? `<h2>Photos</h2>
${photoBlock('entrance', 'Entrance zone')}
${photoBlock('overview', 'Full overview')}
${photoBlock('hero_wall', 'Hero wall')}
${photoBlock('logo', 'Logo detail')}
${photoBlock('extra', 'Additional')}` : ''}

${report.followUpNeeded ? `<h2>Follow-up</h2>
<div class="meta-grid">
  <div class="cell"><div class="cl">Owner</div><div class="cv">${escapeHtml(report.followUpOwner || '—')}</div></div>
  <div class="cell"><div class="cl">Deadline</div><div class="cv">${fmtDate(report.followUpDeadline)}</div></div>
  <div class="cell"><div class="cl">Status</div><div class="cv">Action required</div></div>
</div>` : ''}

<div class="confirm">
  <div class="lbl">Submitted by</div>
  <div class="val">${escapeHtml(report.completedByName)}</div>
  <div class="row2">
    <div><div class="lbl">Submitted at</div><div class="val">${fmtDate(report.submittedAt)}</div></div>
    ${isApproved ? `<div><div class="lbl">Approved by</div><div class="val">${escapeHtml(report.approvedByName || '—')}</div></div>` : ''}
  </div>
  ${isApproved ? `<div class="row2">
    <div><div class="lbl">Approved at</div><div class="val">${fmtDate(report.approvedAt)}</div></div>
    <div></div>
  </div>` : ''}
  ${isApproved && report.approvalNote ? `<div class="note">"${escapeHtml(report.approvalNote)}"</div>` : ''}
</div>

<div class="ft"><span>Selected Frame · Brand Spaces</span><span>Confidential</span></div>
</body></html>`;

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}
