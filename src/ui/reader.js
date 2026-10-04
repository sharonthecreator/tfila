// The reader: comfortable full-text reading with source, edition, license and context.
import { state, set, nodeById, regionById, nusachById, routeById, STATUS_HE, REL_HE, TEXT_STATUS_HE } from '../state.js';
import { loadText } from '../data.js';
import { escapeHtml, normalize, stripMarksKeepTags } from '../hebrew.js';

const el = document.getElementById('reader');
const inner = document.getElementById('readerInner');
let prefs = { nikud: true, size: 1.32 };
try { prefs = { ...prefs, ...JSON.parse(localStorage.getItem('tfila.reader') || '{}') }; } catch {}
const savePrefs = () => { try { localStorage.setItem('tfila.reader', JSON.stringify(prefs)); } catch {} };
document.documentElement.style.setProperty('--reader-size', prefs.size + 'rem');

let current = null; // { nodeId, stopIndex, override, tab }
let renderToken = 0;

export function closeReader() {
  el.hidden = true;
  current = null;
}

export function isReaderOpen() { return !el.hidden; }

/** Pick the text record for a node (or a route stop) in a nusach. */
export function textRecord(node, nusach, stop) {
  if (stop?.t?.[nusach]) return { ...stop.t[nusach], fromStop: true };
  return node.texts[nusach];
}

export async function openReader(nodeId, { stopIndex = null, override = null, focus = true } = {}) {
  const node = nodeById(nodeId);
  if (!node) return;
  current = { nodeId, stopIndex, override, tab: 'text' };
  el.hidden = false;
  await render();
  if (focus) inner.querySelector('h2')?.focus();
}

export function rerenderReader() { if (current && !el.hidden) render(); }

async function render() {
  const token = ++renderToken;
  const { nodeId, stopIndex, override } = current;
  const node = nodeById(nodeId);
  const region = regionById(node.region);
  const route = state.routeId ? routeById(state.routeId) : null;
  const stop = route && stopIndex != null ? route.stops[stopIndex] : null;
  const nusach = override?.nusach || state.nusach;
  const ns = nusachById(state.nusach);
  const rec = override?.gen ? { ...node.gen, status: 'generic' } : textRecord(node, nusach, stop);

  const stopInfo = stop
    ? `תחנה ${stopIndex + 1} מתוך ${route.stops.length} · ${escapeHtml(route.title)}` +
      (stop.occTotal > 1 ? ` · מופע ${stop.occ} מתוך ${stop.occTotal} במסלול` : '')
    : '';
  const statusTag = `<span class="tag ${stop?.cond || node.k}">${STATUS_HE[stop?.cond || node.k] || ''}</span>`;
  const kabTag = node.tags.includes('kabbalah') ? '<span class="tag kab">רכיב קבלי</span>' : '';

  const rels = [
    ...node.rel.map((r) => ({ ...r, dir: 'out', other: r.target })),
    ...state.world.nodes.flatMap((n) => n.rel.filter((r) => r.target === node.id).map((r) => ({ ...r, dir: 'in', other: n.id }))),
  ];
  const relHtml = rels.length
    ? `<div class="relations" aria-label="קשרים">${rels
        .map((r) => {
          const o = nodeById(r.other);
          const label = r.dir === 'out' ? REL_HE[r.type] : { contains: 'חלק מתוך', adds: 'מקבל תוספת', varies: 'משתנה לפי מנהג', related: 'קשור' }[r.type];
          const color = { contains: 'var(--contains)', adds: 'var(--adds)', varies: 'var(--varies)', related: 'var(--related)' }[r.type];
          return `<button class="rel-chip" data-goto="${o.id}"><i style="background:${color}"></i>${label}: <b>${escapeHtml(o.title)}</b>${r.note ? ` <span class="muted">(${escapeHtml(r.note)})</span>` : ''}</button>`;
        })
        .join('')}</div>`
    : '';

  const avail = state.world.nusachim
    .map((n) => {
      const r = textRecord(node, n.id, stop);
      const st = r?.status || 'unavailable';
      return `<button class="avail ${st} ${n.id === state.nusach ? 'current' : ''}" data-nusach="${n.id}" title="${escapeHtml(n.name)}: ${TEXT_STATUS_HE[st]}">${escapeHtml(n.short)}</button>`;
    })
    .join('');

  let routeNote = '';
  if (stop) {
    const off = stop.omit || (stop.only && !stop.only.includes(state.nusach));
    routeNote = `<div class="notice ${off ? 'warn' : ''}">${stop.note ? escapeHtml(stop.note) : ''}${
      stop.omit ? '<br><b>תחנה זו מוצגת כדי להראות מה נשמט: היא אינה נאמרת במעמד זה.</b>' : off ? `<br><b>תחנה זו אינה חלק מהמנהג בנוסח ${escapeHtml(ns.short)}.</b>` : ''
    }</div>`;
  }

  inner.innerHTML = `
    <div class="reader-top">
      <div class="row">
        <span class="region">${escapeHtml(region.name)}</span>
        <button class="reader-close" data-close aria-label="סגירת הקורא">✕</button>
      </div>
      <h2 tabindex="-1">${escapeHtml(node.title)}</h2>
      <div class="stopinfo">${stopInfo}</div>
    </div>
    <section>
      <div>${statusTag} ${kabTag}</div>
      <p class="lead">${escapeHtml(node.d)}</p>
      <dl class="facts">
        <dt>מתי</dt><dd>${escapeHtml(node.w || '')}</dd>
        ${node.v ? `<dt>הבדלי מנהג</dt><dd>${escapeHtml(node.v)}</dd>` : ''}
      </dl>
      ${routeNote}
      ${relHtml}
      <div class="availability" aria-label="זמינות הטקסט לפי נוסח">${avail}</div>
    </section>
    <div id="readerText"><p class="prayer" style="color:var(--muted)">טוען טקסט…</p></div>
  `;

  inner.querySelector('[data-close]').onclick = () => { closeReader(); document.dispatchEvent(new CustomEvent('tfila:reader-closed')); };
  inner.querySelectorAll('[data-goto]').forEach((b) => (b.onclick = () => document.dispatchEvent(new CustomEvent('tfila:goto', { detail: b.dataset.goto }))));
  inner.querySelectorAll('[data-nusach]').forEach((b) => (b.onclick = () => set({ nusach: b.dataset.nusach })));

  const textEl = inner.querySelector('#readerText');
  textEl.innerHTML = await renderTextArea(node, rec, nusach, stop, override);
  if (token !== renderToken) return;
  wireTextArea(textEl, node);
}

function sourceCard(payload, label) {
  return payload.parts
    .map(
      (p) => `<div class="source-card">
        ${label ? `<span class="status">${label}</span>` : ''}
        <b>${escapeHtml(p.bookHe)}</b> › ${escapeHtml(p.section || '')}${p.excerpt ? ' <span class="tag">קטע</span>' : ''}<br>
        מהדורה: ${escapeHtml(p.versionHe || p.version)} · רישיון: ${escapeHtml(p.licenseHe)}<br>
        ${p.versionSource ? `מקור המהדורה: <a href="${escapeHtml(p.versionSource)}" target="_blank" rel="noopener">${escapeHtml(shortUrl(p.versionSource))}</a> · ` : ''}
        <a href="${escapeHtml(p.sefaria)}" target="_blank" rel="noopener">פתיחה בספריא ↗</a>
      </div>`,
    )
    .join('');
}

const shortUrl = (u) => u.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];

function segmentsHtml(payload, q) {
  const multi = payload.parts.length > 1;
  return payload.parts
    .map((p) => {
      const head = multi ? `<div class="part-head">${escapeHtml(p.section)}</div>` : '';
      return head + p.segments.map((s) => `<p>${prefs.nikud ? s : stripMarksKeepTags(s)}</p>`).join('');
    })
    .join('');
}

const tools = () => `
  <div class="reader-tools">
    <div class="seg" role="group" aria-label="ניקוד">
      <button data-nikud="1" aria-pressed="${prefs.nikud}">עם ניקוד</button>
      <button data-nikud="0" aria-pressed="${!prefs.nikud}">בלי ניקוד</button>
    </div>
    <div class="seg" role="group" aria-label="גודל גופן">
      <button data-size="-1" aria-label="הקטנת הגופן">א−</button>
      <button data-size="1" aria-label="הגדלת הגופן">א+</button>
    </div>
  </div>`;

async function renderTextArea(node, rec, nusach, stop, override) {
  const ns = nusachById(nusach);
  const nsName = escapeHtml(ns.name);

  if (override?.gen && node.gen) {
    const payload = await loadText(node.gen.id);
    return `<section><div class="notice">מוצג טקסט <b>שאינו משויך לנוסח מסוים</b> (מהדורה כללית בספריא). אין להסיק ממנו על נוסח ${escapeHtml(nusachById(state.nusach).short)}.</div>${sourceCard(payload)}${tools()}</section><div class="prayer">${segmentsHtml(payload)}</div>`;
  }

  if (override?.nusach && override.nusach !== state.nusach) {
    // explicit, labelled cross-nusach view
    const payload = rec?.id ? await loadText(rec.id) : null;
    if (!payload) return `<section><div class="notice warn">גם בנוסח ${nsName} הטקסט אינו זמין.</div></section>`;
    return `<section><div class="notice">שימו לב: מוצג כאן <b>נוסח ${nsName}</b> לבקשתכם, ולא נוסח ${escapeHtml(nusachById(state.nusach).short)}.</div>${sourceCard(payload, rec.status === 'excerpt' ? 'קטע' : 'טקסט מלא')}${tools()}</section><div class="prayer">${segmentsHtml(payload)}</div>`;
  }

  const status = rec?.status || 'unavailable';
  if (status === 'unavailable' || status === 'lens-only') {
    const alternatives = state.world.nusachim
      .filter((n) => n.id !== nusach && ['em', 'ash', 'sef', 'chabad'].includes(n.id) && textRecord(node, n.id, stop)?.id)
      .map((n) => `<button class="ghost-btn" data-alt="${n.id}">הצגה בנוסח ${escapeHtml(n.short)}</button>`)
      .join('');
    const gen = node.gen ? `<button class="ghost-btn" data-gen="1">טקסט כללי (לא משויך לנוסח)</button>` : '';
    const reason = node.explanationOnly
      ? 'לרכיב זה מוצג הסבר בלבד: אין לו טקסט ליטורגי זמין במקורות הפתוחים שבהם השתמשנו, או שנוסחו משתנה מקהילה לקהילה.'
      : nusach === 'shami'
        ? 'אין במקורות הפתוחים שבספריא תכלאל בנוסח שאמי, ולכן הטקסט אינו מוצג.'
        : nusach === 'baladi'
          ? 'אין במקורות הפתוחים שבספריא תכלאל בלדי. לתפילות המרכזיות מוצג ״סדר תפילות כל השנה״ של הרמב״ם — כאן אין לו מקבילה.'
          : `הטקסט של ״${escapeHtml(node.title)}״ בנוסח ${nsName} אינו זמין במקורות הפתוחים שבהם השתמשנו. לא נציג במקומו נוסח אחר בלי שתבקשו זאת במפורש.`;
    let kav = '';
    if (status === 'lens-only' && rec.kav) kav = await kavSection(rec.kav);
    return `<section><div class="notice warn"><b>${TEXT_STATUS_HE.unavailable}.</b> ${reason}${alternatives || gen ? `<div class="btns">${alternatives}${gen}</div>` : ''}</div></section>${kav}`;
  }

  const payload = await loadText(rec.id);
  let banner = '';
  if (status === 'lens') banner = `<div class="notice">עדשת הקבלה: טקסט התפילה הוא של <b>עדות המזרח</b>, שנוסחו נקבע על פי כוונות האר״י כפי שנמסרו על ידי הרש״ש. ${rec.kav ? 'מתחת לטקסט מצורף קטע מ״שער הכוונות״.' : ''}</div>`;
  if (status === 'historical') banner = `<div class="notice"><b>מקור היסטורי, לא סידור בלדי.</b> מוצג ״סדר תפילות כל השנה״ של הרמב״ם (משנה תורה), שעליו מבוסס נוסח בלדי. התכלאל הבלדי עצמו (למשל בעריכת מהרי״ץ) אינו זמין במקורות הפתוחים.</div>`;
  const label = status === 'excerpt' ? 'קטע' : status === 'historical' ? 'מקור היסטורי' : status === 'lens' ? 'בסיס: עדות המזרח' : 'טקסט מלא';
  let kav = '';
  if (status === 'lens' && rec.kav) kav = await kavSection(rec.kav);
  let extra = '';
  if (status === 'lens' && rec.extra) {
    const ep = await loadText(rec.extra.id);
    extra = `<section><h3 style="font-family:var(--serif);color:var(--gold-2)">${escapeHtml(rec.extra.label)}</h3>${sourceCard(ep, 'גרסה נוספת')}</section><div class="prayer">${segmentsHtml(ep)}</div>`;
  }
  const fromStop = rec.fromStop ? '<span class="tag occ">הטקסט של מופע זה במסלול</span> ' : '';
  return `<section>${banner}${sourceCard(payload, fromStop ? 'מופע זה' : label)}${fromStop}${tools()}</section>
    <div class="prayer" id="prayerBody">${segmentsHtml(payload)}</div>${kav}${extra}`;
}

async function kavSection(kav) {
  const payload = await loadText(kav.id);
  return `<section><h3 style="font-family:var(--serif);color:#ffe08a;margin-top:26px">שער הכוונות — שכבת הסוד</h3>
    <div class="notice">קטע מתוך ״שער הכוונות״ (ר׳ חיים ויטאל בשם האר״י) העוסק בתפילה זו. זהו טקסט עיוני־קבלי ולא נוסח תפילה לאמירה.</div>${sourceCard(payload, 'קטע')}</section>
    <div class="prayer kav">${segmentsHtml(payload)}</div>`;
}

function wireTextArea(root, node) {
  root.querySelectorAll('[data-nikud]').forEach((b) => (b.onclick = () => { prefs.nikud = b.dataset.nikud === '1'; savePrefs(); render(); }));
  root.querySelectorAll('[data-size]').forEach((b) => (b.onclick = () => {
    prefs.size = Math.min(2.2, Math.max(1, prefs.size + Number(b.dataset.size) * 0.12));
    savePrefs();
    document.documentElement.style.setProperty('--reader-size', prefs.size.toFixed(2) + 'rem');
  }));
  root.querySelectorAll('[data-alt]').forEach((b) => (b.onclick = () => { current.override = { nusach: b.dataset.alt }; render(); }));
  root.querySelectorAll('[data-gen]').forEach((b) => (b.onclick = () => { current.override = { gen: true }; render(); }));
  if (state.query) highlight(root.querySelector('#prayerBody'), state.query);
}

/** Wrap words that match the search query (ignoring nikud) in <mark>. */
function highlight(container, query) {
  if (!container) return;
  const terms = normalize(query).split(' ').filter((t) => t.length > 1);
  if (!terms.length) return;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  let first = null;
  for (const tn of nodes) {
    const parts = tn.nodeValue.split(/(\s+)/);
    if (!parts.some((w) => terms.some((t) => normalize(w).includes(t)))) continue;
    const frag = document.createDocumentFragment();
    for (const w of parts) {
      if (w.trim() && terms.some((t) => normalize(w).includes(t))) {
        const m = document.createElement('mark');
        m.textContent = w;
        frag.appendChild(m);
        first ||= m;
      } else frag.appendChild(document.createTextNode(w));
    }
    tn.parentNode.replaceChild(frag, tn);
  }
  if (first) setTimeout(() => first.scrollIntoView({ block: 'center', behavior: state.reduceMotion ? 'auto' : 'smooth' }), 60);
}
