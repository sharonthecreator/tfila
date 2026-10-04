// Dev helper: run find-kaddish over every 1st/2nd-level section of a book's cached edition.
//   node scripts/find-kaddish-all.mjs <book> <cache-file-name> [section-prefix]
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const [book, file, prefix = ''] = process.argv.slice(2);
const j = JSON.parse(readFileSync(`${process.cwd()}/.cache/sefaria/${book}/${file}`));
const paths = [];
for (const [a, v] of Object.entries(j.text)) {
  if (prefix && !a.startsWith(prefix)) continue;
  if (v && !Array.isArray(v) && typeof v === 'object') for (const b of Object.keys(v)) paths.push(`${a}/${b}`);
  else paths.push(a);
}
for (const p of paths) {
  try {
    const out = execFileSync('node', [new URL('./find-kaddish.mjs', import.meta.url).pathname, book, p, j.versionTitle], { encoding: 'utf8' });
    const lines = out.trim().split('\n');
    if (lines.length > 1) console.log(lines.join('\n'));
  } catch { /* section without text */ }
}
