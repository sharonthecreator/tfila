// Dev helper: resolve a ref and show where it starts/ends.  node scripts/peek-ref.mjs '<json ref>' ...
import { resolveRef, plain } from './lib/sefaria.mjs';
for (const arg of process.argv.slice(2)) {
  const ref = JSON.parse(arg);
  ref.path = typeof ref.path === 'string' ? ref.path.split('/') : ref.path;
  try {
    const r = resolveRef(ref);
    const segs = r.segments.map((x) => plain(x).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    console.log(`✔ ${ref.book} ${ref.path.join('/')} [${r.versionTitle}] ${segs.length} segs\n   first: ${segs[0].slice(0, 110)}\n   last:  ${segs[segs.length - 1].slice(-110)}`);
  } catch (e) { console.log('✘', arg, e.message); }
}
