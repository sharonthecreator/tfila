// The tree whose trunk is the pillar of words: bark of deep furrows and weathered plates (procedural relief, lichen,
// moss toward the foot), root buttresses flaring into roots that run into the meadow, limbs of the same bark rising
// out of the trunk's top into a crown of leaf masses around the sun at the head of the ladder. The crown is lit by the
// evening light on one side and from within by the sun, glows where the light shines through it, and moves in the
// same wind as the grass. It throws a long dappled shadow over the meadow (a map along the evening light).
import * as THREE from 'three';
import { TABLE_Y } from './instrument';
import { growCrown } from './crown';
import { KEY_DIR, NATURE, NATURE_GLSL, ROOTS } from './atmosphere';

const g8 = (xs: number[]) => `float[${xs.length}](${xs.map((x) => x.toFixed(4)).join(', ')})`;

/** Bark: furrows between elongated plates (cellular noise in an anisotropic space), lichen, moss toward the foot. */
export const BARK_GLSL = /* glsl */ `
// furrows: the contour lines of noise fields stretched along the wood, so they run long, wavy and interlacing
float barkFurrows(vec3 q){
#ifdef BARK_HQ
  q += (vec3(vnoise3(q * vec3(0.35, 0.12, 0.35)), 0.0, vnoise3(q * vec3(0.35, 0.12, 0.35) + 3.3)) - 0.5) * vec3(1.4, 0.0, 1.4);
  float v2 = vnoise3(q * vec3(3.4, 0.4, 3.4) + 5.0);
#else
  float v2 = 0.0;
#endif
  float v1 = vnoise3(q * vec3(1.7, 0.2, 1.7));
  float e = abs(v1 - 0.5) * 1.7;
#ifdef BARK_HQ
  e = min(e, abs(v2 - 0.5) * 2.4 + 0.1);
#endif
  // the ridges are broken across here and there
  float brk = smoothstep(0.07, 0.0, abs(vnoise3(q * vec3(1.3, 1.0, 1.3) + 9.0) - 0.5));
  return mix(e, 0.03, brk * 0.8);
}
// q: bark space (stretched along the wood); P: object space; hA: height above the ground; N: normal. Writes the relief height h (0 furrow … 1 plate).
vec3 barkAlbedo(vec3 q, vec3 P, float hA, vec3 N, out float h){
  float e = barkFurrows(q);
  float fw = fwidth(e);
  // a V-shaped furrow: a crisp dark crease at the bottom, rounded plates either side
  float plate = sqrt(clamp(e / (0.34 + fw), 0.0, 1.0));
  float crease = 1.0 - smoothstep(0.0, 0.05 + fw * 1.5, e);
  float fib = vnoise3(q * vec3(6.0, 0.8, 6.0) + P.y * 3.0) * 0.6 + vnoise3(q * vec3(2.0, 3.5, 2.0)) * 0.4;
  // close up: fine grain along the wood and small cross-cracks in the plates (faded out where a pixel covers them)
  float near = 1.0 - smoothstep(0.08, 0.3, fwidth(q.x * 20.0));
  float grain = near > 0.0 ? vnoise3(q * vec3(26.0, 2.6, 26.0)) * 0.6 + vnoise3(q * vec3(9.0, 9.0, 9.0)) * 0.4 : 0.5;
  float crack = near > 0.0 ? smoothstep(0.07, 0.0, abs(vnoise3(q * vec3(3.0, 7.0, 3.0)) - 0.5)) * smoothstep(0.3, 0.6, plate) : 0.0;
  h = plate * (0.78 + 0.22 * fib) + (grain - 0.5) * 0.18 * near - crack * 0.35 * near;
  float tone = vnoise3(P * 2.1);
  vec3 plateC = mix(vec3(0.19, 0.14, 0.1), vec3(0.32, 0.26, 0.2), tone) * (0.78 + 0.38 * fib);
  vec3 c = mix(plateC * vec3(0.32, 0.29, 0.27), plateC, smoothstep(0.0, 0.85, plate)) * (1.0 - crease * 0.75) * (1.0 - crack * 0.5 * near);
  c *= 1.0 + (grain - 0.5) * 0.35 * near;
  c *= 0.8 + 0.4 * vnoise3(q * vec3(1.3, 0.25, 1.3));
  float li = smoothstep(0.64, 0.8, vnoise3(P * 8.0) * 0.65 + vnoise3(P * 25.0) * 0.35) * plate;
  c = mix(c, mix(vec3(0.33, 0.35, 0.28), vec3(0.4, 0.3, 0.12), step(0.72, vnoise3(P * 3.0 + 9.0))), li * 0.55);
  float mz = 1.0 - smoothstep(0.0, 0.85 + vnoise3(P * 1.7) * 0.8, hA);
  vec2 nh = normalize(N.xz + vec2(1e-4));
  float m = mz * smoothstep(0.35, 0.75, vnoise3(P * 4.5) * 0.55 + (1.0 - plate) * 0.4 + 0.25 * (1.0 - max(dot(nh, normalize(KEY_DIR.xz)), 0.0)));
  c = mix(c, vec3(0.055, 0.095, 0.018) * (0.7 + 0.6 * vnoise3(P * 30.0)), m * 0.9);
  h = mix(h, 0.62, m * 0.6);
  return c;
}
// bump mapping from a height without tangents (Mikkelsen), weaker when a pixel covers much bark
vec3 bumpNormal(vec3 W, vec3 N, float h, float amp){
  vec3 dpx = dFdx(W), dpy = dFdy(W);
  amp *= clamp(0.005 / max(length(dpx) + length(dpy), 1e-6), 0.15, 1.0);
  float dhx = dFdx(h) * amp, dhy = dFdy(h) * amp;
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx);
  float det = dot(dpx, r1);
  vec3 grad = sign(det) * (dhx * r1 + dhy * r2);
  return normalize(abs(det) * N - grad);
}
// warm on the side of the evening light, the cool sky on the other, gold from the sun at the head of the ladder
vec3 barkLight(vec3 alb, vec3 N, vec3 V, vec3 W, float ao, float keyVis){
  vec3 S; float fall; vec3 sc = sunLight(W, N, S, fall);
  float NL = max(dot(N, KEY_DIR), 0.0);
  // the warm meadow and the glow bounce light back into the shade side
  vec3 bounce = vec3(0.17, 0.13, 0.08) * (0.6 + 0.4 * max(-N.y, 0.0) + 0.5 * max(dot(N.xz, KEY_DIR.xz), 0.0));
  vec3 col = alb * (ambient(N) * ao * 1.1 + bounce * ao + FILL_COL * max(dot(N, FILL_DIR), 0.0) * ao + KEY_COL * NL * keyVis + sc * max(dot(N, S), 0.0) * 2.6);
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  col += KEY_COL * 0.2 * rim * pow(max(dot(-V, KEY_DIR), 0.0), 1.5) * keyVis * (0.25 + alb.r * 3.0);
  col += SUN_COL * rim * fall * pow(max(dot(-V, S), 0.0), 2.0) * 0.6;
  return col;
}
`;

export interface TrunkOpts { foot: number; top: number; base: number; turnH: number; turns: number; worldColors: THREE.Color[]; hq: boolean }

/**
 * The trunk — the pillar of words. A cylinder (uv.x around, uv.y up, as the words texture is laid out) shaped in the
 * vertex shader into a living trunk: buttresses flaring into the roots, a swelling where the limbs leave it, gentle
 * irregularity and bark ridges that break its outline. The prayers' words are carved into the bark: a recess with a
 * bevelled edge, gilded and glowing where a rung is near.
 */
export function createTrunkMaterial(o: TrunkOpts): THREE.ShaderMaterial {
  const ra = ROOTS.map((r) => (r.a * Math.PI) / 180), rw = ROOTS.map((r) => r.w);
  return new THREE.ShaderMaterial({
    fog: true,
    defines: o.hq ? { BARK_HQ: 1 } : {},
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...NATURE,
      uTime: { value: 0 }, uWords: { value: null }, uHas: { value: 0 }, uCam: { value: new THREE.Vector3() }, uSel: { value: new THREE.Vector3() },
      uBase: { value: o.base }, uTurnH: { value: o.turnH }, uTurns: { value: o.turns },
      uWorldCols: { value: o.worldColors.map((c) => new THREE.Vector3(c.r, c.g, c.b)) }, uWordsK: { value: 1 },
      uFoot: { value: o.foot }, uTopY: { value: o.top }, uLimbA: { value: [0, 1.05, 2.1, 3.14, 4.2, 5.2] },
    },
    vertexShader: NATURE_GLSL + /* glsl */ `
      uniform float uFoot; uniform float uTopY; uniform float uLimbA[6];
      varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying vec3 vP;
      #include <fog_pars_vertex>
      const float RA[8] = ${g8(ra)};
      const float RW[8] = ${g8(rw)};
      float trunkRadius(float th, float y){
        float foot = 1.0 - smoothstep(uFoot, uFoot + 0.62, y);
        float but = 1.0 - smoothstep(uFoot - 0.04, uFoot + 0.3, y);
        float lob = 0.0;
        for (int i = 0; i < 8; i++) lob += pow(max(cos(th - RA[i]), 0.0), 34.0) * RW[i];
        float r = TRUNK_R * (1.0 + 0.34 * foot * foot + 0.95 * lob * but * but);
        float ll = 0.0;
        for (int i = 0; i < 6; i++) ll += pow(max(cos(th - uLimbA[i]), 0.0), 8.0);
        // where the limbs part, the trunk swells toward each of them and then closes over among their bases
        r *= 1.0 + smoothstep(uTopY - 0.7, uTopY, y) * 0.06 * ll;
        r *= 1.0 - 0.5 * smoothstep(uTopY - 0.25, uTopY + 0.3, y);
        // an old trunk is never round: broad bulges and a slow twist
        r *= 1.0 + 0.055 * sin(th * 2.0 + y * 0.9 + 1.3) + 0.035 * sin(th * 3.0 - y * 1.7) + 0.02 * sin(y * 7.3 - th * 3.0);
        vec3 q = vec3(sin(th) * TRUNK_R * 6.5, y * 1.3, cos(th) * TRUNK_R * 6.5);
        r += 0.012 * (vnoise3(q) - 0.5) + 0.006 * (vnoise3(q * 2.3) - 0.5);
        return r;
      }
      // the trunk leans and wanders a little as it grows
      vec3 trunkPoint(float th, float y){ float r = trunkRadius(th, y); vec2 c = vec2(sin(y * 0.75 + 0.4), cos(y * 0.6 + 1.1)) * 0.035 * smoothstep(uFoot, uFoot + 1.2, y); return vec3(sin(th) * r + c.x, y, cos(th) * r + c.y); }
      void main(){
        float th = uv.x * 6.2831853, y = position.y;
        vec3 P = trunkPoint(th, y);
        vec3 n = normalize(cross(trunkPoint(th + 0.01, y) - P, trunkPoint(th, y + 0.01) - P));
        vP = P;
        vUv = vec2(uv.x, (y - uFoot) / (uTopY - uFoot));
        vec4 w = modelMatrix * vec4(P, 1.0); vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * n);
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: NATURE_GLSL + BARK_GLSL + /* glsl */ `
      uniform sampler2D uWords; uniform float uHas; uniform vec3 uCam; uniform vec3 uSel;
      uniform float uBase; uniform float uTurnH; uniform float uTurns; uniform vec3 uWorldCols[4]; uniform float uWordsK; uniform float uTopY;
      varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying vec3 vP;
      #include <fog_pars_fragment>
      void main(){
        vec3 n = normalize(vN);
        vec3 V = normalize(cameraPosition - vW);
        float ang = vUv.x * 6.2831853;
        float u = (vW.y - uBase) / uTurnH - vUv.x;           // helix coordinate: integer = a rung of world u
        float wi = clamp(floor(u + 0.5), 0.0, uTurns - 1.0);
        vec3 wc = wi < 0.5 ? uWorldCols[0] : wi < 1.5 ? uWorldCols[1] : wi < 2.5 ? uWorldCols[2] : uWorldCols[3];
        // bark
        float hb;
        vec3 alb = barkAlbedo(vec3(vP.x * 8.0, vP.y * 2.3, vP.z * 8.0), vP, vW.y - GROUND_Y, n, hb);
        // the prayers' words, carved into the bark: gilded, and glowing with the light from above where a rung is near
        vec4 words = uHas > 0.5 && vUv.y < 1.0 ? texture2D(uWords, vUv) : vec4(0.0);
        float carve = smoothstep(0.035, 0.1, words.a);
        float gild = smoothstep(0.05, 0.15, words.a) * mix(0.55, 1.0, uWordsK);
        alb = mix(alb, mix(alb * 0.3, vec3(0.5, 0.33, 0.1), gild), carve);
        vec3 N = bumpNormal(vW, n, mix(hb, -0.3, carve), 0.011);
        float ao = mix(0.5, 1.0, smoothstep(0.0, 0.8, vW.y - GROUND_Y)) * mix(0.5, 1.0, hb) * mix(1.0, 0.7, carve * (1.0 - gild));
        vec3 col = barkLight(alb, N, V, vW, ao, 1.0);
        col *= mix(1.0, 0.35, smoothstep(uTopY - 0.15, uTopY + 0.22, vP.y));   // the crotch among the limbs is in their shade
        vec3 Hk = normalize(KEY_DIR + V);
        col += KEY_COL * vec3(1.0, 0.8, 0.45) * gild * carve * pow(max(dot(N, Hk), 0.0), 24.0) * 1.5;
        vec3 gold = mix(vec3(1.0, 0.78, 0.42), words.rgb * 4.0, 0.25);
        // the rows by a rung glow; the rest of the words are only cut into the bark
        col += gold * words.a * 2.9 * uWordsK * smoothstep(0.03, 0.1, words.a);
        col += gold * words.a * 0.25 * uWordsK;
        float band = smoothstep(0.5, 0.0, abs(u - floor(u + 0.5))) * step(-0.5, u) * step(u, uTurns - 0.5);
        col += wc * band * 0.012;
        // prayer rising: soft bands of warm light travelling up the trunk
        float rise = pow(0.5 + 0.5 * sin(vW.y * 5.0 - uTime * 0.9 + sin(ang * 3.0) * 0.4), 18.0);
        col += vec3(1.0, 0.82, 0.55) * rise * 0.04;
        // glow behind the prayer in focus
        float da = abs(mod(ang - uSel.x + 3.14159265, 6.2831853) - 3.14159265);
        col += vec3(0.62, 0.94, 1.0) * uSel.z * exp(-da * da * 18.0 - pow((vW.y - uSel.y) * 7.0, 2.0)) * 0.22;
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
}

/** Tubes whose radius tapers along their curves, merged into one geometry, with the tangent and radius per vertex for the bark. */
interface Tube { curve: THREE.Curve<THREE.Vector3>; segs: number; radial: number; r0: number; r1: number; flare?: number; flat?: number }
function branchGeometry(list: Tube[]): THREE.BufferGeometry {
  const pos: number[] = [], nor: number[] = [], tan: number[] = [], rad: number[] = [], idx: number[] = [];
  for (const b of list) {
    const frames = b.curve.computeFrenetFrames(b.segs, false);
    const v0 = pos.length / 3;
    const flat = b.flat ?? 1;
    for (let i = 0; i <= b.segs; i++) {
      const t = i / b.segs;
      const p = b.curve.getPointAt(t);
      const r = THREE.MathUtils.lerp(b.r0, b.r1, Math.pow(t, 0.75)) * (1 + (b.flare ?? 0) * Math.pow(1 - t, 4));
      const T = frames.tangents[i];
      for (let j = 0; j <= b.radial; j++) {
        const v = (j / b.radial) * Math.PI * 2;
        const n = frames.normals[i].clone().multiplyScalar(Math.cos(v)).addScaledVector(frames.binormals[i], Math.sin(v));
        pos.push(p.x + n.x * r, p.y + n.y * r * flat, p.z + n.z * r);
        n.y /= flat;
        n.normalize();
        nor.push(n.x, n.y, n.z);
        tan.push(T.x, T.y, T.z);
        rad.push(r);
      }
    }
    for (let i = 0; i < b.segs; i++) for (let j = 0; j < b.radial; j++) {
      const a = v0 + i * (b.radial + 1) + j, c = a + b.radial + 1;
      idx.push(a, c, a + 1, c, c + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(tan, 3));
  g.setAttribute('aR', new THREE.Float32BufferAttribute(rad, 1));
  g.setIndex(idx);
  return g;
}

/** Bark for the limbs, branches and roots: the trunk's bark, its plates scaled to each branch's girth. */
function barkMaterial(floorY: number, hq: boolean): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    fog: true,
    defines: hq ? { BARK_HQ: 1 } : {},
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...NATURE, uFloorY: { value: floorY } },
    vertexShader: /* glsl */ `
      attribute vec3 aT; attribute float aR;
      varying vec3 vW; varying vec3 vN; varying vec3 vP; varying vec3 vT; varying float vR;
      #include <fog_pars_vertex>
      void main(){
        vP = position; vT = aT; vR = aR;
        vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: NATURE_GLSL + BARK_GLSL + /* glsl */ `
      uniform float uFloorY;
      varying vec3 vW; varying vec3 vN; varying vec3 vP; varying vec3 vT; varying float vR;
      #include <fog_pars_fragment>
      void main(){
        vec3 n = normalize(vN);
        vec3 V = normalize(cameraPosition - vW);
        vec3 T = normalize(vT);
        float along = dot(vP, T);
        float k = clamp(3.1 / max(vR, 0.02), 7.5, 80.0);
        vec3 q = (vP - T * along) * k + T * along * k * 0.28;
        float hA = vW.y - GROUND_Y;
        float hb;
        vec3 alb = barkAlbedo(q, vP, hA, n, hb);
        float rough = smoothstep(0.018, 0.08, vR);   // twigs are smooth
        hb = mix(0.6, hb, rough);
        alb = mix(vec3(0.15, 0.12, 0.095) * (0.8 + 0.4 * vnoise3(vP * 40.0)), alb, rough);
        vec3 N = bumpNormal(vW, n, hb, 0.009 * mix(0.3, 1.0, rough));
        // inside the crown the evening light and the sky are mostly hidden by the leaves; the sun within is not
        float inCrown = smoothstep(uFloorY - 0.2, uFloorY + 0.9, vW.y);
        float ao = mix(1.0, 0.5, inCrown) * mix(0.5, 1.0, hb) * mix(0.35, 1.0, smoothstep(-0.02, 0.16, hA));
        vec3 col = barkLight(alb, N, V, vW, ao, mix(1.0, 0.3, inCrown) * mix(0.4, 1.0, smoothstep(0.0, 0.2, hA)));
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
}

/** Sprigs of leaves for the crown: four variants in a 2×2 atlas. r: light across each leaf, g: which leaf (a hue jitter), a: shape. */
function sprigAtlas(S: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = S * 2;
  const x = c.getContext('2d')!;
  let seed = 3;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const k = S / 256;
  const leaf = (px: number, py: number, ang: number, L: number) => {
    const W = L * (0.36 + rnd() * 0.1), g = Math.floor(rnd() * 255);
    x.save();
    x.translate(px, py);
    x.rotate(ang);
    x.beginPath();
    x.moveTo(0, 0);
    x.bezierCurveTo(W * 0.95, -L * 0.18, W * 0.75, -L * 0.72, 0, -L);
    x.bezierCurveTo(-W * 0.75, -L * 0.72, -W * 0.95, -L * 0.18, 0, 0);
    x.save();
    x.clip();
    // two halves of the leaf folded along the midrib: one catches the light; darker toward the edges
    const gr = x.createLinearGradient(-W, 0, W, 0);
    gr.addColorStop(0, `rgb(150,${g},0)`);
    gr.addColorStop(0.45, `rgb(236,${g},0)`);
    gr.addColorStop(0.55, `rgb(190,${g},0)`);
    gr.addColorStop(1, `rgb(120,${g},0)`);
    x.fillStyle = gr;
    x.fillRect(-W, -L, W * 2, L);
    x.strokeStyle = `rgb(250,${g},0)`;
    x.lineWidth = 1.6 * k;
    x.beginPath();
    x.moveTo(0, 0);
    x.lineTo(0, -L * 0.96);
    x.stroke();
    x.strokeStyle = `rgb(120,${g},0)`;
    x.lineWidth = 0.9 * k;
    for (let j = 1; j < 7; j++) {
      const y = -L * (0.1 + j * 0.115);
      x.beginPath();
      x.moveTo(0, y);
      x.quadraticCurveTo(-W * 0.4, y - L * 0.06, -W * 0.85, y - L * 0.14);
      x.moveTo(0, y);
      x.quadraticCurveTo(W * 0.4, y - L * 0.06, W * 0.85, y - L * 0.14);
      x.stroke();
    }
    x.restore();
    x.restore();
  };
  for (let v = 0; v < 4; v++) {
    x.save();
    x.translate((v % 2) * S + S / 2, Math.floor(v / 2) * S + S - 8 * k);
    const bend = (rnd() - 0.5) * 0.5;
    const n = 5 + (v % 2) * 2;
    const tip = new THREE.Vector2(bend * 60 * k, -S * 0.62);
    const at = (t: number) => new THREE.Vector2(tip.x * t * t, tip.y * t);
    x.strokeStyle = 'rgb(80,0,0)';
    x.lineWidth = 4 * k;
    x.beginPath();
    x.moveTo(0, 0);
    x.quadraticCurveTo(0, tip.y * 0.5, tip.x, tip.y);
    x.stroke();
    for (let j = 0; j < n - 1; j++) {
      const t = 0.2 + (j / (n - 1)) * 0.75;
      const p = at(t), side = j % 2 ? 1 : -1;
      leaf(p.x, p.y, side * (0.95 - t * 0.45) + bend * t, S * (0.27 + 0.1 * Math.sin(Math.PI * t)) * (0.85 + rnd() * 0.3));
    }
    leaf(tip.x, tip.y, bend * 0.8, S * 0.34);
    x.restore();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

export interface TreeOpts {
  trunkR: number;
  bottom: number;
  top: number;
  /** the sun at the head of the ladder */
  sun: THREE.Vector3;
  /** the crown keeps above this height, clear of the ladder */
  clearY: number;
  leaves: number;
  /** motes of light and falling leaves in the crown */
  sparks: number;
  /** leaf atlas cell size (px) */
  leafTex: number;
  /** soft leaf edges by alpha-to-coverage (needs MSAA) */
  a2c: boolean;
  /** full bark relief */
  hq: boolean;
}

export interface Tree {
  group: THREE.Group;
  /** height of the top of the crown and its horizontal radius, for framing */
  maxY: number;
  radius: number;
  /** angles (rad, like the trunk's uv) where the great limbs leave the trunk */
  limbAngles: number[];
  /** wind and light: t is the (motion-respecting) time, wind 0 (still) … 1 */
  update(t: number, wind: number): void;
  /** drawing-buffer height in px, for sizing the points */
  setPixelHeight(h: number): void;
  dispose(): void;
}

/** The crown's shadow on the meadow along the evening light: leaves and limbs splatted into a density map. */
function crownShadowMap(pts: number[][]): { tex: THREE.DataTexture; xf: THREE.Vector4 } {
  const N = 256;
  const L = KEY_DIR;
  const proj = pts.map(([x, y, z, r, w]) => {
    const s = (y - TABLE_Y) / L.y;
    return [x - L.x * s, z - L.z * s, r, w];
  });
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [x, z] of proj) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  const size = Math.max(x1 - x0, z1 - z0) + 3;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const d = new Float32Array(N * N);
  const lh = new THREE.Vector2(L.x, L.z).normalize();
  const stretch = 1 / Math.max(0.3, L.y); // a blob's shadow is drawn out along the light
  for (const [x, z, r, w] of proj) {
    const px = ((x - cx) / size + 0.5) * N, pz = ((z - cz) / size + 0.5) * N;
    const R = Math.max(0.8, (r / size) * N);
    const ext = Math.ceil(R * stretch * 1.6);
    for (let j = Math.max(0, Math.floor(pz - ext)); j <= Math.min(N - 1, Math.ceil(pz + ext)); j++) {
      for (let i = Math.max(0, Math.floor(px - ext)); i <= Math.min(N - 1, Math.ceil(px + ext)); i++) {
        const dx = i - px, dz = j - pz;
        const al = (dx * lh.x + dz * lh.y) / stretch, ac = -dx * lh.y + dz * lh.x;
        const q = (al * al + ac * ac) / (R * R);
        if (q < 2.6) d[j * N + i] += w * Math.exp(-q * 1.6);
      }
    }
  }
  const data = new Uint8Array(N * N * 4);
  for (let i = 0; i < N * N; i++) {
    const v = 1 - Math.exp(-d[i] * 0.9);
    data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = Math.round(v * 255);
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, N, N);
  tex.magFilter = tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return { tex, xf: new THREE.Vector4(cx, cz, 1 / size, 0.82) };
}

/**
 * Roots running from the buttresses of the trunk into the meadow; above the ladder's head the trunk divides into great
 * limbs that branch four times and spread into a wide crown of leaves, open in the middle where the sun stands. The
 * leaves glow where the light shines through them and move in the wind; motes of light rise in the crown and a few
 * leaves drift down.
 */
export function createTree(o: TreeOpts): Tree {
  const group = new THREE.Group();
  group.name = 'tree';
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  const crown = growCrown({ trunkR: o.trunkR, top: o.top, sun: o.sun, clearY: o.clearY, leaves: o.leaves });
  const bark = barkMaterial(crown.floorY, o.hq);

  // roots: out of the buttresses, along the ground and down into it, each with a rootlet or two
  const roots: Tube[] = [];
  for (const R of ROOTS) {
    const a = (R.a * Math.PI) / 180;
    const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
    const side = new THREE.Vector3(dir.z, 0, -dir.x);
    const wig = (rnd() - 0.5) * 0.25;
    const end = 0.85 + R.len;
    const pts = [
      dir.clone().multiplyScalar(0.32).setY(o.bottom + 0.4),
      dir.clone().multiplyScalar(0.64).setY(o.bottom + 0.1),
      dir.clone().multiplyScalar(0.62 + R.len * 0.45).addScaledVector(side, wig * 0.4).setY(o.bottom + 0.015),
      dir.clone().multiplyScalar(end).addScaledVector(side, wig).setY(o.bottom - 0.04),
    ];
    roots.push({ curve: new THREE.CatmullRomCurve3(pts), segs: 22, radial: 10, r0: 0.15 * R.w, r1: 0.012, flat: 0.6 });
    for (let k = 0; k < 2; k++) {
      if (rnd() < 0.35) continue;
      const t = 0.45 + rnd() * 0.3;
      const p = new THREE.CatmullRomCurve3(pts).getPointAt(t);
      const sd = side.clone().multiplyScalar(k ? 1 : -1);
      const d2 = dir.clone().multiplyScalar(0.6).addScaledVector(sd, 0.8).normalize();
      const len = 0.25 + rnd() * 0.3;
      roots.push({
        curve: new THREE.CatmullRomCurve3([p.clone().setY(p.y + 0.01), p.clone().addScaledVector(d2, len * 0.5).setY(o.bottom + 0.005), p.clone().addScaledVector(d2, len).setY(o.bottom - 0.03)]),
        segs: 8, radial: 6, r0: 0.035 * R.w, r1: 0.006, flat: 0.6,
      });
    }
  }
  const rootMesh = new THREE.Mesh(branchGeometry(roots), bark);
  rootMesh.castShadow = rootMesh.receiveShadow = true;
  rootMesh.name = 'roots';
  group.add(rootMesh);

  // the crown sways about the top of the trunk
  const pivot = new THREE.Group();
  pivot.position.y = o.top;
  const crownG = new THREE.Group();
  crownG.position.y = -o.top;
  pivot.add(crownG);
  group.add(pivot);

  const RADIAL = [16, 10, 7, 5], SEGS = [6, 4, 3, 2];
  const limbs = new THREE.Mesh(branchGeometry(crown.branches.map((b) => ({
    curve: new THREE.CatmullRomCurve3(b.pts), segs: b.pts.length * SEGS[b.level], radial: RADIAL[b.level], r0: b.r0, r1: b.r1, flare: b.level === 0 ? 0.6 : 0.18,
  }))), bark);
  limbs.name = 'branches';
  limbs.castShadow = true;
  crownG.add(limbs);
  const limbAngles = crown.branches.filter((b) => b.level === 0).map((b) => {
    const p = b.pts[Math.min(2, b.pts.length - 1)];
    return Math.atan2(p.x, p.z);
  });

  // leaves
  const n = o.leaves;
  const card = new THREE.PlaneGeometry(1, 1, 2, 3).translate(0, 0.5, 0);
  const cp = card.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < cp.count; i++) cp.setZ(i, -Math.abs(cp.getX(i)) * 0.22 + cp.getY(i) * cp.getY(i) * 0.12); // folded and curled
  card.computeVertexNormals();
  card.setAttribute('aMass', new THREE.InstancedBufferAttribute(crown.leafMass, 4));
  card.setAttribute('aCol', new THREE.InstancedBufferAttribute(crown.leafCol, 3));
  card.setAttribute('aVar', new THREE.InstancedBufferAttribute(crown.leafVar, 2));
  const leafMat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    fog: true,
    defines: o.a2c ? { A2C: 1 } : {},
    alphaToCoverage: o.a2c,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...NATURE, uMap: { value: null } },
    vertexShader: NATURE_GLSL + /* glsl */ `
      attribute vec4 aMass; attribute vec3 aCol; attribute vec2 aVar;
      varying vec2 vUv; varying vec3 vCol; varying vec3 vW; varying vec3 vN; varying vec3 vMass; varying float vExp;
      #include <fog_pars_vertex>
      void main(){
        vUv = (uv + vec2(mod(aVar.x, 2.0), 1.0 - floor(aVar.x / 2.0))) * 0.5;
        vec3 root = instanceMatrix[3].xyz;
        vec4 ip = instanceMatrix * vec4(position, 1.0);
        // the same wind as the meadow's: gusts through the whole crown, stronger at its edges; every sprig flutters on its stem
        float ph = aVar.y;
        float reach = 0.35 + smoothstep(0.6, 3.4, length(root.xz));
        vec2 w = windAt(root.xz, uTime, ph * 0.3);
        vec3 gustV = vec3(w.x, 0.25 * length(w) * sin(uTime * 0.9 + root.y + ph * 6.0), w.y) * 0.05 * reach;
        vec3 flutter = vec3(sin(uTime * 2.3 + ph * 18.8), 0.6 * sin(uTime * 2.9 + ph * 31.4), cos(uTime * 1.9 + ph * 25.1)) * 0.026 * uv.y * uWind;
        ip.xyz += gustV * (0.4 + 0.6 * uv.y) + flutter;
        vec4 wp = modelMatrix * ip;
        vW = wp.xyz;
        vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        vMass = normalize(mat3(modelMatrix) * aMass.xyz);
        vExp = aMass.w; vCol = aCol;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: NATURE_GLSL + /* glsl */ `
      uniform sampler2D uMap;
      varying vec2 vUv; varying vec3 vCol; varying vec3 vW; varying vec3 vN; varying vec3 vMass; varying float vExp;
      #include <fog_pars_fragment>
      void main(){
        vec4 tx = texture2D(uMap, vUv);
      #ifdef A2C
        float alpha = smoothstep(0.28, 0.58, tx.a);
        if (alpha < 0.02) discard;
      #else
        float alpha = 1.0;
        if (tx.a < 0.42) discard;
      #endif
        vec3 V = normalize(cameraPosition - vW);
        vec3 nf = normalize(vN); if (dot(nf, V) < 0.0) nf = -nf;   // the face turned to us
        vec3 M = normalize(vMass);
        vec3 N = normalize(mix(nf, M, 0.72));                       // shaded as part of its mass
        vec3 S; float fall; vec3 sc = sunLight(vW, N, S, fall);
        // colour: the leaf's own green, varied leaf by leaf; warmer and golden near the sun
        vec3 base = vCol * mix(0.6, 1.12, tx.r) * mix(vec3(0.86, 0.95, 0.82), vec3(1.16, 1.06, 0.82), tx.g);
        base = mix(base, base * vec3(1.45, 1.2, 0.5) + vec3(0.03, 0.022, 0.0), clamp(fall * 1.3, 0.0, 1.0) * 0.55 * max(dot(N, S) * 0.7 + 0.3, 0.0));
        float occl = mix(0.08, 1.0, vExp * vExp);                  // deep inside the foliage it is dark
        float keyVis = smoothstep(0.2, 0.85, vExp);
        // the evening light on the masses: a lit side and a shade side, the cool sky from above
        float kd = max(dot(N, KEY_DIR) * 0.7 + 0.3, 0.0);
        vec3 col = base * (ambient(N) * 1.5 * occl + FILL_COL * 1.3 * max(dot(N, FILL_DIR), 0.0) * occl + KEY_COL * 1.15 * kd * kd * keyVis);
        // and shining through the leaves when we look toward it
        float backK = pow(max(dot(-V, KEY_DIR), 0.0), 3.0);
        col += base * vec3(1.15, 1.3, 0.4) * KEY_COL * (backK * 2.2 + max(dot(-nf, KEY_DIR), 0.0) * 0.4) * keyVis * mix(0.4, 1.0, tx.r);
        // the sun at the head of the ladder lights the crown from within and below
        col += base * sc * max(dot(N, S), 0.0) * 3.2 * mix(0.25, 1.0, vExp);
        float behind = max(dot(-V, S), 0.0);
        float through = pow(behind, 3.0) + 0.4 * max(dot(-nf, S), 0.0) * smoothstep(0.0, 0.7, behind);
        col += vec3(0.62, 0.66, 0.1) * mix(0.35, 1.0, tx.r) * through * fall * 2.0 * mix(0.3, 1.0, vExp);
        // a gold rim on the masses around the sun, a cool rim of sky along the top of the crown
        float rim = pow(1.0 - max(dot(N, V), 0.0), 2.5);
        col += vec3(1.0, 0.68, 0.3) * rim * fall * max(dot(M, S), 0.0) * 0.8 * vExp;
        col += SKY_COL * rim * max(M.y, 0.0) * vExp * 0.5;
        // the leaves are glossy: they catch the evening light
        vec3 H = normalize(KEY_DIR + V);
        col += KEY_COL * pow(max(dot(nf, H), 0.0), 28.0) * 0.22 * keyVis;
        gl_FragColor = vec4(col, alpha);
        #include <fog_fragment>
      }`,
  });
  leafMat.uniforms.uMap.value = sprigAtlas(o.leafTex);
  const leaves = new THREE.InstancedMesh(card, leafMat, n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const L = crown.leafPos;
    p.set(L[i * 4], L[i * 4 + 1], L[i * 4 + 2]);
    q.fromArray(crown.leafRot, i * 4);
    s.setScalar(L[i * 4 + 3]);
    leaves.setMatrixAt(i, m4.compose(p, q, s));
  }
  leaves.computeBoundingSphere();
  leaves.boundingSphere!.radius += 0.4;
  leaves.name = 'leaves';
  crownG.add(leaves);

  // the crown's long shadow over the meadow
  const pts: number[][] = [];
  const sizeK = Math.sqrt(9000 / Math.max(1, n));
  for (let i = 0; i < n; i++) {
    const L = crown.leafPos;
    pts.push([L[i * 4], L[i * 4 + 1] + L[i * 4 + 3] * 0.3, L[i * 4 + 2], L[i * 4 + 3] * 0.42, 0.55 * sizeK * sizeK]);
  }
  for (const b of crown.branches) {
    const c = new THREE.CatmullRomCurve3(b.pts);
    const len = c.getLength(), k = Math.max(2, Math.ceil(len / 0.08));
    for (let i = 0; i <= k; i++) {
      const pt = c.getPointAt(i / k);
      pts.push([pt.x, pt.y, pt.z, Math.max(0.03, THREE.MathUtils.lerp(b.r0, b.r1, i / k)), 1.2]);
    }
  }
  const shadow = crownShadowMap(pts);
  const oldShadow = NATURE.uCrownShadow.value;
  NATURE.uCrownShadow.value = shadow.tex;
  NATURE.uCrownXf.value.copy(shadow.xf);
  oldShadow.dispose();

  // sparks: motes of light rising through the hollow around the sun, and leaves drifting down under the crown
  const sparkGeo = (count: number) => {
    const g = new THREE.BufferGeometry();
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < seeds.length; i++) seeds[i] = rnd();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    g.boundingSphere = new THREE.Sphere(o.sun.clone(), crown.radius + 1);
    return g;
  };
  const sparkUniforms = { uTime: { value: 0 }, uH: { value: 800 }, uSun: { value: o.sun }, uFloor: { value: crown.floorY }, uClear: { value: o.clearY } };
  const motes = new THREE.Points(sparkGeo(o.sparks), new THREE.ShaderMaterial({
    uniforms: sparkUniforms,
    vertexShader: /* glsl */ `
      attribute vec4 aSeed; uniform float uTime; uniform float uH; uniform vec3 uSun; varying float vA;
      void main(){
        float h = fract(aSeed.z + uTime * 0.01 * (0.5 + aSeed.w));
        float a = aSeed.x * 6.2831853 + uTime * 0.04 * (aSeed.y - 0.5);
        float r = 0.35 + aSeed.y * 2.4;
        vec3 p = uSun + vec3(cos(a) * r, -0.45 + h * 2.4 + sin(uTime * 0.3 + aSeed.x * 20.0) * 0.05, sin(a) * r);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        vA = sin(h * 3.14159) * (0.55 + 0.45 * sin(uTime * 1.7 + aSeed.w * 40.0)) / (1.0 + r * 0.4);
        gl_PointSize = clamp((0.022 + 0.02 * aSeed.w) * projectionMatrix[1][1] * uH * 0.5 / -mv.z, 1.0, 9.0);
      }`,
    fragmentShader: /* glsl */ `varying float vA;
      void main(){ float d = length(gl_PointCoord - 0.5); float a = (smoothstep(0.5, 0.0, d) * 0.5 + smoothstep(0.18, 0.0, d)) * vA;
        gl_FragColor = vec4(vec3(1.0, 0.82, 0.48) * a * 1.4, a); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  motes.name = 'crown-motes';
  const falling = new THREE.Points(sparkGeo(Math.max(4, Math.round(o.sparks * 0.35))), new THREE.ShaderMaterial({
    uniforms: sparkUniforms,
    vertexShader: /* glsl */ `
      attribute vec4 aSeed; uniform float uTime; uniform float uH; uniform float uFloor; uniform float uClear;
      varying float vA; varying float vSpin; varying float vLit;
      void main(){
        float h = fract(aSeed.z + uTime * 0.012 * (0.6 + aSeed.w));
        float a = aSeed.x * 6.2831853 + h * 0.5;
        float r = 1.3 + aSeed.y * 1.9 + h * 0.4;
        float sway = sin(uTime * 1.1 + aSeed.x * 30.0) * 0.18 * h;
        vec3 p = vec3(cos(a) * r + sway * sin(a), mix(uFloor, uClear + 0.05, h), sin(a) * r - sway * cos(a));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        vA = smoothstep(0.0, 0.12, h) * smoothstep(1.0, 0.8, h);
        vSpin = uTime * (1.2 + aSeed.w * 2.0) + aSeed.y * 6.28;
        vLit = 0.55 + 0.45 * sin(vSpin * 1.3);
        gl_PointSize = clamp(0.1 * projectionMatrix[1][1] * uH * 0.5 / -mv.z, 1.5, 28.0);
      }`,
    fragmentShader: /* glsl */ `varying float vA; varying float vSpin; varying float vLit;
      void main(){
        vec2 q = gl_PointCoord - 0.5; float c = cos(vSpin), s = sin(vSpin);
        q = vec2(c * q.x - s * q.y, s * q.x + c * q.y);
        float w = 0.17 * (1.0 - pow(abs(q.y) / 0.45, 2.0)) * (0.6 + 0.4 * abs(sin(vSpin * 0.7)));
        if (abs(q.y) > 0.45 || abs(q.x) > w || vA < 0.02) discard;
        gl_FragColor = vec4(mix(vec3(0.12, 0.17, 0.03), vec3(0.55, 0.45, 0.1), vLit) * (0.8 + 0.4 * vA), vA);
      }`,
    transparent: true, depthWrite: false,
  }));
  falling.name = 'falling-leaves';
  crownG.add(motes, falling);

  return {
    group,
    maxY: crown.maxY,
    radius: crown.radius,
    limbAngles,
    update(t, wind) {
      sparkUniforms.uTime.value = t;
      motes.visible = falling.visible = wind > 0;
      // a breath of wind in the whole crown
      pivot.rotation.set(Math.sin(t * 0.31) * 0.004 * wind, 0, Math.sin(t * 0.37 + 1) * 0.005 * wind);
    },
    setPixelHeight(h) { sparkUniforms.uH.value = h; },
    dispose() {
      group.traverse((ob) => {
        const mesh = ob as THREE.Mesh;
        if (!mesh.geometry) return;
        mesh.geometry.dispose();
        for (const m of ([] as THREE.Material[]).concat(mesh.material)) {
          for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose();
          if (m instanceof THREE.ShaderMaterial) for (const [k, u] of Object.entries(m.uniforms)) if (u.value instanceof THREE.Texture && !(k in NATURE)) u.value.dispose();
          m.dispose();
        }
      });
    },
  };
}
