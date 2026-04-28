# Selected Frame · Command Space — v2.5.0

Internal Brand Spaces tool for Selected Frame concept.
Live: https://selected-frame-command-space.vercel.app

## What's new in v2.5.0

**ROI ↔ Asana integration** (Phase 3 of ROI Decision Engine work).

### Linked project on ROI page
A new "Linked project" bar at the top of ROI Decision Engine lets you select any active Asana task from a dropdown. Once selected, the project name appears as a green-bordered badge with a Clear button. The link is optional — only required to enable Push to Asana.

### Push to Asana button
The ASANA-ready summary panel now has two buttons:
- **Copy summary** (existing) — places summary on clipboard
- **Push to Asana** (new) — sends the same text directly to the linked task as a comment via Asana's stories endpoint

Push requires a linked project. The button is disabled (50% opacity) until one is selected.

### Status feedback
- Success: green "✓ Posted to {project name}" badge for 4 seconds
- Failure: red "✗ {error message}" badge with specific error (permission denied / task not found / network)
- The button itself reflects state: `Push to Asana` → `Pushing…` → `✓ Posted`

### Project name in summary
When a project is linked, the ASANA summary now starts with a `Project: {name}` line — so when pushed, the comment is self-identifying.

## Decisions in this release

- **Comment, not description** — additive history-preserving approach (matches Excel framework's "ASANA history" wording).
- **No auto-fill of ROI fields** — Asana doesn't have CAPEX/sqm/retail custom fields, so ROI inputs remain manual. Linking only ties the calculation to a specific task for push.
- **No write to Quotation Builder linkage** — kept independent for now. Future iteration could pull CAPEX from latest parsed quote, but adds session-state complexity not worth the cost yet.

## How to deploy

1. Unzip locally
2. Drag everything to GitHub repo root
3. Commit message: `v2.5.0 — ROI Asana sync`
4. Vercel auto-deploys

This release adds **two new directories** (no deletions):
- `src/app/api/asana-comment/` (new — POST endpoint)
- `src/app/api/test-asana-write/` (already added in v2.4.1)

## Smoke test

1. Open ROI Decision Engine
2. Top of page: select a project from dropdown — verify it appears as linked
3. Fill in some ROI values
4. Bottom of page: click **Push to Asana** — should show "✓ Posted to {project name}"
5. Open Asana → navigate to that task → verify the ROI Summary appears as a comment in the task feed
6. Click **Clear** to unlink — Push button becomes disabled
7. Try clicking Push without a linked project → button should be disabled (no error)

## Inherited from earlier versions

- v2.4.0 ROI Decision Engine (explainer cards, manual uplift %, Total Payback own sqm, Mini Indicator, Decision rationale)
- v2.4.1 Admin → Asana Write Access Test
- v2.3.0 Hanger Calculator
- v2.2.0 3-pillar mapping, mailto flow, focus-loss fix
