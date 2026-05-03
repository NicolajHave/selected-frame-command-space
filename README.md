# Selected Frame · Command Space — v2.8.3

Internal Brand Spaces tool for Selected Frame concept.
Live: https://selected-frame-command-space.vercel.app

## What's new in v2.8.3

### Standards Section 03: Space Management — full content rewrite

All 6 remaining subsections now use concept-true, operational copy.

**Subsections kept and rewritten:**
1. Entrance Zone
2. Hero Wall / Focal Wall
3. Product Density
4. Sightlines
5. Category Zoning
6. Podium & Mannequin Usage

**Subsections removed:**
- Rack Sequencing (deleted)
- Outfit Storytelling (deleted)

### New rendering features

Two new optional content fields for any zone:

- **`supporting`**: italicised paragraph with left border, used for technical references that support but don't override the main definition. Used in Product Density, Sightlines, Category Zoning, and Podium & Mannequin Usage.
- **`commercialZones`**: structured 2×2 grid with numbered cards (Zone 1–4). Currently used in Category Zoning to show Newness / Main / NOOS / Clearance commercial structure.

### Content logic changes

- "Double Shelf Floor Rack" replaces "Jeans denim rack double" everywhere in Space Management copy
- Category Zoning is now structured around the 4-zone commercial logic (Newness / Main / NOOS / Clearance) for SIS spaces of 50 sqm and above
- All REVIEW pills removed from Section 03
- Specific measurements (700 mm clearance) removed from Space Management — those references live in the technical-master content layer

## How to deploy

1. Unzip locally
2. Drag everything to GitHub repo root
3. Commit message: `v2.8.3 — Space Management section rewrite`
4. Vercel auto-deploys

## Smoke test

1. Standards → scroll to Space Management
2. Verify exactly 6 subsections in this order: Entrance Zone, Hero Wall, Product Density, Sightlines, Category Zoning, Podium & Mannequin Usage
3. Verify Rack Sequencing and Outfit Storytelling are GONE
4. Click Product Density → see body, italic supporting line about fixture capacities, then DO and DON'T blocks
5. Click Category Zoning → see body, supporting line, then 4 numbered zone cards (Newness/Main/NOOS/Clearance), then DO and DON'T blocks
6. Verify NO orange REVIEW pills anywhere in the section
