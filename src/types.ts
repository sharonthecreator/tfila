// Shapes of the generated content in public/data (see scripts/build-content.mjs).

export type NusachId = 'em' | 'ash' | 'sef' | 'chabad' | 'baladi' | 'shami' | 'kabbalah';
export type Kind = 'core' | 'conditional' | 'custom' | 'optional';
export type TextStatus = 'full' | 'excerpt' | 'lens' | 'lens-only' | 'historical' | 'unavailable' | 'generic';
export type WorldId = 'asiyah' | 'yetzirah' | 'beriah' | 'atzilut';
export type RelType = 'contains' | 'adds' | 'varies' | 'related';

export interface TextSummary {
  id: string;
  words: number;
  excerpt: boolean;
  src: string;
  /** direct link to the passage at its source (Sefaria) */
  url?: string;
}

export interface TextRecord extends Partial<TextSummary> {
  status: TextStatus;
  base?: 'em';
  kav?: TextSummary;
  extra?: TextSummary & { label: string };
  fromStop?: boolean;
  /** shown above the text when it is a stand-in of the same form (e.g. a Kaddish from the weekday siddur) */
  label?: string;
}

export interface Relation {
  type: RelType;
  target: string;
  note: string | null;
}

export interface PrayerNode {
  id: string;
  region: string;
  title: string;
  k: Kind;
  imp: number;
  d: string;
  w: string;
  v: string | null;
  tags: string[];
  /** world of the ladder (bottom → top: asiyah, yetzirah, beriah, atzilut) */
  world: WorldId;
  /** 'ari' = placed by the Ari's division of Shacharit; 'tfila' = this project's structural placement */
  wsrc: 'ari' | 'tfila';
  /** the Ari's own reason, when it is not the four-world division of Shacharit */
  wnote?: string;
  /** cylindrical position on the ladder: angle (deg, 0 = +Z), radius, height */
  a: number;
  r: number;
  y: number;
  texts: Record<NusachId, TextRecord>;
  gen: TextSummary | null;
  explanationOnly: boolean;
  rel: Relation[];
}

export interface Stop {
  n: string;
  sec: string | null;
  note: string | null;
  cond: Kind | null;
  only: NusachId[] | null;
  omit: boolean;
  occ: number;
  occTotal: number;
  t: Partial<Record<NusachId, TextRecord>> | null;
}

export interface Route {
  id: string;
  group: string;
  title: string;
  featured: boolean;
  d: string;
  stops: Stop[];
}

export interface Region {
  id: string;
  name: string;
  /** centre angle of the region's sector (deg) */
  a: number;
  color: string;
}

export interface LadderWorld {
  id: WorldId;
  he: string;
  en: string;
  color: string;
  ari: string;
  rule: string;
}

export interface Nusach {
  id: NusachId;
  name: string;
  short: string;
  default?: boolean;
  textual: 'full' | 'partial' | 'historical' | 'none' | 'lens';
  color: string;
  about: string;
}

export interface World {
  generated: string;
  regions: Region[];
  nusachim: Nusach[];
  nodes: PrayerNode[];
  routes: Route[];
  books: Record<string, { title: string; heTitle: string }>;
  worlds: LadderWorld[];
  ladder: { turnH: number; rIn: number; rOut: number; base: number; turns: number; sources: { worlds: TextSummary; descent: TextSummary } };
  editions: { bookHe: string; book: string; version: string; versionHe: string | null; license: string; licenseHe: string; source: string | null; excerpts: number }[];
  nodeMap: Map<string, PrayerNode>;
  routeMap: Map<string, Route>;
  regionMap: Map<string, Region>;
  worldMap: Map<WorldId, LadderWorld>;
}

export interface TextPart {
  segments: string[];
  excerpt: boolean;
  bookHe: string;
  book: string;
  section: string;
  version: string;
  versionHe: string | null;
  license: string;
  licenseHe: string;
  versionSource: string | null;
  sefaria: string;
}

export interface TextPayload {
  id: string;
  parts: TextPart[];
  words: number;
  excerpt: boolean;
}

export interface SearchEntry {
  n: string;
  x: string;
  f: string;
}
