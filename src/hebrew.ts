// Hebrew text utilities: nikud / cantillation stripping and search normalization.
const MARKS = /[֑-ׇ]/g;
const VOWELS_ONLY = /[֑-ֽֿׁׂׄ-ׇ]/g; // keeps maqaf and sof pasuq
const FINALS: Record<string, string> = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };

export const stripMarks = (s: string): string => String(s).replace(/־/g, ' ').replace(MARKS, '');

/** Normalize for matching: no marks, no punctuation, final letters folded, single spaces. */
export function normalize(s: string): string {
  return stripMarks(s)
    .replace(/[ךםןףץ]/g, (c) => FINALS[c])
    .replace(/[^א-תa-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export const foldFinals = (s: string): string => s.replace(/[ךםןףץ]/g, (c) => FINALS[c]);

/** Remove nikud and te'amim but keep markup (the reader's "without vowels" mode). */
export const stripVowelsKeepTags = (html: string): string => String(html).replace(VOWELS_ONLY, '');

export const escapeHtml = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const fmt = (n: number): string => n.toLocaleString('en-US');
