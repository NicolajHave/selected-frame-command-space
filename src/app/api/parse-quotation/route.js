export const dynamic = 'force-dynamic';

// ─── SHARED HELPERS ────────────────────────────────────────────────────────────

function parseEuro(raw) {
  if (!raw) return 0;
  let s = raw.replace(/€/g, '').trim();
  if (s === '-' || s === '') return 0;
  s = s.replace(/\s+/g, '');
  if (/,\d{1,2}$/.test(s) && !s.includes('.')) { s = s.replace(',', '.'); return parseFloat(s) || 0; }
  s = s.replace(/\.(\d{3})/g, '$1');
  s = s.replace(/[.,]/g, '');
  return parseFloat(s) || 0;
}

// Extract ALL euro amounts - handles both "€ X.XXX" and "X.XXX €" formats
function extractEuros(line) {
  const matches = [];
  const regexA = /€\s*([\d\s.,]+)/g;
  let m;
  while ((m = regexA.exec(line)) !== null) {
    const val = parseEuro(m[1]);
    if (val > 0) matches.push(val);
  }
  const regexB = /([\d.,]+)\s*€/g;
  while ((m = regexB.exec(line)) !== null) {
    const val = parseEuro(m[1]);
    if (val > 0 && !matches.includes(val)) matches.push(val);
  }
  return matches;
}

// Parse Sales Quote decimal-only numbers like "18.488,00" or "419,00"
// (no € sign in column-based table layout)
function parseDecimalOnly(s) {
  if (!s) return 0;
  s = s.replace(/\s+/g, '').trim();
  if (s === '-' || s === '') return 0;
  // European format: dot = thousand separator, comma = decimal
  if (/,\d{1,2}$/.test(s)) {
    s = s.replace(/\.(\d{3})/g, '$1').replace(',', '.');
    return parseFloat(s) || 0;
  }
  s = s.replace(/\./g, '').replace(/,/g, '');
  return parseFloat(s) || 0;
}

// ─── FORMAT DETECTION ─────────────────────────────────────────────────────────

function detectFormat(lines) {
  const fullText = lines.join('\n').toUpperCase();
  // Sales Quote format markers - look anywhere in document
  if (fullText.includes('SALES QUOTE |') || fullText.includes('SALES QUOTE  |')) {
    return 'sales-quote';
  }
  // Calculation format has explicit category headers like INVENTORY, FLOOR, etc.
  // alongside "QUOTATION" and "Project:" header lines
  const firstChunk = lines.slice(0, 40).join('\n').toUpperCase();
  if (firstChunk.includes('QUOTATION') && firstChunk.includes('PROJECT:')) {
    return 'calculation';
  }
  // Heuristic: if "Regarding deliveries for Selected" appears, it's a Sales Quote
  if (fullText.includes('REGARDING DELIVERIES FOR SELECTED')) {
    return 'sales-quote';
  }
  // Default to calculation format - has been the historical format
  return 'calculation';
}

// ─── CALCULATION FORMAT PARSER (original &elements internal format) ──────────

function parseCalculationFormat(lines) {
  const warnings = [];
  const addWarn = (severity, message, context = null) => warnings.push({ severity, message, context });

  const fullText = lines.join('\n');
  const get = (p) => { const m = fullText.match(p); return m ? m[1].trim() : null; };
  const header = {
    project: get(/Project:\s*(.+)/),
    salesArea: parseInt(get(/Sales area,?\s*sqm:\s*(\d+)/) || '0'),
    gender: get(/Gender:\s*(\w+)/),
    updated: get(/Updated:\s*(.+)/),
    revision: get(/Revision:\s*(.+)/),
    deliveryDate: get(/Delivery date:\s*(.+)/) || 'TBC',
    openingDate: get(/Target opening date:\s*(.+)/) || 'TBC',
    supplier: '&elements ApS',
  };

  if (!header.project) addWarn('warn', 'Project name not found in PDF header');
  if (!header.salesArea) addWarn('warn', 'Sales area (sqm) not found - SQM price will be missing');
  if (!header.gender) addWarn('info', 'Gender not specified in PDF');

  const categories = [];
  let currentCat = null;
  const catNames = ['INVENTORY', 'SELECTED DELIVERIES', 'SPECIFIC PROJECT COST', 'SPECIAL ELEMENTS', 'FITTING ROOMS', 'FLOOR', 'AV & HIFI', 'CONSTRUCTION', 'LIGHT'];
  let grandTotal = 0, grandSqm = 0;
  let inSummary = false;

  let unmatchedItemLines = 0;
  let droppedItems = 0;
  const seenCategoryHeaders = new Set();

  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    const upper = t.toUpperCase();

    if (t.includes('Project cost overview') || upper.includes('HEADERS')) { inSummary = true; continue; }
    if (t.startsWith('Conditions:') || t.startsWith('Payment terms')) break;

    if (inSummary) {
      if (upper.includes('TOTAL EXCL') || upper.startsWith('TOTAL EXCL')) {
        const euros = extractEuros(t);
        if (euros.length >= 1) {
          const sorted = [...euros].sort((a, b) => b - a);
          grandTotal = sorted[0];
          const sqmCandidate = sorted.slice(1).find(v => v < grandTotal * 0.1);
          if (sqmCandidate) grandSqm = sqmCandidate;
        }
      }
      continue;
    }

    const matchedCat = catNames.find(c => upper === c || upper.startsWith(c));
    if (matchedCat && !t.includes('€')) {
      currentCat = { name: matchedCat, items: [], total: 0 };
      categories.push(currentCat);
      seenCategoryHeaders.add(matchedCat);
      continue;
    }

    if (!currentCat) {
      if (upper.match(/^[A-Z\s&]{4,}$/) && upper.length < 40 && !upper.includes('SLT') && !upper.includes('QUOTATION')) {
        addWarn('warn', `Possible unrecognised category: "${t}"`, { line: t });
      }
      continue;
    }

    if (upper.startsWith('TOTAL') && t.includes('€')) {
      const euros = extractEuros(t);
      if (euros.length > 0) currentCat.total = euros[0];
      currentCat = null;
      continue;
    }

    if (t.startsWith('item no.') || t.startsWith('Product Name') || t.startsWith('Item no.')) continue;

    const euros = extractEuros(t);
    if (euros.length === 0) {
      const isPrettyText = upper.match(/^[A-Z]/) && t.length > 5;
      if (isPrettyText && !t.startsWith('-') && !t.includes(':')) {
        unmatchedItemLines++;
      }
      continue;
    }

    const qtyMatch = t.match(/(\d+)\s+(pcs|pack|Hours?|km|Pack)/i);
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : 0;
    const last = euros.length - 1;
    const totalPrice = euros[last];
    const unitPrice = euros.length >= 2 ? euros[last - 1] : totalPrice;

    let name = t.replace(/€[\s\d.,-]+/g, ' ').replace(/\s+/g, ' ');
    name = name.replace(/^[\d.\-_]+/, '').replace(/\s+\d+\s+(pcs|pack|Hours?|km|Pack).*/i, '').trim();
    if (name.length < 3 && totalPrice > 0) {
      droppedItems++;
      continue;
    }
    if (name.length >= 3) {
      currentCat.items.push({ name, qty, unitPrice, totalPrice });
      currentCat.total += totalPrice;
    }
  }

  if (unmatchedItemLines > 5) addWarn('info', `${unmatchedItemLines} text lines couldn't be parsed (may be notes or descriptions)`);
  if (droppedItems > 0) addWarn('warn', `${droppedItems} items dropped because the name was too short to be valid`);

  return buildSummary({ header, categories, grandTotal, grandSqm, warnings, addWarn, format: 'calculation' });
}

// ─── SALES QUOTE PARSER (Bestseller-customer-facing, item-by-line, no categories) ─

function parseSalesQuoteFormat(lines) {
  const warnings = [];
  const addWarn = (severity, message, context = null) => warnings.push({ severity, message, context });

  const fullText = lines.join('\n');

  // Header extraction
  // Project name guess: "Regarding deliveries for Selected at X" or "Selected at X"
  let projectName = null;
  const m1 = fullText.match(/Regarding deliveries for\s+(.+?)(?:\n|$|3D layout)/i);
  if (m1) {
    projectName = `Selected SIS - ${m1[1].replace(/^Selected at\s+/i, '').trim()}`;
  } else {
    // Fallback: try delivery address (PRIMTEMPS NANCY etc.)
    const m2 = fullText.match(/\(Delivery Address\)\s*\n\s*([A-Z][A-Z\s_-]+)/);
    if (m2) {
      projectName = `Selected SIS - ${m2[1].trim()}`;
    }
  }
  // Quote number for fallback ID
  const quoteNum = fullText.match(/Sales Quote\s*\|\s*(\d+)/);

  const header = {
    project: projectName,
    salesArea: 0, // Not available in Sales Quote format
    gender: null,
    updated: null,
    revision: quoteNum ? `Quote ${quoteNum[1]}` : null,
    deliveryDate: (fullText.match(/Planned delivery date:\s*(.+)/) || [])[1]?.trim() || 'TBC',
    openingDate: 'TBC',
    supplier: '&elements ApS',
  };

  if (!header.project) addWarn('warn', 'Project name not found - please enter manually');
  addWarn('info', 'Sales area (sqm) not in Sales Quote format - please enter manually');

  // Find the table boundaries
  let tableStart = -1, tableEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.match(/^Regarding deliveries/i) && tableStart === -1) tableStart = i + 1;
    if (t.match(/^Total EUR Excl/i)) { tableEnd = i; break; }
  }
  if (tableStart === -1) tableStart = 0;
  if (tableEnd === -1) tableEnd = lines.length;

  // Grand total
  let grandTotal = 0;
  const totalLine = lines.slice(tableEnd, tableEnd + 3).join(' ');
  const totalMatch = totalLine.match(/Total EUR Excl\.?\s*VAT\s+([\d.,]+)/i);
  if (totalMatch) grandTotal = parseDecimalOnly(totalMatch[1]);

  // Parse items between tableStart and tableEnd
  // Format: "ITEM-NO  Description  QTY  Unit  UnitPrice  LinePrice"
  // ITEM-NO can be: 105-XX-XXX-X, 112_XX_XXX, 0421, 0500, etc.
  // Multi-line descriptions: continuation lines have no item-no at start

  const items = [];

  // PDF.js may split a single item across multiple lines. Example from production:
  //   line N:   "0325  Backwall panels: NOT included, existing wall will be"
  //   line N+1: "painted"
  //   line N+2: "1  Pcs  0,00  0,00"
  // Strategy: walk through table lines, accumulate text from item-no line forward,
  // looking ahead until we find the qty/unit/price tail. Then commit the item.

  // Pattern to detect tail of an item: "QTY Unit UnitPrice LinePrice"
  const TAIL_RE = /^(.*?)\s+(\d+)\s+(Pcs|Hour|Pallet|Pack|km)\s+([\d.,]+)\s+([\d.,]+)\s*$/i;
  // Pattern to detect start of item (item-no at line start)
  const ITEM_START_RE = /^(\d{3,4}(?:[-_][\dA-Za-z\-_]+)?)\s+(.+)$/;

  // Filter and trim relevant table lines first
  const tableLines = [];
  for (let i = tableStart; i < tableEnd; i++) {
    const t = lines[i].trim();
    if (!t) continue;
    if (t.startsWith('Ordered by:')) break;
    if (t.startsWith('Fees for')) continue;
    if (t.startsWith('Planned delivery')) continue;
    tableLines.push(t);
  }

  let buffer = null; // { itemNo, parts: [...] }
  const tryCommit = () => {
    if (!buffer) return;
    const combined = buffer.parts.join(' ');
    const tail = combined.match(TAIL_RE);
    if (tail) {
      items.push({
        itemNo: buffer.itemNo,
        name: tail[1].trim(),
        qty: parseInt(tail[2]),
        unit: tail[3],
        unitPrice: parseDecimalOnly(tail[4]),
        totalPrice: parseDecimalOnly(tail[5]),
      });
    }
    buffer = null;
  };

  for (const t of tableLines) {
    const startMatch = t.match(ITEM_START_RE);
    if (startMatch) {
      // New item starts. Commit any previous buffer first.
      tryCommit();
      buffer = { itemNo: startMatch[1], parts: [startMatch[2]] };
      // If this single line already has the tail, commit immediately
      const tail = startMatch[2].match(TAIL_RE);
      if (tail) tryCommit();
    } else if (buffer) {
      // Continuation - append to current buffer
      buffer.parts.push(t);
      // After appending, check if combined now has a tail
      const combined = buffer.parts.join(' ');
      if (TAIL_RE.test(combined)) tryCommit();
    }
    // else: stray line before any item - ignore
  }
  tryCommit(); // commit last item if any

  // Build pillar mapping
  // Inventory: items with 105- or 112_ prefix (standard product codes)
  //            OR items with custom prefix (0325) that are physical products by name pattern
  // Selected Deliveries: name contains "_SLT delivery"
  // Specific Project Cost: services (0421/0500/0540/0432/0459/0600), materials, and all other 0325 items
  const isPhysicalProductByName = (name) => {
    const n = name.toLowerCase();
    // Service-keyword guard: anything that is clearly an action/service goes to Specific Project Cost
    // even if the name happens to mention a product like "LED logo" or "wall panels"
    if (n.match(/\b(installation|inspection|paint works|works|mounting|removal|freight|transport|travel|disposal|warehouse|project manager|packaging|hours)\b/)) return false;
    // Logo (LED, corona, brushed steel) - physical signage
    if (n.includes("logo") && (n.includes("light") || n.includes("corona") || n.includes("brushed steel") || n.match(/\bled\b/))) return true;
    // Backwall panels - physical wall material
    if (n.includes("backwall panel")) return true;
    // Screen - physical AV product (size like 55", 65", 75", 85" suggests physical product)
    if (n.includes("screen") && n.match(/\b(55|65|75|85)\b/)) return true;
    // Carpet - physical floor material
    if (n.includes("carpet") && !n.includes("delivery")) return true;
    return false;
  };

  const inventoryItems = [];
  const selectedDeliveryItems = [];
  const projectCostItems = [];

  for (const it of items) {
    if (it.name.match(/_SLT delivery/i)) {
      selectedDeliveryItems.push(it);
    } else if (it.itemNo.match(/^(105|112)/)) {
      inventoryItems.push(it);
    } else if (isPhysicalProductByName(it.name)) {
      inventoryItems.push(it);
    } else {
      projectCostItems.push(it);
    }
  }

  const sumPrice = (arr) => arr.reduce((s, x) => s + x.totalPrice, 0);
  const categories = [
    { name: 'INVENTORY', items: inventoryItems, total: sumPrice(inventoryItems) },
    { name: 'SELECTED DELIVERIES', items: selectedDeliveryItems, total: sumPrice(selectedDeliveryItems) },
    { name: 'SPECIFIC PROJECT COST', items: projectCostItems, total: sumPrice(projectCostItems) },
  ].filter(c => c.items.length > 0);

  return buildSummary({ header, categories, grandTotal, grandSqm: 0, warnings, addWarn, format: 'sales-quote' });
}

// ─── SHARED SUMMARY BUILDER (3-pillar mapping) ────────────────────────────────

function buildSummary({ header, categories, grandTotal, grandSqm, warnings, addWarn, format }) {
  const getCat = (n) => categories.find(c => c.name === n)?.total || 0;

  const inventoryGroup = ['INVENTORY', 'FLOOR', 'SPECIAL ELEMENTS', 'FITTING ROOMS'];
  const deliveriesGroup = ['SELECTED DELIVERIES'];
  const projectCostGroup = ['SPECIFIC PROJECT COST', 'AV & HIFI', 'LIGHT', 'CONSTRUCTION'];

  const sumGroup = (group) => group.reduce((s, n) => s + getCat(n), 0);
  const groupBreakdown = (group) => group.map(n => ({ name: n, value: getCat(n) })).filter(x => x.value > 0);

  const summary = {
    inventory: sumGroup(inventoryGroup),
    selectedDeliveries: sumGroup(deliveriesGroup),
    specificProjectCost: sumGroup(projectCostGroup),
    inventoryRaw: getCat('INVENTORY'),
    selectedDeliveriesRaw: getCat('SELECTED DELIVERIES'),
    specificProjectCostRaw: getCat('SPECIFIC PROJECT COST'),
    specialElements: getCat('SPECIAL ELEMENTS'),
    fittingRooms: getCat('FITTING ROOMS'),
    floor: getCat('FLOOR'),
    avHifi: getCat('AV & HIFI'),
    light: getCat('LIGHT'),
    construction: getCat('CONSTRUCTION'),
    inventoryBreakdown: groupBreakdown(inventoryGroup),
    projectCostBreakdown: groupBreakdown(projectCostGroup),
    totalExclVat: grandTotal || 0,
    sqmPrice: grandSqm || 0,
  };

  // Sanity check
  if (summary.totalExclVat > 0) {
    const sumOfPillars = summary.inventory + summary.selectedDeliveries + summary.specificProjectCost;
    const diff = Math.abs(summary.totalExclVat - sumOfPillars);
    const tolerance = Math.max(50, summary.totalExclVat * 0.02);
    if (sumOfPillars > 0 && diff > tolerance) {
      addWarn('warn', `Pillar totals (€${sumOfPillars.toLocaleString('de-DE')}) don't match grand total (€${summary.totalExclVat.toLocaleString('de-DE')}) - difference €${Math.round(diff).toLocaleString('de-DE')}`);
    }
  }

  if (!summary.totalExclVat) {
    summary.totalExclVat = summary.inventory + summary.selectedDeliveries + summary.specificProjectCost;
    addWarn('info', 'Grand total not found in PDF - calculated from pillar sums');
  }
  if (!summary.sqmPrice && header.salesArea > 0 && summary.totalExclVat > 0) {
    summary.sqmPrice = Math.round(summary.totalExclVat / header.salesArea);
  }

  return Response.json({
    success: true,
    format,
    project: header.project,
    header,
    categories,
    summary,
    parseStats: { categoriesFound: categories.length, totalItems: categories.reduce((s, c) => s + c.items.length, 0) },
    parseWarnings: warnings,
  });
}

// ─── ROUTE HANDLER ────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const { lines } = await request.json();
    if (!lines?.length) return Response.json({ error: 'No lines' }, { status: 400 });

    const format = detectFormat(lines);
    if (format === 'sales-quote') {
      return parseSalesQuoteFormat(lines);
    } else {
      return parseCalculationFormat(lines);
    }
  } catch (e) {
    return Response.json({ error: e.message || 'Parse failed' }, { status: 500 });
  }
}
