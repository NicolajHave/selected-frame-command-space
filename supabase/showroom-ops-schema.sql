-- Showroom Operations module schema.
-- Run once in the Supabase SQL Editor (Project → SQL → New query → Run).
-- Safe to re-run: every statement uses IF NOT EXISTS.
--
-- SCHEMA ISOLATION: all tables live in a dedicated `showroom_ops` schema so
-- this module is cleanly separated from the public-schema tables used by
-- External Project Folders and Opening Reports.
--
-- ONE-TIME SETTING (required): after running this, expose the schema to the
-- Data API → Supabase Dashboard → Project Settings → API → "Exposed schemas"
-- → add `showroom_ops` → Save. Without this, PostgREST returns PGRST106 and
-- every query fails. The app surfaces a clear message if this is missing.

CREATE SCHEMA IF NOT EXISTS showroom_ops;

-- ─── showrooms — master registry (seed from sheet "SHOWROOM REGISTRY") ────────
CREATE TABLE IF NOT EXISTS showroom_ops.showrooms (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  country            TEXT,
  lines              TEXT,                 -- 'MEN' | 'WOMEN' | 'MEN+WOMEN'
  delivery_type      TEXT,                 -- 'PHYSICAL_PACKAGE' | 'PDF_FILES_ONLY' | 'PHYSICAL_PLUS_PDF' | 'INTERNAL_DIRECT'
  company_name       TEXT,
  address_men        TEXT,
  zip_men            TEXT,
  address_women      TEXT,
  zip_women          TEXT,
  customer_no_men    TEXT,                 -- HOMME / FEMME can differ at one location; stored as text
  customer_no_women  TEXT,
  contact_men        TEXT,
  contact_women      TEXT,
  email_women        TEXT,
  phone_women        TEXT,
  special_handling   TEXT,
  status             TEXT NOT NULL DEFAULT 'ACTIVE',  -- 'ACTIVE' | 'VERIFY'
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_showrooms_status ON showroom_ops.showrooms(status);

-- ─── materials — reusable catalog (seed from sheet "MATERIAL CATALOG") ────────
CREATE TABLE IF NOT EXISTS showroom_ops.materials (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              TEXT,                  -- 'SB', 'MB', 'LB', 'TRS', 'IF-WF', ...
  name              TEXT NOT NULL,
  category          TEXT,                  -- BOARD | SIGN | FOIL | POSTER | CARD | TAG | WINDOW | BANNER | DIGITAL
  default_format    TEXT,
  default_colour    TEXT,
  default_quality   TEXT,
  default_packing   TEXT,
  standard_remarks  TEXT,
  filename_slug     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── seasons ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS showroom_ops.seasons (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,         -- 'SPRING 27'
  code              TEXT NOT NULL,         -- 'SPRING27' (used in filenames)
  order_date        DATE,
  delivery_date     DATE,
  status            TEXT NOT NULL DEFAULT 'PLANNING',  -- PLANNING | IN_PRODUCTION | SHIPPED | CLOSED
  invoicing         TEXT,
  costcenter_men    TEXT,
  costcenter_women  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── season_showrooms — which showrooms participate this season ───────────────
CREATE TABLE IF NOT EXISTS showroom_ops.season_showrooms (
  season_id      UUID NOT NULL REFERENCES showroom_ops.seasons(id)   ON DELETE CASCADE,
  showroom_id    UUID NOT NULL REFERENCES showroom_ops.showrooms(id) ON DELETE CASCADE,
  men_package    BOOLEAN NOT NULL DEFAULT FALSE,
  women_package  BOOLEAN NOT NULL DEFAULT FALSE,
  extras         TEXT,
  remarks        TEXT,
  PRIMARY KEY (season_id, showroom_id)
);

-- ─── season_lines — one row = one print/digital item ──────────────────────────
CREATE TABLE IF NOT EXISTS showroom_ops.season_lines (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id          UUID NOT NULL REFERENCES showroom_ops.seasons(id) ON DELETE CASCADE,
  material_id        UUID REFERENCES showroom_ops.materials(id) ON DELETE SET NULL,  -- nullable: free-text one-offs allowed
  scope              TEXT NOT NULL,        -- LOCAL_SHOWROOMS | BRANDE_SHOWROOM | PERFECT_SHOWROOM | CREATIVE_SHOWROOM | DACH_SHOWROOM | FOYER | INSTORE
  gender             TEXT,                 -- MEN | WOMEN | UNISEX
  motif_title        TEXT,
  free_text_name     TEXT,                 -- product name for catalog-less one-offs
  format_override    TEXT,
  colour_override    TEXT,
  quality_override   TEXT,
  motives            INTEGER,
  amount             TEXT,
  sprint             TEXT,
  responsible        TEXT,
  copy_brief         TEXT,
  remarks            TEXT,
  filename           TEXT,                 -- auto-generated, editable
  status             TEXT NOT NULL DEFAULT 'DRAFT',  -- DRAFT | BRIEFED | IN_PROGRESS | FINAL | RELEASED | ORDERED
  price              NUMERIC,
  target_showroom_id UUID REFERENCES showroom_ops.showrooms(id) ON DELETE SET NULL,
  sort_order         INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_season_lines_season ON showroom_ops.season_lines(season_id);
CREATE INDEX IF NOT EXISTS idx_season_lines_status ON showroom_ops.season_lines(status);
CREATE INDEX IF NOT EXISTS idx_season_lines_scope  ON showroom_ops.season_lines(scope);

-- Row Level Security: the service-role key is used server-side only; the anon
-- key must never read or write these rows. Matches the public-schema modules.
ALTER TABLE showroom_ops.showrooms        ENABLE ROW LEVEL SECURITY;
ALTER TABLE showroom_ops.materials        ENABLE ROW LEVEL SECURITY;
ALTER TABLE showroom_ops.seasons          ENABLE ROW LEVEL SECURITY;
ALTER TABLE showroom_ops.season_showrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE showroom_ops.season_lines     ENABLE ROW LEVEL SECURITY;

-- Schema grants for a custom Supabase schema. Without these, PostgREST
-- responds with "permission denied for schema showroom_ops" even when the
-- schema is exposed under Project Settings → API → Exposed schemas. RLS is
-- enabled above, so the anon key still cannot read or write any rows.
GRANT USAGE ON SCHEMA showroom_ops
  TO postgres, anon, authenticated, service_role;

GRANT ALL ON ALL TABLES    IN SCHEMA showroom_ops
  TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA showroom_ops
  TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES  IN SCHEMA showroom_ops
  TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA showroom_ops
  GRANT ALL ON TABLES    TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA showroom_ops
  GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA showroom_ops
  GRANT ALL ON ROUTINES  TO postgres, anon, authenticated, service_role;
