// The reader: full text with source, edition, license and liturgical context.
import { state, set, nodeById, regionById, nusachById, currentRoute, textRecord, stopOff, KIND_HE, KIND_LONG, REL_HE, REL_IN_HE, REL_COLOR, STATUS_HE, STATUS_LONG } from '../state';
import type { NusachId, PrayerNode, Stop, TextPayload, TextRecord } from '../types';
import { loadText } from '../data';
import { escapeHtml, fmt, normalize, stripVowelsKeepTags } from '../hebrew';
import { $, emit } from './dom';

/** A gentle reminder, as printed siddurim carry: the texts contain holy names. */
const HOLY_NOTE = '<p class="holy-note">הטקסטים כוללים שמות קודש. אם תדפיסו אותם — נא לנהוג בדפים בכבוד ולגנוז אותם.</p>';

interface Current { nodeId: string; stopIndex: number | null; override: { nusach?: NusachId; gen?: boolean } | null }
let current: Current | null = null;
let token = 0;
let lastFocus: HTMLElement | null = null;
const prefs = { nikud: true, size: 1.3 };
try { Object.assign(prefs, JSON.parse(localStorage.getItem('tfila.reader') || '{}')); } catch { /* storage unavailable */ }
const savePrefs = () => { try { localStorage.setItem('tfila.reader', JSON.stringify(prefs)); } catch { /* ignore */ } };
document.documentElement.style.setProperty('--reader-size', prefs.size + 'rem');

export const isReaderOpen = (): boolean => !$('reader').hidden;

export function closeReader(): void {
  if (!current) return;
  $('reader').hidden = true;
  current = null;
  emit('reader-closed');
  lastFocus?.focus?.();
}

export async function openReader(nodeId: string, opts: { stopIndex?: number | null } = {}): Promise<void> {
  lastFocus = document.activeElement as HTMLElement;
  current = { nodeId, stopIndex: opts.stopIndex ?? null, override: null };
  $('reader').hidden = false;
  await render();
  ($('readerSheet').querySelector('h2') as HTMLElement | null)?.focus();
}

export function rerenderReader(): void { if (current && isReaderOpen()) void render(); }

$('reader').addEventListener('click', (e) => { if (e.target === $('reader')) closeReader(); });

function sourceCards(p: TextPayload, label: string): string {
  return `<div class="prov">${p.parts.map((x) => `<div class="card">
    <span class="pill ${label === 'קטע' || x.excerpt ? 'excerpt' : 'full'}">${escapeHtml(x.excerpt ? 'קטע' : label)}</span>
    <b>${escapeHtml(x.bookHe)}</b> › ${escapeHtml(x.section)}<br>
    מהדורה <span class="mono">${escapeHtml(x.versionHe || x.version)}</span> · רישיון <span class="mono">${escapeHtml(x.licenseHe)}</span><br>
    ${x.versionSource ? `<a href="${escapeHtml(x.versionSource)}" target="_blank" rel="noopener">מקור המהדורה ↗</a> · ` : ''}<a href="${escapeHtml(x.sefaria)}" target="_blank" rel="noopener">פתיחה בספריא ↗</a>
  </div>`).join('')}</div>`;
}

function segments(p: TextPayload): string {
  const multi = p.parts.length > 1;
  return p.parts.map((x) => (multi ? `<div class="part">${escapeHtml(x.section)}</div>` : '') + x.segments.map((s) => `<p>${prefs.nikud ? s : stripVowelsKeepTags(s)}</p>`).join('')).join('');
}

async function kavSection(id: string): Promise<string> {
  const p = await loadText(id);
  return `<div class="sec-title">שער הכוונות — שכבת הסוד</div>
    <div class="notice">קטע מ״שער הכוונות״ (ר׳ חיים ויטאל בשם האר״י) על תפילה זו. זהו טקסט עיוני־קבלי, לא נוסח לאמירה.</div>
    ${sourceCards(p, 'קטע')}<div class="prayer kav">${segments(p)}</div>`;
}

async function textArea(node: PrayerNode, rec: TextRecord, nusach: NusachId, stop: Stop | null): Promise<string> {
  const ov = current!.override;
  const nsName = escapeHtml(nusachById(nusach).name);
  if (ov?.gen && node.gen) {
    const p = await loadText(node.gen.id);
    return `<div class="notice">מוצג טקסט <b>שאינו משויך לנוסח מסוים</b> (מהדורה כללית בספריא). אין להסיק ממנו על נוסח ${escapeHtml(nusachById(state.nusach).short)}.</div>${sourceCards(p, 'כללי')}<div class="prayer">${segments(p)}</div>`;
  }
  if (ov?.nusach && ov.nusach !== state.nusach) {
    if (!rec.id) return `<div class="notice warn">גם בנוסח ${nsName} הטקסט אינו זמין.</div>`;
    const p = await loadText(rec.id);
    return `<div class="notice">מוצג כאן <b>נוסח ${nsName}</b> לבקשתכם — לא נוסח ${escapeHtml(nusachById(state.nusach).short)}.</div>${sourceCards(p, 'מלא')}<div class="prayer" id="prayerBody">${segments(p)}</div>${HOLY_NOTE}`;
  }
  if (rec.status === 'unavailable' || rec.status === 'lens-only') {
    const alts = (['em', 'ash', 'sef', 'chabad'] as NusachId[])
      .filter((n) => n !== nusach && textRecord(node, n, stop).id)
      .map((n) => `<button class="btn" data-alt="${n}">הצגה בנוסח ${escapeHtml(nusachById(n).short)}</button>`).join('');
    const gen = node.gen ? `<button class="btn" data-gen="1">טקסט כללי (לא משויך לנוסח)</button>` : '';
    const reason = node.explanationOnly
      ? 'לרכיב זה מוצג הסבר בלבד: אין לו טקסט ליטורגי זמין במקורות הפתוחים, או שנוסחו משתנה מקהילה לקהילה.'
      : nusach === 'shami' ? 'אין במקורות הפתוחים תכלאל בנוסח שאמי, ולכן הטקסט אינו מוצג.'
      : nusach === 'baladi' ? 'אין במקורות הפתוחים תכלאל בלדי. לתפילות המרכזיות מוצג ״סדר תפילות כל השנה״ של הרמב״ם — כאן אין לו מקבילה.'
      : `הטקסט של ״${escapeHtml(node.title)}״ בנוסח ${nsName} אינו זמין במקורות הפתוחים שבהם השתמשנו. נוסח אחר לא יוצג במקומו בלי שתבקשו זאת במפורש.`;
    const kav = rec.status === 'lens-only' && rec.kav ? await kavSection(rec.kav.id) : '';
    return `<div class="notice warn"><b>לא זמין.</b> ${reason}${alts || gen ? `<div class="btns">${alts}${gen}</div>` : ''}</div>${kav}`;
  }
  const p = await loadText(rec.id!);
  let banner = '';
  if (rec.status === 'lens') banner = `<div class="notice">עדשת הקבלה: טקסט התפילה הוא של <b>עדות המזרח</b> — הנוסח שבו התפללו המקובלים, ושעליו הוסיף הרש״ש את כוונותיו.${rec.kav ? ' מתחת לטקסט — קטע מ״שער הכוונות״.' : ''}</div>`;
  if (rec.status === 'historical') banner = `<div class="notice"><b>מקור היסטורי, לא סידור בלדי.</b> מוצג ״סדר תפילות כל השנה״ של הרמב״ם, שעליו מבוסס נוסח בלדי. התכלאל עצמו אינו זמין במקורות הפתוחים.</div>`;
  const label = rec.status === 'historical' ? 'היסטורי' : rec.status === 'lens' ? 'בסיס ע״מ' : 'מלא';
  const kav = rec.status === 'lens' && rec.kav ? await kavSection(rec.kav.id) : '';
  let extra = '';
  if (rec.status === 'lens' && rec.extra) {
    const ep = await loadText(rec.extra.id);
    extra = `<div class="sec-title">${escapeHtml(rec.extra.label)}</div>${sourceCards(ep, 'גרסה נוספת')}<div class="prayer">${segments(ep)}</div>`;
  }
  const occ = rec.label
    ? `<div class="notice">${escapeHtml(rec.label)} — אין במהדורה הפתוחה טקסט למקום הזה עצמו.</div>`
    : rec.fromStop ? '<div class="notice">הטקסט של <b>מופע זה</b> במסלול (לא בהכרח של שאר המופעים).</div>' : '';
  return `${banner}${occ}${sourceCards(p, label)}<div class="prayer" id="prayerBody">${segments(p)}</div>${kav}${extra}${HOLY_NOTE}`;
}

async function render(): Promise<void> {
  const my = ++token;
  const { nodeId, stopIndex } = current!;
  const node = nodeById(nodeId);
  const region = regionById(node.region);
  const route = currentRoute();
  const stop = route && stopIndex != null ? route.stops[stopIndex] : null;
  const nusach = current!.override?.nusach || state.nusach;
  const rec = textRecord(node, nusach, stop);
  const kind = stop?.cond || node.k;

  const rels = [
    ...node.rel.map((r) => ({ ...r, label: REL_HE[r.type], other: r.target })),
    ...state.world.nodes.flatMap((n) => n.rel.filter((r) => r.target === node.id).map((r) => ({ ...r, label: REL_IN_HE[r.type], other: n.id }))),
  ];
  const avail = state.world.nusachim.map((n) => {
    const st = textRecord(node, n.id, stop).status;
    return `<button data-ns="${n.id}" aria-pressed="${n.id === state.nusach}" title="${escapeHtml(n.name)}: ${STATUS_LONG[st]}"><span>${escapeHtml(n.short)}</span><span class="pill ${st}">${STATUS_HE[st]}</span></button>`;
  }).join('');
  const off = stop && stopOff(stop);
  const words = rec.words ? `${fmt(rec.words)} מילים` : '';

  $('readerSheet').innerHTML = `
    <aside>
      <span class="eyebrow" style="color:${region.color}">${escapeHtml(region.name)}${stop ? ` · תחנה ${stopIndex! + 1}/${route!.stops.length}` : ''}</span>
      <h2 id="readerTitle" tabindex="-1">${escapeHtml(node.title)}</h2>
      <div class="spec">
        <span>${KIND_HE[kind]}</span>${stop && stop.occTotal > 1 ? `<span>מופע ${stop.occ}/${stop.occTotal}</span>` : ''}${words ? `<span>${words}</span>` : ''}${node.tags.includes('kabbalah') ? '<span>✧ רכיב קבלי</span>' : ''}
      </div>
      <p class="lead">${escapeHtml(node.d)}</p>
      <dl class="facts">
        <div><dt>מתי</dt><dd>${escapeHtml(node.w)}</dd></div>
        <div><dt>מעמד</dt><dd>${KIND_LONG[kind]}</dd></div>
        ${node.v ? `<div><dt>הבדלי מנהג</dt><dd>${escapeHtml(node.v)}</dd></div>` : ''}
        ${stop?.note ? `<div><dt>בתחנה זו</dt><dd>${escapeHtml(stop.note)}</dd></div>` : ''}
      </dl>
      ${off ? `<div class="notice warn">${stop!.omit ? 'תחנה זו מוצגת כדי להראות מה <b>נשמט</b> — היא אינה נאמרת במעמד זה.' : `תחנה זו אינה חלק מהמנהג בנוסח ${escapeHtml(nusachById(state.nusach).short)}.`}</div>` : ''}
      ${rels.length ? `<span class="lbl">קשרים</span><div class="rels" style="margin-top:8px">${rels.map((r) => `<button class="btn" data-goto="${r.other}"><i style="background:${REL_COLOR[r.type]}"></i>${r.label}: ${escapeHtml(nodeById(r.other).title)}</button>`).join('')}</div>` : ''}
      <div style="margin-top:16px"><span class="lbl">זמינות לפי נוסח</span><div class="avail">${avail}</div></div>
    </aside>
    <main>
      <div class="bar">
        <span class="eyebrow">${escapeHtml(nusachById(nusach).name)}</span>
        <div class="tools">
          <div class="seg" role="group" aria-label="ניקוד"><button data-nikud="1" aria-pressed="${prefs.nikud}">עם ניקוד</button><button data-nikud="0" aria-pressed="${!prefs.nikud}">בלי ניקוד</button></div>
          <div class="seg" role="group" aria-label="גודל גופן"><button data-size="-1" aria-label="הקטנת גופן">א−</button><button data-size="1" aria-label="הגדלת גופן">א+</button></div>
          <button class="icon-btn" data-close aria-label="סגירת הקורא">✕</button>
        </div>
      </div>
      <div class="scroller" id="readerScroll"><p style="color:var(--muted)">טוען טקסט…</p></div>
    </main>`;

  const root = $('readerSheet');
  root.querySelector<HTMLElement>('[data-close]')!.onclick = closeReader;
  root.querySelectorAll<HTMLElement>('[data-goto]').forEach((b) => (b.onclick = () => emit('goto', b.dataset.goto)));
  root.querySelectorAll<HTMLElement>('[data-ns]').forEach((b) => (b.onclick = () => { current!.override = null; set({ nusach: b.dataset.ns as NusachId }); }));
  root.querySelectorAll<HTMLElement>('[data-nikud]').forEach((b) => (b.onclick = () => { prefs.nikud = b.dataset.nikud === '1'; savePrefs(); void render(); }));
  root.querySelectorAll<HTMLElement>('[data-size]').forEach((b) => (b.onclick = () => {
    prefs.size = Math.min(2.2, Math.max(1, prefs.size + Number(b.dataset.size) * 0.12));
    savePrefs();
    document.documentElement.style.setProperty('--reader-size', prefs.size.toFixed(2) + 'rem');
  }));

  const scroller = $('readerScroll');
  try {
    const html = await textArea(node, rec, nusach, stop);
    if (my !== token) return;
    scroller.innerHTML = html;
  } catch {
    if (my !== token) return;
    scroller.innerHTML = `<div class="notice warn">לא הצלחנו לטעון את הטקסט. בדקו את החיבור ונסו שוב. <div class="btns"><button class="btn" data-retry>לנסות שוב</button></div></div>`;
    scroller.querySelector<HTMLElement>('[data-retry]')!.onclick = () => void render();
    return;
  }
  // short instructions read as rubric pills; long optional passages as a quieter, smaller serif
  scroller.querySelectorAll<HTMLElement>('.prayer small').forEach((el) => el.classList.add((el.textContent || '').length > 70 ? 'aside' : 'rubric'));
  scroller.querySelectorAll<HTMLElement>('[data-alt]').forEach((b) => (b.onclick = () => { current!.override = { nusach: b.dataset.alt as NusachId }; void render(); }));
  scroller.querySelectorAll<HTMLElement>('[data-gen]').forEach((b) => (b.onclick = () => { current!.override = { gen: true }; void render(); }));
  if (state.query) highlight(scroller.querySelector('#prayerBody'), state.query);
}

function highlight(container: Element | null, query: string): void {
  if (!container) return;
  const terms = normalize(query).split(' ').filter((t) => t.length > 1);
  if (!terms.length) return;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  let first: HTMLElement | null = null;
  for (const tn of nodes) {
    const parts = tn.nodeValue!.split(/(\s+)/);
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
    tn.parentNode!.replaceChild(frag, tn);
  }
  if (first) setTimeout(() => first!.scrollIntoView({ block: 'center', behavior: state.reduceMotion ? 'auto' : 'smooth' }), 60);
}
