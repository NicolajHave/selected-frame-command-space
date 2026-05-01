# Selected Frame · Command Space — v2.8.1

Internal Brand Spaces tool for Selected Frame concept.
Live: https://selected-frame-command-space.vercel.app

## What's new in v2.8.1 (small refinements)

### Custom Items: now visibly counted
Custom Items were already being added to the grand total — but only visible deep in the Quotation Summary box. v2.8.1 adds:
- **Per-row total**: each custom item shows its computed total (price × qty) inline
- **Subtotal line**: appears under the input list when any custom item has a price, showing "Custom Items subtotal: €X"
- **Comma decimal support**: writing "200,50" now parses as €200.50 (previously only "200.50" worked)

These changes don't change any behaviour — just make sure the math is **visible** as you type.

### Standards page refinements
- **Concept owner removed** from intro meta — page now shows only "Last reviewed" and "Applies to"
- **Concept DNA rebuilt** with concept-faithful copy:
  - 5 cards now: Scandinavian Clarity / Visibility / Consistency / Modular Flexibility / Controlled Contrast
  - Visibility, Consistency, Modular Flexibility = concept logic
  - Scandinavian Clarity, Controlled Contrast = design language
  - All "REVIEW" pills removed from this section
- **Hero image added** above DNA cards: stainless steel + oak edges with Selected wordmark, with caption explaining the material meeting that defines the frame

## How to deploy

1. Unzip locally
2. Drag everything to GitHub repo root
3. Commit message: `v2.8.1 — Custom Items visibility + DNA refinement`
4. Vercel auto-deploys

## Smoke test

### Quotation Builder
1. Upload any PDF, scroll to Custom Items
2. Add a row, write a description and price (try both "200.50" and "200,50" — both should work)
3. Verify per-row total shows on the right of each input line
4. Verify "Custom Items subtotal: €X" appears below the inputs once you have a value
5. Verify the Quotation Summary box (right column) shows "Custom: €X" and that grand total reflects it

### Standards page  
1. Verify intro shows only 2 meta cards (Last reviewed + Applies to)
2. Scroll to Concept DNA
3. Verify a hero image with Selected logo on stainless+oak fixture, with italic caption below
4. Verify 5 principle cards in the new order: Scandinavian Clarity / Visibility / Consistency / Modular Flexibility / Controlled Contrast
5. Verify NO orange "REVIEW" pills in DNA section
