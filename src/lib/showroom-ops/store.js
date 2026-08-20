// Server-side data layer for Showroom Operations.
// Mirrors the shape of lib/external-folders/folders.js (row mappers + thin
// functions over Supabase). All access goes through the schema-scoped client.

import { getShowroomSupabase, unwrap, isConfigured } from './db';
import { generateFilename } from './filename';

export { isConfigured };

// ─── Row mappers ──────────────────────────────────────────────────────────────
const showroomFromRow = (r) => r && ({
  id: r.id, name: r.name, city: r.city, country: r.country, lines: r.lines,
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
  name: 'name', city: 'city', country: 'country', lines: 'lines', deliveryType: 'delivery_type',
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

// ─── Showroom materials — standing customisations per showroom ───────────────
// These belong to the showroom, not to a season, so nobody has to remember
// Helsinki's lightposter when ticking it for a new season.
const showroomMaterialFromRow = (r) => r && ({
  id: r.id, showroomId: r.showroom_id, materialId: r.material_id,
  name: r.name, gender: r.gender, format: r.format,
  quantity: r.quantity, remarks: r.remarks, active: r.active !== false,
});
const SHOWROOM_MATERIAL_COLS = {
  showroomId: 'showroom_id', materialId: 'material_id', name: 'name',
  gender: 'gender', format: 'format', quantity: 'quantity',
  remarks: 'remarks', active: 'active',
};

export async function listShowroomMaterials(showroomId = null) {
  const sb = getShowroomSupabase();
  let q = sb.from('showroom_materials').select('*').order('name', { ascending: true });
  if (showroomId) q = q.eq('showroom_id', showroomId);
  const data = unwrap(await q, 'listShowroomMaterials');
  return data.map(showroomMaterialFromRow);
}
export async function createShowroomMaterial(patch) {
  const sb = getShowroomSupabase();
  const row = unwrap(
    await sb.from('showroom_materials').insert(toColumns(patch, SHOWROOM_MATERIAL_COLS)).select('*').single(),
    'createShowroomMaterial',
  );
  return showroomMaterialFromRow(row);
}
export async function updateShowroomMaterial(id, patch) {
  const sb = getShowroomSupabase();
  const update = { ...toColumns(patch, SHOWROOM_MATERIAL_COLS), updated_at: new Date().toISOString() };
  const row = unwrap(
    await sb.from('showroom_materials').update(update).eq('id', id).select('*').maybeSingle(),
    'updateShowroomMaterial',
  );
  return showroomMaterialFromRow(row);
}
export async function deleteShowroomMaterial(id) {
  const sb = getShowroomSupabase();
  unwrap(await sb.from('showroom_materials').delete().eq('id', id), 'deleteShowroomMaterial');
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
 * Import one gender's sales list into a season.
 *
 * The customer number is the join key: the sales list calls a showroom
 * "Düsseldorf" where the shipping list calls it "Kaarst", so matching on name
 * alone would create duplicates. Name is only a fallback, normalised so
 * "Montreal 1" and "Montreal1" land on the same physical location — multiple
 * sample sets per city ship once, by design.
 *
 * Existing showrooms are never overwritten: only blank fields are filled in,
 * so a corrected address in the registry survives the next import.
 */
const normName = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '').replace(/\d+$/, '');

export async function importSalesList(seasonId, { gender, rows, createMissing = false }) {
  if (gender !== 'MEN' && gender !== 'WOMEN') throw new Error('gender must be MEN or WOMEN');
  const season = await getSeason(seasonId);
  if (!season) return null;

  const existing = await listShowrooms();
  const byCustomer = new Map();
  for (const s of existing) {
    for (const c of [s.customerNoMen, s.customerNoWomen]) {
      const key = String(c || '').trim();
      if (key) byCustomer.set(key, s);
    }
  }
  const byName = new Map(existing.map((s) => [normName(s.name), s]));

  const custField = gender === 'MEN' ? 'customerNoMen' : 'customerNoWomen';
  const addrField = gender === 'MEN' ? 'addressMen' : 'addressWomen';
  const zipField = gender === 'MEN' ? 'zipMen' : 'zipWomen';
  const contactField = gender === 'MEN' ? 'contactMen' : 'contactWomen';

  const result = { matched: [], created: [], unmatched: [], ticked: 0 };

  for (const row of rows || []) {
    const cust = String(row.customerNo || '').trim();
    let showroom = (cust && byCustomer.get(cust)) || byName.get(normName(row.name)) || null;

    if (!showroom) {
      if (!createMissing) { result.unmatched.push({ name: row.name, customerNo: cust }); continue; }
      showroom = await createShowroom({
        name: row.name,
        city: row.city || null,
        country: row.country || null,
        companyName: row.companyName || null,
        [custField]: cust || null,
        [addrField]: row.address || null,
        [zipField]: row.zip || null,
        [contactField]: row.contact || null,
        ...(gender === 'WOMEN' ? { emailWomen: row.email || null, phoneWomen: row.phone || null } : {}),
        status: cust ? 'ACTIVE' : 'VERIFY',
        notes: row.notes || null,
      });
      if (cust) byCustomer.set(cust, showroom);
      byName.set(normName(showroom.name), showroom);
      result.created.push(showroom.name);
    } else {
      // Fill blanks only — an address corrected in the registry must not be
      // clobbered by a stale sales list.
      const patch = {};
      const fill = (field, value) => {
        if (value && !String(showroom[field] || '').trim()) patch[field] = value;
      };
      fill('city', row.city);
      fill('country', row.country);
      fill('companyName', row.companyName);
      fill(custField, cust);
      fill(addrField, row.address);
      fill(zipField, row.zip);
      fill(contactField, row.contact);
      if (gender === 'WOMEN') { fill('emailWomen', row.email); fill('phoneWomen', row.phone); }
      if (Object.keys(patch).length) await updateShowroom(showroom.id, patch);
      result.matched.push(showroom.name);
    }

    // Tick the gender, preserving whatever the other gender already had.
    const sb = getShowroomSupabase();
    const prior = unwrap(
      await sb.from('season_showrooms').select('*').eq('season_id', seasonId).eq('showroom_id', showroom.id).maybeSingle(),
      'importSalesList/existing',
    );
    await setSeasonShowroom(seasonId, showroom.id, {
      menPackage: gender === 'MEN' ? true : !!prior?.men_package,
      womenPackage: gender === 'WOMEN' ? true : !!prior?.women_package,
      extras: prior?.extras || null,
      remarks: prior?.remarks || null,
    });
    result.ticked += 1;
  }

  return result;
}

/**
 * Everything a ticked showroom pulls in for a season, per gender.
 *
 * A tick on Helsinki/MEN drags Helsinki's standing MEN (and BOTH) materials
 * along with it. Graphics need them as items to produce; purchasing needs them
 * as extras on the shipping row. Derived on demand so a change to a showroom's
 * customisations is reflected the moment it is saved — nothing is copied into
 * the season.
 */
export async function getSeasonCustomisations(seasonId) {
  const detail = await getSeasonDetail(seasonId);
  if (!detail) return null;
  const [showrooms, materials] = await Promise.all([listShowrooms(), listShowroomMaterials()]);
  const byId = new Map(showrooms.map((s) => [s.id, s]));
  const bySr = new Map();
  for (const m of materials) {
    if (!m.active) continue;
    if (!bySr.has(m.showroomId)) bySr.set(m.showroomId, []);
    bySr.get(m.showroomId).push(m);
  }

  const wanted = (m, gender) => m.gender === 'BOTH' || m.gender === gender;
  const rows = [];
  for (const ss of detail.seasonShowrooms) {
    const sr = byId.get(ss.showroomId);
    if (!sr) continue;
    for (const gender of ['MEN', 'WOMEN']) {
      const ticked = gender === 'MEN' ? ss.menPackage : ss.womenPackage;
      if (!ticked) continue;
      for (const m of bySr.get(sr.id) || []) {
        if (!wanted(m, gender)) continue;
        rows.push({
          showroomId: sr.id,
          showroom: sr.name,
          city: sr.city,
          country: sr.country,
          gender,
          name: m.name,
          format: m.format,
          quantity: m.quantity || 1,
          remarks: m.remarks,
          materialId: m.materialId,
        });
      }
    }
  }
  rows.sort((a, b) =>
    (a.showroom || '').localeCompare(b.showroom || '') ||
    a.gender.localeCompare(b.gender) ||
    (a.name || '').localeCompare(b.name || ''));
  return { season: detail.season, rows };
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
  const [all, customs] = await Promise.all([listShowrooms(), listShowroomMaterials()]);
  const byId = new Map(all.map((s) => [s.id, s]));
  // Standing customisations show up as extras on the row, so the buyer sees
  // Helsinki's lightposter without anyone re-typing it each season.
  const customFor = (showroomId, gender) =>
    customs
      .filter((m) => m.active && m.showroomId === showroomId && (m.gender === 'BOTH' || m.gender === gender))
      .map((m) => `${m.quantity > 1 ? `${m.quantity}× ` : ''}${m.name}${m.format ? ` (${m.format})` : ''}`);

  const rows = [];
  for (const ss of detail.seasonShowrooms) {
    const sr = byId.get(ss.showroomId);
    if (!sr) continue;
    const base = {
      showroomId: sr.id, showroom: sr.name, city: sr.city, country: sr.country,
      deliveryType: sr.deliveryType, remarks: ss.remarks,
      specialHandling: sr.specialHandling, status: sr.status,
    };
    const withExtras = (gender) => {
      const parts = [ss.extras, ...customFor(sr.id, gender)].filter(Boolean);
      return parts.join(' · ');
    };
    if (ss.menPackage) {
      rows.push({
        ...base, gender: 'MEN', address: sr.addressMen, zip: sr.zipMen,
        customerNo: sr.customerNoMen, contact: sr.contactMen,
        extras: withExtras('MEN'),
      });
    }
    if (ss.womenPackage) {
      rows.push({
        ...base, gender: 'WOMEN', address: sr.addressWomen || sr.addressMen,
        zip: sr.zipWomen || sr.zipMen, customerNo: sr.customerNoWomen,
        contact: sr.contactWomen, email: sr.emailWomen, phone: sr.phoneWomen,
        extras: withExtras('WOMEN'),
      });
    }
  }
  rows.sort((a, b) => (a.showroom || '').localeCompare(b.showroom || '') || (a.gender || '').localeCompare(b.gender || ''));
  return { season: detail.season, rows };
}
