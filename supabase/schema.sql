-- Supabase / Postgres schema for External Project Folders.
-- Run this once in the Supabase SQL Editor (Project → SQL → New query → Run).
-- Safe to re-run: every statement uses IF NOT EXISTS.

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

-- Row Level Security:
-- We use the service-role key on the server only; clients never touch these
-- tables directly. RLS is therefore not strictly required for V1, but we
-- enable it so the anon key cannot read or write these rows by accident.
ALTER TABLE external_project_folders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_project_files     ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_opened_folders    ENABLE ROW LEVEL SECURITY;
