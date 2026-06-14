// Filename generator for Showroom Ops print/digital lines.
// Pure module — imported by both the data layer (auto-generate on create) and
// the UI (live preview + regenerate). Convention:
//
//   {BRAND}_{SEASONCODE}_{EVENT}_{LOCATION}_{MATERIAL_SLUG}_{FORMAT}_3MM-BLEED_PRINT
//
// Real example:
//   SLM_SPRING27_CM_PERFECT_SHOWROOM_MEDIUM_BOARD_300x420MM_3MM-BLEED_PRINT

const BRAND_BY_GENDER = { MEN: 'SLM', WOMEN: 'SLW', UNISEX: 'SLT' };

// Collection-meeting scopes carry the CM event code. LOCAL_SHOWROOMS uses LS.
// (LS code is provisional — confirm with Nicolaj; today only CM appears in
// real data.) Other scopes default to CM.
const EVENT_BY_SCOPE = {
  LOCAL_SHOWROOMS: 'LS',
  BRANDE_SHOWROOM: 'CM',
  PERFECT_SHOWROOM: 'CM',
  CREATIVE_SHOWROOM: 'CM',
  DACH_SHOWROOM: 'CM',
  FOYER: 'CM',
  INSTORE: 'CM',
};

// Scopes that contribute a LOCATION segment. LOCAL_SHOWROOMS generic items omit it.
const LOCATION_SCOPES = new Set([
  'BRANDE_SHOWROOM', 'PERFECT_SHOWROOM', 'CREATIVE_SHOWROOM', 'DACH_SHOWROOM', 'FOYER', 'INSTORE',
]);

export function eventCodeForScope(scope) {
  return EVENT_BY_SCOPE[scope] || 'CM';
}

export function brandForGender(gender) {
  return BRAND_BY_GENDER[gender] || 'SLT';
}

/**
 * Normalise a human format string into the filename token.
 *   '210 x 297 mm' → 'A4'
 *   '300 x 420 mm' → '300x420MM'
 *   'A4'           → 'A4'
 */
export function formatToken(format) {
  if (!format) return '';
  const raw = String(format).trim();
  const compact = raw.replace(/\s+/g, '').toUpperCase();
  if (compact === '210X297MM' || compact === '210X297') return 'A4';
  // Strip a trailing MM, collapse spaces around the ×/x, re-append MM.
  const m = raw.match(/(\d+)\s*[x×]\s*(\d+)/i);
  if (m) return `${m[1]}x${m[2]}MM`;
  return compact;
}

function slugSegment(s) {
  return String(s || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Build a filename from line + material context.
 * @param {object} args
 * @param {string} args.gender   MEN | WOMEN | UNISEX
 * @param {string} args.seasonCode  e.g. 'SPRING27'
 * @param {string} args.scope    LOCAL_SHOWROOMS | BRANDE_SHOWROOM | ...
 * @param {string} args.materialSlug  material.filename_slug (or free-text name)
 * @param {string} args.format   resolved format string (override or default)
 * @param {boolean} args.isDigital  digital items skip the _3MM-BLEED_PRINT suffix
 */
export function generateFilename({ gender, seasonCode, scope, materialSlug, format, isDigital }) {
  const parts = [
    brandForGender(gender),
    slugSegment(seasonCode),
    eventCodeForScope(scope),
  ];
  if (LOCATION_SCOPES.has(scope)) parts.push(slugSegment(scope));
  if (materialSlug) parts.push(slugSegment(materialSlug));
  const ft = formatToken(format);
  if (ft) parts.push(ft);
  let name = parts.filter(Boolean).join('_');
  if (!isDigital) name += '_3MM-BLEED_PRINT';
  return name;
}
