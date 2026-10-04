// Builds public/data/* from content/*.mjs + the cached Sefaria export files.
//   node scripts/fetch-sources.mjs   (once, downloads sources into .cache/)
//   node scripts/build-content.mjs
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { REGIONS, NODES } from '../content/catalog.mjs';
import { ROUTES } from '../content/routes.mjs';
import { NUSACHIM, NUSACH_IDS } from '../content/nusachim.mjs';
import { BOOKS } from '../content/books.mjs';
import { resolveRef, plain } from './lib/sefaria.mjs';

const OUT = new URL('../public/data/', import.meta.url).pathname;
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 't'), { recursive: true });

const errors = [];
const warnings = [];
const texts = new Map(); // hash -> payload
const LIVE = ['em', 'ash', 'sef', 'chabad']; // nusachim with direct liturgical editions

const LICENSE_HE = {
  'Public Domain': 'נחלת הכלל',
  CC0: 'CC0 — ללא זכויות שמורות',
  'CC-BY': 'CC-BY — שימוש חופשי בציון ייחוס',
  'CC-BY-SA': 'CC-BY-SA — ייחוס ושיתוף זהה',
  'CC-BY-NC': 'CC-BY-NC — ייחוס, לא מסחרי',
  unknown: 'רישיון לא צוין בספריא',
};

const asList = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);

function resolveTextId(refs, context) {
  refs = asList(refs);
  if (!refs.length) return null;
  const key = JSON.stringify(refs);
  const hash = createHash('sha1').update(key).digest('hex').slice(0, 12);
  if (texts.has(hash)) return hash;
  const parts = [];
  for (const ref of refs) {
    try {
      const r = resolveRef(ref);
      const excerpt = ref.count != null || ref.excerpt === true;
      parts.push({
        segments: r.segments,
        excerpt,
        bookHe: r.bookHeTitle,
        book: r.bookTitle,
        section: r.sectionHe,
        version: r.versionTitle,
        versionHe: r.versionTitleHe,
        license: r.license,
        licenseHe: LICENSE_HE[r.license] || r.license,
        versionSource: r.versionSource,
        sefaria: r.sefariaUrl,
      });
    } catch (e) {
      errors.push(`${context}: ${e.message}`);
    }
  }
  if (!parts.length) return null;
  const words = parts.reduce((n, p) => n + p.segments.reduce((m, s) => m + plain(s).split(/\s+/).filter(Boolean).length, 0), 0);
  texts.set(hash, { id: hash, parts, words, excerpt: parts.some((p) => p.excerpt) });
  return hash;
}

function textSummary(hash) {
  if (!hash) return null;
  const t = texts.get(hash);
  return { id: hash, words: t.words, excerpt: t.excerpt, src: [...new Set(t.parts.map((p) => p.bookHe))].join(' · ') };
}

// ---------- layout ----------
const deg = Math.PI / 180;
function offsetLatLon(lat, lon, bearingDeg, distDeg) {
  const φ1 = lat * deg, λ1 = lon * deg, θ = bearingDeg * deg, δ = distDeg * deg;
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return [φ2 / deg, ((λ2 / deg + 540) % 360) - 180];
}

const nodeById = new Map(NODES.map((n) => [n.id, n]));
const layout = new Map();
for (const region of REGIONS) {
  const members = NODES.filter((n) => n.region === region.id);
  // order: keep authoring order but pull important nodes toward the center
  const ordered = [...members].sort((a, b) => (b.imp || 1) - (a.imp || 1));
  const spacing = members.length > 14 ? 5.6 : 6.2;
  ordered.forEach((n, i) => {
    const dist = i === 0 ? 0 : spacing * Math.sqrt(i + 0.15);
    const bearing = i * 137.508 + 20;
    layout.set(n.id, offsetLatLon(region.lat, region.lon, bearing, dist));
  });
}

// ---------- nodes ----------
const outNodes = [];
for (const n of NODES) {
  if (!REGIONS.find((r) => r.id === n.region)) errors.push(`node ${n.id}: unknown region ${n.region}`);
  const texts = {};
  for (const ns of LIVE) {
    const id = n.t && n.t[ns] ? resolveTextId(n.t[ns], `${n.id}/${ns}`) : null;
    texts[ns] = id ? { status: textsMap(id).excerpt ? 'excerpt' : 'full', ...textSummary(id) } : { status: 'unavailable' };
  }
  // Kabbalah lens: Edot HaMizrach text, labelled as such, plus Sha'ar HaKavanot layer
  const kav = n.kav ? resolveTextId(n.kav, `${n.id}/kav`) : null;
  const kab = n.kab ? resolveTextId(n.kab, `${n.id}/kab`) : null;
  texts.kabbalah = texts.em.status === 'unavailable'
    ? { status: kav || kab ? 'lens-only' : 'unavailable' }
    : { ...texts.em, status: 'lens', base: 'em' };
  if (kav) texts.kabbalah.kav = textSummary(kav);
  if (kab) texts.kabbalah.extra = { ...textSummary(kab), label: 'ברכת המזון בנוסח האר״י (גרסה נפרדת בספריא)' };
  const rmb = n.rmb ? resolveTextId(n.rmb, `${n.id}/rmb`) : null;
  texts.baladi = rmb ? { status: 'historical', ...textSummary(rmb) } : { status: 'unavailable' };
  texts.shami = { status: 'unavailable' };
  const gen = n.gen ? resolveTextId(n.gen, `${n.id}/gen`) : null;

  for (const [type, target] of n.rel || []) if (!nodeById.has(target)) errors.push(`node ${n.id}: rel to unknown ${target}`);
  const hasAny = Object.values(texts).some((t) => t.id || t.kav) || gen;
  const [lat, lon] = layout.get(n.id);
  outNodes.push({
    id: n.id, region: n.region, title: n.title, k: n.k || 'core', imp: n.imp || 1,
    d: n.d, w: n.w, v: n.v || null, tags: n.tags || [],
    lat: +lat.toFixed(3), lon: +lon.toFixed(3),
    texts, gen: gen ? textSummary(gen) : null,
    explanationOnly: !hasAny,
    rel: (n.rel || []).map(([type, target, note]) => ({ type, target, note: note || null })),
  });
}
function textsMap(id) { return texts.get(id); }

// ---------- routes ----------
const outRoutes = [];
for (const r of ROUTES) {
  const counts = {};
  const stops = r.stops.map((s, i) => {
    if (!nodeById.has(s.n)) errors.push(`route ${r.id} stop ${i}: unknown node ${s.n}`);
    counts[s.n] = (counts[s.n] || 0) + 1;
    const t = {};
    if (s.t) {
      for (const [ns, ref] of Object.entries(s.t)) {
        const id = resolveTextId(ref, `${r.id}#${i}/${ns}`);
        if (id) t[ns] = { status: texts.get(id).excerpt ? 'excerpt' : 'full', ...textSummary(id) };
      }
      if (t.em) t.kabbalah = { ...t.em, status: 'lens', base: 'em' };
    }
    return {
      n: s.n, sec: s.sec || null, note: s.note || null, cond: s.cond || null,
      only: s.only || null, omit: !!s.omit, occ: counts[s.n], t: Object.keys(t).length ? t : null,
    };
  });
  for (const s of stops) s.occTotal = counts[s.n];
  outRoutes.push({ id: r.id, group: r.group, title: r.title, featured: !!r.featured, d: r.d, stops });
}

// ---------- text files, previews, search ----------
for (const [hash, payload] of texts) writeFileSync(join(OUT, 't', hash + '.json'), JSON.stringify(payload));

function previewWords(hash, max = 90) {
  const t = texts.get(hash);
  const words = [];
  for (const p of t.parts) for (const s of p.segments) {
    // drop rubrics (<small>…</small>) from the globe preview, keep the prayer words
    const clean = s.replace(/<small>[\s\S]*?<\/small>/g, ' ').replace(/<[^>]+>/g, ' ');
    for (const w of clean.split(/\s+/)) if (w && /[א-ת]/.test(w)) { words.push(w); if (words.length >= max) return words.join(' '); }
  }
  return words.join(' ');
}
const normalize = (s) => plain(s).replace(/[^א-ת\s]/g, ' ').replace(/\s+/g, ' ').trim();

const previews = {};
const search = {};
for (const ns of NUSACH_IDS) { previews[ns] = {}; search[ns] = []; }
for (const n of outNodes) {
  for (const ns of NUSACH_IDS) {
    const id = n.texts[ns]?.id || (ns === 'kabbalah' ? n.texts.kabbalah?.kav?.id : null);
    if (id) previews[ns][n.id] = previewWords(id);
    if (id) {
      const full = texts.get(id).parts.flatMap((p) => p.segments).map(normalize).join(' ');
      search[ns].push({ n: n.id, x: full });
    }
  }
}
for (const ns of NUSACH_IDS) {
  writeFileSync(join(OUT, `preview-${ns}.json`), JSON.stringify(previews[ns]));
  writeFileSync(join(OUT, `search-${ns}.json`), JSON.stringify(search[ns]));
}

const books = Object.fromEntries(Object.entries(BOOKS).map(([k, b]) => [k, { title: b.title, heTitle: b.heTitle }]));
const world = {
  generated: new Date().toISOString().slice(0, 10),
  regions: REGIONS, nusachim: NUSACHIM, nodes: outNodes, routes: outRoutes, books,
};
writeFileSync(join(OUT, 'world.json'), JSON.stringify(world));

// ---------- report ----------
const stat = {};
for (const ns of NUSACH_IDS) {
  stat[ns] = {};
  for (const n of outNodes) { const s = n.texts[ns].status; stat[ns][s] = (stat[ns][s] || 0) + 1; }
}
console.log('nodes', outNodes.length, 'routes', outRoutes.length, 'texts', texts.size);
console.table(stat);
if (warnings.length) console.warn(warnings.join('\n'));
if (errors.length) { console.error('\nERRORS:\n' + errors.join('\n')); process.exitCode = 1; }
