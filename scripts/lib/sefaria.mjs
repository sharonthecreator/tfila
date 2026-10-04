// Helpers for reading Sefaria export JSON and resolving references into clean segments.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BOOKS } from '../../content/books.mjs';

const CACHE = new URL('../../.cache/sefaria/', import.meta.url).pathname;
const loaded = new Map();

export function loadVersion(bookKey, version) {
  const id = bookKey + '|' + version;
  if (!loaded.has(id)) {
    const file = join(CACHE, bookKey, encodeURIComponent(version.trim() || 'v') + '.json');
    loaded.set(id, JSON.parse(readFileSync(file, 'utf8')));
  }
  return loaded.get(id);
}

// Walk the schema to find the Hebrew titles along a path (for display).
function schemaTitles(schema, path) {
  const titles = [];
  let node = schema;
  for (const key of path) {
    const next = (node.nodes || []).find((n) => (n.enTitle || n.key) === key || (n.default && key === '<default>'));
    if (!next) return null;
    const he = (next.titles || []).find((t) => t.lang === 'he' && t.primary)?.text || next.heTitle || '';
    titles.push(he.trim());
    node = next;
  }
  return titles;
}

function getAt(text, path) {
  let cur = text;
  for (const key of path) {
    if (cur == null) return undefined;
    if (Array.isArray(cur)) cur = cur[Number(key)];
    else cur = key === '<default>' ? (cur.default ?? cur['']) : cur[key];
  }
  return cur;
}

// Flatten nested arrays/objects (in schema order when possible) into a list of strings.
export function flatten(node, schemaNode) {
  const out = [];
  const rec = (t, s) => {
    if (typeof t === 'string') { out.push(t); return; }
    if (Array.isArray(t)) { t.forEach((x) => rec(x, null)); return; }
    if (t && typeof t === 'object') {
      if (s && s.nodes) {
        for (const n of s.nodes) {
          const k = n.default ? (t.default !== undefined ? 'default' : '') : (n.enTitle || n.key);
          if (t[k] !== undefined) rec(t[k], n);
        }
      } else Object.values(t).forEach((x) => rec(x, null));
    }
  };
  rec(node, schemaNode);
  return out;
}

function schemaAt(schema, path) {
  let node = schema;
  for (const key of path) {
    if (!node || !node.nodes) return null;
    node = node.nodes.find((n) => (n.enTitle || n.key) === key || (n.default && key === '<default>'));
  }
  return node;
}

// ---- Sanitizing ------------------------------------------------------------
// Keep only a tiny, safe subset of markup: <b>, <small> (rubrics / instructions),
// <big> (headings) and line breaks. Everything else is stripped to plain text.
export function sanitize(html) {
  let s = String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<(\/?)(b|strong)(\s[^>]*)?>/gi, '<$1b>')
    .replace(/<(\/?)(small)(\s[^>]*)?>/gi, '<$1small>')
    .replace(/<(\/?)(big)(\s[^>]*)?>/gi, '<$1big>')
    .replace(/<(?!\/?(b|small|big)>)[^>]*>/gi, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();
  // collapse nested <small><small>
  s = s.replace(/<small>\s*<small>/g, '<small>').replace(/<\/small>\s*<\/small>/g, '</small>');
  // balance tags
  for (const tag of ['b', 'small', 'big']) {
    const open = (s.match(new RegExp(`<${tag}>`, 'g')) || []).length;
    const close = (s.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    if (open > close) s += `</${tag}>`.repeat(open - close);
    if (close > open) s = `<${tag}>`.repeat(close - open) + s;
  }
  return s;
}

export const NIKUD_RE = /[֑-ׇ]/g;
export function plain(s) {
  return String(s).replace(/<[^>]+>/g, '').replace(/־/g, ' ').replace(NIKUD_RE, '');
}

// Resolve a reference:
//   { book, path: [...], version?, from?, to?, start?: 'regex', end?: 'regex', count? }
// `start`/`end` are regexes tested against nikud-free plain text of each segment.
export function resolveRef(ref) {
  const book = BOOKS[ref.book];
  if (!book) throw new Error('Unknown book ' + ref.book);
  const versions = ref.version ? [ref.version] : book.versions;
  for (const v of versions) {
    const data = loadVersion(ref.book, v);
    const node = getAt(data.text, ref.path);
    if (node === undefined) continue;
    let segs = flatten(node, schemaAt(data.schema, ref.path)).map(sanitize).filter((x) => plain(x).trim());
    if (!segs.length) continue;
    const total = segs.length;
    let a = 0, b = segs.length;
    if (ref.from != null) a = ref.from;
    if (ref.to != null) b = ref.to;
    if (ref.start) {
      const re = new RegExp(ref.start);
      const i = segs.findIndex((x, idx) => idx >= a && re.test(plain(x)));
      if (i < 0) throw new Error(`start /${ref.start}/ not found in ${ref.book} ${ref.path.join(' / ')} (${v})`);
      a = i;
    }
    if (ref.end) {
      const re = new RegExp(ref.end);
      const i = segs.findIndex((x, idx) => idx > a && re.test(plain(x)));
      if (i < 0) throw new Error(`end /${ref.end}/ not found in ${ref.book} ${ref.path.join(' / ')} (${v})`);
      b = ref.endInclusive ? i + 1 : i;
    }
    if (ref.count != null) b = Math.min(b, a + ref.count);
    segs = segs.slice(a, b);
    if (!segs.length) continue;
    return {
      segments: segs,
      partial: a > 0 || b < total,
      book: ref.book,
      bookTitle: book.title,
      bookHeTitle: book.heTitle,
      sectionHe: (schemaTitles(data.schema, ref.path.filter((p) => !/^\d+$/.test(p))) || []).join(' › '),
      path: ref.path,
      versionTitle: (data.versionTitle || v).trim(),
      versionTitleHe: data.versionTitleInHebrew || null,
      license: data.license || 'unknown',
      versionSource: data.versionSource || null,
      sefariaUrl:
        'https://www.sefaria.org/' +
        encodeURIComponent(
          [book.title, ...ref.path.filter((p) => p !== '<default>' && !/^\d+$/.test(p))].join(', ').replace(/ /g, '_'),
        ).replace(/%2C/g, ',') +
        '?lang=he',
    };
  }
  throw new Error(`No text for ${ref.book} ${ref.path.join(' / ')}`);
}
