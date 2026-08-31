// Shared code gate for the two destructive / authoritative actions on an
// Opening Report: deleting one, and approving one on behalf of Brand Spaces.
//
// This is a speed bump against mistakes by colleagues who have the app open,
// not a security boundary — the whole Command Space is already behind
// Bestseller's own access. It is checked server-side all the same, so the
// button cannot simply be clicked past in devtools.
//
// The default matches what the team was told; override per environment with
// OPENING_REPORT_ADMIN_CODE.

const DEFAULT_CODE = '1234';

export function expectedCode() {
  return String(process.env.OPENING_REPORT_ADMIN_CODE || DEFAULT_CODE);
}

export function isValidAdminCode(code) {
  return String(code ?? '').trim() === expectedCode();
}

/**
 * Throws a Response the route can return verbatim, matching the
 * ensureConfiguredOr503 pattern used across the app.
 */
export function ensureAdminCodeOr403(code) {
  if (!isValidAdminCode(code)) {
    throw new Response(
      JSON.stringify({ error: 'INVALID_CODE', message: 'Wrong code.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
