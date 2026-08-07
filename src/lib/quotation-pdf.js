// Quotation PDF generator — server-side, pdf-lib (same stack as the filecard).
//
// Produces the A4 portrait quotation in the Selected identity. This is the
// single renderer for a quotation that gets stored in a project folder, so the
// filed document and the downloaded one are byte-identical.
//
// Returns a Uint8Array of PDF bytes.

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';

const A4 = { w: 595.28, h: 841.89 };
const M = 48;
const CONTENT_W = A4.w - M * 2;

const BLACK = rgb(0.102, 0.102, 0.102);
const TEXT = rgb(0.173, 0.173, 0.173);
const GREY = rgb(0.42, 0.42, 0.42);
const OAK = rgb(0.769, 0.580, 0.290);
const RULE = rgb(0.925, 0.918, 0.898);
const SURFACE = rgb(0.961, 0.957, 0.945);
const WHITE = rgb(1, 1, 1);
const DANGER = rgb(0.78, 0.357, 0.290);

// The standard fonts encode WinAnsi (CP1252) only. Anything outside it throws
// at draw time and would take the whole export down — a typographic minus
// (U+2212) in a negative custom item was enough. Normalise what we can and
// drop the rest, so an odd character in a project name degrades instead of
// failing. € and the curly quotes/dashes ARE in CP1252, so they survive.
const CP1252_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
function safeText(s) {
  return String(s ?? '')
    .replace(/[−‐‑]/g, '-')
    .split('')
    .filter((ch) => {
      const c = ch.charCodeAt(0);
      return (c >= 0x20 && c <= 0xff) || CP1252_EXTRA.includes(ch);
    })
    .join('');
}

function fmtMoney(n, cur) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  const abs = Math.abs(Math.round(n)).toLocaleString(cur?.locale || 'de-DE');
  const sym = cur?.symbol || '€';
  return n < 0 ? `-${sym}${abs}` : `${sym}${abs}`;
}

function wrap(text, font, size, maxW) {
  const out = [];
  for (const para of safeText(text).split('\n')) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) { out.push(''); continue; }
    let line = '';
    for (const w of words) {
      const trial = line ? `${line} ${w}` : w;
      // Input is already safeText'd above, so measure directly.
      if (font.widthOfTextAtSize(trial, size) > maxW && line) { out.push(line); line = w; }
      else line = trial;
    }
    if (line) out.push(line);
  }
  return out;
}

export async function buildQuotationPdf(data) {
  const {
    header = {}, currency, rows = [], addOns = [], customs = [],
    supTotal = 0, aoTotal = 0, custTotal = 0, grand = 0, sqmPrice = 0,
    split = null, itemised = null,
  } = data || {};
  const cur = currency || { code: 'EUR', symbol: '€', locale: 'de-DE' };

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let logo = null;
  try {
    const bytes = await fs.readFile(path.join(process.cwd(), 'public/images/logo-black.png'));
    logo = await doc.embedPng(bytes);
  } catch { /* optional */ }

  // Every draw and every measurement goes through safeText, so no unencodable
  // character can reach pdf-lib from user-supplied names.
  const draw = (p, s, o) => p.drawText(safeText(s), o);
  const wOf = (f, s, size) => f.widthOfTextAtSize(safeText(s), size);

  const pages = [];
  let page = null, y = 0;
  const newPage = () => { page = doc.addPage([A4.w, A4.h]); pages.push(page); y = A4.h - M; };
  const ensure = (h) => { if (y - h < M + 40) newPage(); };
  newPage();

  // ── Header ──
  if (logo) {
    const lw = 132, lh = (logo.height / logo.width) * lw;
    page.drawImage(logo, { x: M, y: y - lh, width: lw, height: lh });
  }
  draw(page, '[ A FRAME FOR THE BUSINESS WE SHARE ]', { x: M, y: y - 44, size: 7, font, color: GREY, characterSpacing: 1.4 });

  // Meta block, right aligned.
  const metaRows = [
    ['Date', header.quotationDate || '—'],
    ['Valid until', header.validUntil || '—'],
    header.salesArea ? ['Sales area', `${header.salesArea} m²`] : null,
    header.gender ? ['Gender', header.gender] : null,
    ['Currency', cur.code],
  ].filter(Boolean);

  draw(page, 'Quotation', { x: A4.w - M - wOf(bold, 'Quotation', 13), y: y - 4, size: 13, font: bold, color: BLACK });
  let my = y - 20;
  const projLines = wrap(header.project || 'Selected Frame', font, 10, 240);
  for (const l of projLines) {
    draw(page, l, { x: A4.w - M - wOf(font, l, 10), y: my, size: 10, font, color: GREY });
    my -= 13;
  }
  for (const [k, v] of metaRows) {
    const vs = String(v);
    draw(page, vs, { x: A4.w - M - wOf(font, vs, 10), y: my, size: 10, font, color: TEXT });
    const kw = wOf(font, vs, 10);
    draw(page, k.toUpperCase(), { x: A4.w - M - kw - 8 - wOf(font, k.toUpperCase(), 7.5), y: my, size: 7.5, font, color: GREY, characterSpacing: 0.5 });
    my -= 13;
  }

  y = Math.min(y - 60, my) - 12;
  page.drawLine({ start: { x: M, y }, end: { x: A4.w - M, y }, thickness: 2, color: BLACK });
  y -= 26;

  // ── Section helper ──
  const section = (title) => {
    ensure(46);
    draw(page, title, { x: M, y: y - 13, size: 15, font, color: BLACK });
    y -= 20;
    page.drawLine({ start: { x: M, y }, end: { x: A4.w - M, y }, thickness: 0.75, color: RULE });
    y -= 16;
  };

  // Two/three-column table row helper. cols: [{text, w, align, size, font, color}]
  const row = (cols, { h = 16, bg = null, topRule = false } = {}) => {
    ensure(h + 4);
    if (bg) page.drawRectangle({ x: M, y: y - h + 4, width: CONTENT_W, height: h, color: bg });
    if (topRule) page.drawLine({ start: { x: M, y: y + 5 }, end: { x: A4.w - M, y: y + 5 }, thickness: 1, color: RULE });
    let x = M;
    for (const c of cols) {
      const f = c.font || font, s = c.size || 10.5, col = c.color || TEXT;
      const t = String(c.text ?? '');
      const tw = wOf(f, t, s);
      const tx = c.align === 'right' ? x + c.w - tw - 8 : x + 8;
      draw(page, t, { x: tx, y: y - h + 9, size: s, font: f, color: col });
      x += c.w;
    }
    y -= h;
  };

  // ── Project cost ──
  section('Project Cost incl. construction, shopfitting and logistics');
  row([
    { text: 'CATEGORY', w: CONTENT_W - 140, size: 8, color: GREY },
    { text: 'AMOUNT', w: 140, align: 'right', size: 8, color: GREY },
  ], { h: 18, bg: SURFACE });
  for (const r of rows) {
    row([
      { text: r.label, w: CONTENT_W - 140 },
      { text: fmtMoney(r.value, cur), w: 140, align: 'right' },
    ]);
  }
  row([
    { text: 'Total', w: CONTENT_W - 140, font: bold },
    { text: fmtMoney(supTotal, cur), w: 140, align: 'right', font: bold },
  ], { topRule: true });
  y -= 14;

  // ── Add-ons ──
  if (addOns.length) {
    section('Add-ons');
    row([
      { text: 'ITEM', w: CONTENT_W - 200, size: 8, color: GREY },
      { text: 'QTY', w: 60, align: 'right', size: 8, color: GREY },
      { text: 'TOTAL', w: 140, align: 'right', size: 8, color: GREY },
    ], { h: 18, bg: SURFACE });
    for (const a of addOns) {
      row([
        { text: a.name, w: CONTENT_W - 200 },
        { text: String(a.qty), w: 60, align: 'right' },
        { text: fmtMoney(a.total, cur), w: 140, align: 'right' },
      ]);
    }
    row([
      { text: 'Add-ons Total', w: CONTENT_W - 200, font: bold },
      { text: '', w: 60 },
      { text: fmtMoney(aoTotal, cur), w: 140, align: 'right', font: bold },
    ], { topRule: true });
    y -= 14;
  }

  // ── Custom items ──
  if (customs.length) {
    section('Additional Items');
    row([
      { text: 'ITEM', w: CONTENT_W - 200, size: 8, color: GREY },
      { text: 'QTY', w: 60, align: 'right', size: 8, color: GREY },
      { text: 'TOTAL', w: 140, align: 'right', size: 8, color: GREY },
    ], { h: 18, bg: SURFACE });
    for (const c of customs) {
      row([
        { text: c.name, w: CONTENT_W - 200 },
        { text: String(c.qty), w: 60, align: 'right' },
        { text: fmtMoney(c.total, cur), w: 140, align: 'right', color: c.total < 0 ? DANGER : TEXT },
      ]);
    }
    row([
      { text: 'Total', w: CONTENT_W - 200, font: bold },
      { text: '', w: 60 },
      { text: fmtMoney(custTotal, cur), w: 140, align: 'right', font: bold, color: custTotal < 0 ? DANGER : TEXT },
    ], { topRule: true });
    y -= 14;
  }

  // ── Grand total block ──
  ensure(80);
  const boxH = 58;
  page.drawRectangle({ x: M, y: y - boxH, width: CONTENT_W, height: boxH, color: BLACK });
  draw(page, 'Total excl. VAT', { x: M + 22, y: y - 34, size: 11, font, color: rgb(0.722, 0.733, 0.745) });
  const gt = fmtMoney(grand, cur);
  draw(page, gt, { x: A4.w - M - 22 - wOf(bold, gt, 22), y: y - 40, size: 22, font: bold, color: WHITE });
  y -= boxH + 6;
  if (sqmPrice > 0) {
    const sq = `${fmtMoney(sqmPrice, cur)} / m²`;
    draw(page, sq, { x: A4.w - M - wOf(font, sq, 9.5), y: y - 4, size: 9.5, font, color: GREY });
    y -= 16;
  }
  y -= 8;

  // ── Cost split ──
  if (split?.on && split.parties?.length) {
    ensure(40 + split.parties.length * 14);
    draw(page, 'Cost Split', { x: M, y: y - 11, size: 12, font, color: BLACK });
    y -= 16;
    page.drawLine({ start: { x: M, y }, end: { x: A4.w - M, y }, thickness: 0.75, color: RULE });
    y -= 12;
    for (const p of split.parties) {
      row([
        { text: p.label, w: CONTENT_W - 220, size: 10 },
        { text: `${p.pct}%`, w: 80, align: 'right', size: 10 },
        { text: fmtMoney(p.amount, cur), w: 140, align: 'right', size: 10 },
      ], { h: 14 });
    }
    row([
      { text: 'Total', w: CONTENT_W - 220, size: 10, font: bold },
      { text: `${split.sum}%`, w: 80, align: 'right', size: 10, font: bold },
      { text: fmtMoney(grand, cur), w: 140, align: 'right', size: 10, font: bold },
    ], { h: 14, topRule: true });
    if (!split.valid) {
      y -= 4;
      draw(page, `Note: shares total ${split.sum}%, not 100%.`, { x: M + 8, y: y - 8, size: 8.5, font, color: DANGER });
      y -= 14;
    }
    y -= 12;
  }

  // ── Validity ──
  ensure(52);
  page.drawRectangle({ x: M, y: y - 40, width: CONTENT_W, height: 40, color: SURFACE });
  page.drawRectangle({ x: M, y: y - 40, width: 3, height: 40, color: OAK });
  draw(page, 'VALIDITY', { x: M + 16, y: y - 15, size: 7.5, font: bold, color: GREY, characterSpacing: 0.6 });
  draw(page, `This quotation is valid until ${header.validUntil || '—'} (14 days from quotation date).`,
    { x: M + 16, y: y - 30, size: 9.5, font, color: TEXT });
  y -= 52;

  // ── Itemised breakdown annex (own page) ──
  if (itemised?.include && itemised.categories?.length) {
    newPage();
    draw(page, 'Itemised Breakdown', { x: M, y: y - 18, size: 18, font, color: BLACK });
    y -= 26;
    draw(page, 'Line items from the uploaded supplier quotation, included for transparency.',
      { x: M, y: y - 10, size: 9, font, color: GREY });
    y -= 24;
    for (const cat of itemised.categories) {
      ensure(40);
      row([
        { text: cat.name, w: CONTENT_W - 140, size: 10, font: bold },
        { text: fmtMoney(cat.total, cur), w: 140, align: 'right', size: 10, font: bold },
      ], { h: 18, bg: SURFACE });
      for (const it of cat.items || []) {
        const nameLines = wrap(it.name, font, 9, CONTENT_W - 240);
        ensure(Math.max(13, nameLines.length * 11));
        const top = y;
        draw(page, it.qty > 0 ? `${it.qty}×` : '', { x: M + 8, y: top - 9, size: 9, font, color: GREY });
        nameLines.forEach((l, i) => draw(page, l, { x: M + 44, y: top - 9 - i * 11, size: 9, font, color: TEXT }));
        const pr = fmtMoney(it.totalPrice, cur);
        draw(page, pr, { x: A4.w - M - 8 - wOf(font, pr, 9), y: top - 9, size: 9, font, color: TEXT });
        y = top - Math.max(13, nameLines.length * 11);
        page.drawLine({ start: { x: M, y: y + 2 }, end: { x: A4.w - M, y: y + 2 }, thickness: 0.4, color: RULE });
      }
      y -= 12;
    }
  }

  // ── Footer on every page ──
  const total = pages.length;
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: M - 14 }, end: { x: A4.w - M, y: M - 14 }, thickness: 0.5, color: RULE });
    draw(p, 'Selected Frame · Brand Spaces', { x: M, y: M - 28, size: 8, font, color: GREY });
    const conf = 'Confidential';
    draw(p, conf, { x: (A4.w - wOf(font, conf, 8)) / 2, y: M - 28, size: 8, font, color: GREY });
    const pl = `${i + 1} / ${total}`;
    draw(p, pl, { x: A4.w - M - wOf(font, pl, 8), y: M - 28, size: 8, font, color: GREY });
  });

  return doc.save();
}
