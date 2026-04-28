# Selected Frame · Command Space — v2.6.0

Internal Brand Spaces tool for Selected Frame concept.
Live: https://selected-frame-command-space.vercel.app

## What's new in v2.6.0

### Menu reordering: ROI before Quotation
Sidebar order changed to reflect actual workflow: ROI Engine now sits above Quotation Tool. ROI is renamed from "ROI Tool" to "ROI Engine" to match the Decision Engine framing introduced in v2.4.0.

### Project Flow rebuilt as accordion
The phase list is now a click-to-expand accordion:
- **Closed state**: phase number, name, and short tagline
- **Open state**: full description + project count + (Phase 2 only) cross-link buttons to ROI Engine and Quotation Builder
- **One open at a time**: clicking another phase closes the current one
- **Default open**: Phase 0 (Qualification)

### Updated phase descriptions
All 11 phases (0–10) now use the longer, more descriptive copy you provided. Each phase has both a one-line tagline (closed state) and a full paragraph (open state).

### Live phase counts from Asana
Each phase shows a small badge with the count of active projects currently in that phase, e.g. "3 projects". When expanded, this is restated as "Currently 3 active projects in this phase." Counts auto-update from `/api/projects` and only count non-completed tasks.

### Phase 2 cross-links
When Phase 2 (Internal Budget & ROI Commitment) is expanded, two action buttons appear:
- 📊 Open ROI Engine
- 📋 Open Quotation Builder

These are direct navigation shortcuts, no data passing — keeps things simple while encouraging the right workflow sequence (ROI before Quotation).

## How to deploy

1. Unzip locally
2. Drag everything to GitHub repo root
3. Commit message: `v2.6.0 — Menu reorder, Project Flow accordion`
4. Vercel auto-deploys

No new API routes, no deletions needed.

## Smoke test

1. Sidebar — verify ROI Engine appears above Quotation
2. Open Project Flow — verify Phase 0 is expanded by default with description + project count
3. Click Phase 3 — verify Phase 0 closes and Phase 3 opens
4. Click expanded phase header again — verify it closes (so all are collapsed)
5. Open Phase 2 — verify "Open ROI Engine" and "Open Quotation Builder" buttons appear
6. Click "Open ROI Engine" — verify it navigates to ROI Engine page
7. Verify project counts on each phase reflect actual Asana data (use Admin to compare totals)

## Inherited from earlier versions

- v2.5.0 ROI ↔ Asana integration (linked project + push to comment)
- v2.4.1 Asana write access test
- v2.4.0 ROI Decision Engine
- v2.3.0 Hanger Calculator
- v2.2.0 3-pillar mapping, mailto flow, focus fix
