// What the Command Space is and how its pages fit together — written for the
// assistant on the front page, in the voice it should answer in.
//
// Everything else the assistant knows (Standards, Toolbox, News) is read from
// the same files the pages render from, so it follows those automatically.
// THIS file is the one thing written by hand: when a page changes what it is
// for, or a new page arrives, give it a line here.
//
// Page ids match `navSections` in src/app/page.js. The assistant links to a
// page as [[id|Label]] and the card turns that into a button.
//
// Never put a password or an approval code in here. The assistant is told
// not to reveal them, but the surest way is for it not to know them.

export const PAGES = [
  { id: 'overview', label: 'Overview', what: 'The front page: news, upcoming deadlines and this assistant.' },
  { id: 'intake', label: 'Project Intake', what: 'Where every new project starts. The sales rep fills in the form; it produces the filecard PDF, creates the project in Current, sets up its External Folder and mails the team. This is the first step for any new shop-in-shop.' },
  { id: 'projects', label: 'Current', what: 'Every project, read from Asana — filter by region and status, open one for its details and its External Folder. A new intake appears here within about 15 minutes.' },
  { id: 'flow', label: 'Project Flow', what: 'The phase model, 0 to 10: where each active project sits from intake to completion.' },
  { id: 'footprint', label: 'Footprint', what: 'Square metres delivered and planned per fiscal year. The Selected FY runs 1 August to 31 July.' },
  { id: 'roi', label: 'ROI Engine', what: 'Decision support for a shop-in-shop investment case.' },
  { id: 'draft', label: 'Draft Studio', what: 'Conditions a supplier draft PDF to the Selected Frame standard: swaps in the correct logos and contact line, adds the zoning template and a concept information page, and can file the result into the project folder as "Draft N".' },
  { id: 'quotation', label: 'Quotation', what: 'Upload a supplier quotation PDF and it becomes a branded project quotation: cost broken into Inventory, Selected Deliveries and Specific Project Cost, the hanger calculation (with a 25% buffer on top), cost split between Selected and the partner, and a PDF that can be filed to the project folder.' },
  { id: 'opening-report', label: 'Opening Report', what: 'Filled in on opening day: pick the project, run the 16 compliance checkpoints, add photos of entrance, overview, hero wall and logo, and record who takes over the shop floor. Brand Spaces then reviews and approves; on approval the report is generated as a PDF and filed to the project folder and OneDrive.' },
  { id: 'concept-requests', label: 'Concept Requests', what: 'Where to send an addition, a change or feedback on the concept. Pick the fixture it concerns, say what problem it solves, attach a photo. It lands in a register and is mailed to the concept and inventory owners, who triage it.' },
  { id: 'toolbox', label: 'Toolbox', what: 'Partner email templates in six languages — the Final Installation Alignment and the others — ready to copy and send.' },
  { id: 'showroom-ops', label: 'Showroom Ops', what: 'Seasonal showroom production: seasons, the showroom registry, print lines and their filenames, the sales list and the shipping list. Internal to the showroom team.' },
  { id: 'standards', label: 'Standards', what: 'The Selected Frame concept itself: DNA, non-negotiables, space management, brand application, the full fixture catalogue with codes and dimensions, merchandising rules, playbooks by size, and how exceptions are handled.' },
  { id: 'external-folders', label: 'External Folders', what: 'One file workspace per project — brief, floorplans, quotation, supplier files, installation, photos, handover. Opens with the shared team password.' },
  { id: 'admin', label: 'Admin', what: 'System health.' },
];

export const PROCESS = `
How a project runs, start to finish:

1. A sales rep starts it in [[intake|Project Intake]]. That is always the first step. The form asks for the partner, location, region, desired opening date, the space and its setup, contacts and any drawings. Submitting it creates the filecard, the project in Current and the External Folder in one go.
2. The project appears in [[projects|Current]] and moves through the phases shown in [[flow|Project Flow]].
3. Drawings and supplier drafts go through [[draft|Draft Studio]] before they are shared with the partner, so they carry the right logos, contact line and the concept information page.
4. The supplier's quotation goes through [[quotation|Quotation]] to become the partner-facing quotation, with the hanger calculation and the cost split.
5. Before installation, the partner receives the Final Installation Alignment from [[toolbox|Toolbox]], which confirms site readiness: cleared space, walls painted in the concept colour, flooring, electrics to the plan, power, internet for screens, permissions.
6. On opening day the rep fills in the [[opening-report|Opening Report]]; Brand Spaces approves it.
7. Delivered square metres show up in [[footprint|Footprint]] for the fiscal year.

Anything about the concept itself — what is allowed, which fixtures exist, dimensions, hanger counts, wall colour, zoning, what to do when a site does not fit — is in [[standards|Standards]].
Ideas, changes and problems with the concept go to [[concept-requests|Concept Requests]].
`;
