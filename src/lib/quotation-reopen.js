// Rebuilds a Quotation Builder state from the printed TEXT of a Selected Frame
// quotation that predates the embedded data (see EMBEDDED_KEY in
// quotation-pdf.js). Newer documents never come through here — their data is
// read back exactly from the PDF's metadata.
//
// Two layouts exist in the wild: the pdf-lib document filed into project
// folders, and the browser-printed one from the old download path. Both render
// the same labels, so parsing keys on labels, never on position.
//
// pdf.js hands over each visual line as one string, but the words on it come
// in DRAWING order, not left-to-right — the pdf-lib meta block draws the value
// before its key, so a line reads "12 Aug 2026 DATE". Every match here is
// therefore order-insensitive.
//
// Silent drops are the failure mode to watch: the amounts read back are summed
// and compared with the document's own total, and a mismatch is an error.

// amount() reads sign and digits; the line patterns capture the WHOLE money
// token (symbol included) and hand it to amount() as-is — feeding it sign and
// digits without the symbol quietly returned null for every row.
const MONEY = /([−-]?)\s*(?:€|£|kr)\s*(\d[\d.,]*)/;
const MONEY_TOKEN = '([−-]?\\s*(?:€|£|kr)\\s*\\d[\\d.,]*)';
const MONEY_END = new RegExp(`${MONEY_TOKEN}\\s*$`);
const QTY_MONEY_END = new RegExp(`^(.*?)\\s+(\\d+)\\s+${MONEY_TOKEN}\\s*$`);   // name, qty, money
const ITEM_LINE = new RegExp(`^(\\d+)×\\s*(.*?)\\s+${MONEY_TOKEN}\\s*$`);        // qty, name, money
const TAGLINE = /\[\s*A FRAME FOR THE BUSINESS WE SHARE\s*\]/i;

/** "€12.345" / "kr 12.345" / "£1,234" / "−€500" → number. No decimals are ever printed. */
export function amount(str) {
  const m = String(str || '').match(MONEY);
  if (!m) return null;
  const n = parseInt(m[2].replace(/[^\d]/g, ''), 10);
  if (!Number.isFinite(n)) return null;
  return m[1] ? -n : n;
}

function currencyFrom(lines) {
  const explicit = lines.map((l) => l.match(/\bCURRENCY\b\s*([A-Z]{3})|([A-Z]{3})\s*\bCURRENCY\b/i)).find(Boolean);
  const code = explicit && (explicit[1] || explicit[2]);
  if (code && /^(EUR|DKK|GBP)$/i.test(code)) return code.toUpperCase();
  const joined = lines.join(' ');
  if (/£\s*\d/.test(joined)) return 'GBP';
  if (/\bkr\s*\d/.test(joined)) return 'DKK';
  return 'EUR';
}

/** Value of a meta row whichever side of the line the key sits on. */
function metaValue(line, key) {
  const re = new RegExp(`\\b${key}\\b`, 'i');
  if (!re.test(line)) return null;
  const v = line.replace(re, '').replace(TAGLINE, '').trim();
  return v || null;
}

export function parseSelectedFrameQuotation(rawLines) {
  const lines = (rawLines || []).map((l) => String(l || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
  const warnings = [];
  const header = { project: '', salesArea: null, gender: '', quotationDate: '', validUntil: '' };
  const rows = { Inventory: null, 'Selected Deliveries': null, 'Specific Project Cost': null };
  const addOns = [];
  const customs = [];
  const parties = [];
  const categories = [];
  let grand = null;

  let phase = 'head';      // head → summary → addons → customs → split → itemised
  let sawQuotation = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ── Section switches, in the order the document prints them ──────────
    if (/^Project Cost incl\./i.test(line)) { phase = 'summary'; continue; }
    if (line === 'Add-ons') { phase = 'addons'; continue; }
    if (line === 'Additional Items') { phase = 'customs'; continue; }
    if (line === 'Cost Split') { phase = 'split'; continue; }
    if (/^Itemised Breakdown$/i.test(line)) { phase = 'itemised'; continue; }
    if (/^VALIDITY$/i.test(line) || /^This quotation is valid until/i.test(line)) { phase = 'tail'; continue; }

    // ── Grand total: on one line, or the amount on the line after ────────
    if (/^Total excl\. VAT/i.test(line)) {
      const here = amount(line.replace(/^Total excl\. VAT/i, ''));
      const next = here == null ? amount(lines[i + 1] || '') : null;
      if (here != null) grand = here;
      else if (next != null && MONEY_END.test(lines[i + 1]) && !/[A-Za-z]{3,}/.test(lines[i + 1].replace(/kr/i, ''))) { grand = next; i += 1; }
      continue;
    }

    if (phase === 'head') {
      if (line === 'Quotation') { sawQuotation = true; continue; }
      for (const [key, field] of [['DATE', 'quotationDate'], ['VALID UNTIL', 'validUntil'], ['GENDER', 'gender']]) {
        const v = metaValue(line, key);
        if (v != null) { header[field] = v; continue; }
      }
      const sa = metaValue(line, 'SALES AREA');
      if (sa != null) { const n = parseFloat(sa.replace(/m²|m2/i, '').replace(',', '.')); if (Number.isFinite(n)) header.salesArea = n; continue; }
      if (metaValue(line, 'CURRENCY') != null) continue;
      // The first plain line after "Quotation" is the project name.
      if (sawQuotation && !header.project && !TAGLINE.test(line) && !/^(DATE|VALID UNTIL|SALES AREA|GENDER|CURRENCY)\b/i.test(line) && !MONEY.test(line)) {
        header.project = line;
      }
      continue;
    }

    if (phase === 'summary') {
      for (const label of Object.keys(rows)) {
        if (line.startsWith(label) && MONEY_END.test(line)) rows[label] = amount(line.slice(label.length));
      }
      continue;
    }

    if (phase === 'addons' || phase === 'customs') {
      if (/^(Add-ons Total|Total)\b/.test(line)) continue;      // section totals are recomputed
      if (/^ITEM\b/.test(line)) continue;                       // column header
      const m = line.match(QTY_MONEY_END);
      if (m) {
        const qty = parseInt(m[2], 10) || 1;
        const total = amount(m[3]);
        (phase === 'addons' ? addOns : customs).push({ name: m[1].trim(), qty, total, unitPrice: Math.round((total / qty) * 100) / 100 });
      }
      continue;
    }

    if (phase === 'split') {
      const m = line.match(/^(.*?)\s+([\d.,]+)%\s+(.*)$/);
      if (m && !/^Total$/i.test(m[1].trim())) parties.push({ label: m[1].trim(), pct: parseFloat(m[2].replace(',', '.')), amount: amount(m[3]) });
      continue;
    }

    if (phase === 'itemised') {
      const item = line.match(ITEM_LINE);
      if (item && categories.length) {
        categories[categories.length - 1].items.push({ qty: parseInt(item[1], 10), name: item[2].trim(), totalPrice: amount(item[3]) });
        continue;
      }
      if (MONEY_END.test(line) && !/^\d+×/.test(line) && !/^Line items from/i.test(line)) {
        const name = line.replace(MONEY_END, '').trim();
        if (name) categories.push({ name, total: amount(line.slice(name.length)), items: [] });
      }
      continue;
    }
  }

  const rowList = Object.entries(rows).map(([label, value]) => ({ label, value: value ?? 0 }));
  const found = rowList.filter((r) => rows[r.label] != null).length;
  if (!found && !addOns.length && !customs.length) {
    throw new Error('This does not look like a Selected Frame quotation — no cost rows were found in it.');
  }

  const supTotal = rowList.reduce((s, r) => s + r.value, 0);
  const aoTotal = addOns.reduce((s, a) => s + (a.total || 0), 0);
  const custTotal = customs.reduce((s, c) => s + (c.total || 0), 0);
  const computed = supTotal + aoTotal + custTotal;

  if (grand == null) {
    warnings.push({ severity: 'warn', message: 'The document’s grand total could not be read, so the amounts are unverified.' });
  } else if (Math.abs(computed - grand) > 2) {
    warnings.push({
      severity: 'error',
      message: `The amounts read back (${computed.toLocaleString('en-GB')}) do not add up to the document’s total (${grand.toLocaleString('en-GB')}). A line was probably missed — check every section before re-issuing.`,
    });
  }
  if (found < 3) {
    warnings.push({ severity: 'warn', message: `Only ${found} of the 3 cost categories were found; the missing ones are set to 0.` });
  }
  warnings.push({
    severity: 'info',
    message: 'Restored from the printed text of an older quotation. Item names are as printed, so the hanger calculation may differ from the original.',
  });

  return {
    restoredFrom: 'text',
    header,
    currency: { code: currencyFrom(lines) },
    rows: rowList,
    addOns,
    customs,
    supTotal, aoTotal, custTotal,
    grand: grand ?? computed,
    split: parties.length ? { on: true, parties, sum: parties.reduce((s, p) => s + p.pct, 0) } : null,
    itemised: categories.length ? { include: true, categories } : null,
    warnings,
  };
}
