# Selected Frame · Command Space — v2.7.2

Internal Brand Spaces tool for Selected Frame concept.
Live: https://selected-frame-command-space.vercel.app

## What's new in v2.7.2 (patch)

### The actual root cause — PDF.js merges adjacent items

When testing locally with `pdfplumber` (Python), each item appeared as a separate line in the raw PDF text. So my v2.7.0 and v2.7.1 parsing tested fine and I incorrectly assumed it would behave the same in production.

**But the production app uses PDF.js in the browser**, which extracts text by visual coordinates. When two items in a Sales Quote PDF are vertically very close (less than 2 pixels apart), PDF.js groups them as a single line. That's why the Marseille PDF showed:

- "Mannequin_male" merged with "Backwall panels"
- "Packaging materials" merged with "Installation"
- "Paint works" merged with "Travel expenses"

Each merge "ate" one item's price (€0, €696, €293) → the €989 difference you observed.

### The fix

Added a pre-processing step in the parser that detects merged lines (containing 2+ item-numbers) and splits them. Item-number pattern: 3-4 digit prefix optionally followed by `-` or `_` and more characters, then space and a capital letter starting the description.

**Tested by simulating exactly the merges you saw in production:**

```
Input:  "112_99_041 Mannequin_male 1 Pcs 453,00 453,00 0325 Backwall panels: NOT included, ..."
Output: ["112_99_041 Mannequin_male 1 Pcs 453,00 453,00",
         "0325 Backwall panels: NOT included, existing wall will be painted 1 Pcs 0,00 0,00"]
```

After fix: Marseille parses to 9 Inventory items + 9 SPC items = 18 items, total €12.076 ✓ — matching PDF Total EUR Excl. VAT exactly.

### Validation matrix (all 4 Printemps PDFs after v2.7.2)

| PDF | Inventory | Selected Deliveries | Specific Project Cost | Pillar sum | PDF total |
|---|---|---|---|---|---|
| La Valentine | €12.450 | €0 | €6.038 | €18.488 | €18.488 ✓ |
| Nancy | €13.305 | €933 | €7.492 | €21.730 | €21.730 ✓ |
| Lyon | €6.677 | €0 | €4.996 | €11.673 | €11.673 ✓ |
| Marseille | €7.037 | €0 | €5.039 | €12.076 | €12.076 ✓ |

## Apology — and a process improvement note

In v2.7.0 I shipped this feature based on local Python-based testing, which gave me false confidence that the parser was working. When you reported the merged-line bug, I should have asked you to share the actual rendered output before assuming you were on an old version. That cost us an extra round trip.

For future PDF parser work, I'll specifically validate behaviour by simulating PDF.js merged-line output (where the actual quirks live) rather than relying on Python text extraction.

## How to deploy

1. Unzip locally
2. Drag everything to GitHub repo root
3. Commit message: `v2.7.2 — Fix PDF.js merged-line splitting`
4. Vercel auto-deploys

## Smoke test

1. Upload Marseille TDP again
2. Verify NO warning about pillar mismatch (the €989 diff should be gone)
3. Verify Inventory shows 9 items including Backwall panels (€0) on its own line
4. Verify Specific Project Cost shows 9 items: Paint materials, Project Manager, Warehouse, Packaging, Installation, Paint works, Travel, Waste, Freight — each on their own line
5. Verify Total €12.076 = pillar sum
