// Dev-only diagnostic for External Project Folders. Reveals whether env vars
// are loaded and whether the Supabase tables are reachable, without leaking
// the service-role key.

import { NextResponse } from 'next/server';
import { isConfigured, getSupabase } from '../../../../lib/external-folders/db';
import { hasAccess } from '../../../../lib/external-folders/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // Reuse the password-gate as a simple guard so this isn't open to the world.
  if (!hasAccess()) {
    return NextResponse.json({ error: 'Unauthorised — unlock the gate first.' }, { status: 401 });
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || null;
  const keyPresent = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Build a redacted preview of the URL so we can spot trailing slashes /
  // wrong paths without leaking the project id.
  let urlShape = null;
  if (url) {
    try {
      const u = new URL(url);
      urlShape = {
        protocol: u.protocol,
        hostPattern: u.hostname.replace(/^[^.]+/, '<project-id>'),
        pathname: u.pathname,           // should be "/"
        hasTrailingSlash: url.endsWith('/'),
        rawLength: url.length,
      };
    } catch (e) {
      urlShape = { error: `Malformed URL: ${e.message}` };
    }
  }

  if (!isConfigured()) {
    return NextResponse.json({
      configured: false,
      reason: !url ? 'SUPABASE_URL missing' : 'SUPABASE_SERVICE_ROLE_KEY missing',
      url: urlShape,
      keyPresent,
    });
  }

  // Try a minimal read against each table.
  const sb = getSupabase();
  const tables = ['external_project_folders', 'external_project_files', 'recently_opened_folders'];
  const checks = {};
  for (const t of tables) {
    const { error, count } = await sb.from(t).select('id', { count: 'exact', head: true });
    checks[t] = error
      ? { ok: false, error: error.message, code: error.code }
      : { ok: true, rowCount: count };
  }

  return NextResponse.json({
    configured: true,
    url: urlShape,
    keyPresent,
    tables: checks,
  });
}
