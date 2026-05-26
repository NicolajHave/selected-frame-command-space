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
];
