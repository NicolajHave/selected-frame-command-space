// Shared text guard for the pdf-lib generators.
//
// The StandardFonts (Helvetica et al.) encode WinAnsi / CP1252 only. Drawing a
// character outside that set THROWS, which takes down the whole PDF — a
// typographic minus (U+2212) pasted into a project name was enough to do it.
// Free-text fields routinely pick such characters up from Word and Excel, so
// every generator must route user-supplied text through here.
//
// € and the curly quotes/dashes are part of CP1252 and survive; anything truly
// unrepresentable (CJK, Cyrillic, emoji) is dropped so the document degrades
// instead of failing.

const CP1252_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';

export function safeText(s) {
  return String(s ?? '')
    .replace(/[−‐‑]/g, '-')
    .split('')
    .filter((ch) => {
      const c = ch.charCodeAt(0);
      return (c >= 0x20 && c <= 0xff) || CP1252_EXTRA.includes(ch);
    })
    .join('');
}
