// OneDrive filing path, shared by Project Intake and Opening Reports.
//
// Both must produce the SAME folder for the same project — the whole point of
// filing an opening report is that it lands beside the filecard. Keeping one
// implementation is what stops the two from drifting apart: a stray difference
// in how a slash or a trailing dot is handled would silently create a second
// folder, and nobody would notice until someone went looking for the report.

/** Windows/OneDrive-safe folder or file name. */
export function safeName(s, fallback = 'Untitled') {
  const out = String(s || '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.+$/, '')
    .slice(0, 120);
  return out || fallback;
}

export function isIso(v) {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

/**
 * `<year>/<REGION>/<project>` — the layout the intake flow files under.
 *
 * The year comes from the first usable date given, so a 2027 opening files
 * under 2027 without anyone having to remember. Intake passes the desired
 * opening date; an opening report passes the project's due date, then its own
 * opening date, which is the closest it can get to the same answer after the
 * fact. A project that slipped across a new year is the one case where the two
 * can disagree, so the Flow must create the folder if it is not there.
 */
export function buildTargetPath({ dates = [], region, projectName }) {
  const iso = dates.find(isIso);
  const targetYear = String((iso ? new Date(iso) : new Date()).getFullYear());
  const targetRegion = safeName(region, 'UNSPECIFIED');
  const targetProject = safeName(projectName, 'Project');
  return {
    targetYear,
    targetRegion,
    targetProject,
    targetPath: `${targetYear}/${targetRegion}/${targetProject}`,
  };
}
