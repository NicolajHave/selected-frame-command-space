// The concept information page inserted after the cover of a Draft Studio
// document.
//
// A draft is sent before anything is agreed, so this page is deliberately
// *pre-text*: it tells the partner what a Selected Frame installation asks of
// the site, so they can plan for it early — it does not ask them to confirm
// anything. The confirmations belong to the Final Installation Alignment,
// which uses the same points in binding form. Keep the two in step when the
// concept changes.
//
// Layout is relative to the cover's page size, because supplier drafts arrive
// in whatever format the supplier uses. Left column: the standard text. Right
// column: an optional image in a FIXED-height box, then optional free text —
// the box is what stops a tall photo from running over the notes.

import { rgb } from 'pdf-lib';
import { safeText } from './pdf-text';

const INK = rgb(0.173, 0.173, 0.173);
const MUTED = rgb(0.42, 0.42, 0.42);
const OAK = rgb(0.769, 0.58, 0.29);
const RULE = rgb(0.925, 0.918, 0.898);
const SURFACE = rgb(0.961, 0.957, 0.945);

export const INFO_PAGE_COPY = {
  eyebrow: 'SELECTED FRAME  ·  DRAFT',
  title: 'What the concept involves',
  intro:
    'This draft shows the proposed Selected Frame layout. Nothing on these pages is final — design, scope and dates are confirmed together in the Final Installation Alignment before anything is ordered. The points below describe what a Selected Frame installation asks of the site, so they can be planned for early.',
  sections: [
    {
      heading: 'How an installation runs',
      items: [
        'The installation area needs to be ready and accessible at the time agreed in the Final Alignment.',
        'Delays from unfinished site preparation affect the installation timeline.',
        'On-site work beyond the Selected Frame scope is aligned separately.',
        'Local requirements, restrictions or changes need to reach us before installation is planned.',
      ],
    },
    {
      heading: 'Site readiness',
      lead: 'Before installation the site will need to be at this point — it is confirmed in the Final Alignment:',
      items: [
        'The space is fully cleared of existing fixtures, stock and materials.',
        'Walls are finished and painted in the concept colour: NCS S 1005-G30Y (gloss 10).',
        'Flooring is completed and protected where required.',
        'Electrical work is completed to the electrical plan, which follows with the final drawings. LED logos are fitted on the installation days, so a local electrician will need to be booked once dates are set.',
        'Power outlets are installed, tested and ready for use.',
        'Internet access is available for digital screens, where applicable.',
        'Permissions, access approvals and mall or store regulations are handled locally.',
      ],
    },
  ],
  notesHeading: 'Notes for this draft',
};

/**
 * Word-wrap one already-sanitised paragraph — no newlines in it by this point.
 */
function wrapOne(text, font, size, max) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > max && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Word-wrap into lines no wider than `max` at `size`, keeping line breaks.
 *
 * Splits on newlines FIRST and sanitises each line after. safeText drops every
 * character below 0x20 — a newline included — so sanitising the whole block up
 * front silently glued the lines together into one run of text.
 */
function wrap(text, font, size, max) {
  return String(text)
    .split(/\r?\n/)
    .flatMap((para) => wrapOne(safeText(para), font, size, max));
}

/**
 * Notes as the writer typed them: one line per line, blank lines kept, and a
 * line starting with "-", "*" or "•" rendered as a bullet with its wrapped
 * continuation lines indented under the text rather than under the bullet.
 */
function layoutNotes(text, font, size, max, indent) {
  const out = [];
  for (const raw of String(text).split(/\r?\n/)) {
    const line = safeText(raw).trim();
    if (!line) { out.push({ text: '', bullet: false, indent: 0 }); continue; }
    const m = line.match(/^[-*•]\s*(.*)$/);
    const body = m ? m[1] : line;
    if (m && !body) { out.push({ text: '', bullet: false, indent: 0 }); continue; }
    wrapOne(body, font, size, m ? max - indent : max).forEach((t, i) => {
      out.push({ text: t, bullet: Boolean(m) && i === 0, indent: m ? indent : 0 });
    });
  }
  return out;
}

/**
 * Insert the page at index 1 of `pdfDoc`, sized like the cover.
 *
 * @param pdfDoc         pdf-lib document
 * @param fonts          { regular, bold } embedded StandardFonts
 * @param notes          optional free text from the form
 * @param image          optional embedded pdf-lib image (already embedPng/embedJpg)
 * @param bottomReserve  points to keep clear at the bottom right, for the Frame
 *                       logo that the pipeline draws on every page afterwards
 * @returns { page, warnings }
 */
export function insertInfoPage(pdfDoc, { fonts, notes = '', image = null, bottomReserve = 0 }) {
  const cover = pdfDoc.getPage(0);
  const W = cover.getWidth();
  const H = cover.getHeight();
  const page = pdfDoc.insertPage(1, [W, H]);
  const warnings = [];

  const { regular, bold } = fonts;

  // Everything scales from the page width so the page reads the same on A3
  // and A2, and on a portrait page the columns simply become narrower.
  const base = Math.max(9, Math.min(14, W / 95));
  const M = Math.round(W * 0.055);
  const gutter = Math.round(W * 0.05);
  const contentW = W - M * 2;
  const leftW = Math.round(contentW * 0.56);
  const rightX = M + leftW + gutter;
  const rightW = contentW - leftW - gutter;
  const lead = base * 1.45;

  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: M, y: H - M + base, width: contentW, height: base * 0.3, color: OAK });

  let y = H - M - base * 0.6;

  const text = (s, { size = base, font = regular, colour = INK, x = M } = {}) => {
    page.drawText(safeText(s), { x, y, size, font, color: colour });
  };

  // ── Left column ────────────────────────────────────────────────────────────
  text(INFO_PAGE_COPY.eyebrow, { size: base * 0.75, font: bold, colour: MUTED });
  y -= base * 2.1;
  text(INFO_PAGE_COPY.title, { size: base * 2.3, font: bold });
  y -= base * 2.6;

  const drawParagraph = (s, { size = base, font = regular, colour = INK, x = M, max = leftW, gap = lead } = {}) => {
    for (const line of wrap(safeText(s), font, size, max)) {
      page.drawText(line, { x, y, size, font, color: colour });
      y -= gap;
    }
  };

  drawParagraph(INFO_PAGE_COPY.intro, { colour: MUTED, gap: lead * 0.98 });
  y -= base * 0.6;

  const bulletIndent = base * 1.3;
  for (const section of INFO_PAGE_COPY.sections) {
    y -= base * 0.9;
    page.drawLine({ start: { x: M, y: y + base * 0.9 }, end: { x: M + leftW, y: y + base * 0.9 }, thickness: 0.6, color: RULE });
    text(section.heading.toUpperCase(), { size: base * 0.78, font: bold, colour: MUTED });
    y -= lead * 1.15;
    if (section.lead) {
      drawParagraph(section.lead, { size: base * 0.95, colour: MUTED, gap: lead * 0.95 });
      y -= base * 0.25;
    }
    for (const item of section.items) {
      page.drawText('•', { x: M, y, size: base, font: regular, color: OAK });
      const lines = wrap(safeText(item), regular, base * 0.95, leftW - bulletIndent);
      lines.forEach((line) => {
        page.drawText(line, { x: M + bulletIndent, y, size: base * 0.95, font: regular, color: INK });
        y -= lead * 0.95;
      });
      y -= base * 0.25;
    }
  }

  if (y < M) warnings.push('Concept text ran past the bottom margin on this page size');

  // ── Right column ───────────────────────────────────────────────────────────
  // The image box has a FIXED height. The picture is fitted inside it and never
  // sized by its own dimensions, so a tall photo cannot push into the notes.
  const rightTop = H - M - base * 0.6;
  const rightBottom = M + bottomReserve;
  const rightH = rightTop - rightBottom;
  const boxH = Math.round(rightH * 0.46);
  let ry = rightTop;

  if (image) {
    page.drawRectangle({ x: rightX, y: ry - boxH, width: rightW, height: boxH, color: SURFACE });
    const pad = base * 0.6;
    const scale = Math.min((rightW - pad * 2) / image.width, (boxH - pad * 2) / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    page.drawImage(image, {
      x: rightX + (rightW - w) / 2,
      y: ry - boxH + (boxH - h) / 2,
      width: w,
      height: h,
    });
    ry -= boxH + base * 1.6;
  }

  const trimmed = String(notes || '').trim();
  if (trimmed) {
    page.drawText(safeText(INFO_PAGE_COPY.notesHeading.toUpperCase()), {
      x: rightX, y: ry, size: base * 0.78, font: bold, color: MUTED,
    });
    ry -= lead * 1.15;

    // Cap at what fits above the reserved corner; say so rather than let the
    // last lines vanish under the logo.
    const maxLines = Math.max(0, Math.floor((ry - rightBottom) / lead));
    let lines = layoutNotes(trimmed, regular, base, rightW, base * 1.1);
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      const last = lines[lines.length - 1];
      if (last?.text) last.text = `${last.text.replace(/\s+\S*$/, '')} …`;
      warnings.push(`Notes were cut to ${maxLines} lines to fit the page`);
    }
    for (const line of lines) {
      if (line.bullet) {
        page.drawText('•', { x: rightX, y: ry, size: base, font: regular, color: OAK });
      }
      if (line.text) {
        page.drawText(line.text, { x: rightX + line.indent, y: ry, size: base, font: regular, color: INK });
      }
      ry -= lead;   // a blank line still takes a line, so paragraphs stay apart
    }
  }

  return { page, warnings };
}
