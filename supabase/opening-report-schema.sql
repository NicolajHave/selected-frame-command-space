-- Opening Report schema. Run once in the Supabase SQL Editor (Project → SQL
-- → New query → Run). Safe to re-run: every statement uses IF NOT EXISTS.
--
-- Separate from supabase/schema.sql so the External Project Folders schema
-- can be deployed independently. Both files use the same conventions:
-- snake_case columns, TEXT PRIMARY KEY, TIMESTAMPTZ DEFAULT NOW(), RLS on.

CREATE TABLE IF NOT EXISTS opening_reports (
  id                    TEXT PRIMARY KEY,
  partner_name          TEXT NOT NULL,
  location              TEXT NOT NULL,
  sqm                   INTEGER,
  opening_date          DATE,
  completed_by_name     TEXT NOT NULL,
  shopfloor_responsible TEXT,
  responsible_contact   TEXT,
  responsibility_when   TEXT,
  status                TEXT NOT NULL DEFAULT 'submitted',
  follow_up_needed      BOOLEAN DEFAULT FALSE,
  follow_up_owner       TEXT,
  follow_up_deadline    DATE,
  submitted_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by_name      TEXT,
  approved_at           TIMESTAMPTZ,
  approval_note         TEXT,
  report_url_slug       TEXT UNIQUE NOT NULL,
  blob_prefix           TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_opening_reports_status
  ON opening_reports(status);

CREATE TABLE IF NOT EXISTS opening_report_checkpoints (
  id            TEXT PRIMARY KEY,
  report_id     TEXT NOT NULL REFERENCES opening_reports(id) ON DELETE CASCADE,
  checkpoint_no INTEGER NOT NULL,
  tier          INTEGER NOT NULL,
  title         TEXT NOT NULL,
  result        TEXT,
  comment       TEXT
);

CREATE INDEX IF NOT EXISTS idx_opening_checkpoints_report
  ON opening_report_checkpoints(report_id);

CREATE TABLE IF NOT EXISTS opening_report_photos (
  id           TEXT PRIMARY KEY,
  report_id    TEXT NOT NULL REFERENCES opening_reports(id) ON DELETE CASCADE,
  slot         TEXT NOT NULL,
  slot_order   INTEGER NOT NULL,
  file_name    TEXT NOT NULL,
  blob_url     TEXT NOT NULL,
  blob_path    TEXT NOT NULL,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opening_photos_report
  ON opening_report_photos(report_id);

-- Row Level Security:
-- The service-role key is only used server-side. RLS is enabled so the anon
-- key cannot read or write these rows by accident, matching the External
-- Folders schema convention.
ALTER TABLE opening_reports             ENABLE ROW LEVEL SECURITY;
ALTER TABLE opening_report_checkpoints  ENABLE ROW LEVEL SECURITY;
ALTER TABLE opening_report_photos       ENABLE ROW LEVEL SECURITY;
