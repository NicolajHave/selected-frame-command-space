# Selected Frame · Command Space — v2.8.0

Internal Brand Spaces tool for Selected Frame concept.
Live: https://selected-frame-command-space.vercel.app

## What's new in v2.8.0

### Standards page rebuilt as a real concept manual

The Standards page was previously four small cards with generic copy. It's now a full operational concept manual structured around 9 sections:

1. **Intro** — concept owner, last reviewed date, scope
2. **Concept DNA** — 5 principle cards (Scandinavian Clarity, Modular Flexibility, Elevated Wholesale Presentation, Commercial Visibility, Controlled Calmness)
3. **Non-Negotiables** — 7 fixed rules in a high-contrast black panel (logo placement, material palette, sightlines, single fixture language, walkway clearance, etc.)
4. **Space Management** — 8 expandable zone guides (Entrance, Hero Wall, Density, Sightlines, Zoning, Podium/Mannequin, Rack Sequencing, Outfit Storytelling) with Do/Don't blocks
5. **Brand Application** — mini CI guide with logo placement rules, finishes, hanger orientation, plus an explicit "logo misuse" panel
6. **Fixtures & Modules** — approved fixture table with item codes + capacity, plus combination rules and "do not combine" lists
7. **Merchandising** — 5 VM principles + Do/Don't lists for daily operations
8. **Store Size Playbooks** — playbook cards for 25 / 40 / 60 / 80 sqm with key fixtures, hanger targets, and notes
9. **Exceptions & Approval** — fixed vs flexible rules, 4-step approval process, named approver

### Sticky sidebar navigation
Left-aligned sidebar nav with anchor links to all 9 sections. Active section highlighted in oak as you scroll.

### Content as data — easy to edit later
All copy lives in a separate file `src/app/standards-content.js`. To update text, edit constants there — no need to touch JSX. The structure is array-based so adding a new principle, rule, or zone is just appending an object.

### REVIEW pills mark Nicolaj's validation needs
Items marked `review: true` in the data file render a small orange "REVIEW" pill next to their headline. These flag content I (Claude) generated as best-guess and need Nicolaj's validation before sharing externally.

**Where to expect REVIEW pills:**
- Some Concept DNA principle wording
- Customer sightline integrity rule (specific operational definition)
- Walkway clearance numbers (900/700 mm — verify against actual standard)
- Zone-specific guidelines (rack sequencing, outfit storytelling rotation)
- Approval process step 3 (concept owner approval workflow)
- Logo size threshold (H120 below 2.6m ceiling)
- Tag/label placement rules
- Density percentages (60/25/15 hanging-folded-accessories ratio)
- All four Store Size Playbooks (key fixtures and hanger targets)
- Approver line (named approver and deputy)

The whole Fixtures section is also flagged as a draft until codes/capacities are validated.

## How to deploy

1. Unzip locally
2. Drag everything to GitHub repo root (note: NEW file `src/app/standards-content.js` is in the ZIP)
3. Commit message: `v2.8.0 — Standards page rebuild`
4. Vercel auto-deploys

## Smoke test

1. Open Standards page
2. Verify sticky sidebar with 9 section links — clicking scrolls smoothly to section
3. Verify active section indicator follows scroll position
4. Open Space Management section — click "Entrance Zone" to expand → should show Do/Don't lists
5. Verify REVIEW pills appear on flagged items in orange
6. Open Store Size Playbooks — verify all 4 sizes (25/40/60/80) render with proper layout
7. Scroll to Exceptions — verify the 4-step approval process renders horizontally with numbered circles
