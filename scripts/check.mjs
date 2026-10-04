// Dev helper: node scripts/check.mjs node:nusach ...  — prints start/end of resolved texts
import { readFileSync } from 'node:fs';
const w = JSON.parse(readFileSync('public/data/world.json'));
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/[֑-ׇ]/g, '').slice(0, 90);
for (const arg of process.argv.slice(2)) {
  const [id, ns] = arg.split(':');
  const n = w.nodes.find((x) => x.id === id);
  const t = n.texts[ns];
  if (!t?.id) { console.log(arg, '→', t?.status); continue; }
  const p = JSON.parse(readFileSync(`public/data/t/${t.id}.json`));
  const segs = p.parts.flatMap((x) => x.segments);
  console.log(`\n${arg} [${t.status}] ${segs.length} segs, ${p.words} words | ${p.parts.map((x) => x.bookHe + ' › ' + x.section + ' (' + x.version + ', ' + x.license + ')').join(' + ')}`);
  console.log('  ▶', strip(segs[0])); if (segs.length > 1) console.log('  ▶', strip(segs[1])); console.log('  ■', strip(segs[segs.length - 1]));
}
