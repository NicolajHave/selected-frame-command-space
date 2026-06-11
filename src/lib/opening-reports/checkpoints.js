// The 16 compliance checkpoints for an Opening Report.
// Sourced from the Standards page (Non-Negotiables + Space Management).
// Single source of truth — edit here, and both the seeder (POST /reports)
// and the editor UI pick up the change.
//
// Tier 1 = must verify on site. Tier 2 = note if visible (lighter weight).
// Checkpoint 15 only applies when sqm >= 50 (see SQM_GATED_CHECKPOINTS).

export const CHECKPOINTS = [
  { no: 1,  tier: 1, title: 'Clear brand visibility — Selected reads clearly, sightlines clean and brand-led' },
  { no: 2,  tier: 1, title: 'Back wall logo placement — left-aligned, above final wall module' },
  { no: 3,  tier: 1, title: 'Approved logo application — logo follows approved master logic' },
  { no: 4,  tier: 1, title: 'Approved fixture language only — no partner/third-party fixtures in footprint' },
  { no: 5,  tier: 1, title: 'Approved hanger system — only approved Selected hangers on display' },
  { no: 6,  tier: 1, title: 'Hero Wall / Focal Wall — correct module + sidehang sequence, one clear story' },
  { no: 7,  tier: 1, title: 'Entrance Zone — branded focal zone, Iconic Table/Podium anchor, max 2 mannequins' },
  { no: 8,  tier: 1, title: 'Walkway protection — primary circulation open and readable' },
  { no: 9,  tier: 2, title: 'Approved material expression — approved materials, finishes, colours' },
  { no: 10, tier: 2, title: 'Protected concept hierarchy — no local signage/promo disrupting hierarchy' },
  { no: 11, tier: 2, title: 'Approved material references — stainless, oak, wall paint, table surface' },
  { no: 12, tier: 2, title: 'Closed fixture system — approved modules within system logic' },
  { no: 13, tier: 2, title: 'Sightline protection — no mid-floor messaging / tall blocking elements' },
  { no: 14, tier: 2, title: 'Product Density — engineered, within approved capacities, not overpacked' },
  { no: 15, tier: 2, title: 'Category Zoning — clear gender / category zoning (≥ 50 m² only)' },
  { no: 16, tier: 2, title: 'Podium & Mannequin Usage — floor-standing only, within density rules' },
];

// Checkpoints that depend on sqm thresholds. The UI hides them and the
// seeder still inserts them (so re-opening after sqm changes is consistent),
// but the report PDF/list grays them out when sqm is below the threshold.
export const SQM_GATED_CHECKPOINTS = {
  15: { minSqm: 50 },
};

// Fixed photo slots in display order. 'extra' is a catch-all for
// additional photos the rep wants to include.
export const PHOTO_SLOTS = [
  { id: 'entrance',   label: 'Entrance zone', required: true },
  { id: 'overview',   label: 'Full overview', required: true },
  { id: 'hero_wall',  label: 'Hero wall',     required: true },
  { id: 'logo',       label: 'Logo detail',   required: true },
  { id: 'extra',      label: 'Additional photos', required: false, multiple: true },
];

export function isCheckpointApplicable(checkpointNo, sqm) {
  const gate = SQM_GATED_CHECKPOINTS[checkpointNo];
  if (!gate) return true;
  if (gate.minSqm != null && (sqm == null || sqm < gate.minSqm)) return false;
  return true;
}
