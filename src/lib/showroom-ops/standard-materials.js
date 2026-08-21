// The boards that recur every season. Seeded into the Material Catalog so a
// line only needs its subtitle (the motif) — format, colour and quality come
// from here rather than being retyped, and the override fields on a line stay
// for the seasons that genuinely deviate.
//
// Packing and remarks are taken from the real SUMMER 27 workbook, where every
// board row reads "Plano" and "Renskæres". Everything is editable afterwards.

export const STANDARD_MATERIALS = [
  {
    code: 'SB',
    name: 'Small Board',
    category: 'BOARD',
    defaultFormat: '210 x 297 mm',
    defaultColour: '4+4',
    defaultQuality: '3 mm skiltekarton',
    defaultPacking: 'Plano',
    standardRemarks: 'Renskæres',
    filenameSlug: 'SMALL_BOARD',
  },
  {
    code: 'MB',
    name: 'Medium Board',
    category: 'BOARD',
    defaultFormat: '300 x 420 mm',
    defaultColour: '4+4',
    defaultQuality: '3 mm skiltekarton',
    defaultPacking: 'Plano',
    standardRemarks: 'Renskæres',
    filenameSlug: 'MEDIUM_BOARD',
  },
  {
    code: 'LB',
    name: 'Large Board',
    category: 'BOARD',
    defaultFormat: '450 x 600 mm',
    defaultColour: '4+4',
    defaultQuality: '3 mm skiltekarton',
    defaultPacking: 'Plano',
    standardRemarks: 'Renskæres',
    filenameSlug: 'LARGE_BOARD',
  },
];

/** Names already in the catalog, compared case-insensitively. */
export function missingStandardMaterials(existing) {
  const have = new Set((existing || []).map((m) => String(m.name || '').trim().toLowerCase()));
  return STANDARD_MATERIALS.filter((m) => !have.has(m.name.toLowerCase()));
}
