# Selected Frame · Command Space — v2.3.0

Internal Brand Spaces tool for Selected Frame concept.
Live: https://selected-frame-command-space.vercel.app

## What's new in v2.3.0

**Hanger Calculator** added to Quotation Builder. When a supplier PDF is parsed:

1. The calculator scans the Inventory items for fixtures that hold hangers
2. Each match adds its hanger capacity to a running total (e.g. Sidehang 1400 = 50 hangers, Front hang = 12, Floor rack 700 = 25)
3. The total is split 60% shirt / 25% clips / 15% coat
4. Custom rounding applies:
   - Shirt + clips → nearest 50 (rest >15 = up, rest ≤15 = down)
   - Coat → nearest 25 (rest >5 = up, rest ≤5 = down)
5. **Add to Quote** button populates the Add-ons section with the right pack quantities (shirt50, clip50, coat25)

Hidden when no matching fixtures exist. The three hanger items remain in Add-ons so they can also be edited manually.

### Matching rules

| Match | Hangers per unit |
|---|---|
| name contains "sidehang 1400" | 50 |
| name contains "sidehang 700" | 25 |
| name contains "wall unit" + "jeans" | 10 |
| name contains "front hang" | 12 |
| name contains "floor rack 1400" | 50 |
| name contains "floor rack 700" | 25 |
| name contains "jeans" + "double" | 15 |
| name contains "jeans" + "single" | 30 |
| name contains "wall unit" + "1400" (not bracket/mirror/screen/connector) | 50 |
| name contains "wall unit" + "700" (not bracket/connector) | 25 |

Bracket, Mirror box, Screen, Connector plate etc. are correctly skipped.

### Validated against real PDFs

| PDF | Matched fixtures | Raw total | Rounded shirt/clips/coat |
|---|---|---|---|
| Hagemeyer Minden | Sidehang 1400 (5), Front hang (4), Floor rack 1400 (6) | 598 | 350 / 150 / 100 |
| Stockmann Helsinki | Sidehang 1400 (9), Jeans unit (1), Front hang (4), Floor rack 1400 (7), Floor rack 700 (1), Jeans rack double (1) | 898 | 550 / 250 / 150 |

## How to deploy

1. Unzip locally
2. Go to https://github.com/NicolajHave/selected-frame-command-space
3. Click "Add file" → "Upload files" → drag everything inside the unzipped folder
4. Commit message: `v2.3.0 — Hanger Calculator`
5. Vercel auto-deploys

## Smoke test

1. Upload Hagemeyer PDF or similar
2. Hanger Calculator panel appears below Cost Breakdown
3. See matched fixtures and totals
4. Click **Add to Quote** → Shirt/Clip/Coat hangers appear checked in Add-ons with auto-set quantities
5. Button changes to "✓ Added to Quote" when add-ons match calculator output
6. Adjust quantities manually in Add-ons if needed (Calculator total stays as a reference)

## Inherited from v2.2.0
- 3-pillar category mapping (Inventory + Floor + Special Elements + Fitting Rooms grouped together; AV & HiFi + Light + Construction grouped under Specific Project Cost)
- Mailto-based email flow (no backend dependencies)
- Input fields keep focus while typing
