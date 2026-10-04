// Tiny observable store + shared labels.
import type { Kind, NusachId, PrayerNode, Route, Stop, TextRecord, TextStatus, World, WorldId } from './types';

export type Tab = 'world' | 'library' | 'compare' | 'learn';
export type Quality = 'auto' | 'low' | 'medium' | 'high';

export interface AppState {
  world: World;
  nusach: NusachId;
  nodeId: string | null;
  routeId: string | null;
  stopIndex: number;
  journey: boolean;
  reduceMotion: boolean;
  tab: Tab;
  quality: Quality;
  relView: boolean;
  query: string;
  noWebGL: boolean;
}

type Listener = (changed: Partial<Record<keyof AppState, true>>, s: AppState) => void;
const listeners = new Set<Listener>();

export const state = {
  nusach: 'em',
  nodeId: null,
  routeId: null,
  stopIndex: -1,
  journey: false,
  reduceMotion: false,
  tab: 'world',
  quality: 'auto',
  relView: true,
  query: '',
  noWebGL: false,
} as AppState;

export function set(patch: Partial<AppState>): void {
  const changed: Partial<Record<keyof AppState, true>> = {};
  for (const [k, v] of Object.entries(patch) as [keyof AppState, unknown][]) {
    if (state[k] !== v) {
      (state as unknown as Record<string, unknown>)[k] = v;
      changed[k] = true;
    }
  }
  if (Object.keys(changed).length) for (const fn of listeners) fn(changed, state);
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const nodeById = (id: string): PrayerNode => state.world.nodeMap.get(id)!;
export const routeById = (id: string): Route => state.world.routeMap.get(id)!;
export const nusachById = (id: NusachId) => state.world.nusachim.find((n) => n.id === id)!;
export const regionById = (id: string) => state.world.regionMap.get(id)!;
export const worldById = (id: string) => state.world.worldMap.get(id as WorldId)!;
export const currentRoute = (): Route | null => (state.routeId ? routeById(state.routeId) : null);

/** The text record for a node (or a specific route stop) in a nusach. */
export function textRecord(node: PrayerNode, nusach: NusachId, stop?: Stop | null): TextRecord {
  const st = stop?.t?.[nusach];
  if (st) return { ...st, fromStop: true };
  return node.texts[nusach];
}

export const stopOff = (s: Stop, nusach: NusachId = state.nusach): boolean => s.omit || (!!s.only && !s.only.includes(nusach));

export const KIND_HE: Record<Kind, string> = {
  core: 'חלק קבוע',
  conditional: 'מותנה',
  custom: 'מנהג',
  optional: 'רשות',
};
export const KIND_LONG: Record<Kind, string> = {
  core: 'חלק קבוע מהתפילה',
  conditional: 'מותנה בזמן או באירוע',
  custom: 'מנהג — לא בכל הקהילות',
  optional: 'רשות / למי שנוהג',
};
export const REL_HE: Record<string, string> = { contains: 'מכיל', adds: 'נוסף אל', varies: 'משתנה לפי מנהג', related: 'קשור' };
export const REL_IN_HE: Record<string, string> = { contains: 'חלק מתוך', adds: 'מקבל תוספת', varies: 'משתנה לפי מנהג', related: 'קשור' };
export const REL_COLOR: Record<string, string> = { contains: '#ffd27a', adds: '#5dffa2', varies: '#c9a2ff', related: '#7fb2ff' };

export const STATUS_HE: Record<TextStatus, string> = {
  full: 'מלא',
  excerpt: 'קטע',
  lens: 'בסיס ע״מ',
  'lens-only': 'כוונות',
  historical: 'היסטורי',
  unavailable: 'חסר',
  generic: 'כללי',
};
export const STATUS_LONG: Record<TextStatus, string> = {
  full: 'טקסט מלא מהמהדורה',
  excerpt: 'קטע מתוך המהדורה',
  lens: 'טקסט בסיס: עדות המזרח',
  'lens-only': 'שכבת כוונות בלבד',
  historical: 'מקור היסטורי (רמב״ם), לא סידור בלדי',
  unavailable: 'לא זמין במקורות הפתוחים',
  generic: 'טקסט כללי, לא משויך לנוסח',
};
