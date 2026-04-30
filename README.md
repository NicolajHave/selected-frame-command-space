# Selected Frame · Command Space — v2.7.3

Internal Brand Spaces tool for Selected Frame concept.
Live: https://selected-frame-command-space.vercel.app

## What's new in v2.7.3 — actually fixing the Marseille bug

### My previous diagnosis was wrong (twice)

In v2.7.2 I claimed PDF.js was merging adjacent items into single lines — that was based on me simulating what I *thought* PDF.js did. I was wrong. To finally diagnose this properly, I installed pdfjs-dist locally and ran the actual same library that runs in the browser against the Marseille PDF.

### What PDF.js actually does

It does the **opposite** of merging — it **splits** a single item across 3-4 separate lines when the item description wraps. For Marseille's "Backwall panels" item, the real output looks like this:

```
line N:    "0325   Backwall panels: NOT included, existing wall will be"
line N+1:  "painted"
line N+2:  "1   Pcs   0,00   0,00"
```

My old parser saw line N+2 and didn't recognize it as a continuation — so the description, qty, and price never got reassembled into one item. The same happens for "Installation and inspection" (split across 3 lines) and "Travel expenses" (3 lines). These three items each "lost" their qty/price portion → €0 + €696 + €293 = **the €989 difference**.

### The actual fix

Replaced the parsing loop with a buffered approach: when a line starts with an item-number, start buffering. Append every following line until the buffered content matches the qty/unit/price tail pattern. Then commit as a complete item.

Also fixed format detection — previously only checked first 40 lines for "Sales Quote |" but in PDF.js output that string can appear later. Now scans the whole document plus uses "Regarding deliveries for Selected" as a backup heuristic.

### Validated against actual PDF.js output

Tested by running the production `pdfjs-dist` library against all 4 Printemps PDFs:

| PDF | PDF.js extracted lines | Items parsed | Pillar sum | PDF total |
|---|---|---|---|---|
| La Valentine | ~64 lines | 23 | €18.488 | €18.488 ✓ |
| Nancy | ~64 lines | 26 | €21.730 | €21.730 ✓ |
| Lyon | ~42 lines | 17 | €11.673 | €11.673 ✓ |
| Marseille | ~64 lines | 18 | €12.076 | €12.076 ✓ |

Calculation format (Stockmann, Hagemeyer) regression-tested unchanged.

## Apology and process change

Two failed releases in a row on the same bug because I was diagnosing without the right testing infrastructure. Going forward, when working on PDF parsing I will install `pdfjs-dist` locally and test against the actual library output rather than relying on Python/pdfplumber which has different behaviour.

I appreciated you pushing back hard when v2.7.2 didn't work. That kind of clear, specific, evidence-based feedback ("8 items not 9", "screenshot shows version 2.7.2") is what made it possible to find the real cause this time.

## How to deploy

1. Unzip locally
2. Drag everything to GitHub repo root
3. Commit message: `v2.7.3 — Multi-line item reassembly for PDF.js`
4. Vercel auto-deploys

## Smoke test

1. Upload **Quote_2086_SLT_SIS_Frame_Printemps_Marseille_TDP_260424.pdf**
2. Verify NO warning about pillar mismatch
3. Verify Inventory shows **9 items**, with **Backwall panels on its own line** (€0)
4. Verify Specific Project Cost shows **9 items**: Paint materials / Project Manager / Warehouse / Packaging / **Installation (€696 own line)** / Paint works / **Travel expenses (€293 own line)** / Waste / Freight
5. Verify Total = €12.076 with no diff
