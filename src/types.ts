// Shapes of the generated content in public/data (see scripts/build-content.mjs).

export type NusachId = 'em' | 'ash' | 'sef' | 'chabad' | 'baladi' | 'shami' | 'kabbalah';
export type Kind = 'core' | 'conditional' | 'custom' | 'optional';
export type TextStatus = 'full' | 'excerpt' | 'lens' | 'lens-only' | 'historical' | 'unavailable' | 'generic';
export type RelType = 'contains' | 'adds' | 'varies' | 'related';

export interface TextSummary {
  id: string;
  words: number;
  excerpt: boolean;
  src: string;
}

export interface TextRecord extends Partial<TextSummary> {
  status: TextStatus;
  base?: 'em';
  kav?: TextSummary;
  extra?: TextSummary & { label: string };
  fromStop?: boolean;
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
  lat: number;
  lon: number;
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
  lat: number;
  lon: number;
  color: string;
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
  editions: { bookHe: string; book: string; version: string; versionHe: string | null; license: string; licenseHe: string; source: string | null; excerpts: number }[];
  nodeMap: Map<string, PrayerNode>;
  routeMap: Map<string, Route>;
  regionMap: Map<string, Region>;
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
