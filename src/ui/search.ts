// Hebrew search across titles, explanations, routes and the full text of the selected nusach.
import { state, nodeById, regionById, nusachById } from '../state';
import { loadSearch } from '../data';
import { escapeHtml, normalize } from '../hebrew';
import { $, emit } from './dom';

let seq = 0;
let active = -1;

export function bindSearch(): void {
  const input = $<HTMLInputElement>('q');
  const box = $('results');
  let deb = 0;
  input.addEventListener('input', () => { clearTimeout(deb); deb = window.setTimeout(() => void run(input.value), 140); });
  input.addEventListener('focus', () => { if (input.value) void run(input.value); });
  input.addEventListener('keydown', (e) => {
    const res = [...box.querySelectorAll<HTMLElement>('.res')];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      active = Math.max(0, Math.min(res.length - 1, active + (e.key === 'ArrowDown' ? 1 : -1)));
      res.forEach((r, i) => r.setAttribute('aria-selected', String(i === active)));
      res[active]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      const r = res[active] || res[0];
      if (r) { e.preventDefault(); choose(r); }
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      hide();
      input.blur();
    }
  });
  document.addEventListener('click', (e) => { if (!(e.target as HTMLElement).closest('.search')) hide(); });
}

function hide(): void {
  $('results').hidden = true;
  $('q').setAttribute('aria-expanded', 'false');
}

function choose(b: HTMLElement): void {
  hide();
  if (b.dataset.route) { state.query = ''; emit('route', b.dataset.route); return; }
  if (!b.dataset.q) state.query = '';
  emit('search-pick', b.dataset.node);
}

export async function run(q: string): Promise<void> {
  const my = ++seq;
  state.query = q;
  const nq = normalize(q);
  if (!nq) { hide(); return; }
  const terms = nq.split(' ');
  const titles = state.world.nodes
    .filter((n) => { const hay = normalize(`${n.title} ${n.d} ${n.w}`); return terms.every((t) => hay.includes(t)); })
    .sort((a, b) => Number(normalize(b.title).includes(nq)) - Number(normalize(a.title).includes(nq)))
    .slice(0, 8);
  const routes = state.world.routes.filter((r) => terms.every((t) => normalize(`${r.title} ${r.d}`).includes(t))).slice(0, 4);
  draw(null);
  try {
    const idx = await loadSearch(state.nusach);
    if (my !== seq) return;
    const hits: { n: string; snip: string; snipF: string }[] = [];
    for (const pass of [0, 1]) {
      for (const e of idx) {
        if (hits.length >= 14 || hits.some((h) => h.n === e.n)) continue;
        const pos = pass === 0 ? e.f.indexOf(nq) : e.f.indexOf(terms[0]);
        if (pos < 0 || (pass === 1 && !terms.every((t) => e.f.includes(t)))) continue;
        const a = Math.max(0, pos - 40);
        hits.push({ n: e.n, snip: (a ? '…' : '') + e.x.slice(a, pos + 80) + '…', snipF: e.f.slice(a, pos + 80) });
      }
    }
    draw(hits);
  } catch {
    if (my === seq) draw([]);
  }

  function mark(s: string, f: string): string {
    const off = s.length - f.length - 1;
    const hit = new Array<boolean>(s.length).fill(false);
    for (const t of terms) {
      let i = f.indexOf(t);
      while (t && i >= 0) { for (let k = 0; k < t.length; k++) hit[i + k + off] = true; i = f.indexOf(t, i + 1); }
    }
    let h = '', open = false;
    [...s].forEach((ch, i) => {
      if (hit[i] && !open) { h += '<mark>'; open = true; }
      if (!hit[i] && open) { h += '</mark>'; open = false; }
      h += escapeHtml(ch);
    });
    return h + (open ? '</mark>' : '');
  }

  function draw(hits: { n: string; snip: string; snipF: string }[] | null): void {
    const box = $('results');
    const ns = nusachById(state.nusach).short;
    let html = '';
    if (routes.length) html += `<div class="grp">מסלולים</div>` + routes.map((r) => `<button class="res" role="option" data-route="${r.id}"><b>${escapeHtml(r.title)}</b><span class="mono">${r.stops.length} תחנות</span></button>`).join('');
    if (titles.length) html += `<div class="grp">תפילות ורכיבים</div>` + titles.map((n) => `<button class="res" role="option" data-node="${n.id}"><b style="color:${regionById(n.region).color}">●</b> <b>${escapeHtml(n.title)}</b><span>${escapeHtml(regionById(n.region).name)} · ${escapeHtml(n.w)}</span></button>`).join('');
    if (hits === null) html += `<div class="grp">בטקסט התפילות · ${escapeHtml(ns)}</div><div class="empty">מחפשים…</div>`;
    else if (hits.length) html += `<div class="grp">בטקסט התפילות · ${escapeHtml(ns)}</div>` + hits.map((h) => `<button class="res" role="option" data-node="${h.n}" data-q="1"><b>${escapeHtml(nodeById(h.n).title)}</b><span class="snip">${mark(h.snip, h.snipF)}</span></button>`).join('');
    if (hits && !hits.length && !titles.length && !routes.length)
      html = `<div class="empty">לא נמצאו תוצאות ל״${escapeHtml(q)}״ בנוסח ${escapeHtml(ns)}.<br>אפשר לחפש עם ניקוד או בלעדיו — שם של תפילה (״כל נדרי״) או מילים מתוכה (״אבינו מלכנו״).${['baladi', 'shami'].includes(state.nusach) ? '<br>בנוסח זה יש מעט טקסטים זמינים — נסו נוסח אחר.' : ''}</div>`;
    box.innerHTML = html;
    box.hidden = false;
    active = -1;
    $('q').setAttribute('aria-expanded', 'true');
    box.querySelectorAll<HTMLElement>('.res').forEach((b) => (b.onclick = () => choose(b)));
  }
}
