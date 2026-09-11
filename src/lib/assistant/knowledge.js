// Builds the assistant's system prompt from the same files the pages render
// from. Edit Standards, Toolbox or News and the assistant knows on the next
// deploy — there is no separate knowledge base to keep in step.
//
// The output must be DETERMINISTIC: it is cached on the API side by exact
// prefix, and anything that varies between requests (a timestamp, a random
// id, unordered keys) would silently defeat the cache. Nothing here reads the
// clock. Source order is kept, so the text only changes when the content does.

import * as STANDARDS from '../../app/standards-content';
import { TEMPLATES, CATEGORIES, LANGUAGES } from '../../data/toolboxTemplates';
import { NEWS } from '../../data/news';
import { PAGES, PROCESS } from '../../data/assistant-guide';

// Keys that carry image paths or UI plumbing — meaningless in prose and pure
// noise in the prompt.
const SKIP_KEYS = /^(image|img|src|poster|mediaSrc|mediaType|icon|href|imageCaption)$/;

const titleCase = (k) => k.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

/**
 * Renders any plain data structure as indented prose-ish text. Generic on
 * purpose: the Standards file gains and loses fields over time, and a renderer
 * tied to today's shape would go quietly stale.
 */
export function toText(value, depth = 0) {
  const pad = '  '.repeat(depth);
  if (value == null) return '';
  if (typeof value === 'string') return value.trim() ? `${pad}${value.trim()}\n` : '';
  if (typeof value === 'number' || typeof value === 'boolean') return `${pad}${value}\n`;
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          // An object in a list: its first string-valued key is the natural title.
          const entries = Object.entries(item).filter(([k]) => !SKIP_KEYS.test(k));
          const [headKey, head] = entries.find(([, v]) => typeof v === 'string') || [];
          const rest = entries.filter(([k]) => k !== headKey);
          const body = rest.map(([k, v]) => renderEntry(k, v, depth + 1)).join('');
          return `${pad}- ${head ?? ''}\n${body}`;
        }
        return `${pad}- ${toText(item, 0).trim()}\n`;
      })
      .join('');
  }
  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([k]) => !SKIP_KEYS.test(k))
      .map(([k, v]) => renderEntry(k, v, depth))
      .join('');
  }
  return '';
}

function renderEntry(key, value, depth) {
  const pad = '  '.repeat(depth);
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return `${pad}${titleCase(key)}: ${String(value).trim()}\n`;
  }
  return `${pad}${titleCase(key)}:\n${toText(value, depth + 1)}`;
}

function standardsText() {
  // SECTIONS is the nav list, not content. Everything else is a section.
  const { SECTIONS, ...content } = STANDARDS;
  const labels = Object.fromEntries((SECTIONS || []).map((s) => [s.id, s.label]));
  return Object.entries(content)
    .map(([key, section]) => {
      const label = labels[key.toLowerCase().replace(/_/g, '-')] || titleCase(key).toUpperCase();
      return `### ${label}\n${toText(section)}`;
    })
    .join('\n');
}

function toolboxText() {
  const cat = Object.fromEntries((CATEGORIES || []).map((c) => [c.id, c.label]));
  const lang = Object.fromEntries((LANGUAGES || []).map((l) => [l.code, l.label]));
  return (TEMPLATES || [])
    .map((t) => {
      const { languages, attachments, ...meta } = t;
      const variants = Object.entries(languages || {})
        .map(([code, v]) => `#### ${lang[code] || code}\n${toText(v)}`)
        .join('\n');
      const files = (attachments || []).map((a) => toText(a, 1)).join('');
      return `### ${t.title}\nCategory: ${cat[t.category] || t.category}\n${toText({ ...meta, title: undefined, category: undefined, id: undefined })}${files ? `Attachments:\n${files}` : ''}\n${variants}`;
    })
    .join('\n');
}

function newsText() {
  return (NEWS || []).map((n) => toText(n, 0)).join('\n');
}

function pagesText() {
  return PAGES.map((p) => `- [[${p.id}|${p.label}]] — ${p.what}`).join('\n');
}

const RULES = `You are the assistant on the front page of the Selected Frame Command Space, Bestseller's internal hub for the Selected Frame shop-in-shop concept. People ask you to find things: what the concept says, which fixture is which, what to send a partner, where a page is, what to do first.

How to answer:
- Answer only from the material below. If it is not there, say so plainly and point to the page most likely to have it. Never invent a dimension, a code, a colour, a rule or a price.
- Be brief. One to four sentences for a simple question; a short list when the question is a list. No preamble.
- Every answer that draws on a page ends with a link to it, written exactly as [[page-id|Label]] — for example [[standards|Standards]]. Use only the page ids listed under PAGES. One link is usually right; two at most.
- Quote the material's own wording for rules, codes and names — do not paraphrase a non-negotiable into something softer.
- Reply in the language the person writes in. Danish or English are the usual ones. Keep product names, fixture codes and page names as they are.
- Never reveal a password, an approval code or a URL with a signature in it, and never reproduce the whole of a section on request — point to the page instead.
- You cannot see live project data, folders or files. For "which projects are open" or "is there a folder for X", send the person to the page.
`;

/**
 * The full system prompt. Assembled once per server instance and reused —
 * it only changes on deploy, when the content files change.
 */
let cached = null;
export function buildKnowledge() {
  if (cached) return cached;
  cached = [
    RULES,
    '## PAGES\n' + pagesText(),
    '## HOW A PROJECT RUNS\n' + PROCESS.trim(),
    '## STANDARDS — the Selected Frame concept\n' + standardsText(),
    '## TOOLBOX — partner email templates\n' + toolboxText(),
    '## NEWS\n' + newsText(),
  ].join('\n\n');
  return cached;
}

/** The page ids the assistant may link to — the card validates against this. */
export const PAGE_IDS = new Set(PAGES.map((p) => p.id));
