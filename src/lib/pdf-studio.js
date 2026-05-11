// PDF Studio — server-side PDF processing for Selected Frame draft documents.
//
// Replicates the behaviour of the original Python script that conditioned
// supplier-generated PDFs before they were sent to partners:
//
//   1. Replace the Frame logo in the bottom-right corner of every page.
//   2. On page 1, replace the large SELECTED logo and the contact line.
//   3. Optionally append a zoning template at the back of the document.
//
// PDF coordinates in pdf-lib are bottom-left origin. All region constants are
// expressed as fractions of the page size so they scale with A4 / A3 / Letter.

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';

const WHITE = rgb(1, 1, 1);
const BLACK = rgb(0, 0, 0);

// ─── Region constants (fractions of page width/height) ────────────────────────
// Positions chosen to match the original Python script's hard-coded
// rectangles for the standard Selected Frame draft template (A3 landscape).
// If a future template ships with different placements, override via
// `regions` in `processPdf` rather than editing this file.

export const DEFAULT_REGIONS = {
  // Bottom-right Frame logo (every page).
  frameLogo: { xPct: 0.78, yPct: 0.025, wPct: 0.19, hPct: 0.055 },
  // Large SELECTED logo on cover page.
  page1Logo: { xPct: 0.08, yPct: 0.78, wPct: 0.34, hPct: 0.14 },
  // Contact line on cover page (single line of text).
  page1Contact: { xPct: 0.08, yPct: 0.055, wPct: 0.62, hPct: 0.030 },
};

const CONTACT_TEXT =
  'For any enquiries - please reach out to SELECTEDSIS@bestseller.com';

// ─── Asset loading ────────────────────────────────────────────────────────────

const ASSET_DIR = path.join(process.cwd(), 'public');

async function readAsset(relPath) {
  return fs.readFile(path.join(ASSET_DIR, relPath));
}

async function tryReadAsset(relPath) {
  try {
    return await readAsset(relPath);
  } catch {
    return null;
  }
}

async function embedPngOrJpg(pdfDoc, bytes) {
  // pdf-lib needs to know which decoder to use. PNG signature: 89 50 4E 47
  const isPng =
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  return isPng ? pdfDoc.embedPng(bytes) : pdfDoc.embedJpg(bytes);
}

// ─── Geometry helpers ─────────────────────────────────────────────────────────

function rectFromPct(page, region) {
  const { width, height } = page.getSize();
  return {
    x: width * region.xPct,
    y: height * region.yPct,
    w: width * region.wPct,
    h: height * region.hPct,
  };
}

function fitImage(boxW, boxH, imgW, imgH) {
  const scale = Math.min(boxW / imgW, boxH / imgH);
  const w = imgW * scale;
  const h = imgH * scale;
  return { w, h };
}

// ─── Operations ───────────────────────────────────────────────────────────────

function paintWhite(page, region) {
  const r = rectFromPct(page, region);
  page.drawRectangle({ x: r.x, y: r.y, width: r.w, height: r.h, color: WHITE });
}

function drawImageRightAligned(page, image, region) {
  const r = rectFromPct(page, region);
  const { w, h } = fitImage(r.w, r.h, image.width, image.height);
  // Right-align horizontally within the region, vertically centre.
  page.drawImage(image, {
    x: r.x + (r.w - w),
    y: r.y + (r.h - h) / 2,
    width: w,
    height: h,
  });
}

function drawImageLeftAligned(page, image, region) {
  const r = rectFromPct(page, region);
  const { w, h } = fitImage(r.w, r.h, image.width, image.height);
  page.drawImage(image, {
    x: r.x,
    y: r.y + (r.h - h) / 2,
    width: w,
    height: h,
  });
}

function drawContactText(page, region, font, text) {
  const r = rectFromPct(page, region);
  const fontSize = Math.min(r.h * 0.7, 11);
  page.drawText(text, {
    x: r.x,
    y: r.y + (r.h - fontSize) / 2,
    size: fontSize,
    font,
    color: BLACK,
  });
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

export const ASSET_PATHS = {
  frameLogo: 'logos/Selected_Frame_Logo_FINAL.png',
  page1Logo: 'logos/2023_SLT_Logo_Black.png',
  zoningTemplate: 'templates/ZONING_TEMPLATE.pdf',
};

/**
 * Process a PDF document.
 *
 * @param {Buffer|Uint8Array} inputBytes  Source PDF bytes.
 * @param {object} options
 * @param {boolean} options.replaceLogos      Replace Frame + cover logos.
 * @param {boolean} options.updateContact     Replace the cover contact line.
 * @param {boolean} options.appendZoning      Append the zoning template.
 * @param {object}  [options.regions]         Region overrides (see DEFAULT_REGIONS).
 * @param {string}  [options.contactText]     Override the contact line.
 * @returns {Promise<{ bytes: Uint8Array, report: object }>}
 */
export async function processPdf(inputBytes, options) {
  const {
    replaceLogos = true,
    updateContact = true,
    appendZoning = false,
    regions: regionOverrides = {},
    contactText = CONTACT_TEXT,
  } = options || {};

  const regions = { ...DEFAULT_REGIONS, ...regionOverrides };
  const report = {
    pageCount: 0,
    operations: [],
    warnings: [],
    appendedPages: 0,
  };

  const pdfDoc = await PDFDocument.load(inputBytes);
  const pages = pdfDoc.getPages();
  report.pageCount = pages.length;

  // Embed assets lazily so we only read what we need.
  let frameLogoImg = null;
  let page1LogoImg = null;
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
      page1LogoImg = await embedPngOrJpg(pdfDoc, coverBytes);
      report.operations.push('replace-cover-logo');
    } else {
      report.warnings.push(`Cover logo not found at /${ASSET_PATHS.page1Logo}`);
    }
  }

  if (updateContact) {
    helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    report.operations.push('update-contact-text');
  }

  // Per-page mutations.
  pages.forEach((page, idx) => {
    if (replaceLogos && frameLogoImg) {
      paintWhite(page, regions.frameLogo);
      drawImageRightAligned(page, frameLogoImg, regions.frameLogo);
    }

    if (idx === 0) {
      if (replaceLogos && page1LogoImg) {
        paintWhite(page, regions.page1Logo);
        drawImageLeftAligned(page, page1LogoImg, regions.page1Logo);
      }
      if (updateContact && helvetica) {
        paintWhite(page, regions.page1Contact);
        drawContactText(page, regions.page1Contact, helvetica, contactText);
      }
    }
  });

  // Append zoning template (if requested and available).
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
      report.warnings.push(
        `Zoning template not found at /${ASSET_PATHS.zoningTemplate}`,
      );
    }
  }

  const bytes = await pdfDoc.save();
  return { bytes, report };
}
