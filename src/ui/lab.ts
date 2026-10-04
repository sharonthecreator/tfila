// The lab panels around the instrument: explain card, readouts, control dock and the LIVE inset.
import { state, nodeById, regionById, nusachById, worldById, currentRoute, textRecord, stopOff, KIND_HE, STATUS_HE, REL_IN_HE, REL_HE } from '../state';
import type { NusachId, PrayerNode, Route, TextStatus } from '../types';
import { escapeHtml, fmt } from '../hebrew';
import { loadText } from '../data';
import { $, emit, coverageGlyph } from './dom';

const SEC_COLORS = ['#5fe0ff', '#ffb547', '#ff6fae', '#5dffa2', '#ffe07a', '#c9a2ff', '#7fb2ff', '#ff8a7a', '#b6f06a'];
let previews: Record<string, string> = {};
export const setLivePreviews = (p: Record<string, string>) => { previews = p; };

/** Sections of a route: [{name, start, end, color}] and a per-stop section index. */
export function sections(route: Route) {
  const secs: { name: string; start: number; end: number; color: string }[] = [];
  const of: number[] = [];
  route.stops.forEach((s, i) => {
    if (s.sec || !secs.length) secs.push({ name: s.sec || route.title, start: i, end: i, color: SEC_COLORS[secs.length % SEC_COLORS.length] });
    secs[secs.length - 1].end = i;
    of.push(secs.length - 1);
  });
  return { secs, of };
}

const pct = (i: number, n: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
const wordBar = (w?: number) => (w ? Math.min(100, (Math.log10(w + 1) / Math.log10(4000)) * 100) : 0);
const coverage = (ns: NusachId) => state.world.nodes.filter((n) => n.texts[ns].id || n.texts[ns].kav).length;

function subjLink(n: PrayerNode, label?: string): string {
  const c = regionById(n.region).color;
  return `<button class="subj" style="color:${c}" data-node="${n.id}">${escapeHtml(label || n.title)}</button>`;
}

/** world of the ladder: name chip, and a sentence on where the placement comes from */
function worldChip(n: PrayerNode): string {
  const w = worldById(n.world);
  return `<span style="color:${w.color};border-color:${w.color}55">${['I', 'II', 'III', 'IV'][state.world.worlds.indexOf(w)]} · ${w.he}${n.wsrc === 'ari' ? ' · האר״י' : ''}</span>`;
}
function worldLine(n: PrayerNode): string {
  const w = worldById(n.world);
  return n.wsrc === 'ari'
    ? `<p><strong>בסולם:</strong> עולם ה<b style="color:${w.color}">${w.he}</b> — לפי חלוקת האר״י לתפילת השחר (שער הכוונות): ${escapeHtml(w.ari)}</p>`
    : `<p><strong>בסולם:</strong> עולם ה<b style="color:${w.color}">${w.he}</b> <span style="color:var(--faint)">— שיבוץ מבני של tfila (${escapeHtml(w.rule.split(':')[0])}), לא קביעה קבלית.</span></p>`;
}

/** one-click link to the passage at its source */
function sourceLink(rec: { url?: string; src?: string } | null | undefined): string {
  if (!rec?.url) return '';
  return `<p class="src-link"><strong>מקור:</strong> <a href="${escapeHtml(rec.url)}" target="_blank" rel="noopener">${escapeHtml(rec.src || 'ספריא')} — פתיחה בספריא ↗</a></p>`;
}

// ───────────────────────────── breadcrumbs ─────────────────────────────
/** Where am I, and one clear way back: סולם התפילות › route › stop (or › prayer). */
export function renderCrumbs(): void {
  const el = $('crumbs');
  const route = currentRoute();
  const node = state.nodeId ? nodeById(state.nodeId) : null;
  if (!route && !node) { el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  const parts: string[] = [`<button class="crumb" data-home>סולם התפילות</button>`];
  if (route) {
    parts.push(state.stopIndex >= 0 ? `<button class="crumb" data-up>${escapeHtml(route.title)}</button>` : `<span class="crumb cur" aria-current="page">${escapeHtml(route.title)}</span>`);
    if (state.stopIndex >= 0) parts.push(`<span class="crumb cur" aria-current="page"><span class="mono">${state.stopIndex + 1}/${route.stops.length}</span> ${escapeHtml(nodeById(route.stops[state.stopIndex].n).title)}</span>`);
  } else if (node) {
    parts.push(`<span class="crumb cur" aria-current="page" style="--c:${regionById(node.region).color}">${escapeHtml(node.title)}</span>`);
  }
  const upLabel = route && state.stopIndex >= 0 ? 'חזרה למסלול' : 'חזרה לסולם';
  el.innerHTML = `<button class="back" data-up title="${upLabel} (Esc)" aria-label="${upLabel}"><span aria-hidden="true">→</span> ${upLabel}</button>
    <ol>${parts.map((x) => `<li>${x}</li>`).join('')}</ol>
    ${route ? `<button class="exit" data-exit title="יציאה מהמסלול" aria-label="יציאה מהמסלול ${escapeHtml(route.title)}">✕</button>` : ''}`;
  el.querySelectorAll<HTMLElement>('[data-up]').forEach((b) => (b.onclick = () => emit('up')));
  el.querySelector<HTMLElement>('[data-home]')!.onclick = () => emit('home');
  el.querySelector<HTMLElement>('[data-exit]')?.addEventListener('click', () => emit('exit-route'));
}

// ───────────────────────────── explain ─────────────────────────────
export function renderExplain(): void {
  const el = $('explain');
  const route = currentRoute();
  const ns = nusachById(state.nusach);
  let html = '';

  if (route && state.stopIndex >= 0) {
    const s = route.stops[state.stopIndex];
    const n = nodeById(s.n);
    const { secs, of } = sections(route);
    const sec = secs[of[state.stopIndex]];
    const rec = textRecord(n, state.nusach, s);
    const next = route.stops[state.stopIndex + 1];
    const prev = route.stops[state.stopIndex - 1];
    const others = route.stops.map((x, i) => ({ x, i })).filter(({ x, i }) => x.n === s.n && i !== state.stopIndex);
    const off = stopOff(s);
    html = `
      <span class="eyebrow" style="color:${sec.color}">${escapeHtml(sec.name)} · תחנה ${state.stopIndex + 1}/${route.stops.length}</span>
      <h2>${escapeHtml(n.title)}</h2>
      <div class="spec">${worldChip(n)}<span>${KIND_HE[s.cond || n.k]}</span>${s.occTotal > 1 ? `<span>מופע ${s.occ}/${s.occTotal}</span>` : ''}<span>${STATUS_HE[rec.status]}${rec.words ? ` · ${fmt(rec.words)} מילים` : ''}</span></div>
      ${s.note ? `<p class="lead">${escapeHtml(s.note)}</p>` : ''}
      ${off ? `<div class="notice warn">${s.omit ? 'תחנה זו מראה מה <b>נשמט</b> כאן — היא אינה נאמרת במעמד זה.' : `תחנה זו אינה חלק מהמנהג בנוסח <b>${escapeHtml(ns.short)}</b>.`}</div>` : ''}
      <div class="body">
        <p>${escapeHtml(n.d)}</p>
        <p><strong>מתי:</strong> ${escapeHtml(n.w)}</p>
        ${n.v ? `<p><strong>הבדלי מנהג:</strong> ${escapeHtml(n.v)}</p>` : ''}
        ${worldLine(n)}
        ${off ? '' : sourceLink(rec)}
        ${others.length ? `<p><strong>חוזרת במסלול:</strong> ${others.map(({ i }) => `<button class="subj" style="color:var(--accent-2)" data-stop="${i}">תחנה ${i + 1}</button>`).join(' · ')}</p>` : ''}
        ${prev ? `<p>לפני: ${subjLink(nodeById(prev.n))}${next ? ` · אחרי: ${subjLink(nodeById(next.n))}` : ''}</p>` : next ? `<p>אחרי: ${subjLink(nodeById(next.n))}</p>` : ''}
      </div>
      <div class="actions"><button class="btn primary" data-read>קריאת הטקסט המלא</button>${next ? `<button class="btn" data-stop="${state.stopIndex + 1}">התחנה הבאה ←</button>` : ''}<button class="btn" data-up>→ מבט על המסלול</button></div>`;
  } else if (route) {
    const { secs } = sections(route);
    const repeated = [...new Set(route.stops.filter((s) => s.occTotal > 1).map((s) => s.n))].map((id) => ({ n: nodeById(id), c: route.stops.filter((s) => s.n === id).length }));
    const withText = route.stops.filter((s) => !stopOff(s) && textRecord(nodeById(s.n), state.nusach, s).id).length;
    html = `
      <span class="eyebrow">מסלול · ${escapeHtml(route.group)}</span>
      <h2>${escapeHtml(route.title)}</h2>
      <div class="spec"><span>${route.stops.length} תחנות</span><span>${secs.length} חלקים</span><span>${withText}/${route.stops.length} עם טקסט</span></div>
      <p class="lead">${escapeHtml(route.d)}</p>
      <div class="body">
        ${repeated.length ? `<p><strong>תפילות חוזרות:</strong> ${repeated.map((r) => `${subjLink(r.n)} <span class="num">×${r.c}</span>`).join(' · ')}</p>` : ''}
        <p><strong>חלקי המסלול:</strong> ${secs.map((s) => `<button class="subj" style="color:${s.color}" data-stop="${s.start}">${escapeHtml(s.name)}</button>`).join(' · ')}</p>
      </div>
      <div class="actions"><button class="btn primary" data-journey>▶ מסע מודרך</button><button class="btn" data-stop="0">לתחנה הראשונה</button><button class="btn" data-exit>→ חזרה לסולם</button></div>
      <div class="hint">הקו המקווקו מראה את <b>סדר הזמן</b>, והאור הנע — את הכיוון. <span style="color:#c9f6ff">תכלת — עלייה בסולם</span> · <span style="color:#ffc46b">ענבר — ירידה</span>. קשרים: <span style="color:#ffd27a">מכיל</span> · <span style="color:#5dffa2">נוסף אל</span> · <span style="color:#c9a2ff">משתנה לפי מנהג</span> · <span style="color:#7fb2ff">קשור</span>.</div>`;
  } else if (state.nodeId) {
    const n = nodeById(state.nodeId);
    const reg = regionById(n.region);
    const rec = n.texts[state.nusach];
    const ins = state.world.nodes.flatMap((m) => m.rel.filter((r) => r.target === n.id).map((r) => ({ r, m })));
    html = `
      <span class="eyebrow" style="color:${reg.color}">${escapeHtml(reg.name)} · ${worldById(n.world).he}</span>
      <h2>${escapeHtml(n.title)}</h2>
      <div class="spec">${worldChip(n)}<span>${KIND_HE[n.k]}</span><span>${STATUS_HE[rec.status]}${rec.words ? ` · ${fmt(rec.words)} מילים` : ''}</span>${n.tags.includes('kabbalah') ? '<span>✧ קבלי</span>' : ''}</div>
      <p class="lead">${escapeHtml(n.d)}</p>
      <div class="body">
        <p><strong>מתי:</strong> ${escapeHtml(n.w)}</p>
        ${n.v ? `<p><strong>הבדלי מנהג:</strong> ${escapeHtml(n.v)}</p>` : ''}
        ${worldLine(n)}
        ${sourceLink(rec)}
        ${n.rel.map((r) => `<p>${REL_HE[r.type]}: ${subjLink(nodeById(r.target))}${r.note ? ` <span style="color:var(--faint)">(${escapeHtml(r.note)})</span>` : ''}</p>`).join('')}
        ${ins.map(({ r, m }) => `<p>${REL_IN_HE[r.type]}: ${subjLink(m)}${r.note ? ` <span style="color:var(--faint)">(${escapeHtml(r.note)})</span>` : ''}</p>`).join('')}
        ${routesWith(n.id)}
      </div>
      <div class="actions"><button class="btn primary" data-read>קריאת הטקסט המלא</button><button class="btn" data-up>→ חזרה לסולם</button></div>`;
  } else {
    const featured = state.world.routes.filter((r) => r.featured);
    html = `
      <span class="eyebrow">סולם התפילות</span>
      <h2>${state.world.nodes.length} תפילות · 4 עולמות</h2>
      <p class="lead">״סֻלָּם מֻצָּב אַרְצָה וְרֹאשׁוֹ מַגִּיעַ הַשָּׁמָיְמָה״. כל שלב בסולם הוא תפילה, ברכה או טקס. כל סיבוב של הסולם הוא עולם — <b style="color:${state.world.worlds[0].color}">עשיה</b>, <b style="color:${state.world.worlds[1].color}">יצירה</b>, <b style="color:${state.world.worlds[2].color}">בריאה</b>, <b style="color:${state.world.worlds[3].color}">אצילות</b> — כפי שהאר״י חילק את תפילת השחר; וכל צד של הסולם הוא תחום. בחרו מסלול וראו אותו <strong>עולה ויורד</strong>; <strong>התקרבו</strong> — והמילים עצמן מופיעות על השלבים.</p>
      <div class="actions">${featured.map((r) => `<button class="btn primary" data-route="${r.id}">✦ ${escapeHtml(r.title)}</button>`).join('')}</div>
      <ul class="regions">${state.world.regions.map((r) => `<li><button data-region="${r.id}" style="color:${r.color}"><i></i><span style="color:#d8e0ec">${escapeHtml(r.name)}</span><small>${state.world.nodes.filter((n) => n.region === r.id).length}</small></button></li>`).join('')}</ul>
      <div class="hint">גררו לסיבוב ולטיפוס · <kbd>גלגלת</kbd> להתקרבות · <kbd>Enter</kbd> בחירה · <kbd>/</kbd> חיפוש · <kbd>Esc</kbd> חזרה. הנוסח הנוכחי: <b style="color:${ns.color}">${escapeHtml(ns.name)}</b>.</div>`;
  }
  el.innerHTML = html;
  el.querySelectorAll<HTMLElement>('[data-node]').forEach((b) => (b.onclick = () => emit('goto', b.dataset.node)));
  el.querySelectorAll<HTMLElement>('[data-stop]').forEach((b) => (b.onclick = () => emit('stop', Number(b.dataset.stop))));
  el.querySelectorAll<HTMLElement>('[data-route]').forEach((b) => (b.onclick = () => emit('route', b.dataset.route)));
  el.querySelectorAll<HTMLElement>('[data-region]').forEach((b) => (b.onclick = () => emit('region', b.dataset.region)));
  el.querySelector<HTMLElement>('[data-read]')?.addEventListener('click', () => emit('read'));
  el.querySelector<HTMLElement>('[data-journey]')?.addEventListener('click', () => emit('journey'));
  el.querySelector<HTMLElement>('[data-exit]')?.addEventListener('click', () => emit('exit-route'));
  el.querySelector<HTMLElement>('[data-overview]')?.addEventListener('click', () => emit('overview'));
  el.querySelector<HTMLElement>('[data-up]')?.addEventListener('click', () => emit('up'));
}

function routesWith(id: string): string {
  const rs = state.world.routes.filter((r) => r.stops.some((s) => s.n === id));
  if (!rs.length) return '';
  return `<p><strong>במסלולים:</strong> ${rs.map((r) => `<button class="subj" style="color:var(--accent-2)" data-route="${r.id}">${escapeHtml(r.title)}</button>`).join(' · ')}</p>`;
}

// ───────────────────────────── readouts ─────────────────────────────
let readoutToken = 0;
export function renderReadouts(): void {
  const el = $('readouts');
  const route = currentRoute();
  const ns = nusachById(state.nusach);
  const my = ++readoutToken;

  if (route) {
    const n = route.stops.length;
    const i = state.stopIndex;
    const s = i >= 0 ? route.stops[i] : null;
    const node = s ? nodeById(s.n) : null;
    const rec = node ? textRecord(node, state.nusach, s) : null;
    const { secs, of } = sections(route);
    const secIdx = i >= 0 ? of[i] : 0;
    const sec = secs[secIdx];
    const withText = route.stops.filter((x) => !stopOff(x) && textRecord(nodeById(x.n), state.nusach, x).id).length;
    const list = route.stops.map((x, k) => ({ x, k })).filter(({ k }) => of[k] === secIdx);
    el.innerHTML = `
      <div class="ro-grid">
        <div class="ro big accent"><label>תחנה</label><div class="val">${i >= 0 ? i + 1 : '—'}<small>/${n}</small></div></div>
        <div class="ro big"><label>מופע</label><div class="val">${s ? s.occ : '—'}<small>/${s ? s.occTotal : '—'}</small></div></div>
        <div class="ro"><label>נוסח</label><div class="val he" style="color:${ns.color}">${escapeHtml(ns.short)}</div></div>
        <div class="ro"><label>טקסט במסלול</label><div class="val">${withText}<small>/${n}</small></div></div>
      </div>
      <div class="track" aria-hidden="true">
        <div class="rail"></div>
        <div class="zone" style="right:${pct(sec.start, n)}%;width:${Math.max(1.5, pct(sec.end, n) - pct(sec.start, n))}%"></div>
        ${route.stops.map((x, k) => `<span class="sd ${stopOff(x) ? 'off' : ''}" style="right:${pct(k, n)}%;background:${secs[of[k]].color}"></span>`).join('')}
        ${i >= 0 ? `<div class="mark" style="right:${pct(i, n)}%"></div>` : ''}
        ${secs.map((x, k) => `<span class="tk mono" style="right:${pct(x.start, n)}%">${k + 1}</span>`).join('')}
      </div>
      ${ladderSpark(route, i)}
      <dl class="ro-extra">
        <div><dt>חלק</dt><dd style="color:${sec.color};font-family:var(--sans)">${escapeHtml(sec.name)}</dd></div>
        <div><dt>מילים</dt><dd>${rec?.words ? fmt(rec.words) : '—'}</dd></div>
        <div><dt>מעמד</dt><dd style="font-family:var(--sans)">${node ? KIND_HE[s!.cond || node.k] : '—'}</dd></div>
        <div><dt>מקור</dt><dd style="font-family:var(--sans)" title="${escapeHtml(rec?.src || '')}">${escapeHtml(rec?.src || '—')}</dd></div>
      </dl>
      <ul class="subjects">${list.map(({ x, k }) => {
        const nn = nodeById(x.n);
        const r = textRecord(nn, state.nusach, x);
        const st: TextStatus | 'off' = stopOff(x) ? 'off' : r.status;
        return `<li data-stop="${k}" class="${k === i ? 'cur' : ''}" style="color:${sec.color}">
          <span class="dot"></span><span class="name">${escapeHtml(nn.title)}<small>${k + 1}</small></span>
          <span class="coc"><span class="pill ${st}">${st === 'off' ? 'לא בנוסח' : STATUS_HE[st]}</span>${r.words ? fmt(r.words) : ''}</span>
          <span class="bar"><i style="width:${wordBar(r.words)}%"></i></span></li>`;
      }).join('')}</ul>`;
  } else if (state.nodeId) {
    const n = nodeById(state.nodeId);
    const rec = n.texts[state.nusach];
    const reg = regionById(n.region);
    const rels = n.rel.length + state.world.nodes.reduce((a, m) => a + m.rel.filter((r) => r.target === n.id).length, 0);
    const avail = state.world.nusachim.filter((x) => n.texts[x.id].id).length;
    el.innerHTML = `
      <div class="ro-grid">
        <div class="ro big accent"><label>מילים</label><div class="val">${rec.words ? fmt(rec.words) : '—'}</div></div>
        <div class="ro big"><label>נוסחים</label><div class="val">${avail}<small>/${state.world.nusachim.length}</small></div></div>
        <div class="ro"><label>מעמד</label><div class="val he">${KIND_HE[n.k]}</div></div>
        <div class="ro"><label>קשרים</label><div class="val">${rels}</div></div>
      </div>
      <dl class="ro-extra">
        <div><dt>תחום</dt><dd style="color:${reg.color};font-family:var(--sans)">${escapeHtml(reg.name)}</dd></div>
        <div><dt>עולם</dt><dd style="color:${worldById(n.world).color};font-family:var(--sans)">${worldById(n.world).he}${n.wsrc === 'ari' ? ' · האר״י' : ''}</dd></div>
        <div><dt>סטטוס</dt><dd style="font-family:var(--sans)">${STATUS_HE[rec.status]}</dd></div>
        <div style="grid-column:1/-1"><dt>מהדורה · רישיון</dt><dd id="roEdition" style="font-family:var(--sans)">${rec.id ? '…' : '—'}</dd></div>
      </dl>
      <ul class="subjects">${state.world.nusachim.map((x) => {
        const r = n.texts[x.id];
        return `<li data-ns="${x.id}" class="${x.id === state.nusach ? 'cur' : ''}" style="color:${x.color}">
          <span class="dot"></span><span class="name">${escapeHtml(x.short)}</span>
          <span class="coc"><span class="pill ${r.status}">${STATUS_HE[r.status]}</span>${r.words ? fmt(r.words) : ''}</span>
          <span class="bar"><i style="width:${wordBar(r.words)}%"></i></span></li>`;
      }).join('')}</ul>`;
    if (rec.id) loadText(rec.id).then((p) => {
      if (my !== readoutToken) return;
      const e = document.getElementById('roEdition');
      if (e) e.textContent = [...new Set(p.parts.map((x) => `${x.versionHe || x.version} · ${x.licenseHe}`))].join(' / ');
    }).catch(() => {});
  } else {
    const cov = coverage(state.nusach);
    el.innerHTML = `
      <div class="ro-grid">
        <div class="ro big accent"><label>תפילות</label><div class="val">${state.world.nodes.length}</div></div>
        <div class="ro big"><label>מסלולים</label><div class="val">${state.world.routes.length}</div></div>
        <div class="ro"><label>נוסח</label><div class="val he" style="color:${ns.color}">${escapeHtml(ns.short)}</div></div>
        <div class="ro"><label>עם טקסט</label><div class="val">${cov}<small>/${state.world.nodes.length}</small></div></div>
      </div>
      <dl class="ro-extra">
        <div><dt>טקסטים</dt><dd>${fmt(new Set(state.world.nodes.flatMap((n) => Object.values(n.texts).map((t) => t.id).filter(Boolean))).size)}</dd></div>
        <div><dt>מקור</dt><dd style="font-family:var(--sans)">ספריא · מהדורות פתוחות</dd></div>
      </dl>
      <ul class="subjects">${state.world.nusachim.map((x) => {
        const c = coverage(x.id);
        const st: TextStatus = x.textual === 'none' ? 'unavailable' : x.textual === 'historical' ? 'historical' : x.textual === 'lens' ? 'lens' : x.textual === 'partial' ? 'excerpt' : 'full';
        return `<li data-ns="${x.id}" class="${x.id === state.nusach ? 'cur' : ''}" style="color:${x.color}">
          <span class="dot"></span><span class="name">${escapeHtml(x.short)}</span>
          <span class="coc"><span class="pill ${st}">${x.textual === 'partial' ? 'חלקי' : x.textual === 'none' ? 'אין טקסט' : STATUS_HE[st]}</span>${c}</span>
          <span class="bar"><i style="width:${(c / state.world.nodes.length) * 100}%"></i></span></li>`;
      }).join('')}</ul>`;
  }
  el.querySelectorAll<HTMLElement>('[data-stop]').forEach((b) => (b.onclick = () => emit('stop', Number(b.dataset.stop))));
  el.querySelectorAll<HTMLElement>('[data-ns]').forEach((b) => (b.onclick = () => emit('nusach', b.dataset.ns)));
}

/** The route's climb: the world of every stop, bottom (עשיה) to top (אצילות), with ascents and descents counted. */
function ladderSpark(route: Route, cur: number): string {
  const W = 300, H = 74, pad = 8, n = route.stops.length;
  const lvl = route.stops.map((s) => state.world.worlds.findIndex((w) => w.id === nodeById(s.n).world));
  const x = (k: number) => W - pad - (n <= 1 ? 0.5 : k / (n - 1)) * (W - pad * 2);
  const y = (l: number) => H - 12 - (l / 3) * (H - 24);
  let path = `M${x(0).toFixed(1)},${y(lvl[0]).toFixed(1)}`;
  for (let k = 1; k < n; k++) path += ` H${x(k).toFixed(1)} V${y(lvl[k]).toFixed(1)}`;
  let up = 0, down = 0, peaks = 0;
  for (let k = 1; k < n; k++) { if (lvl[k] > lvl[k - 1]) up++; if (lvl[k] < lvl[k - 1]) down++; if (lvl[k] === 3 && lvl[k - 1] < 3) peaks++; }
  if (lvl[0] === 3) peaks++;
  const rows = state.world.worlds.map((w, l) => `<line x1="${pad}" x2="${W - pad}" y1="${y(l)}" y2="${y(l)}" stroke="${w.color}" stroke-opacity=".18" stroke-dasharray="2 4"/><text x="${W - 2}" y="${y(l) - 3}" text-anchor="end" fill="${w.color}" fill-opacity=".75">${w.he}</text>`).join('');
  return `<figure class="climb" aria-label="עליות וירידות בסולם: ${up} עליות, ${down} ירידות, ${peaks} הגעות לאצילות">
    <figcaption><span class="lbl">הטיפוס בסולם</span><span class="mono">↑${up} ↓${down} · אצילות ×${peaks}</span></figcaption>
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${rows}
      <path d="${path}" fill="none" stroke="#c9f6ff" stroke-width="1.6" stroke-linejoin="round"/>
      ${cur >= 0 ? `<circle cx="${x(cur)}" cy="${y(lvl[cur])}" r="4" fill="#9ff0ff" stroke="#031016" stroke-width="1.5"/>` : ''}
    </svg></figure>`;
}

// ───────────────────────────── dock ─────────────────────────────
export function renderDock(): void {
  const el = $('dock');
  const route = currentRoute();
  const ns = nusachById(state.nusach);
  let first = '';
  if (route) {
    const n = route.stops.length;
    const { secs, of } = sections(route);
    const i = Math.max(0, state.stopIndex);
    const cur = state.stopIndex >= 0 ? nodeById(route.stops[i].n).title : 'בחרו תחנה';
    first = `<div class="ctl">
      <div class="ctl-head"><label class="lbl" for="scrub">ציר המסלול · ${escapeHtml(route.title)}</label><output>${state.stopIndex >= 0 ? `${i + 1}/${n} · ` : ''}${escapeHtml(cur)}</output></div>
      <div class="slider">
        <div class="rail"></div><div class="fill" style="width:${pct(i, n)}%"></div>
        <div class="marks">${route.stops.map((x, k) => `<i class="${stopOff(x) ? 'off' : ''}" style="right:${pct(k, n)}%;color:${secs[of[k]].color}"></i>`).join('')}</div>
        <input id="scrub" type="range" min="0" max="${n - 1}" step="1" value="${i}" aria-valuetext="תחנה ${i + 1}: ${escapeHtml(cur)}" />
        <div class="ticks">${secs.filter((_, k) => secs.length <= 7 || k % 2 === 0).map((x) => `<span style="right:${pct(x.start, n)}%">${escapeHtml(x.name.split(' ').slice(0, 2).join(' '))}</span>`).join('')}</div>
      </div>
      <div class="quick">${secs.map((x) => `<button class="btn" data-stop="${x.start}" aria-pressed="${state.stopIndex >= x.start && state.stopIndex <= x.end}" style="color:${x.color}"><span class="sw"></span><span style="color:#d9e1ed">${escapeHtml(x.name)}</span></button>`).join('')}</div>
    </div>`;
  } else {
    const rs = [...state.world.routes].sort((a, b) => Number(b.featured) - Number(a.featured));
    first = `<div class="ctl">
      <div class="ctl-head"><span class="lbl">מסלולים</span><output>${state.world.routes.length} מסלולים · בחרו אחד</output></div>
      <div class="quick">${rs.map((r) => `<button class="btn" data-route="${r.id}" style="color:${r.featured ? 'var(--accent)' : 'var(--faint)'}"><span class="sw"></span><span style="color:#d9e1ed">${r.featured ? '✦ ' : ''}${escapeHtml(r.title)}</span><small>${r.stops.length}</small></button>`).join('')}</div>
    </div>`;
  }
  const tiles = state.world.nusachim.map((x) => {
    const frac = coverage(x.id) / state.world.nodes.length;
    return `<button class="btn" data-ns="${x.id}" aria-pressed="${x.id === state.nusach}" title="${escapeHtml(x.name)} — ${coverage(x.id)}/${state.world.nodes.length} עם טקסט">${coverageGlyph(frac, x.color, x.short[0])}<span>${escapeHtml(x.short)}</span></button>`;
  }).join('');
  const third = route
    ? `<button class="btn" data-act="overview">מבט על המסלול</button><button class="btn" data-act="focus">אל התחנה</button><button class="btn" data-act="read">קריאה</button><button class="btn" data-act="journey" aria-pressed="${state.journey}">${state.journey ? '❚❚ עצירה' : '▶ מסע מודרך'}</button>`
    : `<button class="btn" data-act="overview">מבט כללי</button><button class="btn" data-act="read" ${state.nodeId ? '' : 'disabled'}>קריאה</button><button class="btn" data-act="library">ספרייה</button><button class="btn" data-act="learn">למדו</button>`;
  el.innerHTML = `${first}
    <div class="ctl ns-ctl"><div class="ctl-head"><span class="lbl">נוסח</span><output style="color:${ns.color}">${escapeHtml(ns.name)}</output></div><div class="ns-tiles" role="group" aria-label="בחירת נוסח">${tiles}</div></div>
    <div class="ctl view-ctl"><div class="ctl-head"><span class="lbl">תצוגה</span><output>${route ? (state.journey ? 'מסע פעיל' : 'מסלול') : 'חופשית'}</output></div>
      <div class="seg" role="group" aria-label="סוג קווים"><button data-rel="0" aria-pressed="${!state.relView}">רצף בלבד</button><button data-rel="1" aria-pressed="${state.relView}">רצף + קשרים</button></div>
      <div class="cams">${third}</div></div>`;

  const scrub = el.querySelector<HTMLInputElement>('#scrub');
  scrub?.addEventListener('input', () => emit('stop', Number(scrub.value)));
  el.querySelectorAll<HTMLElement>('[data-stop]').forEach((b) => (b.onclick = () => emit('stop', Number(b.dataset.stop))));
  el.querySelectorAll<HTMLElement>('[data-route]').forEach((b) => (b.onclick = () => emit('route', b.dataset.route)));
  el.querySelectorAll<HTMLElement>('[data-ns]').forEach((b) => (b.onclick = () => emit('nusach', b.dataset.ns)));
  el.querySelectorAll<HTMLElement>('[data-rel]').forEach((b) => (b.onclick = () => emit('relview', b.dataset.rel === '1')));
  el.querySelectorAll<HTMLElement>('[data-act]').forEach((b) => (b.onclick = () => emit(b.dataset.act!)));
  document.documentElement.style.setProperty('--dock-h', el.offsetHeight + 'px');
}

// ───────────────────────────── LIVE inset ─────────────────────────────
export function renderLive(): void {
  const frame = $('liveFrame');
  const route = currentRoute();
  const id = route && state.stopIndex >= 0 ? route.stops[state.stopIndex].n : state.nodeId;
  const ns = nusachById(state.nusach);
  $('live').querySelector('.edge')!.textContent = route && state.stopIndex >= 0 ? `TFILA · ${state.stopIndex + 1}/${route.stops.length}` : `TFILA · ${state.world.nodes.length}`;
  if (!id) {
    frame.innerHTML = `<div class="hud"><span class="rec">LIVE</span><span>${escapeHtml(ns.short)}</span></div><div class="empty">בחרו תפילה — ומילותיה ירוצו כאן,<br>כפי שהן מופיעות בנוסח ${escapeHtml(ns.short)}.</div>`;
    return;
  }
  const n = nodeById(id);
  const words = previews[n.id];
  const rec = route && state.stopIndex >= 0 ? textRecord(n, state.nusach, route.stops[state.stopIndex]) : n.texts[state.nusach];
  frame.innerHTML = `<div class="hud"><span class="rec">LIVE</span><span>${escapeHtml(n.title)}</span></div>
    ${words ? `<div class="scroll"><p style="--crawl:${Math.max(18, words.split(' ').length * 0.55)}s">${escapeHtml(words)} …</p></div>` : `<div class="empty">${rec.status === 'unavailable' ? `הטקסט אינו זמין בנוסח ${escapeHtml(ns.short)}` : escapeHtml(n.d)}</div>`}
    <div class="hud bottom"><span>${escapeHtml(ns.short)}</span><span>${STATUS_HE[rec.status]}${rec.words ? ` · ${fmt(rec.words)}` : ''}</span></div>`;
}
