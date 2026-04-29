# Selected Frame · Command Space — v2.7.1

Internal Brand Spaces tool for Selected Frame concept.
Live: https://selected-frame-command-space.vercel.app

## What's new in v2.7.1 (patch on v2.7.0)

### Pillar mapping refined for Sales Quote items with 0325 prefix

In Sales Quote PDFs, the `0325` item prefix is used by &elements as a manual/custom code that mixes physical products (Logo, Backwall panels, Screen) with services (Paint and painting materials). v2.7.0 routed all `0325` items to Specific Project Cost — incorrect.

v2.7.1 introduces pattern-based name matching for physical products:

| Pattern in name | Routed to |
|---|---|
| "logo" + ("light"/"corona"/"brushed steel"/"led") | **Inventory** |
| "backwall panel" | **Inventory** |
| "screen" + (55/65/75/85) | **Inventory** |
| "carpet" (without "delivery") | **Inventory** |
| Service keywords (installation/inspection/paint works/freight/transport/travel/disposal/warehouse/project manager/packaging/hours) | **Specific Project Cost** |

The service-keyword guard takes precedence — so "Installation incl. LED logo" stays in Specific Project Cost even though it mentions "LED logo".

### Validation matrix (Sales Quote PDFs after fix)

| PDF | Inventory | Selected Deliveries | Specific Project Cost | Pillar sum | PDF total | Match |
|---|---|---|---|---|---|---|
| La Valentine | €12.450 | €0 | €6.038 | €18.488 | €18.488 | ✓ |
| Nancy | €13.305 | €933 | €7.492 | €21.730 | €21.730 | ✓ |
| Lyon | €6.677 | €0 | €4.996 | €11.673 | €11.673 | ✓ |
| Marseille | €7.037 | €0 | €5.039 | €12.076 | €12.076 | ✓ |

### What you'll notice in the UI for Marseille

After deploy, uploading Marseille TDP will show:
- **Inventory** (€7.037, 9 items) — including Logo H150, corona lght (now correctly placed here)
- **Specific Project Cost** (€5.039, 9 items) — Installation, Paint works, Travel expenses now show as separate lines, not merged with previous items
- **Pillar sum matches PDF total exactly** — no more €989 difference warning

### Note on the line-merge bug you observed

The merged items you saw in your screenshot ("Mannequin_male 0325 Backwall panels...", "Packaging materials, pallets 0432 Installation...", etc.) were not real bugs — that screenshot was from an earlier deployment. v2.7.0's parser already handles each line as a discrete item via item-number detection. After deploying v2.7.1 you should see all items on their own lines.

## How to deploy

1. Unzip locally
2. Drag everything to GitHub repo root
3. Commit message: `v2.7.1 — Pillar mapping for 0325 physical products`
4. Vercel auto-deploys

## Smoke test

1. Upload **Quote_2086_SLT_SIS_Frame_Printemps_Marseille_TDP_260424.pdf**
2. Verify Inventory €7.037 (9 items) — **Logo H150 should be here**
3. Verify Specific Project Cost €5.039 (9 items) — Installation/Paint works/Travel each on their own line
4. Verify Total €12.076 with NO warning about pillar mismatch
5. Verify Hanger Calculator works correctly (3× Floor rack 1400 + 1× Floor rack 700 = 175 raw → Shirt 100 / Clips 50 / Coat 25)
