// Reading a typed money amount, and turning it back into a percentage.
//
// Used by the Quotation cost split, where a share can be given either way:
// type 60 % and see the amount, or type the amount and see the percentage.
// Percentage stays the stored value — it is what the PDF prints and what
// survives re-opening a quotation — so an amount is converted on the way in.

/**
 * Parse an amount as a person would type it, in any of the currencies the
 * builder supports. Handles the symbol, spaces, and both grouping styles:
 *
 *   "kr 123.450"  → 123450     (da-DK / de-DE grouping)
 *   "£1,234"      → 1234       (en-GB grouping)
 *   "1.234,50"    → 1234.5     (both present: dot groups, comma decides)
 *   "1,234.50"    → 1234.5     (both present, the other way round)
 *   "1234,5"      → 1234.5     (a lone separator with 1–2 digits is decimal)
 *
 * Returns null for anything that is not a number, so a half-typed field can
 * be told apart from a deliberate zero.
 */
export function parseAmountInput(raw) {
  const s = String(raw ?? '').replace(/[^\d.,-]/g, '');
  if (!s || !/\d/.test(s)) return null;

  const neg = s.trimStart().startsWith('-');
  const body = s.replace(/-/g, '');
  const lastDot = body.lastIndexOf('.');
  const lastComma = body.lastIndexOf(',');

  let normalised;
  if (lastDot >= 0 && lastComma >= 0) {
    // Both present: whichever comes last is the decimal separator.
    const decimalAt = Math.max(lastDot, lastComma);
    normalised = body.slice(0, decimalAt).replace(/[.,]/g, '') + '.' + body.slice(decimalAt + 1).replace(/[.,]/g, '');
  } else if (lastDot >= 0 || lastComma >= 0) {
    const at = Math.max(lastDot, lastComma);
    const sep = body[at];
    const after = body.slice(at + 1);
    const occurrences = body.split(sep).length - 1;
    // One separator followed by 1 or 2 digits is a decimal point; anything
    // else — several of them, or a group of exactly three digits — is
    // grouping. "1.234" is one thousand two hundred, not 1.234.
    const isDecimal = occurrences === 1 && after.length > 0 && after.length <= 2;
    normalised = isDecimal ? `${body.slice(0, at).replace(/[.,]/g, '')}.${after}` : body.replace(/[.,]/g, '');
  } else {
    normalised = body;
  }

  const n = parseFloat(normalised);
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

/**
 * The percentage of `grand` that gives `amount` — written with the FEWEST
 * decimals that still round-trips back to the same amount.
 *
 * Half of something is "50", not "50.000000"; a third is only as long as it
 * has to be. Round-tripping is the point: the amount shown back must be the
 * amount that was typed, or the split would quietly drift by a unit or two.
 */
export function pctForAmount(amount, grand) {
  if (!(grand > 0) || !Number.isFinite(amount)) return '0';
  const target = Math.round(amount);
  const exact = (amount / grand) * 100;
  for (let d = 0; d <= 8; d++) {
    const candidate = Number(exact.toFixed(d));
    if (Math.round((grand * candidate) / 100) === target) return String(candidate);
  }
  return String(Number(exact.toFixed(8)));
}
