// The light of the evening and the air of the meadow, shared by every natural thing in the scene: one low warm light
// (the glow of the set sun, behind the tree), the cool sky above, the sun at the head of the ladder, one wind field
// that rolls across the grass and through the crown, haze that thickens near the ground, and the analytic shadows the
// trunk and the crown throw across the meadow. Everything here is constant or a shared uniform, so the grass, the
// ground, the bark, the leaves, the sky and the fog all agree.
import * as THREE from 'three';
import { TABLE_Y } from './instrument';

/** toward the evening light: low, behind the tree and to the left of the first view */
export const KEY_DIR = new THREE.Vector3(-0.79, 0.37, -0.49).normalize();
export const KEY_COLOR = new THREE.Color('#ffc58e');
export const KEY_INTENSITY = 2.5;
/** the cool sky on the side away from the glow */
export const FILL_DIR = new THREE.Vector3(0.6, 0.55, 0.58).normalize();
/** the wind blows toward this direction (xz) */
export const WIND_DIR = new THREE.Vector2(0.82, 0.57).normalize();

const f = (x: number) => x.toFixed(4);
const v3 = (v: THREE.Vector3 | THREE.Color) => ('isColor' in v ? `vec3(${f(v.r)}, ${f(v.g)}, ${f(v.b)})` : `vec3(${f(v.x)}, ${f(v.y)}, ${f(v.z)})`);
const KEY_H = new THREE.Vector2(KEY_DIR.x, KEY_DIR.z).normalize();

/** roots of the tree: angle (deg, 0 = +Z toward +X, like the ladder) and length; none near 0°, where the ladder's posts stand */
export const ROOTS: { a: number; len: number; w: number }[] = [
  { a: 38, len: 0.95, w: 1 }, { a: 81, len: 0.7, w: 0.8 }, { a: 122, len: 1.1, w: 1 }, { a: 163, len: 0.75, w: 0.85 },
  { a: 205, len: 1.0, w: 1 }, { a: 248, len: 0.65, w: 0.75 }, { a: 290, len: 1.05, w: 0.95 }, { a: 328, len: 0.6, w: 0.7 },
];

function white(): THREE.DataTexture {
  const t = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  t.needsUpdate = true;
  return t;
}

/** uniforms shared by all the materials of nature (one object each, so a change reaches every material) */
export const NATURE = {
  uTime: { value: 0 },
  uWind: { value: 1 },
  /** the sun at the head of the ladder */
  uSunPos: { value: new THREE.Vector3(0, 3.23, 0) },
  /** the crown's shadow on the ground, seen along the evening light: r = density */
  uCrownShadow: { value: white() as THREE.Texture },
  /** centre (xz) of that map on the ground, 1 / its size, strength */
  uCrownXf: { value: new THREE.Vector4(0, 0, 0.05, 0) },
  /** the stones of the place: centre on the ground (xz in x,z) and radius (w) */
  uStones: { value: Array.from({ length: 12 }, () => new THREE.Vector4(0, 0, 999, 0.01)) },
  /** height of the top of the trunk */
  uTrunkTop: { value: 2.4 },
};

/** Noise, wind, light, haze and shadows, for every nature shader. Uses NATURE's uniforms. */
export const NATURE_GLSL = /* glsl */ `
#define GROUND_Y ${f(TABLE_Y)}
#define TRUNK_R 0.42
const vec3 KEY_DIR = ${v3(KEY_DIR)};
const vec3 KEY_COL = ${v3(KEY_COLOR.clone().multiplyScalar(KEY_INTENSITY / Math.PI))};
const vec3 FILL_DIR = ${v3(FILL_DIR)};
const vec3 FILL_COL = vec3(0.045, 0.07, 0.13);
const vec3 SKY_COL = vec3(0.16, 0.21, 0.34);
const vec3 BOUNCE_COL = vec3(0.075, 0.07, 0.035);
const vec3 SUN_COL = vec3(1.0, 0.72, 0.38);
const vec2 WIND_DIR = vec2(${f(WIND_DIR.x)}, ${f(WIND_DIR.y)});
uniform float uTime; uniform float uWind; uniform vec3 uSunPos;
uniform sampler2D uCrownShadow; uniform vec4 uCrownXf; uniform vec4 uStones[12]; uniform float uTrunkTop;

float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float hash13(vec3 p3){ p3 = fract(p3 * 0.1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
vec3 hash33(vec3 p3){ p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yxz + 33.33); return fract((p3.xxy + p3.yxx) * p3.zyx); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), f.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), f.x), f.y); }
float vnoise3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x), mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x), mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
float fbm2(vec2 p){ return vnoise(p) * 0.55 + vnoise(p * 2.07 + 5.3) * 0.3 + vnoise(p * 4.3 + 1.7) * 0.15; }

// ── wind: big slow gusts rolling across the field with the wind, a travelling wave, and every blade's own flutter
float gust(vec2 xz, float t){
  vec2 p = xz * 0.13 - WIND_DIR * t * 0.42;
  float n = vnoise(p) * 0.68 + vnoise(p * 2.3 + 4.1) * 0.32;
  return smoothstep(0.38, 0.92, n);
}
vec2 windAt(vec2 xz, float t, float ph){
  float g = gust(xz, t);
  float wave = sin(dot(xz, WIND_DIR) * 1.9 - t * 2.1 + ph * 0.6);
  vec2 w = WIND_DIR * (0.16 + 0.75 * g + 0.12 * wave * (0.35 + g));
  w += vec2(sin(t * 5.7 + ph * 6.2832), cos(t * 4.9 + ph * 9.13)) * 0.055 * (0.35 + g);
  return w * uWind;
}

// ── the meadow's colours, shared by the blades and the ground they stand on
float meadowDry(vec2 xz){
  float n = fbm2(xz * 0.21 + 3.1);
  float d = smoothstep(0.42, 0.74, n);
  return clamp(d * 0.9 - 0.25 * (1.0 - smoothstep(1.0, 3.2, length(xz))), 0.0, 1.0); // lush in the tree's shade
}
vec3 bladeMid(float dry){ return mix(vec3(0.085, 0.17, 0.03), vec3(0.19, 0.2, 0.055), dry); }
vec3 bladeTip(float dry){ return mix(vec3(0.21, 0.3, 0.065), vec3(0.5, 0.38, 0.15), dry); }

// ── shadows of the evening light: the trunk (analytic, soft with distance) and the crown (a map along the light)
float trunkShadow(vec3 p){
  vec2 L = KEY_DIR.xz;
  float s = -dot(p.xz, L) / dot(L, L);
  if (s <= 0.0) return 1.0;
  float dmin = length(p.xz + L * s);
  float y = p.y + KEY_DIR.y * s;
  float R = TRUNK_R * (1.0 + 0.5 * (1.0 - smoothstep(GROUND_Y, GROUND_Y + 0.6, y)));
  float pen = 0.015 + 0.03 * s;
  float sh = smoothstep(R + pen, R - pen, dmin) * smoothstep(uTrunkTop + 0.3 + pen, uTrunkTop - pen, y);
  return 1.0 - sh * 0.92;
}
float crownShadow(vec3 p){
  vec3 g = p - KEY_DIR * ((p.y - GROUND_Y) / KEY_DIR.y);
  vec2 uv = (g.xz - uCrownXf.xy) * uCrownXf.z + 0.5;
  uv += windAt(g.xz * 0.5, uTime * 0.7, 0.0) * 0.0012;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 1.0;
  return 1.0 - texture2D(uCrownShadow, uv).r * uCrownXf.w;
}
float keyShadow(vec3 p){ return trunkShadow(p) * crownShadow(p); }

// ── contact darkening where the meadow meets the trunk, the stones and the ladder's posts
float contactAO(vec3 p){
  float ao = mix(0.42, 1.0, smoothstep(0.6, 1.25, length(p.xz)));
  ao *= mix(0.55, 1.0, smoothstep(0.012, 0.09, length(p.xz - vec2(0.0, 0.74))));
  ao *= mix(0.55, 1.0, smoothstep(0.012, 0.09, length(p.xz - vec2(0.0, 1.36))));
  for (int i = 0; i < 12; i++) {
    vec4 s = uStones[i];
    ao *= mix(0.38, 1.0, smoothstep(0.8, 1.75, length(p.xz - s.xz) / s.w));
  }
  return ao;
}

// ── light: the sky (cool above, a dim green bounce below), the evening key, the cool fill, the sun at the ladder's head
vec3 ambient(vec3 N){ return mix(BOUNCE_COL, SKY_COL, 0.5 + 0.5 * N.y); }
vec3 sunLight(vec3 P, vec3 N, out vec3 S, out float fall){
  S = uSunPos - P; float ds = length(S); S /= ds;
  fall = 1.0 / (1.0 + ds * ds * 0.9);
  return SUN_COL * fall;
}
`;

/** The colour of the haze in a direction: warm toward the evening light, a cool lilac away from it. */
export const HAZE_GLSL = /* glsl */ `
#ifndef TF_HAZE
#define TF_HAZE
vec3 tfHaze(vec3 d){
  vec2 h = normalize(d.xz + vec2(1e-5));
  float tw = dot(h, vec2(${f(KEY_H.x)}, ${f(KEY_H.y)})) * 0.5 + 0.5;
  vec3 c = mix(vec3(0.2, 0.2, 0.3), vec3(0.85, 0.47, 0.24), pow(tw, 3.5));
  c = mix(c, vec3(0.36, 0.3, 0.36), 0.2 * (1.0 - tw));
  // looking up there is less air; looking down, the dark land shows through the haze
  return c * (1.0 - 0.3 * smoothstep(0.0, 0.5, d.y)) * (1.0 - 0.45 * smoothstep(-0.01, -0.2, d.y));
}
#endif
`;

let fogInstalled = false;
/**
 * Aerial perspective for every material with fog: the haze thickens with distance and near the ground (exponential
 * height fog), and takes its colour from the sky in that direction — warm toward the evening glow.
 */
export function installAtmosphere(): void {
  if (fogInstalled) return;
  fogInstalled = true;
  const C = THREE.ShaderChunk as unknown as Record<string, string>;
  C.fog_pars_vertex = '#ifdef USE_FOG\n varying float vFogDepth; varying vec3 vFogView;\n#endif\n';
  C.fog_vertex = '#ifdef USE_FOG\n vFogDepth = - mvPosition.z; vFogView = mvPosition.xyz;\n#endif\n';
  C.fog_pars_fragment = `#ifdef USE_FOG
  uniform vec3 fogColor; varying float vFogDepth; varying vec3 vFogView;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear; uniform float fogFar;
  #endif
  ${HAZE_GLSL}
#endif
`;
  C.fog_fragment = `#ifdef USE_FOG
  {
    vec3 fogW = (vec4(vFogView, 0.0) * viewMatrix).xyz;
    float fogDist = length(fogW);
    vec3 fogD = fogW / max(fogDist, 1e-4);
    float fh0 = max(cameraPosition.y - (${f(TABLE_Y)}), 0.0);
    float fh1 = max(fh0 + fogW.y, 0.0);
    float fdh = fh1 - fh0;
    const float fk = 0.6;
    float fInt = abs(fdh) > 0.01 ? (exp(-fk * fh0) - exp(-fk * fh1)) / (fk * fdh) : exp(-fk * fh0);
    #ifdef FOG_EXP2
      float fogFactor = 1.0 - exp(-fogDensity * fogDensity * fogDist * fogDist * 0.6 - fogDist * fogDensity * 0.25 * fInt);
    #else
      float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    gl_FragColor.rgb = mix(gl_FragColor.rgb, tfHaze(fogD), fogFactor);
  }
#endif
`;
}
