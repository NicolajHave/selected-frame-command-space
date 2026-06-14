// Supabase server-side client for the Showroom Operations module.
//
// Reuses the same env vars and the sanitiseSupabaseUrl/isConfigured/
// ensureConfiguredOr503 helpers as External Project Folders, but points the
// client at the isolated `showroom_ops` schema via the `db.schema` option.
//
// Run supabase/showroom-ops-schema.sql once, then expose `showroom_ops` under
// Project Settings → API → Exposed schemas. The `schemaNotExposed` helper
// turns the resulting PostgREST error into an actionable message.

import { createClient } from '@supabase/supabase-js';
import { sanitiseSupabaseUrl, isConfigured, ensureConfiguredOr503 } from '../external-folders/db';

export { isConfigured, ensureConfiguredOr503 };

export const SCHEMA = 'showroom_ops';

let client = null;

export function getShowroomSupabase() {
  if (!isConfigured()) throw new Error('SUPABASE_NOT_CONFIGURED');
  if (!client) {
    const url = sanitiseSupabaseUrl(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: SCHEMA },
    });
  }
  return client;
}

/**
 * Normalise Supabase errors into thrown Error()s with actionable messages.
 * Mirrors the unwrap() helper in lib/external-folders/folders.js, with two
 * extra cases specific to schema isolation.
 */
export function unwrap({ data, error }, ctx) {
  if (error) {
    // Schema exists but is not exposed to the Data API.
    if (error.code === 'PGRST106' || /must be (one of|in)/i.test(error.message || '')) {
      throw new Error(
        `The "${SCHEMA}" schema is not exposed to the API. In Supabase: Project Settings → API → Exposed schemas → add "${SCHEMA}". (${ctx})`,
      );
    }
    // Relation (or schema) does not exist yet.
    if (error.code === '42P01' || error.code === '3F000') {
      throw new Error(
        `Showroom Ops tables are missing. Run supabase/showroom-ops-schema.sql in the SQL Editor. (${ctx})`,
      );
    }
    throw new Error(`${ctx}: ${error.message}`);
  }
  return data;
}
