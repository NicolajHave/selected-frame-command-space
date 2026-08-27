-- Concept Requests — additions, changes, feedback and cost input on the
-- Selected Frame concept.
--
-- Run once in the Supabase SQL Editor (Project → SQL → New query → Run).
-- Safe to re-run: every statement uses IF NOT EXISTS.
--
-- Lives in the public schema, like External Project Folders and Opening
-- Reports — no "Exposed schemas" setting and no extra grants needed.

CREATE TABLE IF NOT EXISTS concept_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who is asking
  submitter_name   TEXT NOT NULL,
  submitter_email  TEXT,
  region           TEXT,                  -- BENELUX & ROW | DACH | NORTHWEST | SOUTH
  partner          TEXT,                  -- partner / store the input comes from

  -- What it is about
  type             TEXT NOT NULL,         -- ADDITION | CHANGE | FEEDBACK (COST retired, old rows kept)
  element_code     TEXT,                  -- e.g. '105-06-010' from the Standards catalogue
  element_name     TEXT,                  -- denormalised so a catalogue rename keeps history readable
  title            TEXT NOT NULL,
  description      TEXT,
  problem          TEXT,                  -- what problem this solves — the field that makes it actionable
  urgency          TEXT NOT NULL DEFAULT 'NICE_TO_HAVE',  -- NICE_TO_HAVE | UPCOMING_PROJECT | BLOCKING
  project_ref      TEXT,                  -- which project, when urgency = UPCOMING_PROJECT

  -- Pointers to Vercel Blob: [{ url, pathname, name, size }]
  photos           JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Triage
  status           TEXT NOT NULL DEFAULT 'NEW',  -- NEW | UNDER_REVIEW | ACCEPTED | DECLINED | PARKED | IMPLEMENTED
  decision_note    TEXT,
  decided_by       TEXT,
  decided_at       TIMESTAMPTZ,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_concept_requests_status  ON concept_requests(status);
CREATE INDEX IF NOT EXISTS idx_concept_requests_type    ON concept_requests(type);
CREATE INDEX IF NOT EXISTS idx_concept_requests_element ON concept_requests(element_code);
CREATE INDEX IF NOT EXISTS idx_concept_requests_created ON concept_requests(created_at DESC);

-- Row Level Security: the service-role key is used server-side only; the anon
-- key must never read or write these rows. Matches the other public-schema
-- modules.
ALTER TABLE concept_requests ENABLE ROW LEVEL SECURITY;
