// Excel import/export for Showroom Ops.
// SheetJS is loaded from CDN at runtime — same approach the Quotation Builder
// uses for pdf.js — so we add no npm dependency (the app is deployed via
// GitHub drag-and-drop without a local build step).

const SHEETJS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

export function loadSheetJs() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('SheetJS is browser-only'));
    if (window.XLSX) return resolve(window.XLSX);
    const s = document.createElement('script');
    s.src = SHEETJS_SRC;
    s.onload = () => resolve(window.XLSX);
    s.onerror = () => reject(new Error('Could not load SheetJS from CDN'));
    document.head.appendChild(s);
  });
}

// ─── Export ───────────────────────────────────────────────────────────────────
// columns: [{ header, key }]; rows: array of objects keyed by `key`.
export async function exportToXlsx({ filename, sheetName = 'Sheet1', columns, rows }) {
  const XLSX = await loadSheetJs();
  const aoa = [columns.map((c) => c.header)];
  for (const row of rows) {
    aoa.push(columns.map((c) => {
      const v = row[c.key];
      return v == null ? '' : v;
    }));
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, filename);
}

// ─── Import ───────────────────────────────────────────────────────────────────
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Pick the first candidate header present in a normalized row map.
function pick(rowMap, candidates) {
  for (const c of candidates) {
    if (rowMap[c] != null && rowMap[c] !== '') return rowMap[c];
  }
  return null;
}

const SHOWROOM_FIELDS = {
  name:            ['name', 'showroom', 'showroomname', 'location'],
  country:         ['country'],
  lines:           ['lines', 'line'],
  deliveryType:    ['deliverytype', 'delivery', 'type'],
  companyName:     ['companyname', 'company'],
  addressMen:      ['addressmen', 'addresshomme', 'addressm', 'address'],
  zipMen:          ['zipmen', 'zipm', 'postalmen', 'zip', 'postcode'],
  addressWomen:    ['addresswomen', 'addressfemme', 'addressw'],
  zipWomen:        ['zipwomen', 'zipw', 'postalwomen'],
  customerNoMen:   ['customernomen', 'customernohomme', 'custnomen', 'kundenrmen', 'customermen', 'customerno', 'custno'],
  customerNoWomen: ['customernowomen', 'customernofemme', 'custnowomen', 'customerwomen'],
  contactMen:      ['contactmen', 'contacthomme', 'contact'],
  contactWomen:    ['contactwomen', 'contactfemme'],
  emailWomen:      ['emailwomen', 'email'],
  phoneWomen:      ['phonewomen', 'phone', 'tel', 'telephone'],
  specialHandling: ['specialhandling', 'special', 'handling'],
  notes:           ['notes', 'note', 'comment', 'comments'],
};

const MATERIAL_FIELDS = {
  code:            ['code', 'materialcode', 'abbreviation', 'abbr'],
  name:            ['name', 'material', 'materialname', 'product'],
  category:        ['category', 'type'],
  defaultFormat:   ['defaultformat', 'format', 'size'],
  defaultColour:   ['defaultcolour', 'defaultcolor', 'colour', 'color'],
  defaultQuality:  ['defaultquality', 'quality', 'materialquality'],
  defaultPacking:  ['defaultpacking', 'packing', 'packaging'],
  standardRemarks: ['standardremarks', 'remarks', 'remark', 'notes'],
  filenameSlug:    ['filenameslug', 'slug', 'filename'],
};

function mapRow(rawRow, fieldMap) {
  const rowMap = {};
  for (const [k, v] of Object.entries(rawRow)) rowMap[norm(k)] = v;
  const out = {};
  for (const [field, candidates] of Object.entries(fieldMap)) {
    out[field] = pick(rowMap, candidates);
  }
  return out;
}

function sheetByName(wb, wanted) {
  const target = norm(wanted);
  const name = wb.SheetNames.find((n) => norm(n).includes(target) || target.includes(norm(n)));
  return name ? wb.Sheets[name] : null;
}

// ─── Sales list (per collection) ─────────────────────────────────────────────
// The MEN and WOMEN workbooks do NOT share a layout: CUSTOMER_No. sits in
// column 12 in one and 11 in the other, the header row is at a different
// height, and the WOMEN file spells it "SHOWRROM". So everything is mapped by
// header name, never by position.

const SALES_FIELDS = {
  priority:    ['priority'],
  salesRep:    ['salesrepresentative', 'salesrep'],
  city:        ['city'],
  country:     ['country'],
  notes:       ['notes'],
  customerNo:  ['customerno', 'customer_no', 'customernumber'],
  companyName: ['showroomcompanyname', 'showrromcompanyname', 'companyname', 'showroom'],
  address:     ['address'],
  zip:         ['zipcode', 'zip', 'postcode'],
  contact:     ['contactperson', 'contact'],
  phone:       ['phonenumber', 'phone'],
  email:       ['email', 'e-mail'],
};

/** Collection sheets in a sales list workbook, newest-looking first. */
export async function readSalesListSheets(file) {
  const XLSX = await loadSheetJs();
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  return wb.SheetNames;
}

// "41564 Kaarst Holzbüttgen" -> zip 41564, city "Kaarst Holzbüttgen".
// Left alone when it would be a guess: UK "E1 6PX", Swedish "412 63".
function splitZipCity(raw) {
  const s = String(raw || '').trim();
  const m = s.match(/^(\d{4,6})\s+([A-Za-zÀ-ÿ].*)$/);
  return m ? { zip: m[1], city: m[2].trim() } : { zip: s, city: '' };
}

/**
 * Parse one collection sheet of a sales list.
 * Returns the participating showrooms with their delivery details.
 */
export async function parseSalesListSheet(file, sheetName) {
  const XLSX = await loadSheetJs();
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet "${sheetName}" not found`);
  const grid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false });

  // The sheet opens with sample-allocation blocks; the real table starts at the
  // row naming the sales representative.
  const headerIdx = grid.findIndex((r) => r.some((c) => norm(c) === 'salesrepresentative'));
  if (headerIdx === -1) throw new Error('Could not find the SALES LIST header row in that sheet');

  const header = grid[headerIdx].map((c) => norm(c));
  const colOf = (candidates) => {
    for (const cand of candidates) {
      const i = header.indexOf(cand);
      if (i !== -1) return i;
    }
    return -1;
  };
  const cols = {};
  for (const [field, cands] of Object.entries(SALES_FIELDS)) cols[field] = colOf(cands);

  const rows = [];
  for (let i = headerIdx + 1; i < grid.length; i++) {
    const r = grid[i];
    const val = (field) => (cols[field] === -1 ? '' : String(r[cols[field]] ?? '').trim());
    const city = val('city');
    const customerNo = val('customerNo');
    // A row is real when it names a location. Totals and spacers have neither.
    if (!city && !customerNo) continue;
    if (/^(total|meeting|balance)/i.test(city)) continue;
    const { zip, city: zipCity } = splitZipCity(val('zip'));
    rows.push({
      priority: val('priority'),
      salesRep: val('salesRep'),
      // The sales list's CITY is the showroom label (Düsseldorf, Oslo2).
      name: city,
      city: zipCity,
      country: val('country'),
      customerNo,
      companyName: val('companyName'),
      address: val('address'),
      zip,
      contact: val('contact'),
      phone: val('phone'),
      email: val('email'),
      notes: val('notes'),
    });
  }
  const missingCols = Object.entries(cols).filter(([, i]) => i === -1).map(([f]) => f);
  return { rows, headerRow: headerIdx, missingCols };
}

/**
 * Parse SELECTED_SHOWROOM_MASTER_REGISTRY.xlsx into mapped rows.
 * Returns { showrooms, materials, verifyChecklist, sheetNames }.
 * Best-effort header matching — the UI shows a preview before committing.
 */
export async function parseRegistryWorkbook(file) {
  const XLSX = await loadSheetJs();
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });

  const result = { showrooms: [], materials: [], verifyChecklist: [], sheetNames: wb.SheetNames };

  const showroomSheet = sheetByName(wb, 'SHOWROOM REGISTRY');
  if (showroomSheet) {
    const raw = XLSX.utils.sheet_to_json(showroomSheet, { defval: '' });
    result.showrooms = raw
      .map((r) => mapRow(r, SHOWROOM_FIELDS))
      .filter((r) => r.name)
      .map((r) => ({
        ...r,
        // Rows flagged VERIFY in the LINES column become VERIFY status; lines
        // is then cleared so it isn't misread as a gender value.
        status: norm(r.lines) === 'verify' ? 'VERIFY' : 'ACTIVE',
        lines: norm(r.lines) === 'verify' ? null : r.lines,
      }));
  }

  const materialSheet = sheetByName(wb, 'MATERIAL CATALOG');
  if (materialSheet) {
    const raw = XLSX.utils.sheet_to_json(materialSheet, { defval: '' });
    result.materials = raw
      .map((r) => mapRow(r, MATERIAL_FIELDS))
      .filter((r) => r.name);
  }

  // "VERIFY WITH PURCHASING" is NOT imported as data — surfaced as a checklist.
  const verifySheet = sheetByName(wb, 'VERIFY WITH PURCHASING');
  if (verifySheet) {
    const raw = XLSX.utils.sheet_to_json(verifySheet, { defval: '', header: 1 });
    result.verifyChecklist = raw
      .filter((row) => Array.isArray(row) && row.some((c) => String(c).trim()))
      .map((row) => row.filter((c) => String(c).trim()).join(' · '));
  }

  return result;
}
