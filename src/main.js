import '@fontsource/frank-ruhl-libre/hebrew-400.css';
import '@fontsource/frank-ruhl-libre/hebrew-500.css';
import '@fontsource/frank-ruhl-libre/hebrew-700.css';
import '@fontsource/heebo/hebrew-400.css';
import '@fontsource/heebo/hebrew-600.css';
import '@fontsource/heebo/hebrew-700.css';
import './styles.css';

import { state, set, subscribe, nodeById, routeById, nusachById, regionById, STATUS_HE, TEXT_STATUS_HE } from './state.js';
import { loadWorld, loadPreview, loadSearch } from './data.js';
import { normalize, escapeHtml } from './hebrew.js';
import { openReader, closeReader, rerenderReader, isReaderOpen, textRecord } from './ui/reader.js';

const $ = (id) => document.getElementById(id);
const live = (msg) => { $('live').textContent = ''; setTimeout(() => ($('live').textContent = msg), 30); };
let globe = null;
let journeyTimer = null;

// ───────────────────────── boot ─────────────────────────
async function boot() {
  const overlayText = $('overlayText');
  try {
    readPrefs();
    const fontsReady = Promise.race([
      Promise.all([
        document.fonts.load('400 40px "Frank Ruhl Libre"', 'אבג'),
        document.fonts.load('700 40px "Frank Ruhl Libre"', 'אבג'),
        document.fonts.load('400 14px "Heebo"', 'אבג'),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
    const world = await loadWorld();
    world.nodeMap = new Map(world.nodes.map((n) => [n.id, n]));
    world.routeMap = new Map(world.routes.map((r) => [r.id, r]));
    world.regionMap = new Map(world.regions.map((r) => [r.id, r]));
    state.world = world;
    readHash();
    await fontsReady;

    let webgl = false;
    const { webglAvailable } = await import('./globe/Globe.js');
    if (webglAvailable()) {
      try {
        const { Globe } = await import('./globe/Globe.js');
        globe = new Globe($('globe'), $('labels'), {
          reduceMotion: state.reduceMotion,
          onSelect: (id) => selectNode(id),
          onHover: showTooltip,
          onBackground: () => { if (!state.routeId && state.nodeId) { set({ nodeId: null }); closeReader(); } },
          onFrame: updateZoomHint,
          onKeyNav: (id) => { if (id) live(`במרכז: ${nodeById(id).title}`); },
        });
        globe.setWorld(world);
        webgl = true;
      } catch (e) {
        console.error(e);
      }
    }
    if (!webgl) {
      $('stage').hidden = true;
      state.textView = true;
      state.noWebGL = true;
    }

    await applyNusach();
    renderNusachPicker();
    renderRoutesPanel();
    bindUi();
    renderTextView();
    applyView();

    // restore deep link
    if (state.routeId) activateRoute(state.routeId, { keepStop: true });
    else if (state.nodeId) selectNode(state.nodeId, { fly: true });
    else if (globe) { globe.alt = 4.4; globe.flyTo(16, 20, 3.1, { duration: 2800 }); }

    $('overlay').classList.add('gone');
    setTimeout(() => ($('overlay').hidden = true), 1000);
  } catch (e) {
    console.error(e);
    overlayText.textContent = 'לא הצלחנו לטעון את עולם התפילות. בדקו את החיבור ונסו שוב.';
    $('overlayRetry').hidden = false;
    $('overlayRetry').onclick = () => location.reload();
  }
}

function readPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem('tfila.prefs') || '{}');
    if (p.nusach) state.nusach = p.nusach;
    if (typeof p.reduceMotion === 'boolean') state.reduceMotion = p.reduceMotion;
    else state.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    state.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
function savePrefs() {
  try { localStorage.setItem('tfila.prefs', JSON.stringify({ nusach: state.nusach, reduceMotion: state.reduceMotion })); } catch {}
}

// ───────────────────────── URL state ─────────────────────────
function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  if (p.get('n') && state.world.nusachim.some((x) => x.id === p.get('n'))) state.nusach = p.get('n');
  if (p.get('route') && routeById(p.get('route'))) state.routeId = p.get('route');
  if (p.get('stop')) state.stopIndex = Number(p.get('stop')) - 1;
  if (p.get('node') && nodeById(p.get('node'))) state.nodeId = p.get('node');
}
function writeHash() {
  const p = new URLSearchParams();
  p.set('n', state.nusach);
  if (state.routeId) p.set('route', state.routeId);
  if (state.routeId && state.stopIndex >= 0) p.set('stop', state.stopIndex + 1);
  else if (state.nodeId) p.set('node', state.nodeId);
  history.replaceState(null, '', '#' + p.toString());
}
subscribe(() => writeHash());

// ───────────────────────── nusach ─────────────────────────
async function applyNusach() {
  const ns = nusachById(state.nusach);
  $('nusachName').textContent = ns.short;
  document.querySelector('#nusachButton .dot').style.background = ns.color;
  document.querySelector('#nusachButton .dot').style.color = ns.color;
  if (globe) {
    try { globe.setPreviews(await loadPreview(state.nusach)); } catch (e) { console.warn(e); globe.setPreviews({}); }
  }
}

function renderNusachPicker() {
  const list = $('nusachList');
  list.innerHTML = state.world.nusachim
    .map((n) => `<button class="nusach-opt" role="option" data-id="${n.id}" aria-selected="${n.id === state.nusach}">
        <span class="dot" style="background:${n.color}"></span><strong>${escapeHtml(n.name)}</strong>
        <span class="sub">${escapeHtml(textualLabel(n))}</span></button>`)
    .join('');
  list.querySelectorAll('.nusach-opt').forEach((b) => (b.onclick = () => { set({ nusach: b.dataset.id }); toggleNusach(false); $('nusachButton').focus(); }));
}
const textualLabel = (n) => ({
  full: 'טקסטים ממהדורות פתוחות בספריא',
  partial: 'סידור לימות החול בלבד; השאר מסומן כחסר',
  historical: 'אין תכלאל פתוח — מוצג מקור היסטורי (רמב״ם) בתווית',
  none: 'אין טקסטים פתוחים — הסברים ומסלולים בלבד',
  lens: 'עדות המזרח + שער הכוונות, בתוויות מפורשות',
}[n.textual]);

function toggleNusach(open) {
  const list = $('nusachList');
  open = open ?? list.hidden;
  list.hidden = !open;
  $('nusachButton').setAttribute('aria-expanded', String(open));
  if (open) list.querySelector('[aria-selected="true"]')?.focus();
}

subscribe(async (ch) => {
  if (!ch.nusach) return;
  savePrefs();
  renderNusachPicker();
  await applyNusach();
  if (state.routeId) { renderItinerary(routeById(state.routeId)); globe?.setRoute(routeById(state.routeId), { nusach: state.nusach }); if (state.stopIndex >= 0) globe?.setStop(state.stopIndex); }
  rerenderReader();
  renderTextView();
  if (state.query) runSearch(state.query);
  live(`נבחר נוסח ${nusachById(state.nusach).name}`);
});

// ───────────────────────── nodes ─────────────────────────
function selectNode(id, { fly = true, stopIndex = null } = {}) {
  const node = nodeById(id);
  if (!node) return;
  // a click on a node that is a stop of the active route selects that stop
  if (state.routeId && stopIndex == null) {
    const r = routeById(state.routeId);
    const idx = r.stops.findIndex((s, i) => s.n === id && i >= state.stopIndex);
    const any = idx >= 0 ? idx : r.stops.findIndex((s) => s.n === id);
    if (any >= 0) return selectStop(any);
  }
  stopJourney();
  set({ nodeId: id });
  globe?.setSelected(id);
  if (fly) globe?.flyToNode(id, 0.3);
  openReader(id, { stopIndex, focus: false });
  live(`נבחר: ${node.title}`);
}

// ───────────────────────── routes ─────────────────────────
function renderRoutesPanel() {
  $('routesTitle').textContent = 'מסלולים';
  const groups = {};
  for (const r of state.world.routes) (groups[r.group] ||= []).push(r);
  $('routesBody').innerHTML =
    `<p style="color:var(--muted);font-size:13px;line-height:1.7;margin:8px 6px 4px">בחרו תפילה, חג או אירוע — והמסלול יואר על הגלובוס. התקרבו אל התחנות כדי לראות את מילות התפילה עצמן.</p>` +
    Object.entries(groups)
      .map(([g, rs]) => `<div class="route-group"><h3>${escapeHtml(g)}</h3>${rs
        .map((r) => `<button class="route-card ${r.featured ? 'featured' : ''}" data-route="${r.id}"><strong>${escapeHtml(r.title)}</strong><span>${r.stops.length} תחנות · ${escapeHtml(r.d.slice(0, 70))}…</span></button>`)
        .join('')}</div>`)
      .join('');
  $('routesBody').querySelectorAll('[data-route]').forEach((b) => (b.onclick = () => activateRoute(b.dataset.route)));
}

function activateRoute(id, { keepStop = false } = {}) {
  const route = routeById(id);
  if (!route) return;
  stopJourney();
  const stopIndex = keepStop ? state.stopIndex : -1;
  set({ routeId: id, stopIndex, nodeId: null });
  globe?.setSelected(null);
  globe?.setRoute(route, { nusach: state.nusach });
  renderItinerary(route);
  showLegend(true);
  $('journeyBar').hidden = false;
  updateCaption();
  setCollapsed(false);
  if (stopIndex >= 0) selectStop(stopIndex);
  else { closeReader(); globe?.overview(); }
  live(`מסלול ${route.title}: ${route.stops.length} תחנות`);
}

function exitRoute() {
  stopJourney();
  set({ routeId: null, stopIndex: -1 });
  globe?.setRoute(null);
  renderRoutesPanel();
  showLegend(false);
  $('journeyBar').hidden = true;
  closeReader();
  globe?.flyTo(globe.focusLL.lat, globe.focusLL.lon, 2.0);
}

function stopOff(s) { return s.omit || (s.only && !s.only.includes(state.nusach)); }

function renderItinerary(route) {
  const body = $('routesBody');
  $('routesTitle').textContent = 'מסלול';
  const repeated = new Set(route.stops.filter((s) => s.occTotal > 1).map((s) => s.n)).size;
  const available = route.stops.filter((s) => !stopOff(s) && textRecord(nodeById(s.n), state.nusach, s)?.id).length;
  let html = `<div class="itinerary-head">
      <button class="back" data-back>→ כל המסלולים</button>
      <h3>${escapeHtml(route.title)}</h3>
      <p>${escapeHtml(route.d)}</p>
      <div class="route-stats"><span><b>${route.stops.length}</b> תחנות</span><span><b>${repeated}</b> תפילות חוזרות</span><span><b>${available}</b> עם טקסט בנוסח ${escapeHtml(nusachById(state.nusach).short)}</span></div>
      <div class="actions">
        <button class="primary-btn" data-journey>▶ מסע מודרך</button>
        <button class="ghost-btn" data-overview>מבט על המסלול</button>
      </div>
    </div><ol class="stops" aria-label="תחנות המסלול לפי הסדר">`;
  route.stops.forEach((s, i) => {
    const n = nodeById(s.n);
    if (s.sec) html += `<li class="sec" aria-hidden="true">${escapeHtml(s.sec)}</li>`;
    const off = stopOff(s);
    const cond = s.cond || (n.k !== 'core' ? n.k : null);
    const tags = [
      s.occTotal > 1 ? `<span class="tag occ" title="אותה תפילה מופיעה ${s.occTotal} פעמים במסלול">${s.occ}/${s.occTotal}</span>` : '',
      cond ? `<span class="tag ${cond}">${STATUS_HE[cond]}</span>` : '',
      n.tags.includes('kabbalah') ? '<span class="tag kab">✧</span>' : '',
      s.omit ? '<span class="tag off">לא נאמר כאן</span>' : off ? `<span class="tag off">לא בנוסח ${escapeHtml(nusachById(state.nusach).short)}</span>` : '',
    ].join('');
    html += `<li><button class="stop ${s.omit ? 'omit' : off ? 'off' : ''}" data-stop="${i}" ${i === state.stopIndex ? 'aria-current="step"' : ''}>
      <span class="num">${i + 1}</span>
      <span><span class="t">${escapeHtml(n.title)}</span><span class="tags">${tags}</span>${s.note ? `<span class="note">${escapeHtml(s.note)}</span>` : ''}</span>
    </button></li>`;
  });
  html += '</ol>';
  body.innerHTML = html;
  body.querySelector('[data-back]').onclick = exitRoute;
  body.querySelector('[data-journey]').onclick = () => (state.journey ? stopJourney() : startJourney());
  body.querySelector('[data-overview]').onclick = () => { stopJourney(); closeReader(); set({ stopIndex: -1 }); globe?.setStop(-1); markStop(); globe?.overview(); };
  body.querySelectorAll('[data-stop]').forEach((b) => (b.onclick = () => { stopJourney(); selectStop(Number(b.dataset.stop)); }));
  body.querySelector('.stops').addEventListener('keydown', (e) => {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
    const btns = [...body.querySelectorAll('[data-stop]')];
    const i = btns.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    btns[Math.max(0, Math.min(btns.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))].focus();
  });
}

function markStop() {
  document.querySelectorAll('.stop').forEach((b) => {
    const cur = Number(b.dataset.stop) === state.stopIndex;
    if (cur) { b.setAttribute('aria-current', 'step'); b.scrollIntoView({ block: 'nearest', behavior: state.reduceMotion ? 'auto' : 'smooth' }); }
    else b.removeAttribute('aria-current');
  });
  updateCaption();
}

function selectStop(i, { openText = true } = {}) {
  const route = routeById(state.routeId);
  if (!route || i < 0 || i >= route.stops.length) return;
  set({ stopIndex: i, nodeId: route.stops[i].n });
  globe?.setStop(i);
  markStop();
  const flight = globe ? globe.flyToStop(i, 0.34) : Promise.resolve();
  if (openText) openReader(route.stops[i].n, { stopIndex: i, focus: false });
  const n = nodeById(route.stops[i].n);
  live(`תחנה ${i + 1} מתוך ${route.stops.length}: ${n.title}`);
  return flight;
}

function updateCaption() {
  const route = routeById(state.routeId);
  if (!route) return;
  const i = state.stopIndex;
  if (i < 0) { $('jCaption').innerHTML = `<b>${escapeHtml(route.title)}</b> · ${route.stops.length} תחנות — לחצו ▶ למסע מודרך`; return; }
  const s = route.stops[i];
  const n = nodeById(s.n);
  $('jCaption').innerHTML = `${i + 1}/${route.stops.length} · <b>${escapeHtml(n.title)}</b>${s.occTotal > 1 ? ` (${s.occ}/${s.occTotal})` : ''}${s.note ? ` — ${escapeHtml(s.note)}` : ''}`;
}

// ───────────────────────── guided journey ─────────────────────────
async function startJourney() {
  const route = routeById(state.routeId);
  if (!route) return;
  set({ journey: true });
  setPlayUi(true);
  if (innerWidth < 760) setCollapsed(true);
  let i = state.stopIndex >= route.stops.length - 1 ? 0 : state.stopIndex + 1;
  const step = async () => {
    if (!state.journey) return;
    if (i >= route.stops.length) { stopJourney(); globe?.overview(); live('המסע הסתיים'); return; }
    closeReader();
    await selectStop(i, { openText: false });
    if (!state.journey) return;
    i++;
    journeyTimer = setTimeout(step, state.reduceMotion ? 4600 : 4000);
  };
  step();
}

function stopJourney() {
  clearTimeout(journeyTimer);
  if (state.journey) { set({ journey: false }); setPlayUi(false); }
}

function setPlayUi(playing) {
  $('jPlayIcon').textContent = playing ? '❚❚' : '▶';
  $('jPlayLabel').textContent = playing ? 'עצירת המסע' : 'התחלת מסע מודרך';
  const b = document.querySelector('[data-journey]');
  if (b) b.textContent = playing ? '❚❚ עצירת המסע' : '▶ מסע מודרך';
}

function showLegend(show) {
  const l = $('legend');
  l.hidden = !show;
  l.innerHTML = `<span><i class="seq"></i>סדר כרונולוגי (הזרימה מראה את הכיוון)</span><span><i class="contains"></i>מכיל</span><span><i class="adds"></i>נוסף אל</span><span><i class="varies"></i>משתנה לפי מנהג</span><span><i class="related"></i>קשור</span>`;
}

// ───────────────────────── search ─────────────────────────
let searchSeq = 0;
let activeResult = -1;
async function runSearch(q) {
  const box = $('searchResults');
  const seq = ++searchSeq;
  state.query = q;
  const nq = normalize(q);
  if (!nq) { box.hidden = true; $('searchInput').setAttribute('aria-expanded', 'false'); return; }
  const terms = nq.split(' ');
  const titleHits = state.world.nodes
    .filter((n) => { const hay = normalize(n.title + ' ' + n.d + ' ' + (n.w || '')); return terms.every((t) => hay.includes(t)); })
    .sort((a, b) => (normalize(b.title).includes(nq) ? 1 : 0) - (normalize(a.title).includes(nq) ? 1 : 0))
    .slice(0, 8);
  const routeHits = state.world.routes.filter((r) => terms.every((t) => normalize(r.title + ' ' + r.d).includes(t))).slice(0, 4);
  render(titleHits, routeHits, null);
  try {
    const idx = await loadSearch(state.nusach);
    if (seq !== searchSeq) return;
    const textHits = [];
    // whole-phrase matches first, then entries containing every term
    for (const pass of [0, 1]) {
      for (const e of idx) {
        if (textHits.length >= 14 || textHits.some((h) => h.n === e.n)) continue;
        const pos = pass === 0 ? e.f.indexOf(nq) : e.f.indexOf(terms[0]);
        if (pos < 0 || (pass === 1 && !terms.every((t) => e.f.includes(t)))) continue;
        const a = Math.max(0, pos - 40);
        textHits.push({ n: e.n, snip: (a ? '…' : '') + e.x.slice(a, pos + 80) + '…', snipF: e.f.slice(a, pos + 80) });
      }
    }
    render(titleHits, routeHits, textHits);
  } catch {
    if (seq === searchSeq) render(titleHits, routeHits, []);
  }

  function render(titles, routes, texts) {
    // highlight using the folded copy so final letters match, but display the original letters
    const mark = (s, f) => {
      if (!f) return escapeHtml(s);
      const off = s.length - f.length - 1; // leading ellipsis
      const hit = new Array(s.length).fill(false);
      for (const t of terms) { let i = f.indexOf(t); while (t && i >= 0) { for (let k = 0; k < t.length; k++) hit[i + k + off] = true; i = f.indexOf(t, i + 1); } }
      let h = '', open = false;
      [...s].forEach((ch, i) => { if (hit[i] && !open) { h += '<mark>'; open = true; } if (!hit[i] && open) { h += '</mark>'; open = false; } h += escapeHtml(ch); });
      return h + (open ? '</mark>' : '');
    };
    let html = '';
    if (routes.length) html += `<div class="group">מסלולים</div>` + routes.map((r) => `<button class="res" role="option" data-route="${r.id}"><strong>${escapeHtml(r.title)}</strong><span>${r.stops.length} תחנות</span></button>`).join('');
    if (titles.length) html += `<div class="group">תפילות ורכיבים</div>` + titles.map((n) => `<button class="res" role="option" data-node="${n.id}"><strong>${escapeHtml(n.title)}</strong><span>${escapeHtml(regionById(n.region).name)} · ${escapeHtml(n.w || '')}</span></button>`).join('');
    if (texts === null) html += `<div class="group">בטקסט התפילות</div><div class="empty">מחפשים בטקסטים בנוסח ${escapeHtml(nusachById(state.nusach).short)}…</div>`;
    else if (texts.length) html += `<div class="group">בטקסט התפילות · נוסח ${escapeHtml(nusachById(state.nusach).short)}</div>` + texts.map((h) => `<button class="res" role="option" data-node="${h.n}" data-q="1"><strong>${escapeHtml(nodeById(h.n).title)}</strong><span>${mark(h.snip, h.snipF)}</span></button>`).join('');
    if (!html || (!titles.length && !routes.length && texts && !texts.length))
      html = `<div class="empty">לא נמצאו תוצאות ל״${escapeHtml(q)}״ בנוסח ${escapeHtml(nusachById(state.nusach).short)}.<br>אפשר לחפש עם ניקוד או בלעדיו, שם של תפילה (״כל נדרי״) או מילים מתוכה (״אבינו מלכנו״). ${['baladi', 'shami'].includes(state.nusach) ? 'בנוסח זה יש מעט טקסטים זמינים — נסו נוסח אחר.' : ''}</div>`;
    box.innerHTML = html;
    box.hidden = false;
    activeResult = -1;
    $('searchInput').setAttribute('aria-expanded', 'true');
    box.querySelectorAll('.res').forEach((b) => (b.onclick = () => chooseResult(b)));
  }
}

function chooseResult(b) {
  $('searchResults').hidden = true;
  $('searchInput').setAttribute('aria-expanded', 'false');
  if (b.dataset.route) { state.query = ''; activateRoute(b.dataset.route); return; }
  if (!b.dataset.q) state.query = '';
  if (state.routeId && !routeById(state.routeId).stops.some((s) => s.n === b.dataset.node)) exitRoute();
  selectNode(b.dataset.node);
}

// ───────────────────────── tooltip / hint ─────────────────────────
function showTooltip(id, x, y) {
  const t = $('tooltip');
  if (!id) { t.hidden = true; return; }
  const n = nodeById(id);
  const rec = n.texts[state.nusach];
  t.innerHTML = `<strong>${escapeHtml(n.title)}</strong><span class="muted">${escapeHtml(regionById(n.region).name)} · ${STATUS_HE[n.k]} · ${TEXT_STATUS_HE[rec?.status || 'unavailable']}</span><br>${escapeHtml(n.w || '')}`;
  t.hidden = false;
  const w = t.offsetWidth, h = t.offsetHeight;
  t.style.left = Math.min(innerWidth - w - 10, Math.max(10, x - w / 2)) + 'px';
  t.style.top = Math.max(70, y - h - 18) + 'px';
}

let lastHintAlt = -1;
function updateZoomHint(alt) {
  if (Math.abs(alt - lastHintAlt) < 0.005) return;
  lastHintAlt = alt;
  const hint = $('zoomHint');
  const pct = Math.round((1 - (Math.log(alt) - Math.log(0.07)) / (Math.log(3.4) - Math.log(0.07))) * 100);
  const msg = alt > 1.5 ? 'גלגלו או צבטו כדי להתקרב — הכותרות יתגלו' : alt > 0.6 ? 'המשיכו להתקרב — מילות התפילה יופיעו' : alt > 0.3 ? 'מילות התפילה במקומן בעולם · לחצו כדי לקרוא' : 'קריאה מקרוב · לחצו על תפילה לטקסט המלא';
  hint.innerHTML = `<span class="meter"><i style="width:${pct}%"></i></span>${msg}`;
}

// ───────────────────────── text view ─────────────────────────
function renderTextView() {
  const tv = $('textView');
  const ns = nusachById(state.nusach);
  const regions = state.world.regions
    .map((r) => {
      const items = state.world.nodes.filter((n) => n.region === r.id)
        .map((n) => `<li><button data-node="${n.id}"><strong>${escapeHtml(n.title)}</strong><span>${STATUS_HE[n.k]} · ${TEXT_STATUS_HE[n.texts[state.nusach]?.status || 'unavailable']}</span></button></li>`).join('');
      return `<section class="tv-region"><h3>${escapeHtml(r.name)}</h3><ul>${items}</ul></section>`;
    }).join('');
  const routes = state.world.routes
    .map((r) => `<section class="tv-region"><h3>${escapeHtml(r.title)}</h3><p class="intro">${escapeHtml(r.d)}</p><ol style="display:block;columns:2 260px;padding-inline-start:20px">${r.stops
      .map((s, i) => `<li style="margin:3px 0"><button data-route="${r.id}" data-stop="${i}" style="background:none;border:0;text-align:right;padding:2px;color:${stopOff(s) ? 'var(--dim)' : 'var(--parchment)'}">${escapeHtml(nodeById(s.n).title)}${s.occTotal > 1 ? ` <span class="tag occ">${s.occ}/${s.occTotal}</span>` : ''}${stopOff(s) ? ' <span class="tag off">לא בנוסח זה</span>' : ''}</button></li>`).join('')}</ol></section>`)
    .join('');
  tv.innerHTML = `
    ${state.noWebGL ? '<div class="notice warn fallback-note">הדפדפן או המכשיר אינם תומכים בגרפיקה תלת־ממדית (WebGL), ולכן מוצגת תצוגת הטקסט. כל התוכן, המסלולים והטקסטים זמינים כאן במלואם.</div>' : ''}
    <h2>כל התפילות</h2>
    <p class="intro">תצוגה נגישה של עולם התפילות, בנוסח <b>${escapeHtml(ns.name)}</b>. כל כפתור פותח את הקורא עם ההסבר והטקסט המלא.</p>
    ${regions}
    <h2>מסלולים</h2>
    ${routes}`;
  tv.querySelectorAll('[data-node]').forEach((b) => (b.onclick = () => { if (state.routeId) exitRoute(); selectNode(b.dataset.node, { fly: false }); }));
  tv.querySelectorAll('[data-route]').forEach((b) => (b.onclick = () => {
    if (state.routeId !== b.dataset.route) activateRoute(b.dataset.route);
    selectStop(Number(b.dataset.stop));
  }));
}

function applyView() {
  const tv = state.textView;
  $('textView').hidden = !tv;
  $('stage').style.visibility = tv ? 'hidden' : 'visible';
  $('viewToggle').setAttribute('aria-pressed', String(tv));
  $('viewToggle').querySelector('.label').textContent = tv ? 'תצוגת גלובוס' : 'תצוגת טקסט';
  $('routesPanel').hidden = tv;
  $('legend').hidden = tv || !state.routeId;
  $('journeyBar').hidden = tv || !state.routeId;
  $('zoomHint').hidden = tv;
  if (state.noWebGL) { $('viewToggle').disabled = true; $('viewToggle').title = 'תצוגת הגלובוס אינה זמינה במכשיר זה'; }
}

// ───────────────────────── about ─────────────────────────
function renderAbout() {
  const w = state.world;
  const rows = w.nusachim.map((n) => {
    const c = { full: 0, excerpt: 0, lens: 0, historical: 0, unavailable: 0, 'lens-only': 0 };
    for (const node of w.nodes) c[node.texts[n.id].status]++;
    const has = c.full + c.excerpt + c.lens + c.historical;
    return `<tr><td><b>${escapeHtml(n.name)}</b></td><td>${has} / ${w.nodes.length}</td><td>${c.full + c.lens}</td><td>${c.excerpt + c.historical}</td><td>${c.unavailable + c['lens-only']}</td></tr>`;
  }).join('');
  $('aboutCard').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center"><h2 id="aboutTitle">אודות תפילה</h2><button class="reader-close" data-close aria-label="סגירה">✕</button></div>
    <p>tfila הוא עולם תלת־ממדי של ${w.nodes.length} תפילות, רכיבים וטקסים, ו־${w.routes.length} מסלולים לפי זמנים, מועדים ואירועי חיים. הנוסח המוגדר מראש הוא <b>ספרדי / עדות המזרח</b>.</p>
    <h3>מקורות ורישיונות</h3>
    <p>כל טקסט ליטורגי מגיע ממהדורה מסוימת בספריא (Sefaria), דרך הייצוא הציבורי של מאגר ספריא, וליד כל טקסט מוצגים שם הספר, הסעיף, המהדורה, הרישיון וקישור לספריא. כשמהדורה אינה זמינה בנוסח שנבחר — הדבר מסומן במפורש, ונוסח אחר מוצג רק לבקשתכם ובתווית ברורה. חלק מהמהדורות (בעיקר מוויקיטקסט ומחזורי מצודה ונוסח ספרד) מופיעות בספריא בלי רישיון מוגדר; הן מסומנות ״רישיון לא צוין בספריא״.</p>
    <table><thead><tr><th>נוסח</th><th>עם טקסט</th><th>מלא / בסיס</th><th>קטע / היסטורי</th><th>חסר</th></tr></thead><tbody>${rows}</tbody></table>
    <h3>מה אינו כאן</h3>
    <p>אין במקורות הפתוחים תכלאל תימני (בלדי או שאמי), סידור הרש״ש עם הכוונות, מחזורי חב״ד לשבת ולמועדים, הושענות ספרדיות ונוסחי כתובה. ההסברים נכתבו לצורך הלימוד וההתמצאות; הם מתארים מנהגים נפוצים בקווים כלליים, אינם פסיקת הלכה, ואינם ממצים את כל מנהגי הקהילות. לשאלות מעשיות — פנו לרב הקהילה.</p>
    <h3>ניווט</h3>
    <p>גררו כדי לסובב, גללו או צבטו כדי להתקרב: מרחוק רואים כותרות, מקרוב — את מילות התפילה עצמן. מקלדת: חצים לסיבוב, + ו־− לזום, Enter לבחירת התפילה שבמרכז, / לחיפוש, Esc לסגירה. ״תצוגת טקסט״ מציגה את כל התוכן ללא תלת־ממד.</p>
    <p style="color:var(--dim);font-size:12.5px">נתונים נבנו ב־${escapeHtml(w.generated)}.</p>`;
  $('aboutCard').querySelector('[data-close]').onclick = () => toggleAbout(false);
}
function toggleAbout(open) {
  const m = $('about');
  if (open) { renderAbout(); m.hidden = false; m.querySelector('[data-close]').focus(); }
  else { m.hidden = true; $('aboutButton').focus(); }
}

// ───────────────────────── framing ─────────────────────────
function updateInsets() {
  if (!globe) return;
  const mobile = innerWidth <= 760;
  const reader = $('reader'), routes = $('routesPanel');
  const readerOpen = !reader.hidden;
  const routesOpen = !routes.hidden && !routes.classList.contains('collapsed');
  if (mobile) globe.setInsets({ top: 110, bottom: readerOpen ? 0 : (routesOpen ? routes.offsetHeight : 60) + ($('journeyBar').hidden ? 0 : 66) });
  else globe.setInsets({
    top: 70,
    right: routesOpen ? routes.offsetWidth + 18 : 70,
    left: readerOpen && innerWidth > 1100 ? reader.offsetWidth + 18 : 0,
  });
}

// ───────────────────────── wiring ─────────────────────────
function setCollapsed(c) {
  $('routesPanel').classList.toggle('collapsed', c);
  document.body.classList.toggle('routes-collapsed', c);
  $('routesCollapse').setAttribute('aria-expanded', String(!c));
  $('routesCollapse').querySelector('[aria-hidden]').textContent = c ? '⟨' : '⟩';
}

function bindUi() {
  $('nusachButton').onclick = () => toggleNusach();
  $('nusachList').addEventListener('keydown', (e) => {
    const opts = [...$('nusachList').querySelectorAll('.nusach-opt')];
    const i = opts.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); opts[(i + 1) % opts.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); opts[(i - 1 + opts.length) % opts.length].focus(); }
    if (e.key === 'Escape') { toggleNusach(false); $('nusachButton').focus(); }
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nusach-picker')) toggleNusach(false);
    if (!e.target.closest('.search')) { $('searchResults').hidden = true; $('searchInput').setAttribute('aria-expanded', 'false'); }
  });

  let deb;
  $('searchInput').addEventListener('input', (e) => { clearTimeout(deb); deb = setTimeout(() => runSearch(e.target.value), 140); });
  $('searchInput').addEventListener('focus', (e) => { if (e.target.value) runSearch(e.target.value); });
  $('searchInput').addEventListener('keydown', (e) => {
    const res = [...$('searchResults').querySelectorAll('.res')];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      activeResult = Math.max(0, Math.min(res.length - 1, activeResult + (e.key === 'ArrowDown' ? 1 : -1)));
      res.forEach((r, i) => r.setAttribute('aria-selected', String(i === activeResult)));
      res[activeResult]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      const r = res[activeResult] || res[0];
      if (r) { e.preventDefault(); chooseResult(r); }
    } else if (e.key === 'Escape') { e.stopPropagation(); $('searchResults').hidden = true; e.target.blur(); }
  });

  $('viewToggle').onclick = () => { state.textView = !state.textView; applyView(); if (state.textView) $('textView').focus(); else $('globe').focus(); };
  document.querySelector('.skip-link').onclick = (e) => { e.preventDefault(); state.textView = true; applyView(); $('textView').focus(); };
  $('motionToggle').onclick = () => set({ reduceMotion: !state.reduceMotion });
  $('aboutButton').onclick = () => toggleAbout(true);
  $('about').addEventListener('click', (e) => { if (e.target.id === 'about') toggleAbout(false); });
  $('routesCollapse').onclick = () => setCollapsed(!$('routesPanel').classList.contains('collapsed'));

  $('jPlay').onclick = () => (state.journey ? stopJourney() : startJourney());
  // RTL: "next" points left
  $('jNext').onclick = () => { stopJourney(); selectStop(Math.min(routeById(state.routeId).stops.length - 1, state.stopIndex + 1)); };
  $('jPrev').onclick = () => { stopJourney(); selectStop(Math.max(0, state.stopIndex - 1)); };

  document.addEventListener('tfila:goto', (e) => { if (state.routeId && !routeById(state.routeId).stops.some((s) => s.n === e.detail)) exitRoute(); selectNode(e.detail); });
  document.addEventListener('tfila:reader-closed', () => { if (!state.routeId) { set({ nodeId: null }); globe?.setSelected(null); } });

  document.addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName);
    if (e.key === '/' && !typing) { e.preventDefault(); $('searchInput').focus(); return; }
    if (e.key === 'Escape' && !typing) {
      if (!$('about').hidden) return toggleAbout(false);
      if (state.journey) return stopJourney();
      if (isReaderOpen()) { closeReader(); document.dispatchEvent(new CustomEvent('tfila:reader-closed')); return; }
      if (state.routeId) return exitRoute();
    }
    if (state.routeId && !typing && document.activeElement === $('globe') && (e.key === 'n' || e.key === 'p')) {
      selectStop(state.stopIndex + (e.key === 'n' ? 1 : -1));
    }
  });

  subscribe((ch) => {
    if (ch.reduceMotion) {
      document.body.classList.toggle('reduce-motion', state.reduceMotion);
      $('motionToggle').setAttribute('aria-pressed', String(state.reduceMotion));
      globe?.setReduceMotion(state.reduceMotion);
      savePrefs();
    }
  });
  document.body.classList.toggle('reduce-motion', state.reduceMotion);
  $('motionToggle').setAttribute('aria-pressed', String(state.reduceMotion));
  addEventListener('resize', () => { globe?.measureLabels(); updateInsets(); });
  new MutationObserver(updateInsets).observe($('reader'), { attributes: true, attributeFilter: ['hidden'] });
  new MutationObserver(updateInsets).observe($('routesPanel'), { attributes: true, attributeFilter: ['class', 'hidden'] });
  updateInsets();
  document.fonts?.ready?.then(() => globe?.measureLabels());
}

boot();
