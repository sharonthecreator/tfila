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

// Kaddish: every Kaddish stop must carry the form its note names, in every nusach that has a text for it
const plainText = (id) => JSON.parse(readFileSync(D + 't/' + id + '.json')).parts.flatMap((p) => p.segments).join(' ').replace(/<[^>]+>/g, ' ').replace(/[\u0591-\u05C7]/g, '').replace(/\s+/g, ' ');
const FORMS = [
  [/חצי קדיש/, (t) => /דאמירן בעלמא/.test(t) && !/יהא שלמא|תתקבל|על ישראל ועל רבנן/.test(t), 'half'],
  [/תתקבל/, (t) => /תתקבל/.test(t), 'titkabal'],
  [/קדיש יתום/, (t) => /יהא שלמא/.test(t) && !/תתקבל|על ישראל ועל רבנן/.test(t), 'yatom'],
  [/דרבנן|על ישראל/, (t) => /על ישראל ועל רבנן/.test(t), 'derabbanan'],
];
let kaddishStops = 0;
for (const r of world.routes) r.stops.forEach((s, i) => {
  if (s.n !== 'kaddish') return;
  kaddishStops++;
  if (!s.note) { errors.push(`route ${r.id}#${i}: Kaddish stop without its form`); return; }
  const form = FORMS.find(([re]) => re.test(s.note.split('—')[0]));
  if (!form) { errors.push(`route ${r.id}#${i}: Kaddish form not named in note`); return; }
  for (const ns of ['em', 'ash', 'sef', 'chabad']) if (!s.t?.[ns]) errors.push(`route ${r.id}#${i}/${ns}: Kaddish stop would fall back to another form`);
  const weekday = ['boker', 'shacharit', 'mincha', 'arvit', 'yom-chol', 'brit-mila', 'kabbalah-night', 'avelut'].includes(r.id);
  if (!weekday && s.t?.chabad?.id) errors.push(`route ${r.id}#${i}/chabad: weekday Chabad text on a Shabbat/festival route`);
  for (const [ns, rec] of Object.entries(s.t || {})) {
    if (!rec.id) continue;
    const t = plainText(rec.id);
    if (!/יתגדל/.test(t)) errors.push(`route ${r.id}#${i}/${ns}: text is not a Kaddish`);
    else if (!form[1](t)) errors.push(`route ${r.id}#${i}/${ns}: text is not a ${form[2]} Kaddish`);
  }
});
// every service route has its Kaddish
for (const id of ['shacharit', 'mincha', 'arvit', 'yom-chol', 'shabbat', 'rosh-chodesh', 'rosh-hashana', 'yom-kippur']) {
  if (!world.routes.find((r) => r.id === id)?.stops.some((s) => s.n === 'kaddish')) errors.push(`route ${id}: no Kaddish`);
}

// the ladder: every node stands in one of the four worlds; Ne'ilah on the topmost rung
const WORLD_IDS = world.worlds.map((w) => w.id);
for (const n of world.nodes) {
  if (!WORLD_IDS.includes(n.world)) errors.push(`${n.id}: no world on the ladder`);
  if (![n.a, n.r, n.y].every(Number.isFinite)) errors.push(`${n.id}: no ladder position`);
}
const summit = [...world.nodes].sort((a, b) => b.y - a.y)[0];
if (summit.id !== 'neila') errors.push(`the topmost rung should be Ne'ilah (found ${summit.id})`);
for (const id of ['amidah', 'shema', 'pesukei-dezimra', 'birchot-hashachar', 'tachanun']) {
  const n = nodes.get(id);
  const want = { amidah: 'atzilut', shema: 'beriah', 'pesukei-dezimra': 'yetzirah', 'birchot-hashachar': 'asiyah', tachanun: 'asiyah' }[id];
  if (n.world !== want || n.wsrc !== 'ari') errors.push(`${id}: should be placed in ${want} by the Ari`);
}

if (errors.length) { console.error(errors.join('\n')); console.error(`\n${errors.length} problems`); process.exit(1); }
console.log(`content ok: ${world.nodes.length} nodes, ${world.routes.length} routes, ${kaddishStops} Kaddish stops of the right form, all texts attributed and correctly labelled`);
