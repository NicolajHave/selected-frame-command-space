# Selected Frame · Command Space — v2.2.0

Internal Brand Spaces tool for Selected Frame concept.
Live: https://selected-frame-command-space.vercel.app

## What changed in v2.2.0

This release simplifies the email flow and fixes two bugs.

### Bug fixes
- **Cost Breakdown input fields no longer lose focus on every keystroke.** Caused by React re-mounting input components on each render. Fixed by hoisting `ET` (cost field), `PM` (qty stepper), and `ROIField` definitions to module level.
- **Special Elements / Floor / AV & HiFi / Light / Construction now correctly count toward the total.** They were being parsed but ignored in the summary.

### Category mapping (3 pillars)
The supplier PDF can have up to 9 categories. The UI consolidates them into the 3 pillars used for partner-facing quotations:

```
Inventory pillar       = INVENTORY + FLOOR + SPECIAL ELEMENTS + FITTING ROOMS
Selected Deliveries    = SELECTED DELIVERIES
Specific Project Cost  = SPECIFIC PROJECT COST + AV & HIFI + LIGHT + CONSTRUCTION
```

When a pillar consolidates more than one raw category, the UI shows a small breakdown line under the input field — e.g. *"Includes: inventory (€19.456), special elements (€1.254)"* — so the source is always transparent.

### Email backend removed
Resend backend and pdfkit server-side PDF generation were removed. They caused recurring deployment issues that weren't worth fighting for an internal tool with few users.

**New email flow:**
1. User clicks **Export Quotation as PDF →** (existing button) — downloads PDF
2. User clicks **Send via Email ✉** — opens default mail app with recipient, subject, and summary body prefilled
3. User attaches the PDF manually and sends

Two extra clicks, 100% reliable, no backend dependencies, no DNS records to maintain.

## How to deploy

1. Unzip this file locally
2. Go to https://github.com/NicolajHave/selected-frame-command-space
3. Click "Add file" → "Upload files" → drag everything inside the unzipped folder into the upload area
4. Commit message: `v2.2.0 — Mailto flow, category mapping, focus fix`
5. Vercel auto-deploys

## Required env vars

Only `ASANA_TOKEN` is needed. `RESEND_API_KEY` can be removed (no longer used).

## File reference

```
src/app/
├── page.js                              ← Main UI
├── layout.js                            ← Root layout
├── globals.css                          ← Global styles
└── api/
    ├── parse-quotation/route.js         ← Supplier PDF parser
    └── projects/route.js                ← Asana fetcher

public/images/
├── logo-black.png                       ← Selected Frame logo (black, with crop marks)
├── logo-white.png                       ← Selected Frame logo (white)
└── kh_selected_sis_*.jpg                ← SIS reference photos

package.json                             ← Only Next.js + React (no pdfkit, no resend)
next.config.js                           ← Minimal config
```

## Smoke test after deploy

1. Open Quotation Builder, upload Hagemeyer Minden PDF (or similar with multiple categories)
2. Verify Inventory shows €20.710 (= €19.456 INVENTORY + €1.254 SPECIAL ELEMENTS)
3. Verify the small "Includes:" hint appears under the Inventory field
4. Verify Total excl. VAT matches the PDF (€25.410)
5. Try clicking in a Cost Breakdown field, deleting digits, and typing — should work continuously without re-clicking
6. Click Send via Email, enter recipient → mail app opens with summary prefilled
7. Export the PDF separately and attach manually

## Known limitations

- PDF export still uses browser print dialog (works fine, prints to PDF or paper)
- mailto: URLs have a length limit on some clients (~2000 chars); if the body is too long, some content may be truncated. Current template is well within limits.
