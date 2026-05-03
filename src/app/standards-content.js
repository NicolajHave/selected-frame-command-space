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
