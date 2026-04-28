# Selected Frame · Command Space — v2.4.0

Internal Brand Spaces tool for Selected Frame concept.
Live: https://selected-frame-command-space.vercel.app

## What's new in v2.4.0

**ROI Tool → ROI Decision Engine.** The tool was rebuilt from scratch to match the SIS Investment ROI Framework spreadsheet. Previously it was just a calculator; now it's a decision-support and gatekeeping mechanism.

### New explanatory copy
Each model now has its own card explaining:
- **What the tool does** — plain language description of the calculation
- **Key principle** — why the model is structured this way (incremental value vs total business)
- **Intended use** — when to use this model

### Uplift % is now editable
- Replaced Worst/Base/Best dropdown with a manual % input field
- Three preset shortcuts (Worst 5% / Base 10% / Best 15%) remain as quick-fill buttons
- New **Expected Retail Sales / Year** field with auto-calculate button — derives uplift % from (Expected − Last Year) / Last Year

### Total Payback Model has its own sqm
Previously it was reusing existing+added from Uplift Model (which is conceptually wrong — new distribution doesn't have an "existing" baseline). It now has a single dedicated **Total Shop Size** field.

### Decision rationale text
Below the GO/REVIEW/NO GO badge, the panel now shows specific narrative reasoning:
- *"Within policy thresholds (≤24 months payback)"*
- *"Borderline — between 24 and 36 months payback. Conscious escalation required."*
- *"Payback exceeds policy threshold of 36 months"*
- *"Net annual value is zero or negative"*

### Mini Indicator (Volume vs Brand Presence)
On the Uplift Model, a small bar chart shows how much of the incremental value comes from added space (volume-driven) vs improved performance on existing space (brand presence-driven). Identifies the **primary driver** of the case.

### ASANA-ready summary
A black panel below the inputs renders a copy-paste-ready text block matching the format in the Excel Control Panel (cell B32). One-click **Copy** button puts it on the clipboard.

### Decision logic reference
Always-visible threshold reference at the bottom (GO ≤24mo · REVIEW ≤36mo · NO GO >36mo) with rationale for each.

## Validated against Excel Framework

All key outputs reconcile to the spreadsheet to two decimal places:

| Value | Tool | Excel reference |
|---|---|---|
| Inc wholesale (Uplift) | €22.413,79 | €22.413,79 |
| Net annual value (Uplift, GP) | €4.644,83 | €4.644,83 |
| Payback (Uplift) | 51,67 mo | 51,67 mo |
| Volume share | 77% | 76,9% |
| Net annual value (Total Payback) | €14.903,45 | €14.903,45 |
| Payback (Total Payback) | 16,10 mo | 16,10 mo |

## Deferred — not in this release

- **Bind ROI to Quotation Tool** (auto-fill CAPEX from parsed quote)
- **Bind ROI to Projects** (select project from dropdown to populate fields)
- **Asana sync button** (push ROI summary to task description/comment via API)

These are queued for a follow-up release once the Decision Engine has been validated in production. The Asana integration in particular requires a permissions check on the current `ASANA_TOKEN` (it may be read-only).

## How to deploy

1. Unzip locally
2. Drag everything inside the unzipped folder to GitHub repo root
3. Commit message: `v2.4.0 — ROI Decision Engine`
4. Vercel auto-deploys

## Smoke test

1. Open ROI Decision Engine page
2. **Uplift Model** tab — verify the explainer card shows "What the tool does", "Key principle", "Intended use"
3. Fill in Last Year Retail (e.g. 150000) and Expected Retail (e.g. 172500), click "Auto-calculate uplift % from expected vs last year" — Uplift % should auto-fill to 15.0
4. Verify Net Annual Value matches €4.645 and Payback matches 52 mo (Best 15% scenario)
5. Verify Mini Indicator shows roughly Volume 77% / Uplift 23%, primary driver = Volume-driven
6. Switch to **Total Payback Model** — verify Space section shows only one field (Total Shop Size)
7. Verify Net Annual Value matches €14.903 and Payback matches 16,1 mo
8. Click **Copy summary** in ASANA-ready panel — paste into a text editor to verify format
