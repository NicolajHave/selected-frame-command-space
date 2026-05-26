// Toolbox templates for the Command Space.
//
// V1: edit this file directly. Each template carries one or more language
// variants, each with a subject and body. Placeholders use [SQUARE BRACKETS]
// so they are easy to spot and replace in Outlook after copying.
//
// To add a template: append an object to TEMPLATES with a unique id and at
// least an `en` language variant. New categories can be added to CATEGORIES.

/**
 * @typedef {Object} LangVariant
 * @property {string} subject
 * @property {string} body
 *
 * @typedef {Object} Template
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} category            One of CATEGORIES[].id
 * @property {Object.<string, LangVariant>} languages  Keyed by language code ("en", "da").
 */

/** Category tabs. `count` is derived at render time, not stored here. */
export const CATEGORIES = [
  { id: "partner-emails", label: "Partner Emails" },
  { id: "briefing-support", label: "Briefing Support" },
  { id: "project-handover", label: "Project Handover" },
  { id: "follow-up", label: "Follow-up" },
  { id: "internal-notes", label: "Internal Notes" },
];

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "da", label: "Dansk" },
];

/** @type {Template[]} */
export const TEMPLATES = [
  {
    id: "project-briefing-request",
    title: "Project Briefing Request",
    description:
      "Email template for collecting the necessary project information before a Selected Frame filecard can be completed.",
    category: "partner-emails",
    languages: {
      en: {
        subject: "Selected Frame — Project Briefing: [PROJECT NAME]",
        body: `Hi [Contact Name],

I hope you're doing well.

We're excited to move forward with a new Selected Frame setup at [Store Name], and to get started we need a few key details from your end.

Please find the attached briefing form. It covers:

• Location & space details
• Your main contact information
• Area dimensions & setup conditions
• Logistics & delivery access
• Installation practicalities

Could you fill it in and return it — along with a floorplan in DWG format and photos of the dedicated shop floor — by [DATE]?

Please note that the floorplan is required before we can initiate the project, so the sooner we have it, the better.

If anything is unclear or you'd like to go through it together on a call, just let me know — happy to help.

Looking forward to working on this with you.

Best regards,`,
      },
      da: {
        subject: "Selected Frame — Projektbriefing: [PROJEKTNAVN]",
        body: `Hej [Kontaktnavn],

Vi glæder os til at komme i gang med et nyt Selected Frame-setup i [Butiksnavn], og for at vi kan gå videre har vi brug for nogle oplysninger fra jer.

Vedhæftet finder du vores briefingformular. Den dækker:

• Placering og rumforhold
• Kontaktoplysninger
• Arealets dimensioner og opsætningsforhold
• Logistik og leveringsadgang
• Praktiske installationsforhold

Kan du udfylde den og returnere den — vedlagt en plantegning i DWG-format samt billeder af det dedikerede shopareal — senest [DATO]?

Bemærk venligst, at plantegningen er påkrævet, før vi kan igangsætte projektet, så jo hurtigere vi modtager den, jo bedre.

Hvis noget er uklart, eller du hellere vil gennemgå det over et opkald, er du meget velkommen til at skrive — jeg hjælper gerne.

Ser frem til samarbejdet.

Med venlig hilsen,`,
      },
    },
  },
  {
    id: "one-month-prior-installation-alignment",
    title: "One-Month Prior Installation Alignment",
    description:
      "Email template for final practical alignment with the partner approximately one month before Selected Frame delivery and installation.",
    category: "partner-emails",
    languages: {
      en: {
        subject: "Selected Frame — Final Installation Alignment: [Store / City]",
        body: `Dear [Partner Name],

We are now approaching the delivery and installation of the SELECTED Frame setup in [Store / City].

As we are now approximately one month prior to installation, we would like to make a final alignment to ensure that everything is ready on site and that we have all practical details confirmed.

Please find attached the final floorplan for reference.

1. Key Project Dates

Mounting / installation date: [Date]
Estimated delivery time: [Time]
Estimated installation duration: [Duration / see attached installation plan]
Merchandising date: [Date]
Opening date: [Date]

Please confirm that the above dates are aligned with your internal planning.

2. Delivery & Installation Details

The installation will include:

• Delivery of SELECTED Frame furniture and fixtures
• Assembly and installation of the shopfit elements
• Installation of rails, racks and related fixtures
• Final merchandising and styling according to SELECTED guidelines

Number of installers on site: [Number of people]
Additional SELECTED / partner team members on site: [Names / roles if relevant]

Please ensure that access is granted upon arrival and that the installation area is available from the agreed time.

3. Site Readiness Requirements

To ensure a smooth installation, we kindly ask you to confirm that the following will be completed prior to our arrival:

• The space is fully cleared of existing fixtures, stock and materials
• Walls are finished and painted according to the agreed colour specification
• Flooring is completed and protected if required
• Electrical work is completed according to the approved plan
• Power outlets are installed, tested and ready for use
• Internet access is available for digital screens, if applicable
• Any required permissions, access approvals or mall/store regulations have been handled internally

If any of the above is not finalised, or if there is anything we need to be aware of, please inform us as soon as possible.

4. Access & Logistics

Please confirm the following practical details:

• Delivery address: [Address]
• Preferred unloading point: [Loading zone / shop entrance / goods reception]
• Earliest possible unloading time: [Time]
• Any specific access requirements or time restrictions
• Whether a pallet lifter or unloading equipment is available on site
• Elevator access and maximum load capacity, if applicable
• Parking arrangements for the installation team
• Security clearance or check-in procedure, if required

5. Digital Screens

If digital screens are included in the setup, please confirm:

• Power supply is available at the agreed screen position
• WiFi or LAN access is available
• Network access can be provided during installation
• Any local IT restrictions or approval processes are clarified in advance

Our screen content is managed centrally by SELECTED HQ. Once connected, no daily manual operation should be required.

6. Conditions & On-site Responsibilities

To avoid any misunderstandings, please note the following conditions:

• The installation area must be ready and accessible at the agreed time
• Any delays caused by unfinished site preparation may affect the installation timeline
• Any additional on-site work not included in the agreed scope must be aligned separately
• Local requirements, restrictions or changes must be communicated before installation

Please also confirm whether:

• Professional cleaning is scheduled after installation
• Waste disposal is handled locally, or whether our team should remove packaging
• There are any local rules regarding noise, working hours or after-hours installation

7. Sign-off

Please confirm who will be responsible for signing off the completed installation on site:

Name: [Name]
Role: [Role]
Phone: [Phone]
Email: [Email]

8. Guidelines & Training Material

For reference, please find the relevant links below:

VM Guiding Principles: [Insert link]
Sales Training Material: [Insert link]

These materials should be shared with the relevant local store team before opening to ensure a strong and consistent launch.

If there are any deviations, uncertainties or open questions, it is important that we address them in advance.

Please confirm the above details at your earliest convenience, so we can move forward with a fully aligned installation plan.

We look forward to a successful installation and opening.

Best regards,
Nicolaj`,
      },
    },
  },
];
