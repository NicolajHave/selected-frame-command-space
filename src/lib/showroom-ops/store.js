// Server-side data layer for Showroom Operations.
// Mirrors the shape of lib/external-folders/folders.js (row mappers + thin
// functions over Supabase). All access goes through the schema-scoped client.

import { getShowroomSupabase, unwrap, isConfigured } from './db';
import { generateFilename } from './filename';

export { isConfigured };

// ─── Row mappers ──────────────────────────────────────────────────────────────
const showroomFromRow = (r) => r && ({
  id: r.id, name: r.name, country: r.country, lines: r.lines,
  deliveryType: r.delivery_type, companyName: r.company_name,
  addressMen: r.address_men, zipMen: r.zip_men,
  addressWomen: r.address_women, zipWomen: r.zip_women,
  customerNoMen: r.customer_no_men, customerNoWomen: r.customer_no_women,
  contactMen: r.contact_men, contactWomen: r.contact_women,
  emailWomen: r.email_women, phoneWomen: r.phone_women,
  specialHandling: r.special_handling, status: r.status, notes: r.notes,
});

const materialFromRow = (r) => r && ({
  id: r.id, code: r.code, name: r.name, category: r.category,
  defaultFormat: r.default_format, defaultColour: r.default_colour,
  defaultQuality: r.default_quality, defaultPacking: r.default_packing,
  standardRemarks: r.standard_remarks, filenameSlug: r.filename_slug,
});

const seasonFromRow = (r) => r && ({
  id: r.id, name: r.name, code: r.code, orderDate: r.order_date,
  deliveryDate: r.delivery_date, status: r.status, invoicing: r.invoicing,
  costcenterMen: r.costcenter_men, costcenterWomen: r.costcenter_women,
});

const lineFromRow = (r) => r && ({
  id: r.id, seasonId: r.season_id, materialId: r.material_id, scope: r.scope,
  gender: r.gender, motifTitle: r.motif_title, freeTextName: r.free_text_name,
  formatOverride: r.format_override, colourOverride: r.colour_override,
  qualityOverride: r.quality_override, motives: r.motives, amount: r.amount,
  sprint: r.sprint, responsible: r.responsible, copyBrief: r.copy_brief,
  remarks: r.remarks, filename: r.filename, status: r.status, price: r.price,
  targetShowroomId: r.target_showroom_id, sortOrder: r.sort_order,
});

const seasonShowroomFromRow = (r) => r && ({
  seasonId: r.season_id, showroomId: r.showroom_id,
  menPackage: !!r.men_package, womenPackage: !!r.women_package,
  extras: r.extras, remarks: r.remarks,
});

// camelCase → snake_case column maps for partial updates.
const SHOWROOM_COLS = {
  name: 'name', country: 'country', lines: 'lines', deliveryType: 'delivery_type',
  companyName: 'company_name', addressMen: 'address_men', zipMen: 'zip_men',
  addressWomen: 'address_women', zipWomen: 'zip_women',
  customerNoMen: 'customer_no_men', customerNoWomen: 'customer_no_women',
  contactMen: 'contact_men', contactWomen: 'contact_women',
  emailWomen: 'email_women', phoneWomen: 'phone_women',
  specialHandling: 'special_handling', status: 'status', notes: 'notes',
};
const MATERIAL_COLS = {
  code: 'code', name: 'name', category: 'category', defaultFormat: 'default_format',
  defaultColour: 'default_colour', defaultQuality: 'default_quality',
  defaultPacking: 'default_packing', standardRemarks: 'standard_remarks',
  filenameSlug: 'filename_slug',
};
const SEASON_COLS = {
  name: 'name', code: 'code', orderDate: 'order_date', deliveryDate: 'delivery_date',
  status: 'status', invoicing: 'invoicing', costcenterMen: 'costcenter_men',
  costcenterWomen: 'costcenter_women',
};
const LINE_COLS = {
  materialId: 'material_id', scope: 'scope', gender: 'gender', motifTitle: 'motif_title',
  freeTextName: 'free_text_name', formatOverride: 'format_override',
  colourOverride: 'colour_override', qualityOverride: 'quality_override',
  motives: 'motives', amount: 'amount', sprint: 'sprint', responsible: 'responsible',
  copyBrief: 'copy_brief', remarks: 'remarks', filename: 'filename', status: 'status',
  price: 'price', targetShowroomId: 'target_showroom_id', sortOrder: 'sort_order',
};

function toColumns(patch, map) {
  const out = {};
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      out[col] = patch[k] === '' ? null : patch[k];
    }
  }
  return out;
}

// ─── Showrooms ────────────────────────────────────────────────────────────────
export async function listShowrooms() {
  const sb = getShowroomSupabase();
  const data = unwrap(await sb.from('showrooms').select('*').order('name', { ascending: true }), 'listShowrooms');
  return data.map(showroomFromRow);
}
export async function createShowroom(patch) {
  const sb = getShowroomSupabase();
  const row = unwrap(await sb.from('showrooms').insert(toColumns(patch, SHOWROOM_COLS)).select('*').single(), 'createShowroom');
  return showroomFromRow(row);
}
export async function updateShowroom(id, patch) {
  const sb = getShowroomSupabase();
  const update = { ...toColumns(patch, SHOWROOM_COLS), updated_at: new Date().toISOString() };
  const row = unwrap(await sb.from('showrooms').update(update).eq('id', id).select('*').maybeSingle(), 'updateShowroom');
  return showroomFromRow(row);
}
export async function deleteShowroom(id) {
  const sb = getShowroomSupabase();
  unwrap(await sb.from('showrooms').delete().eq('id', id), 'deleteShowroom');
}

// ─── Materials ────────────────────────────────────────────────────────────────
export async function listMaterials() {
  const sb = getShowroomSupabase();
  const data = unwrap(await sb.from('materials').select('*').order('name', { ascending: true }), 'listMaterials');
  return data.map(materialFromRow);
}
export async function createMaterial(patch) {
  const sb = getShowroomSupabase();
  const row = unwrap(await sb.from('materials').insert(toColumns(patch, MATERIAL_COLS)).select('*').single(), 'createMaterial');
  return materialFromRow(row);
}
export async function updateMaterial(id, patch) {
  const sb = getShowroomSupabase();
  const update = { ...toColumns(patch, MATERIAL_COLS), updated_at: new Date().toISOString() };
  const row = unwrap(await sb.from('materials').update(update).eq('id', id).select('*').maybeSingle(), 'updateMaterial');
  return materialFromRow(row);
}
export async function deleteMaterial(id) {
  const sb = getShowroomSupabase();
  unwrap(await sb.from('materials').delete().eq('id', id), 'deleteMaterial');
}

// Bulk seed (used by the xlsx importer). Inserts only; caller decides whether
// to clear first. Returns inserted counts.
export async function bulkInsertShowrooms(rows) {
  if (!rows?.length) return 0;
  const sb = getShowroomSupabase();
  const payload = rows.map((r) => toColumns(r, SHOWROOM_COLS));
  unwrap(await sb.from('showrooms').insert(payload), 'bulkInsertShowrooms');
  return payload.length;
}
export async function bulkInsertMaterials(rows) {
  if (!rows?.length) return 0;
  const sb = getShowroomSupabase();
  const payload = rows.map((r) => toColumns(r, MATERIAL_COLS));
  unwrap(await sb.from('materials').insert(payload), 'bulkInsertMaterials');
  return payload.length;
}

// ─── Seasons ──────────────────────────────────────────────────────────────────
export async function listSeasons() {
  const sb = getShowroomSupabase();
  const data = unwrap(await sb.from('seasons').select('*').order('created_at', { ascending: false }), 'listSeasons');
  return data.map(seasonFromRow);
}
export async function getSeason(id) {
  const sb = getShowroomSupabase();
  const row = unwrap(await sb.from('seasons').select('*').eq('id', id).maybeSingle(), 'getSeason');
  return seasonFromRow(row);
}
export async function createSeason(patch) {
  const sb = getShowroomSupabase();
  const row = unwrap(await sb.from('seasons').insert(toColumns(patch, SEASON_COLS)).select('*').single(), 'createSeason');
  return seasonFromRow(row);
}
export async function updateSeason(id, patch) {
  const sb = getShowroomSupabase();
  const update = { ...toColumns(patch, SEASON_COLS), updated_at: new Date().toISOString() };
  const row = unwrap(await sb.from('seasons').update(update).eq('id', id).select('*').maybeSingle(), 'updateSeason');
  return seasonFromRow(row);
}
export async function deleteSeason(id) {
  const sb = getShowroomSupabase();
  unwrap(await sb.from('seasons').delete().eq('id', id), 'deleteSeason');
}

export async function getSeasonDetail(id) {
  const season = await getSeason(id);
  if (!season) return null;
  const sb = getShowroomSupabase();
  const lines = unwrap(
    await sb.from('season_lines').select('*').eq('season_id', id).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
    'getSeasonDetail/lines',
  );
  const seasonShowrooms = unwrap(
    await sb.from('season_showrooms').select('*').eq('season_id', id),
    'getSeasonDetail/showrooms',
  );
  return {
    season,
    lines: lines.map(lineFromRow),
    seasonShowrooms: seasonShowrooms.map(seasonShowroomFromRow),
  };
}

/**
 * Duplicate a season: copies header data, all season_showrooms, and all lines
 * with status reset to DRAFT. The "killer feature" — a new season starts as a
 * copy of the previous one.
 */
export async function duplicateSeason(sourceId, { name, code, orderDate, deliveryDate }) {
  const source = await getSeasonDetail(sourceId);
  if (!source) return null;
  const sb = getShowroomSupabase();

  const newSeason = unwrap(
    await sb.from('seasons').insert({
      name: name || `${source.season.name} (copy)`,
      code: code || `${source.season.code}_COPY`,
      order_date: orderDate || null,
      delivery_date: deliveryDate || null,
      status: 'PLANNING',
      invoicing: source.season.invoicing,
      costcenter_men: source.season.costcenterMen,
      costcenter_women: source.season.costcenterWomen,
    }).select('*').single(),
    'duplicateSeason/season',
  );

  if (source.seasonShowrooms.length) {
    const ssPayload = source.seasonShowrooms.map((ss) => ({
      season_id: newSeason.id, showroom_id: ss.showroomId,
      men_package: ss.menPackage, women_package: ss.womenPackage,
      extras: ss.extras, remarks: ss.remarks,
    }));
    unwrap(await sb.from('season_showrooms').insert(ssPayload), 'duplicateSeason/showrooms');
  }

  if (source.lines.length) {
    const linePayload = source.lines.map((l) => ({
      season_id: newSeason.id, material_id: l.materialId, scope: l.scope,
      gender: l.gender, motif_title: l.motifTitle, free_text_name: l.freeTextName,
      format_override: l.formatOverride, colour_override: l.colourOverride,
      quality_override: l.qualityOverride, motives: l.motives, amount: l.amount,
      sprint: l.sprint, responsible: l.responsible, copy_brief: l.copyBrief,
      remarks: l.remarks, filename: l.filename, status: 'DRAFT', price: l.price,
      target_showroom_id: l.targetShowroomId, sort_order: l.sortOrder,
    }));
    unwrap(await sb.from('season_lines').insert(linePayload), 'duplicateSeason/lines');
  }

  return seasonFromRow(newSeason);
}

// ─── season_showrooms ─────────────────────────────────────────────────────────
export async function setSeasonShowroom(seasonId, showroomId, patch) {
  const sb = getShowroomSupabase();
  const row = {
    season_id: seasonId, showroom_id: showroomId,
    men_package: !!patch.menPackage, women_package: !!patch.womenPackage,
    extras: patch.extras || null, remarks: patch.remarks || null,
  };
  const data = unwrap(
    await sb.from('season_showrooms').upsert(row, { onConflict: 'season_id,showroom_id' }).select('*').single(),
    'setSeasonShowroom',
  );
  return seasonShowroomFromRow(data);
}
export async function removeSeasonShowroom(seasonId, showroomId) {
  const sb = getShowroomSupabase();
  unwrap(await sb.from('season_showrooms').delete().eq('season_id', seasonId).eq('showroom_id', showroomId), 'removeSeasonShowroom');
}

// ─── season_lines ─────────────────────────────────────────────────────────────
async function resolveFilename({ seasonId, line, materialId }) {
  // Build the auto filename from season code + line + material context.
  const sb = getShowroomSupabase();
  const season = await getSeason(seasonId);
  if (!season) return null;
  let material = null;
  if (materialId) {
    const row = unwrap(await sb.from('materials').select('*').eq('id', materialId).maybeSingle(), 'resolveFilename/material');
    material = materialFromRow(row);
  }
  const slug = material?.filenameSlug || material?.name || line.freeTextName || '';
  const format = line.formatOverride || material?.defaultFormat || '';
  const isDigital = (material?.category || '').toUpperCase() === 'DIGITAL';
  return generateFilename({
    gender: line.gender, seasonCode: season.code, scope: line.scope,
    materialSlug: slug, format, isDigital,
  });
}

export async function createLine(seasonId, patch) {
  const sb = getShowroomSupabase();
  const insert = { season_id: seasonId, ...toColumns(patch, LINE_COLS) };
  if (!insert.scope) insert.scope = 'LOCAL_SHOWROOMS';
  // Auto-generate filename unless one was supplied.
  if (!insert.filename) {
    insert.filename = await resolveFilename({ seasonId, line: patch, materialId: patch.materialId });
  }
  const row = unwrap(await sb.from('season_lines').insert(insert).select('*').single(), 'createLine');
  return lineFromRow(row);
}

export async function updateLine(id, patch) {
  const sb = getShowroomSupabase();
  const update = { ...toColumns(patch, LINE_COLS), updated_at: new Date().toISOString() };
  // Regenerate filename on demand (UI sends regenerateFilename: true).
  if (patch.regenerateFilename) {
    const existing = unwrap(await sb.from('season_lines').select('*').eq('id', id).maybeSingle(), 'updateLine/read');
    if (existing) {
      const merged = { ...lineFromRow(existing), ...patch };
      update.filename = await resolveFilename({ seasonId: existing.season_id, line: merged, materialId: merged.materialId });
    }
  }
  const row = unwrap(await sb.from('season_lines').update(update).eq('id', id).select('*').maybeSingle(), 'updateLine');
  return lineFromRow(row);
}

export async function deleteLine(id) {
  const sb = getShowroomSupabase();
  unwrap(await sb.from('season_lines').delete().eq('id', id), 'deleteLine');
}

/**
 * Derived shipping list for a season. Joins season_showrooms with the
 * registry, splitting per gender so each row carries the correct customer
 * number. Never stored — recomputed on demand. This is what replaces the
 * drift between order sheet and forsendelsesliste.
 */
export async function getShippingList(seasonId) {
  const detail = await getSeasonDetail(seasonId);
  if (!detail) return null;
  const all = await listShowrooms();
  const byId = new Map(all.map((s) => [s.id, s]));

  const rows = [];
  for (const ss of detail.seasonShowrooms) {
    const sr = byId.get(ss.showroomId);
    if (!sr) continue;
    const base = {
      showroomId: sr.id, showroom: sr.name, country: sr.country,
      deliveryType: sr.deliveryType, extras: ss.extras, remarks: ss.remarks,
      specialHandling: sr.specialHandling, status: sr.status,
    };
    if (ss.menPackage) {
      rows.push({
        ...base, gender: 'MEN', address: sr.addressMen, zip: sr.zipMen,
        customerNo: sr.customerNoMen, contact: sr.contactMen,
      });
    }
    if (ss.womenPackage) {
      rows.push({
        ...base, gender: 'WOMEN', address: sr.addressWomen || sr.addressMen,
        zip: sr.zipWomen || sr.zipMen, customerNo: sr.customerNoWomen,
        contact: sr.contactWomen, email: sr.emailWomen, phone: sr.phoneWomen,
      });
    }
  }
  rows.sort((a, b) => (a.showroom || '').localeCompare(b.showroom || '') || (a.gender || '').localeCompare(b.gender || ''));
  return { season: detail.season, rows };
}
