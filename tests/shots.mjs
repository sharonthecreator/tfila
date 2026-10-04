// Interaction + screenshot test for tfila: node tests/shots.mjs [baseUrl] [outDir] [suite]
// suites: all | desktop | journey | views | mobile | fallback
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const base = process.argv[2] || 'http://localhost:4173/';
const out = process.argv[3] || 'test-shots';
const only = process.argv[4] || 'all';
mkdirSync(out, { recursive: true });
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: GL });
const errors = [];
const check = (c, m) => { if (!c) errors.push('ASSERT: ' + m); console.log((c ? 'ok   ' : 'FAIL ') + m); };
const wait = (p, ms) => p.waitForTimeout(ms);

async function open(viewport, hash = '', b = browser) {
  const page = await b.newPage({ viewport });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(base + hash, { waitUntil: 'networkidle' });
  await page.waitForSelector('#loader.done', { timeout: 40000 });
  return page;
}

if (['all', 'desktop'].includes(only)) {
  const p = await open({ width: 1600, height: 900 });
  await wait(p, 4000);
  await p.screenshot({ path: `${out}/01-instrument.png` });
  check(await p.locator('#readouts .subjects li').count() === 7, 'readouts list all 7 nusachim with coverage');

  await p.click('#dock [data-route="yom-kippur"]');
  await wait(p, 4500);
  await p.screenshot({ path: `${out}/02-yom-kippur.png` });
  check((await p.locator('#explain h2').textContent()).includes('יום כיפור'), 'explain shows the Yom Kippur route');
  check(await p.locator('#dock .slider .marks i').count() === 44, 'route scrubber has a mark per stop');
  check(await p.locator('.badge').count() === 44, 'numbered badges for every stop');

  await p.evaluate(() => { const s = document.querySelector('#scrub'); s.value = '9'; s.dispatchEvent(new Event('input')); });
  await wait(p, 4500);
  await p.screenshot({ path: `${out}/03-kol-nidrei.png` });
  check((await p.locator('#explain h2').textContent()).includes('כל נדרי'), 'scrubbing to stop 10 focuses Kol Nidrei');
  check((await p.locator('#liveFrame').textContent()).length > 40, 'LIVE inset shows the prayer words');

  const box = await p.locator('#gl').boundingBox();
  await p.mouse.move(box.width / 2 - 30, box.height / 2 - 60);
  for (let i = 0; i < 5; i++) { await p.mouse.wheel(0, -260); await wait(p, 150); }
  await wait(p, 3000);
  await p.screenshot({ path: `${out}/04-closeup-words.png` });

  await p.click('#explain [data-read]');
  await wait(p, 2500);
  await p.screenshot({ path: `${out}/05-reader.png` });
  check(await p.locator('#readerSheet .prov .card').count() > 0, 'reader shows source / edition / license card');
  check((await p.locator('#readerSheet .prayer').first().textContent()).includes('כָּל'), 'reader shows Kol Nidrei text with nikud');
  await p.keyboard.press('Escape');
  check(await p.locator('#reader').isHidden(), 'Escape closes the reader');

  // repeated occurrence: stop 13 is Vidui 2/7
  await p.evaluate(() => { const s = document.querySelector('#scrub'); s.value = '12'; s.dispatchEvent(new Event('input')); });
  await wait(p, 1500);
  check((await p.locator('#explain .spec').textContent()).includes('מופע 2/7'), 'Vidui shows its occurrence 2/7');

  await p.fill('#q', 'אבינו מלכנו');
  await wait(p, 1500);
  check(await p.locator('#results .res').count() > 0, 'search finds אבינו מלכנו');
  await p.fill('#q', 'וְנָתְנָה תֹּקֶף');
  await wait(p, 1500);
  check(await p.locator('#results .res').count() > 0, 'search with nikud works');
  await p.fill('#q', 'ברוך');
  await wait(p, 1500);
  check(await p.locator('#results .res').count() > 0, 'search folds final letters (ברוך)');
  await p.screenshot({ path: `${out}/06-search.png` });
  await p.keyboard.press('Escape');

  // Ashkenaz wedding: explicit unavailable
  await p.click('#dock [data-ns="ash"]');
  await wait(p, 800);
  await p.click('#explain [data-exit]');
  await wait(p, 600);
  await p.click('#dock [data-route="wedding"]');
  await wait(p, 3000);
  await p.evaluate(() => { const s = document.querySelector('#scrub'); s.value = '3'; s.dispatchEvent(new Event('input')); });
  await wait(p, 2500);
  await p.click('#explain [data-read]');
  await wait(p, 1500);
  check(await p.locator('#readerSheet .notice.warn').count() > 0, 'Ashkenaz Sheva Berachot is marked unavailable, not substituted');
  await p.screenshot({ path: `${out}/07-wedding-ashkenaz.png` });
  await p.close();
}

if (['all', 'journey'].includes(only)) {
  const p = await open({ width: 1440, height: 900 }, '#n=em&route=yom-kippur');
  await wait(p, 2500);
  await p.click('#dock [data-act="journey"]');
  await wait(p, 10000);
  const cur = await p.locator('#readouts .ro.big.accent .val').textContent();
  check(parseInt(cur) >= 2, 'guided journey advances (now at ' + cur.trim() + ')');
  await p.click('#dock [data-act="journey"]');
  await p.click('#motionBtn');
  check(await p.evaluate(() => document.body.classList.contains('reduce-motion')), 'reduced motion toggles');
  await p.click('#quality [data-q="low"]');
  await wait(p, 1500);
  check(await p.locator('#quality [data-q="low"][aria-pressed="true"]').count() === 1, 'quality preset switches');
  await p.focus('#gl');
  await p.keyboard.press('Escape');
  await wait(p, 500);
  for (let i = 0; i < 6; i++) await p.keyboard.press('+');
  await p.keyboard.press('Enter');
  await wait(p, 1200);
  check((await p.locator('#explain h2').textContent()).trim().length > 0, 'keyboard Enter selects the prayer at the centre');
  await p.close();
}

if (['all', 'views'].includes(only)) {
  const p = await open({ width: 1440, height: 900 });
  await p.click('#tabs [data-tab="library"]');
  await wait(p, 800);
  await p.screenshot({ path: `${out}/08-library.png` });
  check(await p.locator('#libraryView .card-btn').count() === 154, 'library lists all prayers');
  await p.click('#libraryView [data-sec="routes"]');
  check(await p.locator('#libraryView ol li').count() > 200, 'library lists every route stop as text');
  await p.click('#tabs [data-tab="compare"]');
  await wait(p, 2500);
  await p.screenshot({ path: `${out}/09-compare.png` });
  check(await p.locator('#compareView .prayer').count() === 2, 'compare shows two nusachim side by side');
  await p.click('#tabs [data-tab="learn"]');
  await wait(p, 800);
  await p.screenshot({ path: `${out}/10-learn.png` });
  check(await p.locator('#learnView svg.chart circle').count() >= 19, 'learn chart plots repeated Yom Kippur prayers');
  await p.click('#learnView [data-i="3"]');
  check(await p.locator('#learnView table.data tr').count() > 10, 'sources table lists editions and licenses');
  await p.close();
}

if (['all', 'mobile'].includes(only)) {
  const p = await open({ width: 390, height: 844 }, '#n=em&route=yom-kippur&stop=10');
  await wait(p, 4500);
  await p.screenshot({ path: `${out}/11-mobile.png` });
  check(await p.locator('#explain h2').isVisible(), 'mobile shows the explain card');
  await p.click('#explain [data-read]');
  await wait(p, 1500);
  await p.screenshot({ path: `${out}/12-mobile-reader.png` });
  await p.close();
}

if (['all', 'fallback'].includes(only)) {
  const b2 = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--disable-webgl', '--disable-3d-apis'] });
  const p = await open({ width: 1280, height: 800 }, '', b2);
  check(!(await p.locator('#libraryView').isHidden()), 'without WebGL the library (text view) is shown');
  check(await p.locator('#noWebglNote').count() === 1, 'fallback explains why');
  await p.click('#libraryView [data-node="kol-nidrei"]');
  await wait(p, 1000);
  check(await p.locator('#readerSheet h2', { hasText: 'כל נדרי' }).count() === 1, 'reader works without WebGL');
  await p.screenshot({ path: `${out}/13-fallback.png` });
  await b2.close();
}

console.log(errors.length ? '\n' + errors.join('\n') : '\nno errors');
await browser.close();
process.exitCode = errors.some((e) => /^(ASSERT|pageerror)/.test(e)) ? 1 : 0;
