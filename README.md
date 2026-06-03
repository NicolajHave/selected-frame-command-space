# Selected Frame · Command Space — v2.9.0

Internal Brand Spaces tool for Selected Frame concept.
Live: https://selected-frame-command-space.vercel.app

## What's new in v2.9.0

### Standards Section 05: Fixtures & Modules — complete rebuild

Replaced the previous text-only "Fixtures & Modules" section with a full visual catalog mirroring the Selected SIS Catalog Rev 1 (March 2026).

**Section renamed:** name kept as "Fixtures & Modules" 

**8 categories with 35 elements total:**
- Wall Units (10)
- Racks (8)
- Podiums (3)
- Tables (2)
- Logos (3)
- Accessories (6)
- Mannequins (2)
- Carpets (1)

### Card grid layout

Each element renders as a card with:
- 3D render image (extracted from catalog PDF)
- Item code (mono)
- Name
- Dimensions (mono)
- Material
- Hanger count badge in oak colour (when applicable)

Categories are visually separated with serif-styled headings and item counts. Grid auto-fills to 4–5 columns on wide screens, fewer on narrower viewports.

### Image pipeline

34 product renders extracted from the catalog PDF and optimized:
- Source: 5.8 MB across 34 JPEGs at 300 DPI
- Optimized: 398 KB total (resized to 600px max edge, quality 82)
- Saved to `public/images/elements/` with semantic filenames

LED Logo has no image in the source catalog; rendered as "No image" placeholder card.

### Removed from earlier version

- "Combination rules" panel (operational guidance moved to Space Management section)
- "Do not combine" panel (operational guidance moved to Space Management section)
- Old text-only fixture table
- All REVIEW pills

## External Project Folders — setup

Per-project workspaces backed by Vercel Blob (files) and Postgres (metadata).
The feature degrades gracefully if not configured — the rest of the app
keeps working, and the page shows a setup banner.

### 1. Vercel Blob
Already in use for Draft Studio. If a Blob store isn't connected yet, go to
Vercel → Storage → Connect Blob; this sets `BLOB_READ_WRITE_TOKEN` automatically.

### 2. Postgres
Connect Vercel Postgres (or any Postgres) to the project. Vercel sets
`POSTGRES_URL` automatically; `DATABASE_URL` is also accepted.

Tables are created on first request (idempotent `CREATE TABLE IF NOT EXISTS`),
so no manual migration step is needed.

### 3. Environment variables
Copy `.env.example` and fill in:

- `BLOB_READ_WRITE_TOKEN` — set by Vercel when Blob is connected
- `POSTGRES_URL` / `DATABASE_URL` — set by Vercel when Postgres is connected
- `EXTERNAL_FOLDER_PASSWORD` — shared internal password (V1 default: `1234`)
- `RETENTION_DAYS` — defaults to `750`
- `CRON_SECRET` — protects the retention cron endpoint
- `RETENTION_REMINDER_EMAIL` — optional; address to receive 30/7-day reminders

### 4. Retention cron
`vercel.json` registers a daily cron at 03:00 UTC pointing at
`/api/cron/external-folder-retention`. It checks completed folders, marks
30/7-day reminders as sent, and deletes the blob objects + metadata when
`deleteAt` is reached. Project records themselves remain visible after deletion.

### 5. Email (optional)
`src/lib/external-folders/email.js` is a stub. To send real reminders, replace
the body with a provider call (Resend, SendGrid, M365 etc.) and add the
provider's credentials as env vars. The cron writes `reminder_30_sent_at` /
`reminder_7_sent_at` after each call so reminders won't be sent twice.

## How to deploy

1. Unzip locally
2. Drag everything to GitHub repo root
3. Commit message: `v2.9.0 — Element Overview rebuild with full catalog`
4. Vercel auto-deploys

**Note:** This release adds a NEW directory `public/images/elements/` with 34 JPEG files. Drag-and-drop in GitHub UI will create the directory automatically.

## Smoke test

1. Standards page → sticky sidebar should show "Element Overview" (not "Fixtures & Modules")
2. Section 05 header reads "Element Overview"
3. Section meta line: "Source: Selected SIS Catalog — Rev 1, March 2026"
4. Verify 8 category sections in order: Wall Units, Racks, Podiums, Tables, Logos, Accessories, Mannequins, Carpets
5. Verify each category shows item count next to heading (e.g. "10 items")
6. Verify product images render correctly inside each card
7. Verify hanger-count badge appears on items that have hangers (e.g. Floor Rack 1400 shows "50 hangers")
8. Verify LED Logo card shows "No image" placeholder
9. Verify NO orange REVIEW pills anywhere in the section
