// Tiny observable store.
const listeners = new Set();

export const state = {
  world: null,
  nusach: 'em',
  nodeId: null, // selected node
  routeId: null, // active route
  stopIndex: -1, // selected stop within route
  journey: false, // guided journey playing
  reduceMotion: false,
  textView: false,
  query: '',
};

export function set(patch) {
  const changed = {};
  for (const [k, v] of Object.entries(patch)) if (state[k] !== v) { state[k] = v; changed[k] = true; }
  if (Object.keys(changed).length) for (const fn of listeners) fn(changed, state);
}

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

// helpers
export const nodeById = (id) => state.world?.nodeMap.get(id);
export const routeById = (id) => state.world?.routeMap.get(id);
export const nusachById = (id) => state.world?.nusachim.find((n) => n.id === id);
export const regionById = (id) => state.world?.regionMap.get(id);

export const STATUS_HE = {
  core: 'חלק קבוע',
  conditional: 'מותנה בזמן או באירוע',
  custom: 'מנהג',
  optional: 'רשות / למי שנוהג',
};
export const REL_HE = {
  contains: 'מכיל',
  adds: 'נוסף אל',
  varies: 'משתנה לפי מנהג',
  related: 'קשור',
};
export const TEXT_STATUS_HE = {
  full: 'טקסט מלא',
  excerpt: 'קטע',
  lens: 'טקסט בסיס: עדות המזרח',
  'lens-only': 'שכבת כוונות בלבד',
  historical: 'מקור היסטורי (רמב״ם)',
  unavailable: 'לא זמין',
};
