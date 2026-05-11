// PDF Studio — server-side PDF processing for Selected Frame draft documents.
//
// Replicates the original Python (PyMuPDF / fitz) script `remove_logo.py`:
//
//   1. Replace the Frame logo in the bottom-right corner of every page.
//   2. On page 1, replace the large SELECTED logo and the contact line.
//   3. Optionally append a zoning template at the back of the document.
//
// PyMuPDF uses top-left origin (y grows downward). pdf-lib uses bottom-left
// origin (y grows upward). All constants below match the Python script in
// PyMuPDF's coordinate space and are converted at draw time. Units are PDF
// points (1/72 inch) in both libraries.

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';

const WHITE = rgb(1, 1, 1);
const BLACK = rgb(0, 0, 0);

// ─── Constants from remove_logo.py (PyMuPDF top-left coords, in points) ──────

const FRAME_LOGO = {
  // Old logo cover rectangle: Rect(W-220-margin, H-90-margin, W-20+margin, H-20+margin)
  coverMargin: 6,
  coverRight: 20,       // gap from right edge to right side of old logo
  coverWidth: 200,      // 220 - 20
  coverHeight: 70,      // 90 - 20
  // New logo anchor (top-left in PyMuPDF coords):
  //   x0 = W - max_w - (-190) = W - max_w + 190
  //   y0 = H - max_h - (-35)  = H - max_h + 35
  newMaxW: 410,
  newMaxH: 175,
  newOffsetX: 190,
  newOffsetY: 35,
};

const COVER_LOGO = {
  // White cover rect: Rect(W-1000, 30, W-20, 190) in PyMuPDF coords
  whiteX0FromRight: 1000,
  whiteX1FromRight: 20,
  whiteTop: 30,
  whiteBottom: 190,
  // New cover logo: max 320x110, anchored at (W - 320 - 460, 55) = (W - 780, 55)
  maxW: 320,
  maxH: 110,
  offsetXFromRight: 780,
  topY: 55,
};

const CONTACT = {
  // page.insert_text((50, H-120), text, fontsize=11)
  x: 50,
  yFromBottom: 120,
  fontSize: 11,
  text: 'For any enquiries - please reach out to SELECTEDSIS@bestseller.com',
};

// ─── Asset paths ──────────────────────────────────────────────────────────────

export const ASSET_PATHS = {
  frameLogo: 'logos/Selected_Frame_Logo_FINAL.png',
  page1Logo: 'logos/2023_SLT_Logo_Black.png',
  zoningTemplate: 'templates/ZONING_TEMPLATE.pdf',
};

const ASSET_DIR = path.join(process.cwd(), 'public');

async function tryReadAsset(relPath) {
  try {
    return await fs.readFile(path.join(ASSET_DIR, relPath));
  } catch {
    return null;
  }
}

async function embedPngOrJpg(pdfDoc, bytes) {
  const isPng =
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  return isPng ? pdfDoc.embedPng(bytes) : pdfDoc.embedJpg(bytes);
}

// ─── Coordinate helpers ───────────────────────────────────────────────────────

// PyMuPDF Rect(x0_tl, y0_tl, x1_tl, y1_tl) → pdf-lib drawRectangle args.
function rectFromPyMu(pageH, x0, y0, x1, y1) {
  return {
    x: x0,
    y: pageH - y1,
    width: x1 - x0,
    height: y1 - y0,
  };
}

// PyMuPDF top-left anchor (ax, ay) with rendered size (w, h) → pdf-lib drawImage args.
function imageFromPyMu(pageH, anchorX, anchorYTop, w, h) {
  return {
    x: anchorX,
    y: pageH - anchorYTop - h,
    width: w,
    height: h,
  };
}

// Aspect-preserving fit into a max box (same formula as insert_image_keep_aspect).
function fitInto(maxW, maxH, imgW, imgH) {
  const scale = Math.min(maxW / imgW, maxH / imgH);
  return { w: imgW * scale, h: imgH * scale };
}

// ─── Per-page operations ──────────────────────────────────────────────────────

function applyFrameLogo(page, frameImg) {
  const { width: W, height: H } = page.getSize();

  // White cover rectangle (PyMuPDF top-left coords)
  const m = FRAME_LOGO.coverMargin;
  const x0 = W - 220 - m;
  const y0 = H - 90 - m;
  const x1 = W - 20 + m;
  const y1 = H - 20 + m;
  page.drawRectangle({ ...rectFromPyMu(H, x0, y0, x1, y1), color: WHITE });

  // New logo, aspect-preserved into 410x175, anchored top-left at (W-220, H-140)
  const ax = W - FRAME_LOGO.newMaxW + FRAME_LOGO.newOffsetX; // = W - 220
  const ay = H - FRAME_LOGO.newMaxH + FRAME_LOGO.newOffsetY; // = H - 140
  const { w, h } = fitInto(FRAME_LOGO.newMaxW, FRAME_LOGO.newMaxH, frameImg.width, frameImg.height);
  page.drawImage(frameImg, imageFromPyMu(H, ax, ay, w, h));
}

function applyCoverLogo(page, coverImg) {
  const { width: W, height: H } = page.getSize();

  // White cover rect: Rect(W-1000, 30, W-20, 190)
  const x0 = W - COVER_LOGO.whiteX0FromRight;
  const x1 = W - COVER_LOGO.whiteX1FromRight;
  page.drawRectangle({
    ...rectFromPyMu(H, x0, COVER_LOGO.whiteTop, x1, COVER_LOGO.whiteBottom),
    color: WHITE,
  });

  // New cover logo: anchored at (W-780, 55), max 320x110
  const ax = W - COVER_LOGO.offsetXFromRight;
  const ay = COVER_LOGO.topY;
  const { w, h } = fitInto(COVER_LOGO.maxW, COVER_LOGO.maxH, coverImg.width, coverImg.height);
  page.drawImage(coverImg, imageFromPyMu(H, ax, ay, w, h));
}

function applyContactText(page, font, text) {
  const { height: H } = page.getSize();
  // Python: page.insert_text((50, H-120), text, fontsize=11)
  // In PyMuPDF top-left coords, y=H-120 means 120pt above the bottom edge.
  page.drawText(text, {
    x: CONTACT.x,
    y: CONTACT.yFromBottom,
    size: CONTACT.fontSize,
    font,
    color: BLACK,
  });
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

/**
 * Process a PDF document.
 *
 * @param {Buffer|Uint8Array} inputBytes  Source PDF bytes.
 * @param {object} options
 * @param {boolean} options.replaceLogos   Replace Frame + cover logos.
 * @param {boolean} options.updateContact  Replace the cover contact line.
 * @param {boolean} options.appendZoning   Append the zoning template.
 * @param {string}  [options.contactText]  Override the contact line.
 * @returns {Promise<{ bytes: Uint8Array, report: object }>}
 */
export async function processPdf(inputBytes, options) {
  const {
    replaceLogos = true,
    updateContact = true,
    appendZoning = false,
    contactText = CONTACT.text,
  } = options || {};

  const report = {
    pageCount: 0,
    operations: [],
    warnings: [],
    appendedPages: 0,
  };

  const pdfDoc = await PDFDocument.load(inputBytes);
  const pages = pdfDoc.getPages();
  report.pageCount = pages.length;

  let frameLogoImg = null;
  let coverLogoImg = null;
  let helvetica = null;

  if (replaceLogos) {
    const frameBytes = await tryReadAsset(ASSET_PATHS.frameLogo);
    if (frameBytes) {
      frameLogoImg = await embedPngOrJpg(pdfDoc, frameBytes);
      report.operations.push('replace-frame-logo');
    } else {
      report.warnings.push(`Frame logo not found at /${ASSET_PATHS.frameLogo}`);
    }

    const coverBytes = await tryReadAsset(ASSET_PATHS.page1Logo);
    if (coverBytes) {
      coverLogoImg = await embedPngOrJpg(pdfDoc, coverBytes);
      report.operations.push('replace-cover-logo');
    } else {
      report.warnings.push(`Cover logo not found at /${ASSET_PATHS.page1Logo}`);
    }
  }

  if (updateContact) {
    helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    report.operations.push('update-contact-text');
  }

  pages.forEach((page, idx) => {
    if (replaceLogos && frameLogoImg) {
      applyFrameLogo(page, frameLogoImg);
    }
    if (idx === 0) {
      if (replaceLogos && coverLogoImg) {
        applyCoverLogo(page, coverLogoImg);
      }
      if (updateContact && helvetica) {
        applyContactText(page, helvetica, contactText);
      }
    }
  });

  if (appendZoning) {
    const zoningBytes = await tryReadAsset(ASSET_PATHS.zoningTemplate);
    if (zoningBytes) {
      const zoningDoc = await PDFDocument.load(zoningBytes);
      const indices = zoningDoc.getPageIndices();
      const copied = await pdfDoc.copyPages(zoningDoc, indices);
      copied.forEach((p) => pdfDoc.addPage(p));
      report.operations.push('append-zoning-template');
      report.appendedPages = copied.length;
    } else {
      report.warnings.push(`Zoning template not found at /${ASSET_PATHS.zoningTemplate}`);
    }
  }

  const bytes = await pdfDoc.save();
  return { bytes, report };
}
