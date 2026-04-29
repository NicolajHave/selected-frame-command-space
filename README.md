# Selected Frame · Command Space — v2.7.0

Internal Brand Spaces tool for Selected Frame concept.
Live: https://selected-frame-command-space.vercel.app

## What's new in v2.7.0

### Sales Quote PDF format support
The Quotation Builder now auto-detects and parses **two PDF formats**:

1. **Calculation format** (existing) — &elements internal calculations with category headers like INVENTORY, SELECTED DELIVERIES, etc. Includes Sales area sqm, Project name, gender.
2. **Sales Quote format** (new) — Bestseller customer-facing quotes with no category headers, flat item-by-line table. Used for projects like the Printemps series.

Detection is automatic — no user action needed. The parser checks the first 40 lines for "Sales Quote |" or "QUOTATION".

### Sales Quote: pillar mapping logic
Since Sales Quote PDFs have no category headers, items are mapped to the 3 pillars by item-number convention:

| Pillar | Items matched by |
|---|---|
| Inventory | Item starts with `105-` or `112_` (and not _SLT delivery) |
| Selected Deliveries | Name contains `_SLT delivery` (e.g. "Carpet Size 1_SLT delivery") |
| Specific Project Cost | Everything else (services 0421/0500/0540, freight 0600, install 0432, paint 0325) |

Validated against 4 Printemps PDFs — all totals reconcile to PDF Total EUR Excl. VAT.

### Sales Quote: project name guess
Project name is auto-extracted from "Regarding deliveries for Selected at X" line. User can override by editing the field.

### Hanger Calculator: rule updates

- **Wall unit Sidehang 1400 + mirror** is now a separate rule = **30 hangers** (was incorrectly excluded by mirror-rule)
- **Jeans rack double** lowered from 15 → **10 hangers** per request
- **Wall rack column** explicitly excluded (it's a structural base, no hangers)
- All "sidehang" matching now position-agnostic — handles both "Sidehang 1400" and "1400 - Sidehang" formats

### Validation matrix

| PDF | Format | Total parsed | PDF total | Match |
|---|---|---|---|---|
| Stockmann Helsinki | Calculation | €48.510 | €48.509 | ✓ |
| Hagemeyer Minden | Calculation | €25.610 | €25.410 | ⚠ €200 diff (pre-existing AV parsing bug) |
| Printemps La Valentine | Sales Quote | €18.488 | €18.488 | ✓ |
| Printemps Nancy | Sales Quote | €21.730 | €21.730 | ✓ |
| Printemps Lyon | Sales Quote | €11.673 | €11.673 | ✓ |
| Printemps Marseille | Sales Quote | €12.076 | €12.076 | ✓ |

### Hanger Calculator validation (Printemps PDFs)

| PDF | Raw total | Shirt / Clips / Coat |
|---|---|---|
| La Valentine | 315 hangers | 200 / 100 / 50 |
| Nancy | 225 hangers | 150 / 50 / 50 |
| Lyon | 195 hangers | 150 / 50 / 25 |
| Marseille | 175 hangers | 100 / 50 / 25 |

## Known issues (not fixed in this release)

- **Hagemeyer AV parsing**: pre-existing bug where "75\" screen 0 pcs €2.200 €-" is parsed as €200 instead of €0. Causes €200 diff vs PDF total. Will fix in next release.
- **Sales Quote sqm**: not present in PDF format; user must enter manually. The UI shows a clear "info" warning.

## How to deploy

1. Unzip locally
2. Drag everything to GitHub repo root
3. Commit message: `v2.7.0 — Sales Quote format + Hanger rules update`
4. Vercel auto-deploys

## Smoke test

1. Upload **Quote_2088_SLT_SIS_Frame_Printemps_La_Valentine_260424.pdf**
2. Verify project name auto-fills as "Selected SIS - Printemps La Valentine"
3. Verify Cost Breakdown shows Inventory €9.777, Selected Deliveries €0, Specific Project Cost €8.711, Total €18.488
4. Verify Hanger Calculator appears with: 1× Sidehang+mirror (30), 1× Sidehang 700 (25), 4× Floor rack 1400 (200), 2× Floor rack 700 (50), 1× Jeans double (10) = 315 raw → Shirt 200 / Clips 100 / Coat 50
5. Click Add to Quote — verify hangers populate Add-ons section
6. Type sqm in the Sales area field manually — verify SQM Price calculates
