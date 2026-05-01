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
  intro: "How the floor is structured and managed. These guidelines explain the why behind layout decisions and give project owners and shopfitters a shared operational reference.",
  zones: [
    {
      title: "Entrance Zone",
      body: "First 1.5–2 meters from the partner-facing edge. Holds the focal volume table or iconic table with curated outfit story. No racks in this zone — the entrance is a statement, not a sales surface.",
      dos: ["Volume table or iconic table as anchor", "Two mannequins maximum, dressed as outfit story", "Floor signage limited to leather tray or A5 magnet sign"],
      donts: ["No floor racks", "No fold tables with high stacks", "No promotional signage"],
      review: true,
    },
    {
      title: "Hero Wall / Focal Wall",
      body: "The wall opposite or adjacent to entrance flow. Holds Logo H150 corona light + sidehang sequence + screen module if applicable. This is the brand statement surface.",
      dos: ["Logo above final wall module, left-aligned", "Sidehang 1400 with strongest seasonal story", "Screen content from approved Selected playlist only"],
      donts: ["No partner-supplied signage on hero wall", "No mixing of seasonal stories on the same wall", "No empty hangers — even briefly"],
    },
    {
      title: "Product Density",
      body: "Engineered density per fixture type. Sidehang 1400 carries 50 hangers, sidehang 700 carries 25, jeans denim rack double carries 10. Overfilling kills the calm aesthetic; underfilling reads as missing stock.",
      dos: ["Use Hanger Calculator output as fill target", "Maintain consistent density across same fixture type", "Replenish daily during peak"],
      donts: ["Do not exceed hanger capacity per fixture", "Do not mix shirt-clip-coat hangers on same rod"],
    },
    {
      title: "Sightlines",
      body: "From the partner customer's main entry point, three sightlines must remain clean: entry-to-hero-wall, entry-to-screen, entry-to-fitting-room (if present). Audit these before approving floor layout.",
      review: true,
    },
    {
      title: "Category Zoning",
      body: "Mens and womens never mix on the same wall module. Categories transition at module boundaries, never mid-fixture. Footwear gets its own podium or shelf bay — not mixed with apparel.",
      review: true,
    },
    {
      title: "Podium & Mannequin Usage",
      body: "Wooden podiums (low 400×400×400, high 400×400×550) are used for footwear, accessories, and folded outfit anchors. Mannequins are floor-standing with stainless tube — no busts on tables. Maximum two mannequins per 25 sqm.",
      review: true,
    },
    {
      title: "Rack Sequencing",
      body: "Floor racks are placed in pairs or trios with 700 mm clearance. Never single-stand a 1400 floor rack in open floor — it reads as orphaned stock. Sequence by category, then size, then colour.",
    },
    {
      title: "Outfit Storytelling",
      body: "Every entrance zone and hero wall tells one outfit story per cycle (4–6 weeks). Front-hang sample is the story anchor; sidehang carries the volume. Story rotates on partner trade calendar.",
      review: true,
    },
  ],
};

export const BRAND_APPLICATION = {
  intro: "How the Selected wordmark and brand assets are applied inside the frame. This section is the mini-CI guide for everything visible to the customer.",
  rules: [
    { label: "Primary logo",        value: "Selected wordmark with crop marks. The crop marks are part of the brand identity — never remove them." },
    { label: "Logo placement",      value: "Always left-aligned on the back wall, above the final wall module. Centred placement is not approved." },
    { label: "Logo size",           value: "H150 corona light is the standard. H120 reduced version is permitted only when ceiling height is below 2.6 m.", review: true },
    { label: "Logo clear space",    value: "Minimum clear space equal to the height of the 'S' on all sides.", review: true },
    { label: "Logo finish",         value: "Brushed steel (3mm dibond, butler finish) or LED-lit steel letters with acrylic front. No painted MDF substitutes." },
    { label: "Hanger branding",     value: "Selected wordmark on all hangers. Wood hangers for outerwear and tailoring; metal clips for trousers and skirts." },
    { label: "Hanger orientation",  value: "Hooks always face the same direction across one fixture. Standard: hooks facing the back wall." },
    { label: "Tag and label placement", value: "Price tags hidden from customer-facing side. Care labels tucked into garment. No partner-supplied tags on display product.", review: true },
  ],
  misuse: [
    "Logo centred on back wall",
    "Logo on side walls or columns",
    "Crop marks removed from wordmark",
    "Logo applied as decal on glass",
    "Logo paired with partner co-branding inside the frame",
  ],
};

export const FIXTURES = {
  intro: "Approved fixtures and how they combine. This section is the working reference for shopfitters and project owners during layout and ordering.",
  approved: [
    { code: "105-01-001-20", name: "Wall unit – L-Beam Sidehang 1400", capacity: "50 hangers" },
    { code: "105-01-001-21", name: "Wall unit – Front hang", capacity: "12 hangers (display)" },
    { code: "105-06-001",    name: "Floor rack 1400",                  capacity: "50 hangers" },
    { code: "105-06-002",    name: "Floor rack 700",                   capacity: "25 hangers" },
    { code: "105-06-011",    name: "Jeans denim rack Double",          capacity: "10 hangers (folded)" },
    { code: "105-09-002/003", name: "Wooden podium (low / high)",      capacity: "Footwear, accessories, folded anchors" },
    { code: "105-13-015",    name: "Brushed steel logo 1200",          capacity: "Brand surface" },
    { code: "105-15-001",    name: "Leather tray",                     capacity: "Accessory display" },
    { code: "105-17-001",    name: "Volume table",                     capacity: "Entrance / focal anchor" },
    { code: "105-17-002",    name: "Iconic table (large / medium)",    capacity: "Entrance / focal anchor" },
    { code: "112_18_001",    name: "Long torso mannequin (M/W)",       capacity: "Outfit storytelling" },
  ],
  combinationRules: [
    "Wall unit modules connect via standard L-beams — no gap, no overlap",
    "Floor racks are placed in pairs or trios; never single in open floor",
    "Sidehang 1400 and 700 may share the same wall but transition at module boundary",
    "Volume table and iconic table are not used in the same room — pick one focal anchor per SIS",
    "Mannequin tubes are always stainless grit 240; no chrome or matte finishes",
  ],
  doNotCombine: [
    "Selected fixtures with partner-supplied fixtures in the same footprint",
    "Stainless and chrome finishes on the same fixture",
    "Oak and laminate edges on visible surfaces",
    "Two-level sidehangs adjacent to single-level — disrupts horizontal rhythm",
  ],
  review: true,
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
