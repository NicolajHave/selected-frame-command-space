export const dynamic = 'force-dynamic';

// Parse European number formats:
// "1.398,00" → 1398 (dot=thousand, comma=decimal)
// "37.225" → 37225 (dot=thousand, no decimal)
// "45,00" → 45
// "0,00" → 0
function parseNum(raw) {
  if (!raw) return 0;
  let s = raw.toString().replace(/€/g, '').replace(/\s+/g, '').trim();
  if (s === '-' || s === '') return 0;
  
  // European format: "1.398,00" → dot is thousand, comma is decimal
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
    return parseFloat(s) || 0;
  }
  // Only comma: "45,00" → comma is decimal
  if (s.includes(',')) {
    s = s.replace(',', '.');
    return parseFloat(s) || 0;
  }
  // Only dot: could be thousand separator "37.225" or decimal "3.5"
  // If dot is followed by exactly 3 digits → thousand separator
  if (/\.(\d{3})$/.test(s)) {
    s = s.replace(/\./g, '');
    return parseFloat(s) || 0;
  }
  return parseFloat(s) || 0;
}

// Extract all amounts from a line (handles both "€ 3 7.225", "37.225€", and "1.398,00")
function extractAmounts(line) {
  const amounts = [];
  // Pattern: € before number
  let m;
  const r1 = /€\s*([\d\s.,]+)/g;
  while ((m = r1.exec(line)) !== null) { const v = parseNum(m[1]); if (v > 0) amounts.push(v); }
  // Pattern: number before €
  const r2 = /([\d.,]+)\s*€/g;
  while ((m = r2.exec(line)) !== null) { const v = parseNum(m[1]); if (v > 0 && !amounts.includes(v)) amounts.push(v); }
  return amounts;
}

// Detect which format the PDF is
function detectFormat(lines) {
  const text = lines.join('\n').toUpperCase();
  if (text.includes('SALES QUOTE')) return 'sales_quote';
  if (text.includes('INVENTORY') && (text.includes('SELECTED DELIVERIES') || text.includes('SPECIFIC PROJECT COST'))) return 'multi_category';
  // Check for European comma-decimal prices without category headers
  if (lines.some(l => /\d+,\d{2}$/.test(l.trim()))) return 'sales_quote';
  return 'multi_category'; // default
}

// ─── FORMAT A: Multi-category (&elements QUOTATION) ──────
function parseMultiCategory(lines) {
  const fullText = lines.join('\n');
  const get = (p) => { const m = fullText.match(p); return m ? m[1].trim() : null; };
  const header = {
    project: get(/Project:\s*(.+)/),
    salesArea: parseInt(get(/Sales area,?\s*sqm:\s*(\d+)/) || '0'),
    gender: get(/Gender:\s*(\w+)/),
    updated: get(/Updated:\s*(.+)/),
    supplier: '&elements ApS',
    deliveryDate: get(/Delivery date:\s*(.+)/) || 'TBC',
  };

  const categories = [];
  let currentCat = null;
  const catNames = ['INVENTORY', 'SELECTED DELIVERIES', 'SPECIFIC PROJECT COST', 'SPECIAL ELEMENTS', 'FITTING ROOMS', 'FLOOR', 'AV & HIFI', 'CONSTRUCTION'];
  let grandTotal = 0, grandSqm = 0, inSummary = false;

  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    const upper = t.toUpperCase();

    if (t.includes('Project cost overview') || upper.includes('HEADERS')) { inSummary = true; continue; }
    if (t.startsWith('Conditions:') || t.startsWith('Payment terms')) break;

    if (inSummary) {
      if (upper.includes('TOTAL EXCL')) {
        const euros = extractAmounts(t);
        if (euros.length >= 1) grandTotal = euros[0];
        if (euros.length >= 2) grandSqm = euros[1];
      }
      continue;
    }

    const matchedCat = catNames.find(c => upper === c || (upper.startsWith(c) && !t.includes('€')));
    if (matchedCat && !t.includes('€')) {
      currentCat = { name: matchedCat, items: [], total: 0 };
      categories.push(currentCat);
      continue;
    }

    if (upper.includes('PRODUCT NAME') || upper.includes('ITEM NO.')) continue;
    if (!currentCat) continue;

    if (/^Total/i.test(t)) {
      const euros = extractAmounts(t);
      if (euros.length > 0) currentCat.total = euros[euros.length - 1];
      continue;
    }

    if (t.startsWith('Transportation & Accomodation') || t.startsWith('Freight & Logistic')) continue;

    if (t.includes('€')) {
      const euros = extractAmounts(t);
      const totalPrice = euros.length >= 1 ? euros[euros.length - 1] : 0;
      const unitPrice = euros.length >= 2 ? euros[euros.length - 2] : 0;
      const qtyMatch = t.match(/(\d+)\s*(pcs|Hours|hours|pack|Pack|km)/i);
      const qty = qtyMatch ? parseInt(qtyMatch[1]) : 0;
      let name = qtyMatch ? t.substring(0, t.indexOf(qtyMatch[0])).trim() : t.split('€')[0].trim();
      name = name.replace(/^[\d._-]+[A-Za-z]?\s+/, '').trim();
      if (name && name.length > 1) currentCat.items.push({ name, qty, unitPrice, totalPrice });
    }
  }

  const getCat = (n) => categories.find(c => c.name === n)?.total || 0;
  return {
    ...header, categories,
    summary: {
      inventory: getCat('INVENTORY'),
      selectedDeliveries: getCat('SELECTED DELIVERIES'),
      specificProjectCost: getCat('SPECIFIC PROJECT COST'),
      specialElements: getCat('SPECIAL ELEMENTS'),
      fittingRooms: getCat('FITTING ROOMS'),
      floor: getCat('FLOOR'),
      avHifi: getCat('AV & HIFI'),
      construction: getCat('CONSTRUCTION'),
      totalExclVat: grandTotal || (getCat('INVENTORY') + getCat('SELECTED DELIVERIES') + getCat('SPECIFIC PROJECT COST') + getCat('SPECIAL ELEMENTS') + getCat('FITTING ROOMS') + getCat('FLOOR') + getCat('AV & HIFI') + getCat('CONSTRUCTION')),
      sqmPrice: grandSqm || 0,
    }
  };
}

// ─── FORMAT B: Sales Quote (flat list) ───────────────────
function parseSalesQuote(lines) {
  const fullText = lines.join('\n');
  const get = (p) => { const m = fullText.match(p); return m ? m[1].trim() : null; };

  // Extract project name from description line or External Document No
  let project = get(/Regarding deliveries for Selected at\s*(.+)/);
  if (!project) project = get(/External Document No\.\s*[\d]*\s*(SLT.+?)(?:\s+Phone|\n)/);
  if (!project) project = get(/Sales Quote\s*\|\s*(\d+)/);

  const deliveryDate = get(/Planned delivery date:\s*(.+)/);
  const docDate = get(/Document Date\s*(\d{2}-\d{2}-\d{4})/);

  const items = [];
  let grandTotal = 0;

  for (const line of lines) {
    const t = line.trim();

    // Total line: "Total EUR Excl. VAT 11.673,00"
    if (/^Total\s+EUR/i.test(t) || /Total EUR Excl/i.test(t)) {
      // Extract the last number on the line
      const nums = t.match(/([\d.,]+)/g);
      if (nums) grandTotal = parseNum(nums[nums.length - 1]);
      continue;
    }

    // Item lines: "105-06-001-E Floor rack 1400 3 Pcs 466,00 1.398,00"
    // Pattern: starts with item number, has qty + unit, ends with two numbers
    const itemMatch = t.match(/^([\d_-]+[A-Za-z]?)\s+(.+?)\s+(\d+)\s+(Pcs|Hour|Pcs|Pack|pcs|hour)\s+([\d.,]+)\s+([\d.,]+)$/i);
    if (itemMatch) {
      const [, itemNo, name, qty, unit, unitPrice, totalPrice] = itemMatch;
      items.push({
        name: name.trim(),
        qty: parseInt(qty),
        unitPrice: parseNum(unitPrice),
        totalPrice: parseNum(totalPrice),
      });
      continue;
    }

    // Also try without item number prefix (some lines like "0325 Paint...")
    const simpleMatch = t.match(/^(\d+)\s+(.+?)\s+(\d+)\s+(Pcs|Hour|Pack|pcs|hour)\s+([\d.,]+)\s+([\d.,]+)$/i);
    if (simpleMatch) {
      const [, , name, qty, unit, unitPrice, totalPrice] = simpleMatch;
      items.push({
        name: name.trim(),
        qty: parseInt(qty),
        unitPrice: parseNum(unitPrice),
        totalPrice: parseNum(totalPrice),
      });
    }
  }

  // If we didn't find grand total, sum items
  if (!grandTotal && items.length > 0) {
    grandTotal = items.reduce((s, i) => s + i.totalPrice, 0);
  }

  // Put all items in a single "ALL ITEMS" category
  const categories = [{ name: 'ALL ITEMS', items, total: grandTotal }];

  return {
    project: project || 'Sales Quote',
    salesArea: 0,
    gender: null,
    updated: docDate || '',
    supplier: '&elements ApS',
    deliveryDate: deliveryDate || 'TBC',
    format: 'sales_quote',
    categories,
    summary: {
      inventory: grandTotal,
      selectedDeliveries: 0,
      specificProjectCost: 0,
      specialElements: 0,
      fittingRooms: 0,
      floor: 0,
      avHifi: 0,
      construction: 0,
      totalExclVat: grandTotal,
      sqmPrice: 0,
    }
  };
}

export async function POST(request) {
  try {
    const { lines } = await request.json();
    if (!lines?.length) return Response.json({ error: 'No lines' }, { status: 400 });

    const format = detectFormat(lines);
    const result = format === 'sales_quote' ? parseSalesQuote(lines) : parseMultiCategory(lines);

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
