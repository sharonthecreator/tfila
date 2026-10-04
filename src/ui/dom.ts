export const $ = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;

export function announce(msg: string): void {
  const el = $('sr');
  el.textContent = '';
  setTimeout(() => (el.textContent = msg), 30);
}

/** A tiny event bus between UI modules. */
type Handler = (detail: unknown) => void;
const bus = new Map<string, Set<Handler>>();
export function on(name: string, fn: Handler): void {
  if (!bus.has(name)) bus.set(name, new Set());
  bus.get(name)!.add(fn);
}
export function emit(name: string, detail?: unknown): void {
  bus.get(name)?.forEach((fn) => fn(detail));
}

/** Small iris-like glyph for a nusach tile: a ring whose arc shows text coverage. */
export function coverageGlyph(frac: number, color: string, letter: string): string {
  const r = 11, c = 2 * Math.PI * r;
  return `<svg viewBox="0 0 28 28" aria-hidden="true">
    <circle cx="14" cy="14" r="${r}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="2.4"/>
    <circle cx="14" cy="14" r="${r}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round"
      stroke-dasharray="${(c * frac).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 14 14)"/>
    <text x="14" y="18.5" text-anchor="middle" font-size="11" font-weight="700" fill="${color}" font-family="Heebo Variable, sans-serif">${letter}</text>
  </svg>`;
}
