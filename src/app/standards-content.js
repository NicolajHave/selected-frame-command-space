// Selected Frame · Standards content
//
// All copy lives here so it can be edited without touching layout code.
// Items marked with `review: true` are best-guess placeholders — Nicolaj should
// validate them before sharing the page externally. The Standards page surfaces
// these as small "REVIEW" pills next to the headline.

export const SECTIONS = [
  { id: "intro",          label: "Intro" },
  { id: "dna",            label: "Concept DNA" },
  { id: "non-negotiables",label: "Non-Negotiables" },
  { id: "space",          label: "Space Management" },
  { id: "brand",          label: "Brand Application" },
  { id: "fixtures",       label: "Fixtures & Modules" },
  { id: "vm",             label: "Merchandising" },
  { id: "playbooks",      label: "Store Size Playbooks" },
  { id: "exceptions",     label: "Exceptions & Approval" },
];

export const INTRO = {
  title: "Selected Frame Guidelines",
  kicker: "Concept Standards",
  body: "The internal operational guide for executing the Selected Frame concept across wholesale partners. Use this page to brief project owners, partner teams, and shopfitters on how the concept must be applied — and where local adaptation is allowed.",
  meta: [
    { label: "Last reviewed", value: "April 2026" },
    { label: "Applies to", value: "All Selected SIS, Brand Spaces, Showroom installations" },
  ],
};

export const DNA = {
  intro: "The five principles that define every Selected Frame installation. Together they express both the concept logic and the design language behind the space.",
  image: "/images/kh_selected_sis_032_web.jpg",
  imageCaption: "Stainless steel grit 240, solid oak edges, brushed Selected wordmark — the meeting of materials that defines the frame.",
  principles: [
    {
      title: "Scandinavian Clarity",
      body: "A light-toned, refined foundation where product, fixture and brand each have room to breathe. Selected Frame should feel calm and legible, never crowded or visually noisy.",
    },
    {
      title: "Visibility",
      body: "Selected must read clearly in the partner environment. The concept creates distinct brand presence through strong sightlines, clear focal points and immediately recognisable brand territory.",
    },
    {
      title: "Consistency",
      body: "Selected Frame must feel unmistakably Selected across markets, partners and store sizes. The expression can scale and adapt, but the core visual identity and concept logic must remain coherent.",
    },
    {
      title: "Modular Flexibility",
      body: "Every fixture is part of a scalable system. Standard modules combine into 25, 40, 60 and 80 sqm setups, allowing adaptation through configuration rather than custom-built reinvention.",
    },
    {
      title: "Controlled Contrast",
      body: "The concept is defined by the meeting of cool steel, warm wood and soft sculptural form. Contrast is not decoration — it is what gives the space character, warmth and memorability without losing control.",
    },
  ],
};

export const NON_NEGOTIABLES = {
  intro: "These rules apply to every Selected Frame installation. Some define the concept itself, while others govern approved specifications and in-store execution.",
  groups: [
    {
      title: "Core Non-Negotiables",
      kicker: "Concept law",
      rules: [
        {
          title: "Clear brand visibility",
          body: "Selected must read clearly and immediately in the partner environment. Primary sightlines into the SIS must remain clean, legible and visibly brand-led.",
        },
        {
          title: "Approved fixture language only",
          body: "Only approved Selected Frame fixtures and concept elements may exist inside the Selected Frame footprint. The space must not be mixed with partner-supplied or third-party fixture language.",
        },
        {
          title: "Approved material expression only",
          body: "The concept may only be executed using approved Selected Frame materials, finishes and colour directions. Unapproved substitutions are not allowed without prior concept approval.",
        },
        {
          title: "Protected concept hierarchy",
          body: "No local signage, promotional messaging or retail add-ons may disrupt the internal hierarchy of the Selected Frame space. Brand communication must remain controlled and concept-led.",
        },
        {
          title: "Approved logo application",
          body: "Logo placement must always follow the approved master application logic for Selected Frame. Brand marking is part of the concept structure, not a decorative add-on.",
        },
      ],
    },
    {
      title: "Technical Standards",
      kicker: "Approved master spec",
      rules: [
        {
          title: "Back wall logo placement",
          body: "The Selected logo is positioned left-aligned on the back wall above the final wall module, following the approved master layout logic.",
        },
        {
          title: "Approved material references",
          body: "Use approved stainless steel, selected oak details, approved wall paint and approved table-surface specifications only. Technical references must follow the current concept master.",
        },
        {
          title: "Closed fixture system",
          body: "The fixture system is modular and closed. Approved modules must be configured within the system logic rather than replaced with locally improvised alternatives.",
        },
      ],
    },
    {
      title: "Planning & VM Controls",
      kicker: "Execution-level enforcement",
      rules: [
        {
          title: "Walkway protection",
          body: "Primary circulation through the Selected Frame space must remain open and commercially readable. Fixtures, VM elements and local additions must never block the intended customer flow.",
        },
        {
          title: "Sightline protection",
          body: "Mid-floor messaging, oversized dump bins, tall blocking elements or ad hoc local inserts must not interrupt the main visual approach into the space.",
        },
        {
          title: "Approved hanger system",
          body: "Only approved Selected hanger systems may be used on display. Mixed hanger expressions from partner stock are not permitted inside the Selected Frame presentation.",
        },
      ],
    },
  ],
};

export const SPACE_MANAGEMENT = {
  intro: "How the floor is structured, planned and protected. This section is the operational reference for project owners and shopfitters when applying the Selected Frame concept on site.",
  zones: [
    {
      title: "Entrance Zone",
      body: "The first 1.5–2 metres from the partner-facing edge. This is the concept's first statement zone and must create immediate Selected visibility, calmness and recognition.",
      dos: [
        "Use the entrance as a branded focal zone, not a sales-dense surface",
        "Use Iconic Table as the preferred entrance anchor in every Shop-In-Shop",
        "If space does not allow for Iconic Table, use Iconic Podium as the approved fallback",
        "Limit mannequin presence to a maximum of two, styled as one coherent outfit story",
        "Keep any planned screen fully visible from the main customer approach and ensure it is not visually blocked by fixtures or VM elements",
        "Use only one clear hero story in the entrance zone",
        "Place A5 magnet sign on Volume Table only, never on Iconic Table",
      ],
      donts: [
        "No floor racks in the entrance zone",
        "No fold tables with high product stacks",
        "No promotional signage or local retail messaging",
        "No fixture placement that blocks the screen from the customer approach",
        "No competing outfit stories or secondary focal points",
        "No visual density that weakens first impression and brand clarity",
      ],
    },
    {
      title: "Hero Wall / Focal Wall",
      body: "The primary branded wall in the space, positioned opposite or adjacent to the entrance depending on layout logic. This is the main statement surface and must create immediate Selected recognition.",
      dos: [
        "Use the wall as the main branded anchor of the Shop-In-Shop",
        "Keep logo application clear, protected and left-aligned according to approved master logic",
        "Follow approved wall module and sidehang sequence",
        "Use one clear seasonal or brand-led story only",
        "Keep any planned screen fully visible from the main customer approach and aligned with the wall story",
        "Maintain a visually complete and commercially readable presentation at all times",
      ],
      donts: [
        "No partner-supplied signage on the hero wall",
        "No mixing of multiple seasonal stories on the same wall",
        "No fixture or VM element blocking logo or screen visibility",
        "No empty or visibly depleted hanger presentation during customer-facing hours",
        "No overcrowding that weakens the wall's role as the main statement surface",
      ],
    },
    {
      title: "Product Density",
      body: "Density must be engineered, not maximised. Its role is to support commercial readability, visual rhythm and a calm premium expression across the space.",
      supporting: "Approved fixture capacities define the presentation framework. Sidehang 1400 carries 50 hangers, sidehang 700 carries 25, and Double Shelf Floor Rack follows approved double-shelf capacity logic. Overfilling weakens readability; underfilling makes the space read incomplete.",
      dos: [
        "Use Hanger Calculator output as fill guidance",
        "Keep density visually consistent across the same fixture type",
        "Follow approved fixture capacities and presentation logic",
        "Replenish depleted presentation during customer-facing hours",
        "Let product spacing support readability, rhythm and premium perception",
      ],
      donts: [
        "Do not exceed approved hanger capacity per fixture",
        "Do not create stock-heavy or overpacked presentation",
        "Do not mix shirt, clip and coat hanger systems on the same rod",
        "Do not allow identical fixtures to read with inconsistent fill levels unless intentionally planned",
        "Do not leave customer-facing presentation visibly depleted during trading hours",
      ],
    },
    {
      title: "Sightlines",
      body: "The main customer approach must preserve clear visual reading paths into the Selected Frame space. Sightlines protect brand clarity, screen visibility and spatial usability.",
      supporting: "Three sightlines must remain clear: entry-to-hero-wall, entry-to-screen, and entry-to-fitting-room (if present). These must be checked before approving floor plan and fixture placement.",
      dos: [
        "Protect the visual path from entry to hero wall",
        "Keep any planned screen readable from the main customer approach",
        "Preserve a clear approach to the fitting room where included",
        "Audit sightlines before approving floor plan and fixture placement",
        "Use low, controlled entrance elements so the space opens clearly",
      ],
      donts: [
        "Do not place tall fixtures, mannequins or signage in key reading paths",
        "Do not let secondary VM elements interrupt logo or screen visibility",
        "Do not block fitting room visibility or access with ad hoc product placement",
        "Do not approve layouts where the first customer view reads crowded or visually broken",
      ],
    },
    {
      title: "Category Zoning",
      body: "For Shop-In-Shop spaces of 50 sqm and above, the floor should be structured into four commercial zones. This zoning logic helps organise customer flow, product hierarchy and trading priority across the space.",
      supporting: "The four zones must read clearly in layout planning and support a controlled journey from seasonal impact to continuity and exit-driven product.",
      commercialZones: [
        {
          number: 1,
          name: "Newness",
          body: "The most visible and brand-led zone in the space. This is where new arrivals, seasonal focus and first impression product stories should live.",
        },
        {
          number: 2,
          name: "Main",
          body: "The commercial core of the Shop-In-Shop. This zone carries the main seasonal assortment and should hold the strongest volume of full-price presentation.",
        },
        {
          number: 3,
          name: "NOOS",
          body: "The continuity zone. This area should hold never-out-of-stock product in a stable, easy-to-shop and easy-to-replenish structure.",
        },
        {
          number: 4,
          name: "Clearance",
          body: "The exit or secondary commercial zone for price-driven product. Clearance must remain clearly separated from the primary brand experience and should never define the first impression of the space.",
        },
      ],
      dos: [
        "Apply the 4-zone structure in Shop-In-Shop spaces of 50 sqm and above",
        "Let Zone 1 carry the strongest seasonal visibility",
        "Use Zone 2 as the main full-price trading area",
        "Keep Zone 3 stable, clear and operationally easy to replenish",
        "Place Zone 4 away from the first brand impression and keep it visually controlled",
        "Make transitions between zones readable in the layout",
      ],
      donts: [
        "Do not mix all product priorities evenly across the floor",
        "Do not place clearance in the primary entrance or hero zone",
        "Do not let NOOS dominate the seasonal first impression",
        "Do not make zone transitions visually confusing or commercially unclear",
        "Do not allow clearance presentation to weaken the overall Selected Frame experience",
      ],
    },
    {
      title: "Podium & Mannequin Usage",
      body: "Podiums and mannequins are focal presentation tools. Their role is to create rhythm, outfit storytelling and visual pause — not to increase selling density.",
      supporting: "Use approved podium types and floor-standing mannequins only. Technical sizes belong to the concept master and do not need to be shown as the primary rule here.",
      dos: [
        "Use podiums to create focal rhythm, not stock density",
        "Use podiums for footwear, accessories and folded outfit anchors only",
        "Use floor-standing mannequins only",
        "Use mannequins to communicate one clear outfit story",
        "Keep podium and mannequin placement aligned with sightlines and customer flow",
        "Limit mannequin count so the space remains calm and readable",
      ],
      donts: [
        "No busts placed on tables",
        "No podium use as overflow or dump surface",
        "No mannequin clusters that create visual noise",
        "No placement that blocks entry view, hero wall or screen visibility",
        "No more than the approved mannequin density for the size of the space",
        "No competing focal points created by podium or mannequin overuse",
      ],
    },
  ],
};

export const BRAND_APPLICATION = {
  intro: "How the Selected wordmark and visible brand assets are applied inside the frame. This section defines the approved in-store brand application logic.",
  rules: [
    { label: "Primary logo",          value: "Selected wordmark only. In-store applications use the approved retail logo without crop marks." },
    { label: "Logo placement",        value: "Always left-aligned on the back wall above the final wall module. Centred placement is not approved." },
    { label: "Standard logo scale",   value: "160 cm is the standard logo scale. Any deviation must be reviewed against wall proportion, sightline and concept balance." },
    { label: "Approved logo solutions", value: "Use approved Selected logo solutions only. Multiple approved logo executions may be used depending on project conditions, but all must follow concept review and approval logic." },
    { label: "Hanger branding",       value: "Approved hangers use oiled oak with Selected logo application. Hanger expression must remain consistent across the installation." },
    { label: "Custom solutions",      value: "Custom logo or branding solutions may be developed where required, but only through additional concept review and approval." },
  ],
  misuse: [
    "Logo centred on back wall",
    "Logo on side walls or columns",
    "Crop-marked wordmark used in-store (crop marks belong to print/CI assets only)",
    "Logo applied as decal on glass without concept approval",
    "Logo paired with partner co-branding inside the frame",
  ],
};

export const FIXTURES = {
  intro: "All approved Selected Frame elements. Use this as the visual reference for fixtures, podiums, signage and inventory items during layout, ordering and partner alignment.",
  meta: "Source: Selected SIS Catalog — Rev 1, March 2026",
  categories: [
    {
      name: "Wall Units",
      items: [
        { code: "105-99-003", name: "Wall Unit Sidehang",            dims: "2288 H × 1496 W × 434 D", material: "Stainless Steel", hangers: 35, image: "/images/elements/wall_unit_sidehang.jpg" },
        { code: "105-99-004", name: "Wall Unit 1400 — Shelves",      dims: "2288 H × 1496 W × 517 D", material: "Stainless Steel, Oak",        image: "/images/elements/wall_unit_1400_shelves.jpg" },
        { code: "105-99-005", name: "Wall Unit 1400 — Single Shelf Sidehang", dims: "2288 H × 1496 W × 517 D", material: "Stainless Steel, Oak", hangers: 35, image: "/images/elements/wall_unit_1400_single_shelf_sidehang.jpg" },
        { code: "105-99-006", name: "Wall Unit 1400 — 2-level Sidehang",     dims: "2288 H × 1496 W × 542 D", material: "Stainless Steel",     hangers: 40, image: "/images/elements/wall_unit_1400_2_level_sidehang.jpg" },
        { code: "105-99-007", name: "Wall Unit 1400 — Mirror Sidehang",      dims: "2288 H × 1496 W × 434 D", material: "Stainless Steel",     hangers: 28, image: "/images/elements/wall_unit_1400_mirror_sidehang.jpg" },
        { code: "105-99-008", name: "Wall Unit — Category Library",          dims: "2288 H × 1496 W × 529.5 D", material: "Stainless Steel",   hangers: 10, image: "/images/elements/wall_unit_category_library.jpg" },
        { code: "105-99-009", name: "Wall Unit 1400 — Screen",               dims: "2288 H × 1496 W × 445 D",   material: "Stainless Steel",   image: "/images/elements/wall_unit_1400_screen.jpg" },
        { code: "105-99-010", name: "Wall Unit 700 — Shelf",                 dims: "2288 H × 810 W × 517 D",    material: "Stainless Steel, Oak", image: "/images/elements/wall_unit_700_shelf.jpg" },
        { code: "105-99-011", name: "Wall Unit 700 — 2-level Sidehang",      dims: "2288 H × 810 W × 389 D",    material: "Stainless Steel",   hangers: 26, image: "/images/elements/wall_unit_700_2_level_sidehang.jpg" },
        { code: "105-99-012", name: "Wall Unit 700 — Sidehang",              dims: "2288 H × 810 W × 389 D",    material: "Stainless Steel",   hangers: 13, image: "/images/elements/wall_unit_700_sidehang.jpg" },
      ],
    },
    {
      name: "Racks",
      items: [
        { code: "105-06-001",        name: "Floor Rack 1400",               dims: "1758 H × 1310 W × 500 D", material: "Stainless Steel",      hangers: 50, image: "/images/elements/floor_rack_1400.jpg" },
        { code: "105-06-002",        name: "Floor Rack 700",                dims: "1758 H × 800 W × 500 D",  material: "Stainless Steel",      hangers: 25, image: "/images/elements/floor_rack_700.jpg" },
        { code: "105-06-014",        name: "Floor Rack 1400 H1700",         dims: "1708 H × 1310 W × 500 D", material: "Stainless Steel",      hangers: 50, image: "/images/elements/floor_rack_1400_h1700.jpg" },
        { code: "105-06-014b",       name: "Floor Rack 700 H1700",          dims: "1708 H × 800 W × 500 D",  material: "Stainless Steel",      hangers: 25, image: "/images/elements/floor_rack_700_h1700.jpg" },
        { code: "105-06-010",        name: "Jeans Rack Single",             dims: "1758 H × 1310 W × 500 D", material: "Stainless Steel, Oak", hangers: 25, image: "/images/elements/jeans_rack_single.jpg" },
        { code: "105-06-011",        name: "Double Shelf Floor Rack",       dims: "1758 H × 1310 W × 500 D", material: "Stainless Steel, Oak", hangers: 10, image: "/images/elements/double_shelf_floor_rack.jpg" },
        { code: "105-06-013",        name: "Triple Shelf Floor Rack",       dims: "1752 H × 1300 W × 500 D", material: "Stainless Steel, Oak", image: "/images/elements/triple_shelf_floor_rack.jpg" },
        { code: "105-06-011-22-C",   name: "Floor Rack Acrylic Sign",       dims: "324.9 H × 148.5 W × 19.6 D", material: "Stainless Steel",   image: "/images/elements/floor_rack_acrylic_sign.jpg" },
      ],
    },
    {
      name: "Podiums",
      items: [
        { code: "105-09-001", name: "Iconic Podium",    dims: "750 H × Ø 450",          material: "MDF",  image: "/images/elements/iconic_podium.jpg" },
        { code: "105-09-002", name: "Tall Oak Podium",  dims: "550 H × 400 W × 400 D",  material: "Oak",  image: "/images/elements/tall_oak_podium.jpg" },
        { code: "105-09-003", name: "Short Oak Podium", dims: "400 H × 400 W × 400 D",  material: "Oak",  image: "/images/elements/short_oak_podium.jpg" },
      ],
    },
    {
      name: "Tables",
      items: [
        { code: "105-17-001", name: "Volume Table", dims: "430 / 815 H × 1800 W × 1280 D", material: "Stainless Steel, Oak", image: "/images/elements/volume_table.jpg" },
        { code: "105-17-007", name: "Iconic Table", dims: "650 H × 1265 W × 1200 D",       material: "MDF",                  image: "/images/elements/iconic_table.jpg" },
      ],
    },
    {
      name: "Logos",
      items: [
        { code: "105-13-001", name: "Corona Light Logo",    dims: "225 H × 1200 W × 20 D", material: "Stainless Steel", image: "/images/elements/corona_light_logo.jpg" },
        { code: "105-13-015", name: "Stainless Steel Logo", dims: "225 H × 1200 W × 20 D", material: "Stainless Steel", image: "/images/elements/stainless_steel_logo.jpg" },
        { code: "—",          name: "LED Logo",             dims: "225 H × 1200 W × 20 D", material: "LED",             image: null },
      ],
    },
    {
      name: "Accessories",
      items: [
        { code: "105-13-023", name: "Table Sign A5 Portrait", dims: "210 H × 148 W × 50 D",     material: "Stainless Steel", image: "/images/elements/table_sign_a5.jpg" },
        { code: "105-15-001", name: "Leather Tray",           dims: "28 H × 420 W × 275 D",     material: "Leather",         image: "/images/elements/leather_tray.jpg" },
        { code: "105-15-002", name: "Accessories Rack",       dims: "1508 H × 756.2 W × 500 D", material: "Stainless Steel", image: "/images/elements/accessories_rack.jpg" },
        { code: "105-15-003", name: "Accessories Tray 3×3",   dims: "70 H × 287 W × 287 D",     material: "Oak",             image: "/images/elements/accessories_tray_3x3.jpg" },
        { code: "105-15-004", name: "Accessories Tray 3×5",   dims: "70 H × 469 W × 287 D",     material: "Oak",             image: "/images/elements/accessories_tray_3x5.jpg" },
        { code: "105-18-001", name: "Floor Price Sign A5",    dims: "51.2 H × 180 W × 241 D",   material: "Stainless Steel", image: "/images/elements/floor_price_sign_a5.jpg" },
      ],
    },
    {
      name: "Mannequins",
      items: [
        { code: "112_18_001", name: "Long Torso — Female", dims: "Floor-standing", material: "—", image: "/images/elements/mannequin_female.jpg" },
        { code: "112_18_002", name: "Long Torso — Male",   dims: "Floor-standing", material: "—", image: "/images/elements/mannequin_male.jpg" },
      ],
    },
    {
      name: "Carpets",
      items: [
        { code: "105-19-001", name: "Carpet Size 1", dims: "2424 W × 2809 D", material: "—", image: "/images/elements/carpet_size_1.jpg" },
      ],
    },
  ],
};

export const MERCHANDISING = {
  intro: "Visual merchandising rules. The frame creates the calm; merchandising preserves it.",
  principles: [
    {
      title: "Density is engineered",
      body: "Hanger capacity is the upper limit, not a target. Aim for 80–90% fill on visible fixtures. Empty fixtures or rods are not allowed even in low-stock periods.",
      review: true,
    },
    {
      title: "Hanging-folded balance",
      body: "Per 60 sqm: roughly 60% hanging volume, 25% folded on tables, 15% accessories and footwear on podiums. Adjust by category mix per partner.",
      review: true,
    },
    {
      title: "Outfit focus",
      body: "Front-hang on each wall is a styled outfit, not a single product. The full outfit (top, bottom, layer) is visible from the customer's primary sightline.",
    },
    {
      title: "Product rhythm",
      body: "Within a sidehang, products group by colour story (light to dark, neutral to accent). Between sidehangs, separate by category or story chapter.",
    },
    {
      title: "Storytelling hierarchy",
      body: "Three layers: Hero wall = season's main story; Volume table = outfit anchor; Floor racks = depth and size availability. Stories rotate together, never on different cycles.",
      review: true,
    },
  ],
  dos: [
    "Replenish daily during peak periods",
    "Re-fold tables every morning before opening",
    "Keep hooks facing back wall",
    "Group by colour, then size",
    "Audit sightlines weekly",
  ],
  donts: [
    "Do not leave empty hangers on rods",
    "Do not stack folded product above 8 pieces",
    "Do not mix categories on one rack",
    "Do not place sale signs inside the frame",
    "Do not let mannequins stand undressed for more than 24 hours",
  ],
};

export const PLAYBOOKS = {
  intro: "How the concept adapts by sales area. Each size has a recommended fixture mix and zone strategy. Quotation Builder and ROI Engine reference these defaults.",
  sizes: [
    {
      sqm: 25,
      name: "Compact",
      bestFor: "Boutique multibrand, dense city retail",
      keyFixtures: "1× Volume table or iconic table (medium), 2× Floor rack 1400, 1× Floor rack 700, 1× Sidehang 1400 wall, 1× Front hang",
      hangerTarget: "≈ 200 hangers",
      notes: "Skip mannequins entirely or use one floor-standing piece at entrance. Hero wall doubles as primary sales surface.",
      review: true,
    },
    {
      sqm: 40,
      name: "Standard",
      bestFor: "Mid-tier department store SIS",
      keyFixtures: "1× Volume table, 2× Floor rack 1400, 2× Floor rack 700, 2× Sidehang 1400 wall units, 1× Jeans denim rack, 1 mannequin",
      hangerTarget: "≈ 350 hangers",
      notes: "Single hero wall with logo. Walkway clearance still 900 mm — density is not the answer to limited space.",
      review: true,
    },
    {
      sqm: 60,
      name: "Full Frame",
      bestFor: "Premium department store, dedicated SIS",
      keyFixtures: "1× Volume table, 1× Iconic table, 4× Floor rack 1400, 2× Floor rack 700, 3× Sidehang wall units, 2× Front hang, 2 podiums, 2 mannequins",
      hangerTarget: "≈ 550 hangers",
      notes: "Reference size for the concept. Logo H150 corona light, full screen module, complete outfit storytelling cycle.",
      review: true,
    },
    {
      sqm: 80,
      name: "Flagship",
      bestFor: "Anchor partner, premium location",
      keyFixtures: "1× Volume table, 1× Iconic table large, 5× Floor rack 1400, 3× Floor rack 700, 4× Sidehang wall units, 3× Front hang, 3 podiums, 2 mannequins, dedicated fitting area",
      hangerTarget: "≈ 750 hangers",
      notes: "Full concept expression. Optional Light poster module on hero wall when ceiling height permits.",
      review: true,
    },
  ],
};

export const EXCEPTIONS = {
  intro: "Selected Frame is a system, not a template. Local conditions vary — these guidelines clarify what is fixed and what is open to discussion.",
  fixed: [
    "Approved material palette",
    "Logo placement (left-aligned, above final wall module)",
    "Single fixture language inside the frame",
    "Approved hanger system",
    "No unapproved local signage",
  ],
  flexible: [
    "Total fixture count and arrangement",
    "Floor rack placement and grouping",
    "Mannequin count (within zone density rules)",
    "Outfit story content per cycle",
    "Carpet size and colour within approved range",
  ],
  process: [
    {
      step: 1,
      title: "Identify",
      body: "Project owner identifies a local condition that conflicts with a guideline. Document the condition with photos and floor plan.",
    },
    {
      step: 2,
      title: "Propose",
      body: "Propose the deviation in writing — what guideline, what alternative, what justification. Use the project's Asana task as the record.",
    },
    {
      step: 3,
      title: "Approve",
      body: "Concept owner reviews and approves, conditionally approves, or rejects. Approval is recorded as a task comment for audit history.",
      review: true,
    },
    {
      step: 4,
      title: "Implement and learn",
      body: "Approved deviations are implemented and reviewed at Phase 10 (Close & Learning). Recurring deviations may inform updates to the guidelines themselves.",
    },
  ],
};
