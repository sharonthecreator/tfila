// Full-page views: Library (the accessible text alternative), Compare (two nusachim side by side),
// Learn (numbered explainers computed from the data) and the Help sheet.
import { state, nodeById, regionById, nusachById, routeById, textRecord, stopOff, KIND_HE, STATUS_HE } from '../state';
import type { NusachId, TextPayload, TextStatus } from '../types';
import { loadText } from '../data';
import { escapeHtml, fmt } from '../hebrew';
import { $, emit } from './dom';
import { sections } from './lab';

// ───────────────────────────── library ─────────────────────────────
let libSection = 'all';
let libFilter: 'all' | 'text' | 'missing' | 'custom' = 'all';

export function renderLibrary(): void {
  const v = $('libraryView');
  const ns = nusachById(state.nusach);
  const nav = [
    { id: 'all', n: '00', b: 'כל התפילות', s: `${state.world.nodes.length} תפילות ורכיבים` },
    ...state.world.regions.map((r, i) => ({ id: r.id, n: String(i + 1).padStart(2, '0'), b: r.name, s: `${state.world.nodes.filter((x) => x.region === r.id).length} תפילות`, c: r.color })),
    { id: 'routes', n: '★', b: 'מסלולים (רשימה)', s: `${state.world.routes.length} מסלולים, תחנה אחר תחנה` },
  ];
  let main = '';
  if (libSection === 'routes') {
    main = `<span class="eyebrow">ספרייה · מסלולים</span><h2>מסלולי תפילה כרשימה</h2>
      <p class="intro">כל מסלול כרשימה מסודרת — חלופה טקסטואלית מלאה לסולם התלת־ממדי. תחנות שאינן בנוסח ${escapeHtml(ns.short)} מסומנות.</p>
      ${state.world.routes.map((r) => {
        const { secs, of } = sections(r);
        return `<div class="box"><span class="lbl">${escapeHtml(r.group)}</span><h3 style="margin:0 0 6px;font-size:19px">${escapeHtml(r.title)}</h3><p style="color:var(--muted);font-size:13px;line-height:1.7;margin:0 0 10px">${escapeHtml(r.d)}</p>
          <ol style="margin:0;padding-inline-start:22px;columns:2 280px;font-size:13.5px;line-height:2">${r.stops.map((s, i) => {
            const n = nodeById(s.n);
            const head = s.sec ? `<span style="color:${secs[of[i]].color};font-size:11px;letter-spacing:.12em;display:block">${escapeHtml(s.sec)}</span>` : '';
            return `<li>${head}<button class="subj" style="background:none;border:0;padding:0;color:${stopOff(s) ? 'var(--faint)' : 'var(--text)'}" data-route="${r.id}" data-stop="${i}">${escapeHtml(n.title)}</button>${s.occTotal > 1 ? ` <span class="pill occ">${s.occ}/${s.occTotal}</span>` : ''}${stopOff(s) ? ` <span class="pill off">${s.omit ? 'לא נאמר כאן' : 'לא בנוסח'}</span>` : ''}</li>`;
          }).join('')}</ol></div>`;
      }).join('')}`;
  } else {
    const reg = libSection === 'all' ? null : regionById(libSection);
    const list = state.world.nodes.filter((n) => (!reg || n.region === reg.id)).filter((n) => {
      const st = n.texts[state.nusach].status;
      if (libFilter === 'text') return st !== 'unavailable';
      if (libFilter === 'missing') return st === 'unavailable';
      if (libFilter === 'custom') return n.k !== 'core';
      return true;
    });
    main = `<div class="view-head"><div><span class="eyebrow" style="color:${reg?.color || 'var(--accent)'}">ספרייה · נוסח ${escapeHtml(ns.short)}</span><h2>${escapeHtml(reg?.name || 'כל התפילות')}</h2></div>
      <div class="seg" role="group" aria-label="סינון">${([['all', 'הכול'], ['text', 'עם טקסט'], ['missing', 'חסר בנוסח'], ['custom', 'מנהגים ותנאים']] as const).map(([k, l]) => `<button data-filter="${k}" aria-pressed="${libFilter === k}">${l}</button>`).join('')}</div></div>
      <p class="intro">כל כרטיס פותח את הקורא: הסבר, זמן האמירה, הבדלי מנהג, קשרים, והטקסט המלא עם המהדורה והרישיון. ${list.length} פריטים.</p>
      ${list.length ? `<div class="cards">${list.map((n) => {
        const r = n.texts[state.nusach];
        const url = r.url || r.kav?.url;
        return `<div class="card-wrap"><button class="card-btn" data-node="${n.id}"><b style="color:${regionById(n.region).color}"><i></i><span style="color:var(--text)">${escapeHtml(n.title)}</span></b><span>${escapeHtml(n.w)}</span><span class="row"><span class="pill ${r.status}">${STATUS_HE[r.status]}</span><span class="pill ghost">${KIND_HE[n.k]}</span>${r.words ? `<span class="pill ghost mono">${fmt(r.words)} מילים</span>` : ''}${n.tags.includes('kabbalah') ? '<span class="pill kab">✧</span>' : ''}</span></button>${url ? `<a class="card-src" href="${escapeHtml(url)}" target="_blank" rel="noopener" aria-label="${escapeHtml(n.title)} — המקור בספריא">מקור ↗</a>` : ''}</div>`;
      }).join('')}</div>` : `<div class="notice">אין פריטים התואמים לסינון בנוסח ${escapeHtml(ns.short)}.</div>`}`;
  }
  v.innerHTML = `<button class="icon-btn close" data-close aria-label="חזרה למעבדה">✕</button><div class="view-grid">
    <nav class="view-nav" aria-label="חלקי הספרייה">${nav.map((x) => `<button class="item" data-sec="${x.id}" aria-current="${libSection === x.id}"><span class="n">${x.n}</span><b ${'c' in x ? `style="color:${x.c}"` : ''}>${escapeHtml(x.b)}</b><span>${escapeHtml(x.s)}</span></button>`).join('')}</nav>
    <div class="panel view-main">${main}</div></div>`;
  v.querySelector<HTMLElement>('[data-close]')!.onclick = () => emit('tab', 'world');
  v.querySelectorAll<HTMLElement>('[data-sec]').forEach((b) => (b.onclick = () => { libSection = b.dataset.sec!; renderLibrary(); }));
  v.querySelectorAll<HTMLElement>('[data-filter]').forEach((b) => (b.onclick = () => { libFilter = b.dataset.filter as typeof libFilter; renderLibrary(); }));
  v.querySelectorAll<HTMLElement>('[data-node]').forEach((b) => (b.onclick = () => emit('read-node', b.dataset.node)));
  v.querySelectorAll<HTMLElement>('[data-route][data-stop]').forEach((b) => (b.onclick = () => emit('read-stop', { route: b.dataset.route, stop: Number(b.dataset.stop) })));
}

// ───────────────────────────── compare ─────────────────────────────
let cmpNode = 'kol-nidrei';
let cmpA: NusachId = 'em';
let cmpB: NusachId = 'ash';

const segHtml = (p: TextPayload) => p.parts.map((x) => x.segments.map((s) => `<p>${s}</p>`).join('')).join('');

export async function renderCompare(): Promise<void> {
  const v = $('compareView');
  const nodes = state.world.nodes.filter((n) => (['em', 'ash', 'sef', 'chabad', 'baladi'] as NusachId[]).filter((x) => n.texts[x].id).length >= 2);
  const node = nodeById(cmpNode);
  const col = (ns: NusachId, which: 'a' | 'b') => {
    const r = textRecord(node, ns);
    return `<section class="col"><header><select class="sel" data-col="${which}" aria-label="נוסח לעמודה">${state.world.nusachim.map((x) => `<option value="${x.id}" ${x.id === ns ? 'selected' : ''}>${escapeHtml(x.name)}</option>`).join('')}</select>
      <span class="pill ${r.status}">${STATUS_HE[r.status]}</span>${r.words ? `<span class="pill ghost mono">${fmt(r.words)} מילים</span>` : ''}</header><div class="body" id="cmp-${which}"><p style="color:var(--muted)">${r.id ? 'טוען…' : ''}</p></div></section>`;
  };
  v.innerHTML = `<button class="icon-btn close" data-close aria-label="חזרה למעבדה">✕</button>
    <div class="panel view-main" style="height:100%">
      <div class="view-head"><div><span class="eyebrow">השוואה</span><h2>אותה תפילה, שני נוסחים</h2></div>
        <select class="sel" id="cmpNode" aria-label="בחירת תפילה">${nodes.map((n) => `<option value="${n.id}" ${n.id === cmpNode ? 'selected' : ''}>${escapeHtml(n.title)} · ${escapeHtml(regionById(n.region).name)}</option>`).join('')}</select></div>
      <p class="intro">${escapeHtml(node.d)} ${node.v ? `<br><b>הבדלי מנהג:</b> ${escapeHtml(node.v)}` : ''}</p>
      <div class="cmp">${col(cmpA, 'a')}${col(cmpB, 'b')}</div>
    </div>`;
  v.querySelector<HTMLElement>('[data-close]')!.onclick = () => emit('tab', 'world');
  $<HTMLSelectElement>('cmpNode').onchange = (e) => { cmpNode = (e.target as HTMLSelectElement).value; void renderCompare(); };
  v.querySelectorAll<HTMLSelectElement>('[data-col]').forEach((s) => (s.onchange = () => { if (s.dataset.col === 'a') cmpA = s.value as NusachId; else cmpB = s.value as NusachId; void renderCompare(); }));
  for (const [ns, w] of [[cmpA, 'a'], [cmpB, 'b']] as const) {
    const r = textRecord(node, ns);
    const el = $(`cmp-${w}`);
    if (!r.id) { el.innerHTML = `<div class="notice warn">${r.status === 'lens-only' ? 'רק שכבת כוונות.' : `לא זמין בנוסח ${escapeHtml(nusachById(ns).short)} במקורות הפתוחים.`}</div>`; continue; }
    try {
      const p = await loadText(r.id);
      el.innerHTML = `<div class="prov"><div class="card"><b>${escapeHtml(p.parts[0].bookHe)}</b> › ${escapeHtml(p.parts[0].section)}<br>מהדורה <span class="mono">${escapeHtml(p.parts[0].versionHe || p.parts[0].version)}</span> · <span class="mono">${escapeHtml(p.parts[0].licenseHe)}</span> · <a href="${escapeHtml(p.parts[0].sefaria)}" target="_blank" rel="noopener">ספריא ↗</a></div></div>${r.status === 'lens' ? '<div class="notice">עדשת הקבלה מציגה את נוסח עדות המזרח.</div>' : ''}${r.status === 'historical' ? '<div class="notice">מקור היסטורי (רמב״ם), לא סידור בלדי.</div>' : ''}<div class="prayer">${segHtml(p)}</div>`;
    } catch {
      el.innerHTML = '<div class="notice warn">שגיאה בטעינת הטקסט.</div>';
    }
  }
}

// ───────────────────────────── learn ─────────────────────────────
let learnIdx = 0;
const EXPLAINERS = [
  { t: 'סולם התפילה: ארבעה עולמות', s: 'למה סולם, ומה מקור החלוקה — בדברי האר״י' },
  { t: 'הקדיש: החוליה שבין חלקי התפילה', s: 'ארבע צורות, ומקומה של כל אחת' },
  { t: 'יום כיפור: חמש תפילות, שבעה וידויים', s: 'מה חוזר לאורך היום הקדוש, ואיפה' },
  { t: 'כמה מהעולם זמין בכל נוסח', s: 'כיסוי הטקסטים — ומה חסר בכנות' },
  { t: 'מה נוסף לעמידה, ומתי', s: 'יעלה ויבוא, על הניסים, עננו, נחם' },
  { t: 'מאיפה הטקסטים', s: 'מהדורות, רישיונות וסימוני הסטטוס' },
];

export function renderLearn(): void {
  const v = $('learnView');
  const bodies = [learnLadder, learnKaddish, learnYK, learnCoverage, learnAdds, learnSources];
  v.innerHTML = `<button class="icon-btn close" data-close aria-label="חזרה למעבדה">✕</button><div class="view-grid">
    <nav class="view-nav" aria-label="הסברים">${EXPLAINERS.map((x, i) => `<button class="item" data-i="${i}" aria-current="${i === learnIdx}"><span class="n">${String(i + 1).padStart(2, '0')}</span><b>${x.t}</b><span>${x.s}</span></button>`).join('')}
      <div class="panel" style="padding:14px 16px;font-size:12px;color:var(--muted);line-height:1.7"><span class="lbl" style="display:block;margin-bottom:8px">סימוני הטקסט</span>
        <p style="margin:0 0 6px"><span class="pill full">מלא</span> סעיף שלם מהמהדורה</p><p style="margin:0 0 6px"><span class="pill excerpt">קטע</span> חלק מסעיף (למשל ברכה אחת מתוך העמידה)</p>
        <p style="margin:0 0 6px"><span class="pill historical">היסטורי</span> מקור קרוב, לא הסידור עצמו</p><p style="margin:0"><span class="pill unavailable">חסר</span> אין מהדורה פתוחה — לא מוחלף בשקט</p></div>
    </nav>
    <div class="panel view-main"><span class="eyebrow">הסבר ${String(learnIdx + 1).padStart(2, '0')}</span><h2>${EXPLAINERS[learnIdx].t}</h2>${bodies[learnIdx]()}</div></div>`;
  v.querySelector<HTMLElement>('[data-close]')!.onclick = () => emit('tab', 'world');
  v.querySelectorAll<HTMLElement>('[data-i]').forEach((b) => (b.onclick = () => { learnIdx = Number(b.dataset.i); renderLearn(); }));
  v.querySelectorAll<HTMLElement>('[data-open-route]').forEach((b) => (b.onclick = () => emit('route-from-view', b.dataset.openRoute)));
  v.querySelectorAll<HTMLElement>('[data-node]').forEach((b) => (b.onclick = () => emit('read-node', b.dataset.node)));
}

function learnLadder(): string {
  const w = state.world.worlds;
  const count = (id: string) => state.world.nodes.filter((n) => n.world === id).length;
  const ari = state.world.nodes.filter((n) => n.wsrc === 'ari');
  const src = state.world.ladder.sources;
  queueMicrotask(() => {
    for (const [key, el] of [['worlds', 'ariWorlds'], ['descent', 'ariDescent']] as const) {
      const id = src[key]?.id;
      const box = document.getElementById(el);
      if (!id || !box) continue;
      loadText(id).then((t) => {
        const p = t.parts[0];
        box.innerHTML = `<div class="prayer" style="font-size:19px">${p.segments.join(' ')}</div><div class="prov-line">${escapeHtml(p.bookHe)} › ${escapeHtml(p.section)} · ${escapeHtml(p.versionHe || p.version)} · ${escapeHtml(p.licenseHe)} · <a href="${escapeHtml(p.sefaria)}" target="_blank" rel="noopener">ספריא</a></div>`;
      }).catch(() => { box.textContent = 'הטקסט לא נטען.'; });
    }
  });
  return `<p class="intro">״וַיַּחֲלֹם וְהִנֵּה סֻלָּם מֻצָּב אַרְצָה וְרֹאשׁוֹ מַגִּיעַ הַשָּׁמָיְמָה, וְהִנֵּה מַלְאֲכֵי אֱלֹהִים עֹלִים וְיֹרְדִים בּוֹ״ (בראשית כח, יב). המסורת ראתה בסולם של יעקב את התפילה: היא ״מוצבת ארצה״ — בגוף, במעשה, במקום — ו״ראשה מגיע השמימה״. האר״י לימד שתפילת השחר עולה בארבעה עולמות, זה אחר זה. כך בנוי המכשיר: סיבוב אחד של הסולם לכל עולם, מלמטה למעלה, ו־12 צדדים לתחומי התפילה.</p>
    <div class="box"><span class="lbl">שער הכוונות · דרושי תפילת השחר — החלוקה לארבעה עולמות</span><div id="ariWorlds">…</div></div>
    <div class="box"><span class="lbl">ארבעת העולמות בסולם</span>
      <table class="data"><thead><tr><th>עולם</th><th>בתפילת השחר, לפי האר״י</th><th>שיבוץ שאר התפילות ב־tfila</th><th>תפילות</th></tr></thead><tbody>
      ${[...w].reverse().map((x, k) => `<tr><td><b style="color:${x.color}">${['IV', 'III', 'II', 'I'][k]} · ${x.he}</b></td><td>${escapeHtml(x.ari)}</td><td>${escapeHtml(x.rule)}</td><td class="mono">${count(x.id)}</td></tr>`).join('')}
      </tbody></table></div>
    <div class="box"><span class="lbl">ירידה כדי לעלות — נפילת אפיים</span><div id="ariDescent">…</div>
      <p style="margin:10px 0 0;color:var(--muted);font-size:13px">לכן התחנון והווידוי עומדים בסולם בעולם העשיה: אחרי העמידה, ב״אצילות״, המתפלל ״מפיל עצמו עד העשיה״. במסלול יום הכיפורים רואים זאת חמש פעמים — עלייה לעמידה וירידה לווידוי — עד הנעילה, העומדת על השלב העליון.</p></div>
    <div class="notice warn"><b>מה מבוסס על מקור, ומה לא:</b> רק ${ari.length} תחנות ממוקמות לפי דברי האר״י המפורשים (${ari.map((n) => escapeHtml(n.title)).join(', ')}). שאר התפילות שובצו כאן <b>מבנית</b>, לפי כלל אצבע שבטבלה — כדי לפרוש את המפה, לא כקביעה קבלית. בכל תפילה מצוין מה מקור מקומה.</div>`;
}

function learnKaddish(): string {
  const routes = state.world.routes.filter((r) => r.stops.some((s) => s.n === 'kaddish'));
  const forms = [
    ['חצי קדיש', 'סוגר יחידה ופותח את הבאה: אחר פסוקי דזמרה (לפני ״ברכו״), לפני העמידה, אחר קריאת התורה.', 'חצי'],
    ['קדיש תתקבל (״שלם״)', 'חותם את יחידת העמידה של כל תפילה — ״תתקבל צלותהון ובעותהון״.', 'תתקבל'],
    ['קדיש יתום', 'אחר מזמורים ואחר ״עלינו״, נאמר בידי האבלים — ״יהא שלמא רבא״.', 'יתום'],
    ['קדיש דרבנן (״על ישראל״)', 'אחר לימוד תורה: הקרבנות ו״רבי ישמעאל״, פיטום הקטורת, פרקי אבות.', 'דרבנן'],
  ];
  const tally = (needle: string) => routes.reduce((a, r) => a + r.stops.filter((s) => s.n === 'kaddish' && (s.note || '').split('—')[0].includes(needle)).length, 0);
  return `<p class="intro">הקדיש אינו ״עוד תפילה״ בתוך הסדר אלא החוליה שמחברת ומפרידה בין חלקיו: הוא נאמר במעבר מיחידה ליחידה, ובכל מקום — בצורה אחרת. הוא מ״דברים שבקדושה״ ונאמר רק במניין (עשרה). במסלולים של tfila כל קדיש מופיע במקומו, והטקסט שלו נחתך מאותו מקום בדיוק במהדורה של הנוסח.</p>
    <div class="box"><span class="lbl">ארבע הצורות</span><table class="data"><thead><tr><th>צורה</th><th>מקומה</th><th>במסלולים</th></tr></thead><tbody>
      ${forms.map(([t, d, k]) => `<tr><td><b>${t}</b></td><td>${d}</td><td class="mono">${tally(k)}</td></tr>`).join('')}</tbody></table></div>
    <div class="box"><span class="lbl">הקדיש במסלולים</span><div class="cards">${routes.map((r) => `<button class="card-btn" data-open-route="${r.id}"><b><i></i><span style="color:var(--text)">${escapeHtml(r.title)}</span></b><span>${r.stops.filter((s) => s.n === 'kaddish').length} פעמים</span></button>`).join('')}</div></div>
    <div class="notice">הבדלי מנהג: בעדות המזרח ״עלינו״ חותם את התפילה בלי קדיש אחריו, ואילו באשכנז, בנוסח ספרד ובחב״ד אומרים אחריו קדיש יתום; בערבית של עדות המזרח ובחב״ד יש גם חצי קדיש לפני ״ברכו״. תחנות כאלה מסומנות ״לא בנוסח״ בנוסחים שאינם נוהגים בהן.</div>`;
}

function learnYK(): string {
  const r = routeById('yom-kippur');
  const { secs, of } = sections(r);
  const rows = ['amidah-yk', 'vidui-yk', 'kaddish', 'selichot-yk', 'avinu-malkenu'];
  const W = 860, padR = 150, padL = 20, top = 34, rowH = 40;
  const x = (i: number) => W - padR - (i / (r.stops.length - 1)) * (W - padR - padL);
  const H = top + rows.length * rowH + 30;
  const bands = secs.map((s) => `<rect x="${x(s.end) - 6}" y="0" width="${x(s.start) - x(s.end) + 12}" height="${H - 18}" fill="${s.color}" opacity="0.07" rx="6"/><text x="${x(s.start)}" y="14" text-anchor="end" class="he" style="fill:${s.color}">${escapeHtml(s.name)}</text>`).join('');
  const lines = rows.map((id, k) => {
    const y = top + k * rowH + 16;
    const occ = r.stops.map((s, i) => ({ s, i })).filter(({ s }) => s.n === id);
    return `<text x="${W - 6}" y="${y + 4}" text-anchor="start" class="he">${escapeHtml(nodeById(id).title)}</text>
      <line x1="${x(0)}" x2="${x(r.stops.length - 1)}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,.08)"/>
      ${occ.map(({ i }) => `<circle cx="${x(i)}" cy="${y}" r="6" fill="${secs[of[i]].color}" stroke="#05070a" stroke-width="2"><title>תחנה ${i + 1}</title></circle><text x="${x(i)}" y="${y + 20}" text-anchor="middle">${i + 1}</text>`).join('')}`;
  }).join('');
  const count = (id: string) => r.stops.filter((s) => s.n === id).length;
  return `<p class="intro">ביום הכיפורים מתפללים חמש תפילות — ערבית, שחרית, מוסף, מנחה ונעילה — ובכל אחת חוזרים אותם רכיבים. העמידה נאמרת <b class="mono">${count('amidah-yk')}</b> פעמים, הווידוי מופיע <b class="mono">${count('vidui-yk')}</b> פעמים במסלול (כולל במנחה של ערב החג), ו״אבינו מלכנו״ <b class="mono">${count('avinu-malkenu')}</b> פעמים; הקדיש — <b class="mono">${count('kaddish')}</b> פעמים, חוליה בין חלקי כל תפילה. בכל מופע הטקסט שונה מעט — בנעילה, למשל, אומרים ״חתמנו״ במקום ״כתבנו״ ואין ״על חטא״.</p>
    <div class="box"><span class="lbl">מופעים לאורך המסלול · ${r.stops.length} תחנות · מימין לשמאל</span>
      <svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="מופעי העמידה, הווידוי, הקדיש, הסליחות ואבינו מלכנו לאורך יום הכיפורים">${bands}${lines}</svg></div>
    <div class="notice">כל נקודה היא תחנה במסלול; הצבע הוא חלק היום. לחצו כדי לראות את המסלול עולה ויורד בסולם.<div class="btns"><button class="btn primary" data-open-route="yom-kippur">✦ פתחו את מסלול יום כיפור</button></div></div>`;
}

function learnCoverage(): string {
  const N = state.world.nodes.length;
  const order: TextStatus[] = ['full', 'lens', 'excerpt', 'historical', 'lens-only', 'unavailable'];
  const color: Record<string, string> = { full: '#5dffa2', lens: '#5fe0ff', excerpt: '#ffd27a', historical: '#ff8a7a', 'lens-only': '#c9a2ff', unavailable: 'rgba(255,255,255,.08)' };
  const rows = state.world.nusachim.map((ns) => {
    const c: Record<string, number> = {};
    for (const n of state.world.nodes) c[n.texts[ns.id].status] = (c[n.texts[ns.id].status] || 0) + 1;
    let acc = 0;
    const segs = order.filter((k) => c[k]).map((k) => { const w = (c[k] / N) * 100; const s = `<span title="${STATUS_HE[k]}: ${c[k]}" style="position:absolute;top:0;bottom:0;right:${acc}%;width:${w}%;background:${color[k]}"></span>`; acc += w; return s; }).join('');
    const has = N - (c.unavailable || 0);
    return `<div style="display:grid;grid-template-columns:150px 1fr 70px;gap:12px;align-items:center;margin:10px 0"><b style="color:${ns.color};font-size:13.5px">${escapeHtml(ns.name)}</b>
      <div style="position:relative;height:14px;border-radius:7px;overflow:hidden;background:rgba(255,255,255,.05)">${segs}</div><span class="mono" style="font-size:12px;color:var(--muted)">${has}/${N}</span></div>`;
  }).join('');
  return `<p class="intro">לא לכל נוסח יש מהדורה פתוחה ומלאה. הגרף מראה, לכל נוסח, כמה מתוך ${N} התפילות והרכיבים מגיעים עם טקסט — ומאיזה סוג. כשטקסט חסר, הוא מסומן כחסר ואינו מוחלף בשקט בנוסח אחר.</p>
    <div class="box"><span class="lbl">כיסוי טקסט לפי נוסח</span>${rows}
      <div class="legend-row">${order.map((k) => `<span><i style="background:${color[k]}"></i>${STATUS_HE[k]}</span>`).join('')}</div></div>
    <div class="notice"><b>חב״ד</b> — רק סידור לימות החול זמין. <b>בלדי</b> — אין תכלאל פתוח; לעמידה, לווידוי ולברכת המזון מוצג סדר התפילות של הרמב״ם, בתווית ״היסטורי״. <b>שאמי</b> — אין טקסטים, רק הסברים ומסלולים. <b>קבלה</b> — עדשה: טקסט עדות המזרח עם קטעי ״שער הכוונות״.</div>`;
}

function learnAdds(): string {
  const adds = state.world.nodes.flatMap((n) => n.rel.filter((r) => r.type === 'adds').map((r) => ({ from: n, to: nodeById(r.target), note: r.note })));
  const targets = [...new Set(adds.map((a) => a.to.id))];
  return `<p class="intro">חלק מהתפילות אינן עומדות בפני עצמן אלא <b>נוספות</b> לתוך תפילה אחרת ביום מסוים. כך נשמרת מסגרת קבועה, ובתוכה משתנה תוכן לפי הזמן. בסולם הקשרים האלה מסומנים בקו ירוק מקווקו.</p>
    ${targets.map((t) => `<div class="box"><span class="lbl">נוסף אל · ${escapeHtml(nodeById(t).title)}</span>
      <div class="cards">${adds.filter((a) => a.to.id === t).map((a) => `<button class="card-btn" data-node="${a.from.id}"><b style="color:#5dffa2"><i></i><span style="color:var(--text)">${escapeHtml(a.from.title)}</span></b><span>${escapeHtml(a.note || '')} · ${escapeHtml(a.from.w)}</span></button>`).join('')}</div></div>`).join('')}`;
}

function learnSources(): string {
  return `<p class="intro">כל טקסט ליטורגי מגיע ממהדורה מסוימת בספריא (דרך הייצוא הציבורי של המאגר), ולצדו מוצגים הספר, הסעיף, המהדורה, הרישיון וקישור לספריא. שום טקסט לא נכתב או שוחזר כאן. ההסברים נכתבו לצורך התמצאות, מתארים מנהג נפוץ בקווים כלליים, ואינם פסיקת הלכה.</p>
    <div class="box"><span class="lbl">המהדורות שבשימוש · ${state.world.editions.length}</span>
      <table class="data"><thead><tr><th>ספר</th><th>מהדורה</th><th>רישיון</th><th>קטעים</th></tr></thead><tbody>
      ${state.world.editions.map((e) => `<tr><td>${escapeHtml(e.bookHe)}</td><td class="mono">${e.source ? `<a href="${escapeHtml(e.source)}" target="_blank" rel="noopener">${escapeHtml(e.versionHe || e.version)}</a>` : escapeHtml(e.versionHe || e.version)}</td><td>${escapeHtml(e.licenseHe)}</td><td class="mono">${e.excerpts}</td></tr>`).join('')}
      </tbody></table></div>
    <div class="notice warn">מהדורות שבספריא אין להן רישיון מוגדר מסומנות ״רישיון לא צוין בספריא״ — לא ניחשנו. אין כאן תכלאל תימני, סידור הרש״ש עם הכוונות, מחזורי חב״ד לשבת ולמועדים, הושענות ספרדיות ונוסחי כתובה.</div>`;
}

// ───────────────────────────── help ─────────────────────────────
export function renderHelp(): void {
  $('helpPanel').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><span class="eyebrow">עזרה</span><button class="icon-btn" data-close aria-label="סגירה">✕</button></div>
    <h2 id="helpTitle">איך משתמשים במכשיר</h2>
    <p>סולם התפילות הוא מכשיר: גררו הצידה כדי להקיף אותו, ולמעלה ולמטה כדי לטפס; התקרבו כדי לראות את מילות התפילה על השלבים, ולחצו על תפילה כדי לקרוא אותה. בחרו מסלול בלוח הבקרה — והוא יידלק תחנה אחר תחנה; גררו את ״ציר המסלול״ כדי לנוע בזמן.</p>
    <p><b>חזרה:</b> הכפתור ״→ חזרה״ שבראש המסך, מקש <kbd>Esc</kbd> או כפתור ״אחורה״ של הדפדפן והטלפון — כל אחד מהם מחזיר שלב אחד: מתחנה למסלול, ממסלול לסולם כולו.</p>
    <dl><dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>הקפת הסולם (כשהוא בפוקוס)</dd><dt><kbd>↑</kbd> <kbd>↓</kbd> <kbd>PgUp</kbd> <kbd>PgDn</kbd></dt><dd>טיפוס וירידה</dd><dt><kbd>Home</kbd></dt><dd>מבט על הסולם כולו</dd>
      <dt><kbd>+</kbd> <kbd>−</kbd></dt><dd>התקרבות והתרחקות</dd><dt><kbd>Enter</kbd></dt><dd>בחירת התפילה שבמרכז</dd>
      <dt><kbd>N</kbd> <kbd>P</kbd></dt><dd>התחנה הבאה / הקודמת במסלול</dd><dt><kbd>/</kbd></dt><dd>חיפוש</dd><dt><kbd>Esc</kbd></dt><dd>סגירה / חזרה שלב אחד</dd></dl>
    <p>הספרייה היא תצוגת טקסט מלאה ונגישה של כל התוכן והמסלולים. כפתור העיגול מפחית תנועה; בחירת האיכות משפיעה על הצללים, הבלום והחדות.</p>`;
  $('helpPanel').querySelector<HTMLElement>('[data-close]')!.onclick = () => emit('help', false);
}
