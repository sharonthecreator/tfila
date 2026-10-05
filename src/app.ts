// tfila application: wires the instrument (the prayer ladder) to the lab UI, routes, reader and views.
// Navigation is layered — the ladder › a route › a stop (or the ladder › a prayer) — and every layer change
// is a browser history entry, so the browser's / phone's Back button and the on-screen "חזרה" both step up.
import { state, set, subscribe, nodeById, routeById, nusachById, regionById, currentRoute, KIND_HE, STATUS_HE, SPEEDS, type Quality, type Tab } from './state';
import type { NusachId } from './types';
import { loadWorld, loadPreview } from './data';
import { escapeHtml } from './hebrew';
import { $, on, emit, announce } from './ui/dom';
import { openReader, closeReader, rerenderReader, isReaderOpen } from './ui/reader';
import { renderExplain, renderReadouts, renderDock, renderLive, renderCrumbs, setLivePreviews } from './ui/lab';
import { bindSearch, run as runSearch } from './ui/search';
import { renderLibrary, renderCompare, renderLearn, renderHelp } from './ui/views';
import type { PrayerWorld } from './scene/PrayerWorld';
import { resolvePreset } from './render/quality';

let world3d: PrayerWorld | null = null;
let journeyTimer = 0;
let previews: Record<string, string> = {};

export async function boot(): Promise<void> {
  try {
    readPrefs();
    const fonts = Promise.race([
      Promise.all(['400 40px "Frank Ruhl Libre"', '700 40px "Inter Variable"', '600 30px "Heebo Variable"', '500 20px "JetBrains Mono Variable"'].map((f) => document.fonts.load(f, 'אבג 123'))),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
    state.world = await loadWorld();
    readHash();
    await fonts;

    const mod = await import('./scene/PrayerWorld');
    if (mod.webglAvailable()) {
      try {
        world3d = new mod.PrayerWorld($('gl') as HTMLCanvasElement, $('labels'), resolvePreset(state.quality).preset, {
          onSelect: (id) => selectNode(id),
          onHover: tooltip,
          onBackground: () => { if (!state.routeId && state.nodeId) { set({ nodeId: null }); world3d?.setSelected(null); renderAll(); } },
          onKeyNav: (id) => { if (id) announce(`במרכז: ${nodeById(id).title}`); },
        });
        world3d.setWorld(state.world);
        world3d.setReduceMotion(state.reduceMotion);
        world3d.setRelView(state.relView);
        world3d.speed = state.speed;
        world3d.onSlow = () => {
          if (state.quality !== 'auto') return;
          const lvl = resolvePreset('auto').level;
          if (lvl !== 'low') { world3d!.applyQuality(resolvePreset('low').preset); world3d!.onSlow = null; }
        };
      } catch (e) {
        console.error(e);
        world3d = null;
      }
    }
    if (!world3d) {
      state.noWebGL = true;
      $('app').hidden = true;
      state.tab = 'library';
    }

    await applyNusach();
    bindUi();
    bindSearch();
    renderAll();
    applyTab();

    if (state.routeId) activateRoute(state.routeId, { keepStop: true });
    else if (state.nodeId) selectNode(state.nodeId);
    else if (world3d) void world3d.flyHome({ duration: 2800 });
    history.replaceState({ tfila: true, level: levelKey() }, '', '#' + hashParams());
    lastLevel = levelKey();

    $('loader').classList.add('done');
  } catch (e) {
    console.error(e);
    $('loaderSub').textContent = 'לא הצלחנו לטעון את עולם התפילות. בדקו את החיבור ונסו שוב.';
    $('retry').hidden = false;
    $('retry').onclick = () => location.reload();
  }
}

// ───────────────────────────── prefs & URL ─────────────────────────────
function readPrefs(): void {
  const sysReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    const p = JSON.parse(localStorage.getItem('tfila.prefs') || '{}');
    if (p.nusach) state.nusach = p.nusach;
    if (p.quality) state.quality = p.quality;
    if (typeof p.speed === 'number' && p.speed >= 0.5 && p.speed <= 3) state.speed = p.speed;
    state.reduceMotion = typeof p.reduceMotion === 'boolean' ? p.reduceMotion : sysReduce;
  } catch {
    state.reduceMotion = sysReduce;
  }
}
function savePrefs(): void {
  try { localStorage.setItem('tfila.prefs', JSON.stringify({ nusach: state.nusach, reduceMotion: state.reduceMotion, quality: state.quality, speed: state.speed })); } catch { /* ignore */ }
}
interface NavTarget { nusach: NusachId | null; route: string | null; stop: number; node: string | null; tab: Tab }
function parseHash(): NavTarget {
  const p = new URLSearchParams(location.hash.slice(1));
  const n = p.get('n') as NusachId | null;
  const route = p.get('route');
  const node = p.get('node');
  const tab = p.get('tab') as Tab | null;
  return {
    nusach: n && state.world.nusachim.some((x) => x.id === n) ? n : null,
    route: route && state.world.routeMap.has(route) ? route : null,
    stop: p.get('stop') ? Number(p.get('stop')) - 1 : -1,
    node: node && state.world.nodeMap.has(node) ? node : null,
    tab: tab && ['world', 'library', 'compare', 'learn'].includes(tab) ? tab : 'world',
  };
}
function readHash(): void {
  const t = parseHash();
  if (t.nusach) state.nusach = t.nusach;
  if (t.route) { state.routeId = t.route; state.stopIndex = t.stop; }
  else if (t.node) state.nodeId = t.node;
  state.tab = t.tab;
}
function hashParams(): string {
  const p = new URLSearchParams();
  p.set('n', state.nusach);
  if (state.tab !== 'world') p.set('tab', state.tab);
  if (state.routeId) p.set('route', state.routeId);
  if (state.routeId && state.stopIndex >= 0) p.set('stop', String(state.stopIndex + 1));
  else if (state.nodeId) p.set('node', state.nodeId);
  return p.toString();
}
/** The navigation layer: changing it adds a history entry; moving between stops of a route replaces it. */
const levelKey = () => [state.tab, state.routeId || '', state.routeId ? '' : state.nodeId || ''].join('|');
let lastLevel = '';
let fromHistory = false;
let hashQueued = false;
function writeHash(): void {
  if (hashQueued) return;
  hashQueued = true;
  queueMicrotask(() => {
    hashQueued = false;
    const hash = '#' + hashParams();
    const level = levelKey();
    if (level !== lastLevel && !fromHistory && state.world) history.pushState({ tfila: true, level, prev: lastLevel }, '', hash);
    else history.replaceState({ ...(history.state || {}), tfila: true, level }, '', hash);
    lastLevel = level;
  });
}

/** Browser / phone Back and Forward: re-apply the layer that the URL describes. */
function applyHistory(): void {
  const t = parseHash();
  fromHistory = true;
  closeReader();
  stopJourney();
  if (t.nusach && t.nusach !== state.nusach) set({ nusach: t.nusach });
  if (t.tab !== state.tab) set({ tab: t.tab });
  if (t.route) {
    if (state.routeId !== t.route) { state.stopIndex = t.stop; activateRoute(t.route, { keepStop: true }); }
    else if (t.stop !== state.stopIndex) {
      if (t.stop >= 0) void selectStop(t.stop);
      else { set({ stopIndex: -1, nodeId: null }); world3d?.setStop(-1); void world3d?.overview(); renderAll(); }
    }
  } else {
    if (state.routeId) exitRoute(!t.node);
    if (t.node && t.node !== state.nodeId) selectNode(t.node);
    else if (!t.node && state.nodeId) clearNode();
  }
  queueMicrotask(() => queueMicrotask(() => { fromHistory = false; }));
}

/** One layer up: stop → route overview → the whole ladder; prayer → the whole ladder. */
function goUp(): void {
  stopJourney();
  if (state.routeId && state.stopIndex >= 0) {
    set({ stopIndex: -1, nodeId: null });
    world3d?.setStop(-1);
    void world3d?.overview();
    renderAll();
    announce(`מבט על המסלול ${currentRoute()!.title}`);
    return;
  }
  if (!state.routeId && !state.nodeId) return;
  // if the previous history entry is the layer above, really go back, so Back/Forward stay in step
  const parent = [state.tab, '', ''].join('|');
  if (history.state?.tfila && history.state.prev === parent) { history.back(); return; }
  if (state.routeId) exitRoute();
  else clearNode();
}

function clearNode(): void {
  set({ nodeId: null });
  world3d?.setSelected(null);
  void world3d?.flyHome();
  renderAll();
  announce('חזרה לסולם התפילות');
}

// ───────────────────────────── rendering ─────────────────────────────
function renderAll(): void {
  renderCrumbs();
  renderExplain();
  renderReadouts();
  renderDock();
  renderLive();
  updateInsets();
}

subscribe((ch) => {
  writeHash();
  if (ch.nusach) {
    savePrefs();
    void applyNusach().then(() => {
      if (state.routeId) { world3d?.setRoute(currentRoute(), state.nusach); if (state.stopIndex >= 0) world3d?.setStop(state.stopIndex); }
      renderAll();
      rerenderReader();
      if (state.tab === 'library') renderLibrary();
      if ($('q') === document.activeElement && state.query) void runSearch(state.query);
    });
    announce(`נבחר נוסח ${nusachById(state.nusach).name}`);
  }
  if (ch.reduceMotion) {
    document.body.classList.toggle('reduce-motion', state.reduceMotion);
    $('motionBtn').setAttribute('aria-pressed', String(state.reduceMotion));
    world3d?.setReduceMotion(state.reduceMotion);
    savePrefs();
  }
  if (ch.quality) {
    $('quality').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.q === state.quality)));
    world3d?.applyQuality(resolvePreset(state.quality).preset);
    savePrefs();
  }
  if (ch.relView) { world3d?.setRelView(state.relView); renderDock(); }
  if (ch.speed) {
    if (world3d) world3d.speed = state.speed;
    savePrefs();
    renderDock();
    announce(`קצב המסע: ${SPEEDS.find((x) => x.v === state.speed)?.he || state.speed}`);
  }
  if (ch.tab) applyTab();
});

async function applyNusach(): Promise<void> {
  try { previews = await loadPreview(state.nusach); } catch { previews = {}; }
  setLivePreviews(previews);
  world3d?.setPreviews(previews);
}

function applyTab(): void {
  const t = state.tab;
  document.body.dataset.tab = t;
  $('tabs').querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
  $('libraryView').hidden = t !== 'library';
  $('compareView').hidden = t !== 'compare';
  $('learnView').hidden = t !== 'learn';
  if (t === 'library') renderLibrary();
  if (t === 'compare') void renderCompare();
  if (t === 'learn') renderLearn();
  if (t !== 'world') { stopJourney(); $(`${t}View`).focus(); }
  if (state.noWebGL && t === 'library' && !document.getElementById('noWebglNote')) {
    $('libraryView').insertAdjacentHTML('afterbegin', `<div class="notice warn" id="noWebglNote" style="position:fixed;bottom:16px;left:16px;right:16px;z-index:32">הדפדפן או המכשיר אינם תומכים בגרפיקה תלת־ממדית (WebGL), ולכן מוצגת הספרייה. כל התוכן, המסלולים והטקסטים זמינים כאן.</div>`);
  }
}

// ───────────────────────────── selection ─────────────────────────────
function selectNode(id: string): void {
  const n = nodeById(id);
  if (!n) return;
  const route = currentRoute();
  if (route) {
    const idx = route.stops.findIndex((s, i) => s.n === id && i >= state.stopIndex);
    const any = idx >= 0 ? idx : route.stops.findIndex((s) => s.n === id);
    if (any >= 0) { selectStop(any); return; }
    exitRoute(false);
  }
  stopJourney();
  set({ nodeId: id });
  world3d?.setSelected(id);
  void world3d?.flyToNode(id);
  renderAll();
  announce(`נבחר: ${n.title}`);
}

function activateRoute(id: string, { keepStop = false } = {}): void {
  const route = routeById(id);
  if (!route) return;
  stopJourney();
  closeReader();
  const stopIndex = keepStop ? state.stopIndex : -1;
  set({ routeId: id, stopIndex, nodeId: null, tab: 'world' });
  world3d?.setSelected(null);
  world3d?.setRoute(route, state.nusach);
  if (stopIndex >= 0) selectStop(stopIndex);
  else { void world3d?.overview(); renderAll(); }
  announce(`מסלול ${route.title}: ${route.stops.length} תחנות`);
}

function exitRoute(fly = true): void {
  stopJourney();
  const title = currentRoute()?.title;
  set({ routeId: null, stopIndex: -1, nodeId: null });
  world3d?.setRoute(null, state.nusach);
  world3d?.setSelected(null);
  if (fly) void world3d?.flyHome();
  renderAll();
  if (title) announce(`יצאתם מהמסלול ${title}. חזרה לסולם התפילות`);
}

function selectStop(i: number): Promise<void> {
  const route = currentRoute();
  if (!route) return Promise.resolve();
  i = Math.max(0, Math.min(route.stops.length - 1, i));
  const from = state.stopIndex;
  set({ stopIndex: i, nodeId: route.stops[i].n });
  world3d?.setStop(i);
  renderAll();
  if (isReaderOpen()) void openReader(route.stops[i].n, { stopIndex: i });
  announce(`תחנה ${i + 1} מתוך ${route.stops.length}: ${nodeById(route.stops[i].n).title}`);
  // to the next or previous stop the camera travels along the ladder's lane; further jumps fly directly
  if (!world3d) return Promise.resolve();
  return Math.abs(i - from) === 1 ? world3d.travelTo(from, i) : world3d.flyToNode(route.stops[i].n);
}

function read(): void {
  const route = currentRoute();
  if (route && state.stopIndex >= 0) void openReader(route.stops[state.stopIndex].n, { stopIndex: state.stopIndex });
  else if (state.nodeId) void openReader(state.nodeId);
}

// ───────────────────────────── guided journey ─────────────────────────────
function startJourney(): void {
  const route = currentRoute();
  if (!route) return;
  closeReader();
  set({ journey: true });
  renderDock();
  let i = state.stopIndex >= route.stops.length - 1 ? 0 : state.stopIndex + 1;
  const step = async () => {
    if (!state.journey) return;
    if (i >= route.stops.length) { stopJourney(); void world3d?.overview(); announce('המסע הסתיים'); return; }
    await selectStop(i++);
    // the time spent at each stop, so its words can be read — set by the pace control
    if (state.journey) journeyTimer = window.setTimeout(step, (state.reduceMotion ? 4600 : 4000) / state.speed);
  };
  void step();
}
function stopJourney(): void {
  clearTimeout(journeyTimer);
  if (state.journey) { set({ journey: false }); renderDock(); }
}

// ───────────────────────────── chrome ─────────────────────────────
function tooltip(id: string | null, x: number, y: number): void {
  const t = $('tooltip');
  if (!id) { t.hidden = true; return; }
  const n = nodeById(id);
  const r = n.texts[state.nusach];
  t.innerHTML = `<b>${escapeHtml(n.title)}</b><span class="muted">${escapeHtml(regionById(n.region).name)} · ${KIND_HE[n.k]} · ${STATUS_HE[r.status]}</span><br>${escapeHtml(n.w)}`;
  t.hidden = false;
  t.style.left = Math.min(innerWidth - t.offsetWidth - 10, Math.max(10, x - t.offsetWidth / 2)) + 'px';
  t.style.top = Math.max(70, y - t.offsetHeight - 18) + 'px';
}

function updateInsets(): void {
  if (!world3d) return;
  const mobile = innerWidth <= 760;
  const ex = $('explain'), ro = $('readouts'), dock = $('dock');
  if (mobile) world3d.setInsets({ top: $('crumbs').hidden ? 110 : 196, bottom: dock.offsetHeight + ex.offsetHeight + 24 });
  else world3d.setInsets({
    top: 70,
    right: ex.offsetWidth + 30,
    left: ro.offsetParent ? ro.offsetWidth + 30 : 0,
    bottom: dock.offsetHeight + 20,
  });
  document.documentElement.style.setProperty('--live-h', `${Math.min(236, Math.max(150, innerHeight * 0.24))}px`);
}

function bindUi(): void {
  on('goto', (id) => selectNode(id as string));
  on('stop', (i) => { stopJourney(); void selectStop(i as number); });
  on('route', (id) => activateRoute(id as string));
  on('route-from-view', (id) => activateRoute(id as string));
  on('exit-route', () => exitRoute());
  on('up', goUp);
  on('home', () => { if (state.routeId) exitRoute(); else if (state.nodeId) clearNode(); else void world3d?.flyHome(); });
  on('region', (id) => void world3d?.flyToRegion(id as string));
  on('read', read);
  on('journey', () => (state.journey ? stopJourney() : startJourney()));
  on('overview', () => { stopJourney(); void world3d?.overview(); });
  on('focus', () => { const r = currentRoute(); if (r && state.stopIndex >= 0) void world3d?.flyToNode(r.stops[state.stopIndex].n); });
  on('nusach', (ns) => set({ nusach: ns as NusachId }));
  on('relview', (v) => set({ relView: v as boolean }));
  on('speed', (v) => set({ speed: v as number }));
  on('library', () => set({ tab: 'library' }));
  on('learn', () => set({ tab: 'learn' }));
  on('tab', (t) => set({ tab: t as Tab }));
  on('help', (v) => { $('help').hidden = !v; if (v) { renderHelp(); $('helpPanel').querySelector<HTMLElement>('[data-close]')?.focus(); } else $('helpBtn').focus(); });
  on('read-node', (id) => void openReader(id as string));
  on('read-stop', (d) => {
    const { route, stop } = d as { route: string; stop: number };
    if (state.routeId !== route) { set({ routeId: route }); world3d?.setRoute(routeById(route), state.nusach); }
    set({ stopIndex: stop, nodeId: routeById(route).stops[stop].n });
    world3d?.setStop(stop);
    void openReader(routeById(route).stops[stop].n, { stopIndex: stop });
  });
  on('search-pick', (id) => {
    if (state.tab !== 'world') set({ tab: 'world' });
    selectNode(id as string);
    void openReader(id as string, state.routeId ? { stopIndex: state.stopIndex } : {});
  });
  on('reader-closed', () => { /* keep selection; the ladder stays focused on it */ });

  $('tabs').querySelectorAll<HTMLElement>('button').forEach((b) => (b.onclick = () => set({ tab: b.dataset.tab as Tab })));
  $('quality').querySelectorAll<HTMLElement>('button').forEach((b) => (b.onclick = () => set({ quality: b.dataset.q as Quality })));
  $('quality').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.q === state.quality)));
  $('motionBtn').onclick = () => set({ reduceMotion: !state.reduceMotion });
  $('helpBtn').onclick = () => emit('help', true);
  $('help').addEventListener('click', (e) => { if (e.target === $('help')) emit('help', false); });
  $('skipLink').onclick = (e) => { e.preventDefault(); set({ tab: 'library' }); };
  const live = $('live');
  live.onclick = read;
  live.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); read(); } };

  document.body.classList.toggle('reduce-motion', state.reduceMotion);
  $('motionBtn').setAttribute('aria-pressed', String(state.reduceMotion));

  document.addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test((document.activeElement as HTMLElement)?.tagName || '');
    if (e.key === '/' && !typing) { e.preventDefault(); $('q').focus(); return; }
    if (e.key === 'Escape' && !typing) {
      if (!$('help').hidden) return emit('help', false);
      if (isReaderOpen()) return closeReader();
      if (state.tab !== 'world') return set({ tab: 'world' });
      if (state.journey) return stopJourney();
      if (state.routeId || state.nodeId) return goUp();
    }
    if (!typing && (e.key === '[' || e.key === ']')) {
      const k = SPEEDS.findIndex((x) => x.v === state.speed);
      const next = SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, (k < 0 ? 1 : k) + (e.key === ']' ? 1 : -1)))];
      set({ speed: next.v });
    }
    if (!typing && state.routeId && state.tab === 'world' && !isReaderOpen() && (e.key === 'n' || e.key === 'p')) {
      stopJourney();
      void selectStop(state.stopIndex + (e.key === 'n' ? 1 : -1));
    }
  });
  addEventListener('popstate', () => { if (state.world) applyHistory(); });
  addEventListener('resize', () => { world3d?.measureLabels(); updateInsets(); });
  document.fonts?.ready?.then(() => world3d?.measureLabels());
  const ro = new ResizeObserver(updateInsets);
  for (const id of ['explain', 'dock', 'readouts']) ro.observe($(id));
}
