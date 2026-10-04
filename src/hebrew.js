// Hebrew text utilities: nikud / cantillation stripping and search normalization.
const MARKS = /[֑-ׇ]/g; // te'amim + nikud + meteg, rafe, etc.
const FINALS = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };

export function stripMarks(s) {
  return String(s).replace(/־/g, ' ').replace(MARKS, '');
}

/** Normalize for matching: no marks, no punctuation, final letters folded, single spaces. */
export function normalize(s) {
  return stripMarks(s)
    .replace(/[ךםןףץ]/g, (c) => FINALS[c])
    .replace(/[^א-תa-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Remove nikud but keep markup (used by the reader's "without vowels" mode). */
const VOWELS_ONLY = /[֑-ֽֿׁׂׄ-ׇ]/g; // keeps maqaf and sof pasuq
export function stripMarksKeepTags(html) {
  return String(html).replace(VOWELS_ONLY, '');
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Hebrew ordinal-ish number formatting for small counts. */
export const heNum = (n) => String(n);
