// Dev helper: list every Kaddish inside a section of an edition, with its type and the {from, count} that cuts it out.
//   node scripts/find-kaddish.mjs <book> "<section/path>" [version]
import { resolveRef, plain } from './lib/sefaria.mjs';
const [book, path, version] = process.argv.slice(2);
const r = resolveRef({ book, path: path.split('/'), ...(version ? { version } : {}) });
const segs = r.segments.map((s) => plain(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
console.log(`${book} ${path} (${r.versionTitle}) — ${segs.length} segments`);
segs.forEach((s, i) => {
  if (!/יתגדל ויתקדש/.test(s)) return;
  let from = i;
  if (i > 0 && /קדיש/.test(segs[i - 1]) && segs[i - 1].length < 120) from = i - 1;
  let end = i;
  const done = (t) => /עושה שלום|עשה שלום/.test(t);
  // a half Kaddish ends after "דאמירן בעלמא"; a full one after "עושה שלום"
  const win = segs.slice(i, i + 6).join(' ');
  const full = /יהא שלמא|תתקבל|על ישראל ועל רבנן/.test(segs.slice(i, i + 4).join(' '));
  if (full) { while (end < segs.length - 1 && !done(segs[end])) end++; }
  else { while (end < segs.length - 1 && !/דאמירן בעלמא/.test(segs[end])) end++; }
  const type = /על ישראל ועל רבנן/.test(win) && full ? 'derabbanan' : /תתקבל/.test(segs.slice(i, end + 1).join(' ')) ? 'titkabal' : full ? 'yatom' : 'half';
  console.log(type.padEnd(11), `{ from: ${from}, count: ${end - from + 1} }`, '|', segs[from].slice(0, 40), '…', segs[end].slice(-40));
});
