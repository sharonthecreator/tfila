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
  /** grass blades: around the tree (fixed), and three rings that follow the camera (near, mid, far) */
  grass: [number, number, number, number];
  /** segments per blade in each of those layers */
  grassSegs: [number, number, number, number];
  /** wildflowers and seed heads in the meadow */
  flowers: number;
  leaves: number;
  /** leaf atlas cell size (px) */
  leafTex: number;
  /** motes of light and falling leaves in the crown */
  sparks: number;
  /** god rays from the sun through the crown: samples per pixel (0 = off; a soft sprite stands in) */
  godRays: number;
  /** film grain strength */
  grain: number;
  /** full bark relief (domain-warped plates); off: a cheaper pattern */
  barkHQ: boolean;
}

const PRESETS: Record<Exclude<Quality, 'auto'>, QualityPreset> = {
  low: {
    dpr: 1, msaa: 0, shadows: false, shadowSize: 512, bloomLevels: 4, tileSize: 512, maxTiles: 10, visibleTiles: 6, dustWidth: 2048, shell: false, motes: 80,
    grass: [7000, 4000, 3000, 0], grassSegs: [3, 4, 3, 2], flowers: 60, leaves: 1600, leafTex: 256, sparks: 24, godRays: 0, grain: 0, barkHQ: false,
  },
  medium: {
    dpr: 1.5, msaa: 0, shadows: true, shadowSize: 1024, bloomLevels: 5, tileSize: 768, maxTiles: 16, visibleTiles: 9, dustWidth: 4096, shell: true, motes: 170,
    grass: [15000, 14000, 18000, 16000], grassSegs: [5, 5, 3, 2], flowers: 200, leaves: 4500, leafTex: 512, sparks: 60, godRays: 36, grain: 0.022, barkHQ: true,
  },
  high: {
    dpr: 2, msaa: 4, shadows: true, shadowSize: 2048, bloomLevels: 7, tileSize: 1024, maxTiles: 26, visibleTiles: 12, dustWidth: 4096, shell: true, motes: 270,
    grass: [30000, 30000, 32000, 30000], grassSegs: [6, 6, 4, 3], flowers: 440, leaves: 9000, leafTex: 512, sparks: 110, godRays: 60, grain: 0.026, barkHQ: true,
  },
};

/** WebGL drawn by the CPU (no GPU, or a blocked one): every effect costs many times more there */
let software: boolean | null = null;
function softwareRenderer(): boolean {
  if (software !== null) return software;
  software = false;
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (gl) {
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      const name = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
      software = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch { /* keep the guess */ }
  return software;
}

export function autoQuality(): Exclude<Quality, 'auto'> {
  if (softwareRenderer()) return 'low';
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
