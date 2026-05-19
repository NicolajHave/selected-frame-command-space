// News content for the Command Space overview page.
//
// V1: edit this file directly. The shape is intentionally flat and
// upgrade-friendly — when news moves to Vercel Blob, a CMS or an admin
// publishing UI, the consumer code on the overview page should not need
// to change. Order newest-first; the first item is rendered as the
// featured card.

/**
 * @typedef {Object} NewsItem
 * @property {string} title
 * @property {string} date          ISO date (YYYY-MM-DD).
 * @property {string} category      e.g. "Opening", "Installation", "Concept update", "Tool update", "Guideline update", "Partner case".
 * @property {string} description   1–2 sentences.
 * @property {"image" | "video"} mediaType
 * @property {string} mediaSrc      Path under /public, e.g. "/news/stockmann-helsinki-opening.mp4".
 * @property {string} [poster]      Optional poster image for videos.
 * @property {string} [link]        Optional internal page id (e.g. "projects") or external URL.
 */

/** @type {NewsItem[]} */
export const NEWS = [
  {
    title: "Selected Frame opening — Stockmann Helsinki",
    date: "2026-04-23",
    category: "Opening",
    description:
      "A short opening update from the new Selected Frame installation at Stockmann Helsinki. Full Frame format, hero wall with corona light logo.",
    mediaType: "video",
    mediaSrc: "/news/stockmann-helsinki-opening.mp4",
    poster: "/images/kh_selected_sis_075_web.jpg",
  },
  {
    title: "Magasin Lyngby — installation complete",
    date: "2026-04-09",
    category: "Installation",
    description:
      "Standard SIS handed over to the partner. First-impression sightlines and zoning meet the Selected Frame brief.",
    mediaType: "image",
    mediaSrc: "/images/kh_selected_sis_032_web.jpg",
  },
  {
    title: "Draft Studio is live in the Command Space",
    date: "2026-04-02",
    category: "Tool update",
    description:
      "Condition supplier PDFs to the Selected Frame standard directly in the app — replaces the local Python workflow.",
    mediaType: "image",
    mediaSrc: "/images/kh_selected_sis_023_web.jpg",
    link: "draft",
  },
  {
    title: "Merchandising guidelines refreshed",
    date: "2026-03-21",
    category: "Guideline update",
    description:
      "Section 06 reframed around concept protection: density, outfit-led presentation, rhythm and hierarchy.",
    mediaType: "image",
    mediaSrc: "/images/kh_selected_sis_048_web.jpg",
    link: "standards",
  },
];
