// Fiscal year helpers. The Selected FY runs 1 August → 31 July, so a date is
// labelled by the calendar year the FY *started* in: 15 Sep 2026 and 3 Mar 2027
// both belong to FY 2026/27.
//
// Pure module — no React, no I/O — so the boundaries can be tested directly.

const FY_START_MONTH = 7; // 0-indexed: 7 = August

/** Start year of the FY a date falls in, or null for an unusable date. */
export function fiscalYearOf(dateish) {
  if (!dateish) return null;
  const d = new Date(dateish);
  if (Number.isNaN(d.getTime())) return null;
  return d.getMonth() >= FY_START_MONTH ? d.getFullYear() : d.getFullYear() - 1;
}

/** "FY 26/27" for a start year. */
export function fiscalYearLabel(startYear) {
  if (startYear == null) return '—';
  const a = String(startYear).slice(-2);
  const b = String(startYear + 1).slice(-2);
  return `FY ${a}/${b}`;
}

/** ISO bounds of a FY: 1 Aug (start year) → 31 Jul (start year + 1). */
export function fiscalYearRange(startYear) {
  return {
    from: `${startYear}-08-01`,
    to: `${startYear + 1}-07-31`,
  };
}

/** The FY that contains today. */
export function currentFiscalYear(now = new Date()) {
  return fiscalYearOf(now);
}

/**
 * The date a project counts by: what actually happened when it is finished,
 * otherwise what is planned. Keeps delivered work in the FY it landed in even
 * if the due date said otherwise.
 */
export function projectEffectiveDate(project) {
  if (!project) return null;
  return (project.completed && project.completedAt) ? project.completedAt : project.dueOn || null;
}

/**
 * Bucket projects into a FY summary.
 * Returns totals plus per-region and per-type breakdowns, splitting delivered
 * (completed) from planned so a pipeline number is never read as achieved.
 */
export function summariseFiscalYear(projects, startYear) {
  const rows = [];
  for (const p of projects || []) {
    const date = projectEffectiveDate(p);
    if (fiscalYearOf(date) !== startYear) continue;
    const sqm = typeof p.sqm === 'number' && Number.isFinite(p.sqm) ? p.sqm : 0;
    rows.push({ ...p, effectiveDate: date, sqmValue: sqm });
  }

  const sum = (list) => list.reduce((s, r) => s + r.sqmValue, 0);
  const delivered = rows.filter((r) => r.completed);
  const planned = rows.filter((r) => !r.completed);

  const groupBy = (key) => {
    const m = new Map();
    for (const r of rows) {
      const k = r[key] || 'Unspecified';
      const cur = m.get(k) || { key: k, sqm: 0, count: 0 };
      cur.sqm += r.sqmValue;
      cur.count += 1;
      m.set(k, cur);
    }
    return [...m.values()].sort((a, b) => b.sqm - a.sqm);
  };

  return {
    startYear,
    label: fiscalYearLabel(startYear),
    range: fiscalYearRange(startYear),
    rows: rows.sort((a, b) => String(a.effectiveDate).localeCompare(String(b.effectiveDate))),
    totalSqm: sum(rows),
    deliveredSqm: sum(delivered),
    plannedSqm: sum(planned),
    projectCount: rows.length,
    deliveredCount: delivered.length,
    plannedCount: planned.length,
    missingSqmCount: rows.filter((r) => !r.sqmValue).length,
    byRegion: groupBy('region'),
    byType: groupBy('type'),
  };
}

/** FYs present in the data, newest first, always including the current one. */
export function availableFiscalYears(projects, now = new Date()) {
  const set = new Set();
  for (const p of projects || []) {
    const fy = fiscalYearOf(projectEffectiveDate(p));
    if (fy != null) set.add(fy);
  }
  set.add(currentFiscalYear(now));
  return [...set].sort((a, b) => b - a);
}
