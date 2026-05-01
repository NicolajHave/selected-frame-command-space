# Selected Frame · Command Space — v2.8.2

Internal Brand Spaces tool for Selected Frame concept.
Live: https://selected-frame-command-space.vercel.app

## What's new in v2.8.2

### Custom Items now support negative values (discounts)
- Filter changed from "price > 0" to "price ≠ 0", so negative values are kept
- New `fmtEurSigned` formatter renders negative amounts as `−€100` (with proper minus sign and red colour in UI)
- Per-row totals, subtotal, Quotation Summary box, and exported PDF all show negative amounts correctly
- Use case: write `-100` as price to apply a discount line; it will be deducted from the grand total and visibly show on the exported quote

### Standards: Section 02 restructured into 3 subgroups
The Non-Negotiables section now has clear hierarchy under one dark panel:

- **A. Core Non-Negotiables** (concept law) — 5 rules
- **B. Technical Standards** (approved master spec) — 3 rules
- **C. Planning & VM Controls** (execution-level enforcement) — 3 rules

Each subgroup has its own header inside the dark panel with a kicker label and the number range it covers (01–05, 06–08, 09–11). Numbering is continuous across all 11 rules.

All "REVIEW" pills removed from this section. Specific measurements (900/700 mm, paint codes) removed from the section to keep it concept-facing — those references live elsewhere in the app.

### Standards: Approver black box removed
The "Approver: Concept owner" box at the bottom of Exceptions section has been removed entirely. Both the rendering and the data field are gone.

## How to deploy

1. Unzip locally
2. Drag everything to GitHub repo root
3. Commit message: `v2.8.2 — Negative custom items + Section 02 restructure`
4. Vercel auto-deploys

## Smoke test

### Quotation Builder — negative custom items
1. Add a custom item with description "Partner discount" and price `-100`
2. Verify the per-row total shows `−€100` in red on the right
3. Verify the subtotal shows `−€100` in red below the input list
4. Verify Quotation Summary box (right column) shows "Custom: −€100"
5. Verify the grand total reflects the discount
6. Click Export Quotation as PDF — verify "Additional Items" table shows the discount as `−€100` (not "—")

### Standards — Section 02
1. Scroll to Non-Negotiables
2. Verify the dark panel now has 3 subgroup headers: Core Non-Negotiables / Technical Standards / Planning & VM Controls
3. Each subgroup shows a kicker (concept law / approved master spec / execution-level enforcement) and a number range
4. Verify continuous numbering 01-11 across the whole list
5. Verify NO orange REVIEW pills anywhere in the section

### Standards — bottom of page
1. Scroll to Exceptions & Approval
2. Verify the black "Approver: Concept owner" box is GONE
3. Section ends with the 4-step approval process
