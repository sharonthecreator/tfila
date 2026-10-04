// Dev helper: node scripts/peek.mjs <book> "<a/b/c>" [maxSegs] — prints numbered plain segments.
import { resolveRef, plain } from './lib/sefaria.mjs';
const [book, p, max = '400'] = process.argv.slice(2);
const r = resolveRef({ book, path: p ? p.split('/') : [] });
console.log(r.versionTitle, '|', r.license, '|', r.sectionHe, '|', r.sefariaUrl);
r.segments.slice(0, +max).forEach((s, i) => console.log(i, plain(s).slice(0, 110).replace(/\n/g, ' ')));
