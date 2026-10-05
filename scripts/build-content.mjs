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
import { WORLDS, PLACEMENT, ARI, ARI_NOTE, SECTOR_ORDER, LADDER, LADDER_SOURCES } from '../content/ladder.mjs';
import { KADDISH_FORM, kaddishForm } from '../content/kaddish.mjs';
// routes whose services are weekday services (the only ones Chabad's open edition covers)
const HOLY_ROUTES = new Set(['shabbat', 'rosh-hashana', 'yom-kippur', 'sukkot', 'pesach-seder']);
const nodeChabadBook = (id) => { const n = outNodes.find((x) => x.id === id); const tid = n?.texts.chabad?.id; return tid ? texts.get(tid).parts[0].book : null; };
const WEEKDAY_ROUTES = new Set(['boker', 'shacharit', 'mincha', 'arvit', 'yom-chol', 'brit-mila', 'kabbalah-night', 'avelut']);
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
  // url: a direct link to the passage at its source (Sefaria), for the one-click "מקור" links in the panels
  return { id: hash, words: t.words, excerpt: t.excerpt, src: [...new Set(t.parts.map((p) => p.bookHe))].join(' · '), url: t.parts[0].sefaria };
}

// ---------- layout: Jacob's ladder ----------
// One turn of the helix per world (עשיה → אצילות, bottom to top); every region owns a 30° sector of each turn.
// Inside a (world, region) cell the prayers stand on consecutive rungs in the order they are said.
const nodeById = new Map(NODES.map((n) => [n.id, n]));
const layout = new Map();
const WORLD_IDS = WORLDS.map((w) => w.id);
const chronoRank = new Map();
for (const r of ROUTES) for (const st of r.stops) if (!chronoRank.has(st.n)) chronoRank.set(st.n, chronoRank.size);
for (const n of NODES) {
  if (!PLACEMENT[n.id]) errors.push(`ladder: node ${n.id} has no world placement`);
}
for (const id of Object.keys(PLACEMENT)) if (!nodeById.has(id)) errors.push(`ladder: placement for unknown node ${id}`);
for (const region of REGIONS) if (!SECTOR_ORDER.includes(region.id)) errors.push(`ladder: region ${region.id} has no sector`);
for (const [s, regionId] of SECTOR_ORDER.entries()) {
  for (const [w, worldId] of WORLD_IDS.entries()) {
    const cell = NODES.filter((n) => n.region === regionId && PLACEMENT[n.id] === worldId)
      .sort((a, b) => (chronoRank.get(a.id) ?? 999) - (chronoRank.get(b.id) ?? 999));
    const n = cell.length;
    const rows = n <= 3 ? 1 : n <= 7 ? 2 : 3;
    const mid = (LADDER.rIn + LADDER.rOut) / 2;
    const dr = (LADDER.rOut - LADDER.rIn) * 0.3;
    cell.forEach((node, i) => {
      const a = s * 30 + 3 + ((i + 0.5) / n) * 24;
      const row = rows === 1 ? 0 : (i % rows) - (rows - 1) / 2;
      const r = mid + row * dr;
      const y = LADDER.base + (w + a / 360) * LADDER.turnH;
      layout.set(node.id, { world: worldId, wsrc: ARI.has(node.id) ? 'ari' : 'tfila', ...(ARI_NOTE[node.id] ? { wnote: ARI_NOTE[node.id] } : {}), a: +a.toFixed(3), r: +r.toFixed(4), y: +y.toFixed(4) });
    });
  }
}
{
  // sanity: nodes should not sit on top of each other
  const pts = [...layout.entries()].map(([id, p]) => [id, Math.sin((p.a * Math.PI) / 180) * p.r, p.y, Math.cos((p.a * Math.PI) / 180) * p.r]);
  let worst = [99, ''];
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
    const d = Math.hypot(pts[i][1] - pts[j][1], pts[i][2] - pts[j][2], pts[i][3] - pts[j][3]);
    if (d < worst[0]) worst = [d, pts[i][0] + ' ~ ' + pts[j][0]];
  }
  console.log('closest nodes on the ladder:', worst[0].toFixed(3), worst[1]);
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
  outNodes.push({
    id: n.id, region: n.region, title: n.title, k: n.k || 'core', imp: n.imp || 1,
    d: n.d, w: n.w, v: n.v || null, tags: n.tags || [],
    ...layout.get(n.id),
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
    }
    if (s.n === 'kaddish') {
      // never fall back to another form of Kaddish: use the same form from the nusach's weekday siddur, labelled
      const form = kaddishForm(s.note);
      if (!form) errors.push(`route ${r.id}#${i}: Kaddish stop does not name its form`);
      for (const ns of LIVE) {
        if (t[ns]) continue;
        if (ns === 'chabad' && !WEEKDAY_ROUTES.has(r.id)) { t[ns] = { status: 'unavailable' }; continue; }
        const ref = form && KADDISH_FORM[form][ns];
        const id = ref ? resolveTextId(ref, `${r.id}#${i}/${ns}/form`) : null;
        t[ns] = id ? { status: 'excerpt', ...textSummary(id), label: 'נוסח הקדיש הזה כפי שהוא בסידור לימות החול' } : { status: 'unavailable' };
      }
    }
    // Chabad's only open edition is the weekday siddur: on Shabbat / festival / High Holiday routes its weekday text
    // must not stand in for the day's prayer
    if (!WEEKDAY_ROUTES.has(r.id) && HOLY_ROUTES.has(r.id) && !t.chabad) {
      const nt = nodeChabadBook(s.n);
      if (nt === BOOKS.chabad.title) t.chabad = { status: 'unavailable' };
    }
    if (t.em) t.kabbalah = { ...t.em, status: t.em.status === 'unavailable' ? 'unavailable' : 'lens', base: 'em' };
    return {
      n: s.n, sec: s.sec || null, note: s.note || null, cond: s.cond || null,
      only: s.only || null, omit: !!s.omit, occ: counts[s.n], t: Object.keys(t).length ? t : null,
    };
  });
  for (const s of stops) s.occTotal = counts[s.n];
  outRoutes.push({ id: r.id, group: r.group, title: r.title, featured: !!r.featured, d: r.d, stops });
}

// ---------- text files, previews, search ----------
const ladderSources = Object.fromEntries(Object.entries(LADDER_SOURCES).map(([k, ref]) => [k, textSummary(resolveTextId(ref, `ladder/${k}`))]));
for (const [hash, payload] of texts) writeFileSync(join(OUT, 't', hash + '.json'), JSON.stringify(payload));

// Previews are decorative (the word pillar, the medallions, the LIVE ticker), so Divine Names are written there the
// way printed matter for general use writes them — ה׳, אלקים, אד׳ — and in full only in the reader.
const NAME_PREFIX = '[ובלכמשה]{0,3}';
function softenName(w) {
  const bare = w.replace(/[\u0591-\u05C7]/g, '').replace(/[^א-ת]/g, '');
  let m;
  if ((m = bare.match(new RegExp(`^(${NAME_PREFIX})(יהוה|יי|ה׳)$`)))) return `${m[1]}ה׳`;
  if ((m = bare.match(new RegExp(`^(${NAME_PREFIX})(אלה)(ים|ינו|י|יך|יכם|יהם|יו|יה)$`)))) return `${m[1]}אלק${m[3]}`;
  if ((m = bare.match(new RegExp(`^(${NAME_PREFIX})אדני$`)))) return `${m[1]}אד׳`;
  if ((m = bare.match(new RegExp(`^(${NAME_PREFIX})אלוה$`)))) return `${m[1]}אלו־ה`;
  return w;
}
function previewWords(hash, max = 90) {
  const t = texts.get(hash);
  const words = [];
  for (const p of t.parts) for (const s of p.segments) {
    // drop rubrics (<small>…</small>) from the preview, keep the prayer words
    const clean = s.replace(/<small>[\s\S]*?<\/small>/g, ' ').replace(/<[^>]+>/g, ' ');
    for (const w of clean.split(/\s+/)) if (w && /[א-ת]/.test(w)) { words.push(softenName(w)); if (words.length >= max) return words.join(' '); }
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
// every edition actually used, with its license, for the "where the texts come from" explainer
const editionMap = new Map();
for (const t of texts.values()) for (const p of t.parts) {
  const key = p.book + '|' + p.version;
  const e = editionMap.get(key) || { bookHe: p.bookHe, book: p.book, version: p.version, versionHe: p.versionHe, license: p.license, licenseHe: p.licenseHe, source: p.versionSource, excerpts: 0 };
  e.excerpts++;
  editionMap.set(key, e);
}
const editions = [...editionMap.values()].sort((a, b) => b.excerpts - a.excerpts);
const world = {
  generated: new Date().toISOString().slice(0, 10),
  regions: REGIONS.map(({ lat, lon, ...r }) => ({ ...r, a: SECTOR_ORDER.indexOf(r.id) * 30 + 15 })),
  nusachim: NUSACHIM, nodes: outNodes, routes: outRoutes, books, editions,
  worlds: WORLDS, ladder: { ...LADDER, sources: ladderSources },
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
