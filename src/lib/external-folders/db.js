// Postgres client + lazy schema bootstrap for External Project Folders.
//
// We use @vercel/postgres which reads POSTGRES_URL from env (DATABASE_URL is
// also accepted via mirroring below). All callers route through `query` /
// `withDb`, which guards against an unconfigured environment so the rest of
// the app keeps working when the DB is not yet provisioned.

import { sql, createPool } from '@vercel/postgres';

let pool = null;
let initPromise = null;

export function isConfigured() {
  return Boolean(
    process.env.POSTGRES_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL_NON_POOLING,
  );
}

function getPool() {
  if (!isConfigured()) {
    throw new Error('DB_NOT_CONFIGURED');
  }
  if (!pool) {
    const connectionString =
      process.env.POSTGRES_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_PRISMA_URL;
    pool = createPool({ connectionString });
  }
  return pool;
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS external_project_folders (
  id                    TEXT PRIMARY KEY,
  asana_project_id      TEXT UNIQUE NOT NULL,
  project_name          TEXT NOT NULL,
  project_type          TEXT,
  region                TEXT,
  due_date              DATE,
  status                TEXT NOT NULL DEFAULT 'active',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at          TIMESTAMPTZ,
  retention_start_date  TIMESTAMPTZ,
  delete_at             TIMESTAMPTZ,
  reminder_30_sent_at   TIMESTAMPTZ,
  reminder_7_sent_at    TIMESTAMPTZ,
  last_opened_at        TIMESTAMPTZ,
  blob_prefix           TEXT NOT NULL,
  folder_url_slug       TEXT UNIQUE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_external_folders_status
  ON external_project_folders(status);
CREATE INDEX IF NOT EXISTS idx_external_folders_delete_at
  ON external_project_folders(delete_at);

CREATE TABLE IF NOT EXISTS external_project_files (
  id                  TEXT PRIMARY KEY,
  folder_id           TEXT NOT NULL REFERENCES external_project_folders(id) ON DELETE CASCADE,
  file_name           TEXT NOT NULL,
  original_name       TEXT NOT NULL,
  file_type           TEXT,
  file_size           BIGINT,
  blob_url            TEXT NOT NULL,
  blob_path           TEXT NOT NULL,
  uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by_name    TEXT,
  category            TEXT
);

CREATE INDEX IF NOT EXISTS idx_external_files_folder
  ON external_project_files(folder_id);

CREATE TABLE IF NOT EXISTS recently_opened_folders (
  id                TEXT PRIMARY KEY,
  folder_id         TEXT NOT NULL REFERENCES external_project_folders(id) ON DELETE CASCADE,
  asana_project_id  TEXT NOT NULL,
  opened_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recently_opened_at
  ON recently_opened_folders(opened_at DESC);
`;

async function bootstrap() {
  const p = getPool();
  // CREATE TABLE … IF NOT EXISTS is idempotent; safe to run on every cold start.
  await p.query(SCHEMA_SQL);
}

export async function ensureSchema() {
  if (!isConfigured()) return false;
  if (!initPromise) initPromise = bootstrap().catch((e) => {
    initPromise = null;
    throw e;
  });
  await initPromise;
  return true;
}

export async function query(strings, ...values) {
  await ensureSchema();
  const p = getPool();
  return p.sql(strings, ...values);
}

export { sql };
