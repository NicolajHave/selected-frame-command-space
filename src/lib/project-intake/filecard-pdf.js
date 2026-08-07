// Filecard PDF generator — server-side, pdf-lib (same stack as PDF Studio).
//
// Produces an A4 portrait document in the Selected identity: black wordmark
// logo, oak section rules, Helvetica body. Rendered from the structured
// sections in payload.js so it always matches the text summary.
//
// Returns a Uint8Array of PDF bytes, ready to upload to Vercel Blob.

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildFilecardSections } from './payload';
import { safeText } from '../pdf-text';

const A4 = { w: 595.28, h: 841.89 };
const M = 48;                     // page margin
const CONTENT_W = A4.w - M * 2;
const LABEL_W = 168;
const VALUE_W = CONTENT_W - LABEL_W;

const BLACK = rgb(0.102, 0.102, 0.102);  // #1A1A1A
const TEXT = rgb(0.173, 0.173, 0.173);   // #2C2C2C
const GREY = rgb(0.42, 0.42, 0.42);      // #6B6B6B
const OAK = rgb(0.769, 0.580, 0.290);    // #C4944A
const RULE = rgb(0.925, 0.918, 0.898);   // #ECEAE5

// Greedy word-wrap to a max width at a given size.
function wrap(text, font, size, maxW) {
  const out = [];
  for (const paragraph of safeText(text).split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) { out.push(''); continue; }
    let line = '';
    for (const w of words) {
      const trial = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(trial, size) > maxW && line) {
        out.push(line);
        line = w;
      } else {
        line = trial;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

export async function buildFilecardPdf(payload) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let logo = null;
  try {
    const bytes = await fs.readFile(path.join(process.cwd(), 'public/images/logo-black.png'));
    logo = await doc.embedPng(bytes);
  } catch { /* logo is optional — header falls back to text */ }

  // All user-supplied text passes through safeText: the standard fonts are
  // WinAnsi-only and a stray character would throw mid-render.
  const draw = (pg, str, o) => pg.drawText(safeText(str), o);
  const wOf = (f, str, size) => f.widthOfTextAtSize(safeText(str), size);

  const pages = [];
  let page = null;
  let y = 0;

  const newPage = () => {
    page = doc.addPage([A4.w, A4.h]);
    pages.push(page);
    y = A4.h - M;
  };

  const ensure = (h) => { if (y - h < M + 40) newPage(); };

  newPage();

  // ── Header (first page) ──
  if (logo) {
    const lw = 132;
    const lh = (logo.height / logo.width) * lw;
    page.drawImage(logo, { x: M, y: y - lh, width: lw, height: lh });
    y -= lh + 10;
  }
  draw(page, 'PROJECT INTAKE FILECARD', { x: M, y: y - 14, size: 9, font: bold, color: GREY, characterSpacing: 2 });
  y -= 26;
  const title = payload.projectBasics?.projectName || 'Selected Frame Project';
  draw(page, title, { x: M, y: y - 22, size: 22, font: bold, color: BLACK });
  y -= 34;
  const submitted = `Submitted ${new Date(payload.submittedAt).toLocaleString('en-GB')}`;
  draw(page, submitted, { x: M, y: y - 12, size: 10, font, color: GREY });
  y -= 26;
  page.drawLine({ start: { x: M, y }, end: { x: A4.w - M, y }, thickness: 2, color: BLACK });
  y -= 24;

  // ── Sections ──
  for (const section of buildFilecardSections(payload)) {
    // Section title with oak rule.
    ensure(40);
    draw(page, section.title.toUpperCase(), { x: M, y: y - 11, size: 11, font: bold, color: OAK, characterSpacing: 1 });
    y -= 18;
    page.drawLine({ start: { x: M, y }, end: { x: A4.w - M, y }, thickness: 0.75, color: RULE });
    y -= 16;

    if (section.text) {
      const lines = wrap(section.text, font, 10.5, CONTENT_W);
      for (const ln of lines) {
        ensure(15);
        draw(page, ln, { x: M, y: y - 10, size: 10.5, font, color: TEXT });
        y -= 15;
      }
      y -= 10;
      continue;
    }

    if (!section.rows.length) {
      ensure(15);
      draw(page, '—', { x: M, y: y - 10, size: 10.5, font, color: GREY });
      y -= 18;
      continue;
    }

    for (const [label, value] of section.rows) {
      const valueLines = wrap(value, font, 10.5, VALUE_W);
      const rowH = Math.max(15, valueLines.length * 14) + 4;
      ensure(rowH);
      const rowTop = y;
      // Label (grey, left column).
      const labelLines = wrap(label, bold, 9, LABEL_W - 10);
      labelLines.forEach((ll, i) => {
        draw(page, ll, { x: M, y: rowTop - 9 - i * 12, size: 9, font: bold, color: GREY });
      });
      // Value (right column, wraps).
      valueLines.forEach((vl, i) => {
        draw(page, vl, { x: M + LABEL_W, y: rowTop - 9 - i * 14, size: 10.5, font, color: TEXT });
      });
      y = rowTop - rowH;
    }
    y -= 12;
  }

  // ── Footer + page numbers on every page ──
  const total = pages.length;
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: M - 14 }, end: { x: A4.w - M, y: M - 14 }, thickness: 0.5, color: RULE });
    draw(p, 'Selected Frame · Brand Spaces', { x: M, y: M - 28, size: 8, font, color: GREY });
    const conf = 'Confidential';
    draw(p, conf, { x: (A4.w - wOf(font, conf, 8)) / 2, y: M - 28, size: 8, font, color: GREY });
    const pageLabel = `${i + 1} / ${total}`;
    draw(p, pageLabel, { x: A4.w - M - wOf(font, pageLabel, 8), y: M - 28, size: 8, font, color: GREY });
  });

  return doc.save();
}
