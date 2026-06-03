// Supabase server-side client for External Project Folders.
//
// We use the service-role key, which bypasses RLS, because access control
// for this feature lives in the shared-password gate (lib/.../auth.js) and
// runs only inside server routes — the key never reaches the browser.
//
// Run supabase/schema.sql once in the Supabase SQL Editor to create the
// three tables. The `isConfigured` helper lets the rest of the app degrade
// gracefully when env vars are missing.

import { createClient } from '@supabase/supabase-js';

let client = null;

export function isConfigured() {
  return Boolean(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function getSupabase() {
  if (!isConfigured()) throw new Error('SUPABASE_NOT_CONFIGURED');
  if (!client) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/**
 * Throws a Response that the route handler can return verbatim when Supabase
 * is not configured. Lets every route stay one-liner about config.
 */
export function ensureConfiguredOr503() {
  if (!isConfigured()) {
    throw new Response(
      JSON.stringify({
        error: 'SUPABASE_NOT_CONFIGURED',
        message:
          'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel, and run supabase/schema.sql in the SQL Editor.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
