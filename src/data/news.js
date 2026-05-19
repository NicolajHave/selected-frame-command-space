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
 * @property {string} mediaSrc      Path under /public, e.g. "/news/engelhorn-opening.mp4".
 * @property {string} [poster]      Optional poster image for videos (shown before play / as fallback).
 * @property {string} [link]        Optional internal page id (e.g. "draft") or external URL.
 */

/** @type {NewsItem[]} */
export const NEWS = [
  {
    title: "Selected Frame opening — Engelhorn",
    date: "2026-05-15",
    category: "Opening",
    description:
      "A new Selected Frame installation is now live at Engelhorn. The space brings the concept to life through a strong brand presence, clear product hierarchy and a refined Scandinavian expression.",
    mediaType: "video",
    mediaSrc: "/news/engelhorn-opening.mp4",
    poster: "/images/kh_selected_sis_075_web.jpg",
  },
  {
    title: "Standards page updated and complete",
    date: "2026-05-19",
    category: "Guideline update",
    description:
      "The Selected Frame Standards page has been updated and completed with clearer concept guidelines, space management rules and brand application logic.",
    mediaType: "image",
    mediaSrc: "/images/kh_selected_sis_048_web.jpg",
    link: "standards",
  },
  {
    title: "Magasin Lyngby — installation complete",
    date: "2026-04-09",
    category: "Installation",
    description:
      "Soft Shop Solution opened on the womens floor in Magasin, Lyngby. 25 sqm.",
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
];
