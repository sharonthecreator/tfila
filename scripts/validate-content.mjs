// Integrity checks for the generated content (run: npm test).
//  - every route stop points to a node, every relation to a node
//  - every referenced text file exists and is non-empty
//  - no text is attributed to the wrong tradition: each nusach may only draw on
//    editions that belong to it (this is what "never silently substitute" means in data)
//  - Yemenite rites never show liturgical text as if it were theirs
import { readFileSync, existsSync } from 'node:fs';

const D = new URL('../public/data/', import.meta.url).pathname;
const world = JSON.parse(readFileSync(D + 'world.json'));
const errors = [];
const nodes = new Map(world.nodes.map((n) => [n.id, n]));

const ALLOWED = {
  em: ['Siddur Edot HaMizrach', 'Machzor Yom Kippur Edot HaMizrach', 'Machzor Rosh Hashanah Edot HaMizrach', 'Pesach Haggadah Edot Hamizrah', 'Selichot Edot HaMizrach', "Seder Tisha B'Av (Edot HaMizrach)", 'Birkat Hamazon|Birkat Hamazon -- Edot HaMizrach'],
  ash: ['Siddur Ashkenaz', 'Machzor Yom Kippur Ashkenaz', 'Machzor Rosh Hashanah Ashkenaz', "Kinnot for Tisha B'Av (Ashkenaz)", 'Birkat Hamazon|Birkat Hamazon -- Ashkenaz'],
  sef: ['Siddur Sefard', 'Machzor Yom Kippur Sefard', 'Machzor Rosh Hashanah Sefard', 'Birkat Hamazon|Birkat Hamazon -- Sefard'],
  chabad: ['Weekday Siddur Chabad', 'Birkat Hamazon|Birkat Hamazon -- Ari'],
  baladi: ['Mishneh Torah, The Order of Prayer'],
};

function checkText(rec, ns, where) {
  if (!rec?.id) return;
  const f = D + 't/' + rec.id + '.json';
  if (!existsSync(f)) { errors.push(`${where}: missing text file ${rec.id}`); return; }
  const t = JSON.parse(readFileSync(f));
  if (!t.parts.length || !t.parts.every((p) => p.segments.length)) errors.push(`${where}: empty text`);
  for (const p of t.parts) {
    if (!p.version || !p.license || !p.sefaria) errors.push(`${where}: missing attribution`);
    const allowed = ALLOWED[ns === 'kabbalah' ? 'em' : ns];
    if (!allowed) continue;
    const key = p.book === 'Birkat Hamazon' ? `${p.book}|${p.version}` : p.book;
    if (!allowed.includes(key)) errors.push(`${where}: ${ns} text drawn from "${key}"`);
  }
}

for (const n of world.nodes) {
  for (const r of n.rel) if (!nodes.has(r.target)) errors.push(`node ${n.id}: bad relation ${r.target}`);
  for (const [ns, rec] of Object.entries(n.texts)) {
    checkText(rec, ns, `${n.id}/${ns}`);
    if (rec.kav) checkText(rec.kav, null, `${n.id}/kav`);
  }
  if (n.texts.shami.status !== 'unavailable') errors.push(`${n.id}: shami must be unavailable`);
  if (!['historical', 'unavailable'].includes(n.texts.baladi.status)) errors.push(`${n.id}: baladi must be historical or unavailable`);
  if (!n.d || !n.w) errors.push(`${n.id}: missing explanation`);
}
for (const r of world.routes) {
  if (r.stops.length < 3) errors.push(`route ${r.id}: too short`);
  r.stops.forEach((s, i) => {
    if (!nodes.has(s.n)) errors.push(`route ${r.id}#${i}: unknown node ${s.n}`);
    for (const [ns, rec] of Object.entries(s.t || {})) checkText(rec, ns, `route ${r.id}#${i}/${ns}`);
  });
}
for (const id of ['yom-kippur', 'wedding']) if (!world.routes.find((r) => r.id === id)) errors.push(`missing featured route ${id}`);

const yk = world.routes.find((r) => r.id === 'yom-kippur');
const amidot = yk.stops.filter((s) => s.n === 'amidah-yk').length;
if (amidot !== 5) errors.push(`yom kippur should repeat the amidah (found ${amidot})`);

if (errors.length) { console.error(errors.join('\n')); console.error(`\n${errors.length} problems`); process.exit(1); }
console.log(`content ok: ${world.nodes.length} nodes, ${world.routes.length} routes, all texts attributed and correctly labelled`);
