// Dev helper: node scripts/find.mjs <book> "<a/b/c>" <regex>
import { resolveRef, plain } from './lib/sefaria.mjs';
const [book, p, rx] = process.argv.slice(2);
const r = resolveRef({ book, path: p ? p.split('/') : [] });
const re = new RegExp(rx);
console.log(r.segments.length, 'segments');
r.segments.forEach((s, i) => { const t = plain(s); if (re.test(t)) console.log(i, t.slice(0, 120).replace(/\n/g, ' ')); });
