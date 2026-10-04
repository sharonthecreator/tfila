// Downloads the Sefaria export files listed in content/books.mjs into .cache/sefaria.
// Usage: node scripts/fetch-sources.mjs
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { BOOKS } from '../content/books.mjs';

const BASE = 'https://storage.googleapis.com/sefaria-export/json/';
const CACHE = new URL('../.cache/sefaria/', import.meta.url).pathname;

export function cacheFile(bookKey, version) {
  return join(CACHE, bookKey, encodeURIComponent(version.trim() || 'v') + '.json');
}

async function exists(p) { try { await access(p); return true; } catch { return false; } }

async function main() {
  let failures = 0;
  for (const [key, book] of Object.entries(BOOKS)) {
    await mkdir(join(CACHE, key), { recursive: true });
    for (const version of book.versions) {
      const out = cacheFile(key, version);
      if (await exists(out)) { console.log('cached ', key, '|', version); continue; }
      const url = BASE + `${book.path}/Hebrew/${version}.json`.split('/').map(encodeURIComponent).join('/');
      const res = await fetch(url);
      if (!res.ok) { console.error('FAILED', res.status, url); failures++; continue; }
      await writeFile(out, Buffer.from(await res.arrayBuffer()));
      console.log('fetched', key, '|', version);
    }
  }
  if (failures) { console.error(`${failures} downloads failed`); process.exit(1); }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
