# Selected Frame · Command Space — v2.8.4

Internal Brand Spaces tool for Selected Frame concept.
Live: https://selected-frame-command-space.vercel.app

## What's new in v2.8.4

### Standards Section 04: Brand Application — full rewrite

Section now reads as a clean in-store brand governance guide rather than a fabrication spec sheet.

**6 rows replacing the previous 8:**
1. Primary logo — Selected wordmark, retail logo without crop marks
2. Logo placement — left-aligned on back wall above final wall module
3. Standard logo scale — 160 cm
4. Approved logo solutions — multiple approved executions allowed via review
5. Hanger branding — oiled oak hangers with Selected logo
6. Custom solutions — possible via additional concept review and approval

**Removed:**
- All crop-mark references from in-store logic (crop marks belong to print/CI assets only)
- H150 / H120 / corona light language
- "Logo clear space" technical row
- "Logo finish" fabrication row (dibond, butler finish, etc.)
- "Hanger orientation" row
- "Tag and Label Placement" row
- All REVIEW pills

**Logo misuse panel updated:** now flags crop-marked wordmark as misuse in-store (instead of the old wording that treated removing crop marks as misuse).

## How to deploy

1. Unzip locally
2. Drag everything to GitHub repo root
3. Commit message: `v2.8.4 — Brand Application section rewrite`
4. Vercel auto-deploys

## Smoke test

1. Standards → Brand Application
2. Verify exactly 6 rows in the order: Primary logo / Logo placement / Standard logo scale / Approved logo solutions / Hanger branding / Custom solutions
3. Verify no mention of: crop marks (in main rows), H150, H120, corona light, dibond, butler finish, hanger orientation, tag/label placement
4. Verify "Standard logo scale" reads "160 cm is the standard logo scale..."
5. Verify Logo Misuse box at the bottom mentions "Crop-marked wordmark used in-store"
6. Verify NO orange REVIEW pills anywhere in the section
