import type { Quality } from '../state';

export interface QualityPreset {
  dpr: number;
  msaa: number;
  shadows: boolean;
  shadowSize: number;
  bloomLevels: number;
  tileSize: number;
  maxTiles: number;
  visibleTiles: number;
  dustWidth: number;
  shell: boolean;
  motes: number;
  grass: number;
  leaves: number;
  /** motes of light and falling leaves in the crown */
  sparks: number;
}

const PRESETS: Record<Exclude<Quality, 'auto'>, QualityPreset> = {
  low: { dpr: 1, msaa: 0, shadows: false, shadowSize: 512, bloomLevels: 4, tileSize: 512, maxTiles: 10, visibleTiles: 6, dustWidth: 2048, shell: false, motes: 120, grass: 7000, leaves: 1500, sparks: 24 },
  medium: { dpr: 1.5, msaa: 0, shadows: true, shadowSize: 1024, bloomLevels: 5, tileSize: 768, maxTiles: 16, visibleTiles: 9, dustWidth: 4096, shell: true, motes: 260, grass: 16000, leaves: 4000, sparks: 60 },
  high: { dpr: 2, msaa: 4, shadows: true, shadowSize: 2048, bloomLevels: 7, tileSize: 1024, maxTiles: 26, visibleTiles: 12, dustWidth: 4096, shell: true, motes: 420, grass: 30000, leaves: 8000, sparks: 110 },
};

export function autoQuality(): Exclude<Quality, 'auto'> {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const small = Math.min(innerWidth, innerHeight) < 700;
  const cores = navigator.hardwareConcurrency || 4;
  if (coarse || small) return cores >= 8 ? 'medium' : 'low';
  return cores >= 6 ? 'high' : 'medium';
}

export function resolvePreset(q: Quality): { level: Exclude<Quality, 'auto'>; preset: QualityPreset } {
  const level = q === 'auto' ? autoQuality() : q;
  const preset = { ...PRESETS[level], dpr: Math.min(PRESETS[level].dpr, window.devicePixelRatio || 1) };
  return { level, preset };
}
