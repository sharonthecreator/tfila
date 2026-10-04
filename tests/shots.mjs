// Visual + interaction smoke test: node tests/shots.mjs [baseUrl] [outDir]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const base = process.argv[2] || 'http://localhost:4173/';
const out = process.argv[3] || 'shots';
const only = process.argv[4] || 'all';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const errors = [];
const check = (cond, msg) => { if (!cond) errors.push('ASSERT: ' + msg); console.log((cond ? 'ok   ' : 'FAIL ') + msg); };

async function open(viewport, hash = '') {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(base + hash, { waitUntil: 'networkidle' });
  await page.waitForSelector('#overlay.gone', { timeout: 30000 });
  return page;
}
const wait = (p, ms) => p.waitForTimeout(ms);

if (only === 'all' || only === 'desktop') {
  const page = await open({ width: 1440, height: 900 });
  await wait(page, 3800);
  await page.screenshot({ path: `${out}/01-overview.png` });

  // Yom Kippur route
  await page.click('[data-route="yom-kippur"]');
  await wait(page, 3500);
  await page.screenshot({ path: `${out}/02-yk-route.png` });
  check(await page.locator('.stop').count() > 30, 'YK itinerary lists stops');
  check(await page.locator('.tag.occ').count() > 5, 'repeated occurrences are marked');

  // Kol Nidrei stop
  const kn = page.locator('.stop', { hasText: 'כל נדרי' }).first();
  await kn.click();
  await wait(page, 3200);
  await page.screenshot({ path: `${out}/03-yk-kolnidrei.png` });
  check(await page.locator('#reader:not([hidden]) h2', { hasText: 'כל נדרי' }).count() === 1, 'reader opens Kol Nidrei');
  check(await page.locator('.source-card').count() > 0, 'source card shown');

  // close reader, zoom closer to see words
  await page.keyboard.press('Escape');
  const box = await page.locator('#globe').boundingBox();
  await page.mouse.move(box.width / 2, box.height / 2);
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, -260); await wait(page, 120); }
  await wait(page, 1800);
  await page.screenshot({ path: `${out}/04-yk-closeup.png` });

  // Avodah text
  await page.click('.stop:has-text("סדר העבודה")');
  await wait(page, 3500);
  await page.screenshot({ path: `${out}/05-avoda-reader.png` });

  // search without nikud
  await page.keyboard.press('Escape');
  await page.fill('#searchInput', 'אבינו מלכנו');
  await wait(page, 1500);
  await page.screenshot({ path: `${out}/06-search.png` });
  check(await page.locator('.search-results .res').count() > 0, 'search returns results');
  await page.fill('#searchInput', 'וְנָתְנָה');
  await wait(page, 1500);
  check(await page.locator('.search-results .res').count() > 0, 'search with nikud returns results');
  await page.keyboard.press('Escape');

  // wedding in Ashkenaz
  await page.click('[data-back]');
  await page.click('#nusachButton');
  await page.click('.nusach-opt[data-id="ash"]');
  await page.click('[data-route="wedding"]');
  await wait(page, 3000);
  await page.click('.stop:has-text("שבע ברכות")');
  await wait(page, 3000);
  await page.screenshot({ path: `${out}/07-wedding-ash.png` });
  check(await page.locator('.notice.warn').count() > 0, 'unavailable Ashkenaz wedding text is marked explicitly');

  // text view
  await page.click('#viewToggle');
  await wait(page, 600);
  await page.screenshot({ path: `${out}/08-textview.png` });
  await page.close();
}

if (only === 'all' || only === 'mobile') {
  const page = await open({ width: 390, height: 844 }, '#n=em&route=yom-kippur&stop=10');
  await wait(page, 4000);
  await page.screenshot({ path: `${out}/09-mobile-reader.png` });
  await page.click('.reader-close');
  await wait(page, 1500);
  await page.screenshot({ path: `${out}/10-mobile-globe.png` });
  await page.close();
}

if (only === 'all' || only === 'journey') {
  const page = await open({ width: 1280, height: 800 }, '#n=em&route=yom-kippur');
  await wait(page, 2500);
  await page.click('#jPlay');
  await wait(page, 9000);
  const cur = await page.locator('.stop[aria-current="step"] .num').textContent();
  check(Number(cur) >= 2, 'guided journey advances through stops (now at ' + cur + ')');
  await page.screenshot({ path: `${out}/11-journey.png` });
  await page.click('#jPlay');
  // reduced motion toggle
  await page.click('#motionToggle');
  check(await page.evaluate(() => document.body.classList.contains('reduce-motion')), 'reduced motion toggles');
  // keyboard: focus globe, zoom in and select center
  await page.focus('#globe');
  for (let i = 0; i < 4; i++) await page.keyboard.press('+');
  await page.keyboard.press('Enter');
  await wait(page, 800);
  check(!(await page.locator('#reader').isHidden()), 'keyboard Enter selects the prayer at the centre');
  await page.close();
}

if (only === 'all' || only === 'fallback') {
  const b2 = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--disable-webgl', '--disable-3d-apis'] });
  const page = await b2.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', (e) => errors.push('pageerror(fallback): ' + e.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForSelector('#overlay.gone', { timeout: 30000 });
  check(!(await page.locator('#textView').isHidden()), 'without WebGL the text view is shown');
  check(await page.locator('.fallback-note').count() === 1, 'fallback explains why');
  await page.click('#textView [data-node="kol-nidrei"]');
  await wait(page, 800);
  check(await page.locator('#reader h2', { hasText: 'כל נדרי' }).count() === 1, 'reader works without WebGL');
  await page.screenshot({ path: `${out}/12-fallback.png` });
  await b2.close();
}

console.log(errors.length ? '\n' + errors.join('\n') : '\nno errors');
await browser.close();
process.exitCode = errors.some((e) => e.startsWith('ASSERT') || e.startsWith('pageerror')) ? 1 : 0;
