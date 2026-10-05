// The world around the ladder: a sky at the hour of Jacob's dream ("וילן שם כי בא השמש"), a meadow of grass and
// wildflowers that moves in the wind, and the stones of the place ("ויקח מאבני המקום"). The tree whose trunk is the
// pillar of words is in tree.ts; the light, the wind and the haze they all share are in atmosphere.ts.
import * as THREE from 'three';
import { TABLE_Y } from './instrument';
import { HAZE_GLSL, NATURE, NATURE_GLSL, ROOTS, KEY_DIR } from './atmosphere';

export const SKY = {
  /** the base colour of the fog (its real colour comes from the sky in each direction: see atmosphere.ts) */
  fog: new THREE.Color('#5f5566'),
};

function seeded(seed: number): () => number {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

const KEY_H = new THREE.Vector2(KEY_DIR.x, KEY_DIR.z).normalize();

/**
 * Sky dome at dusk: deep blue overhead, a warm glow low where the sun has gone down, the pink belt of Venus over the
 * earth's shadow on the other side, long thin clouds lit from below, the first stars, and far hills and treelines
 * dissolving into the haze at the horizon.
 */
export function createSky(): THREE.Mesh {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { ...NATURE },
    vertexShader: /* glsl */ `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */ `
      ${NATURE_GLSL}
      ${HAZE_GLSL}
      varying vec3 vD;
      const vec2 KEY_H = vec2(${KEY_H.x.toFixed(4)}, ${KEY_H.y.toFixed(4)});
      void main(){
        vec3 d = normalize(vD);
        float y = d.y, yy = max(y, 0.0);
        vec2 h = normalize(d.xz + vec2(1e-5));
        float tw = dot(h, KEY_H) * 0.5 + 0.5;
        float glow = pow(tw, 4.0);
        // the dome
        vec3 zen = vec3(0.008, 0.017, 0.056);
        vec3 mid = mix(vec3(0.045, 0.075, 0.19), vec3(0.17, 0.15, 0.24), glow);
        vec3 c = mix(mid, zen, smoothstep(0.0, 0.8, pow(yy, 0.75)));
        // the horizon band melts into the haze (the fog has the same colour there, so the meadow meets the sky without a seam)
        vec3 hz = tfHaze(vec3(d.x, 0.0, d.z));
        c = mix(c, hz, exp(-yy * mix(15.0, 6.5, glow)));
        // the glow over the place where the sun went down
        vec3 sd = normalize(vec3(KEY_H.x, -0.05, KEY_H.y));
        float s = max(dot(d, sd), 0.0);
        c += vec3(1.0, 0.48, 0.2) * (pow(s, 6.0) * 0.26 + pow(s, 18.0) * 0.16) * smoothstep(-0.02, 0.06, y);
        // opposite it: the pink belt of Venus over the blue shadow of the earth
        float anti = pow(1.0 - tw, 2.0);
        c += vec3(0.2, 0.085, 0.12) * anti * exp(-pow((yy - 0.14) / 0.075, 2.0));
        c = mix(c, vec3(0.11, 0.12, 0.21), anti * (1.0 - smoothstep(0.0, 0.08, yy)) * 0.45);
        // long thin clouds, lit from below toward the glow, dusky grey elsewhere
        vec2 uv = d.xz / (yy + 0.12);
        vec2 cuv = vec2(dot(uv, vec2(0.86, 0.5)), dot(uv, vec2(-0.5, 0.86))) * vec2(0.5, 2.3) + vec2(uTime * 0.005, 0.0);
        float cl = smoothstep(0.52, 0.84, fbm2(cuv) * 0.72 + vnoise(cuv * 3.3) * 0.28) * smoothstep(0.035, 0.17, yy) * (1.0 - smoothstep(0.42, 0.8, yy));
        vec3 cloud = mix(vec3(0.075, 0.07, 0.11), vec3(1.05, 0.5, 0.26), glow * (1.0 - smoothstep(0.06, 0.42, yy)));
        cloud = mix(cloud, vec3(0.24, 0.12, 0.15), anti * 0.4 * (1.0 - smoothstep(0.1, 0.4, yy)));
        c = mix(c, cloud, cl * 0.75);
        // the first stars, high up and away from the glow
        vec2 g = d.xz / (y + 1.0) * 230.0;
        float st = step(0.9972, hash12(floor(g))) * smoothstep(0.35, 0.85, y) * (1.0 - glow) * (0.6 + 0.4 * sin(uTime * 1.3 + hash12(floor(g)) * 30.0));
        c += vec3(st) * 0.7;
        // far hills, and nearer lines of trees, in the haze
        if (y < 0.06) {
          float aa = max(fwidth(y), 1e-4);
          float hill = 0.006 + 0.026 * fbm2(h * 2.6 + 3.0);
          float trees = 0.003 + 0.011 * fbm2(h * 7.0 + 11.0);
          trees += 0.0065 * smoothstep(0.35, 0.8, vnoise(h * 260.0)) * smoothstep(0.35, 0.6, vnoise(h * 11.0));
          trees *= smoothstep(0.3, 0.55, vnoise(h * 4.0 + 2.0));
          vec3 hillC = hz * mix(vec3(0.78, 0.8, 0.9), vec3(0.85, 0.75, 0.75), glow);
          vec3 treeC = hz * mix(vec3(0.5, 0.55, 0.66), vec3(0.6, 0.48, 0.45), glow);
          c = mix(c, hillC, smoothstep(hill + aa, hill - aa, y));
          c = mix(c, treeC, smoothstep(trees + aa, trees - aa, y));
        }
        if (y < 0.0) c = mix(c, tfHaze(d), smoothstep(0.0, -0.02, y));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(80, 64, 40), mat);
  sky.frustumCulled = false;
  sky.renderOrder = -10;
  sky.name = 'sky';
  return sky;
}

/**
 * The ground: where the blades end it carries on as a field of the same colours and noise (fresh green, dry gold
 * patches, the sheen of the gusts rolling over it); under the blades it is the dark thatch of the sward; at the foot of
 * the trunk, bare earth with leaf litter, darkened where it meets the trunk, the roots, the stones and the posts. It
 * takes the trunk's and the crown's long shadows from the evening light.
 */
export function createGround(lq = false): THREE.Mesh {
  const roots = ROOTS.map((r) => new THREE.Vector4(Math.sin((r.a * Math.PI) / 180), Math.cos((r.a * Math.PI) / 180), 0.85 + r.len, r.w));
  const mat = new THREE.ShaderMaterial({
    fog: true,
    defines: lq ? { LQ: 1 } : {},
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...NATURE, uRoots: { value: roots } },
    vertexShader: /* glsl */ `
      varying vec3 vW;
      #include <fog_pars_vertex>
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      ${NATURE_GLSL}
      uniform vec4 uRoots[8];
      varying vec3 vW;
      #include <fog_pars_fragment>
      float segD(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
      void main(){
        vec2 xz = vW.xz;
        float r = length(xz);
        float camD = distance(vW, cameraPosition);
        float dry = meadowDry(xz);
        // the field: blades seen from above and afar, in streaks that lean with the wind
        vec2 sq = vec2(dot(xz, vec2(0.82, 0.57)), dot(xz, vec2(-0.57, 0.82)));
        float n1 = vnoise(sq * vec2(5.0, 15.0));
        float n2 = vnoise(xz * 41.0);
        #ifndef LQ
          n1 = n1 * 0.7 + vnoise(sq * vec2(13.0, 38.0)) * 0.3;
        #endif
        float tuft = vnoise(xz * 2.3) * 0.6 + vnoise(xz * 7.1) * 0.4;
        vec3 field = mix(bladeMid(dry), bladeTip(dry), 0.18 + 0.35 * n1) * (0.62 + 0.3 * n2 + 0.25 * tuft);
        // close by, the field is a tangle of blade tops over dark gaps
        float fine = smoothstep(0.004, 0.0, length(fwidth(xz)) * 0.03) ;
        float strands = 0.0;
        #ifndef LQ
          vec2 sq2 = vec2(dot(xz, vec2(0.6, 0.8)), dot(xz, vec2(-0.8, 0.6)));
          strands = smoothstep(0.55, 0.85, vnoise(sq * vec2(28.0, 90.0))) * 0.6 + smoothstep(0.55, 0.85, vnoise(sq2 * vec2(25.0, 80.0) + 3.0)) * 0.6;
        #endif
        float gap = smoothstep(0.35, 0.75, vnoise(xz * 60.0));
        field *= mix(1.0, mix(0.45, 1.0, gap) + strands * 0.7, (1.0 - smoothstep(1.0, 12.0, camD)) * 0.9);
        // underneath the sward close by: dark thatch
        vec3 thatch = mix(vec3(0.022, 0.03, 0.01), vec3(0.06, 0.055, 0.024), n2 * 0.7 + dry * 0.3);
        float open = smoothstep(1.5, 9.0, camD) * mix(0.65, 1.0, smoothstep(2.6, 4.6, r));
        vec3 col = mix(thatch, field, mix(0.45, 0.95, open));
        // bare earth and leaf litter at the foot of the trunk, along the roots
        float ang = atan(xz.x, xz.y);
        float soilR = 0.92 + 0.22 * vnoise(vec2(ang * 2.2, 3.0)) + 0.12 * vnoise(xz * 3.0);
        float soil = 1.0 - smoothstep(soilR - 0.28, soilR + 0.08, r);
        float rootD = 9.0;
        for (int i = 0; i < 8; i++) {
          vec4 R = uRoots[i];
          float d = segD(xz, R.xy * 0.4, R.xy * R.z) / mix(1.0, 0.25, clamp((length(xz) - 0.4) / R.z, 0.0, 1.0));
          rootD = min(rootD, d / R.w);
        }
        soil = max(soil, (1.0 - smoothstep(0.06, 0.2, rootD)) * (1.0 - smoothstep(1.4, 2.0, r)));
        vec3 earth = mix(vec3(0.03, 0.019, 0.011), vec3(0.075, 0.05, 0.03), n2);
        float litter = smoothstep(0.62, 0.8, vnoise(xz * 23.0)) * (0.6 + 0.4 * vnoise(xz * 5.0));
        earth = mix(earth, mix(vec3(0.14, 0.075, 0.03), vec3(0.2, 0.15, 0.06), n2), litter * 0.75);
        earth = mix(earth, vec3(0.03, 0.05, 0.012), smoothstep(0.55, 0.8, vnoise(xz * 9.0 + 4.0)) * 0.6); // moss
        col = mix(col, earth, soil);
        // light
        float sh = keyShadow(vW);
        float ao = contactAO(vW) * mix(0.55, 1.0, smoothstep(0.03, 0.22, rootD));
        vec3 N = vec3(0.0, 1.0, 0.0);
        vec3 S; float fall; vec3 sc = sunLight(vW, N, S, fall);
        float sunVis = smoothstep(1.4, 3.0, r);
        // lit like the blades it stands for: from the light's side we see their lit faces, against it their shaded
        // backs with the light shining through
        vec3 V = normalize(cameraPosition - vW);
        float facing = 0.5 + 0.5 * dot(normalize(V.xz + vec2(1e-4)), normalize(KEY_DIR.xz));
        float bladeK = 0.16 + 0.5 * facing + 0.3 * pow(1.0 - facing, 3.0);
        float keyK = mix(bladeK, KEY_DIR.y, soil);
        vec3 light = ambient(vec3(0.0, mix(0.35, 1.0, soil), 0.9)) * ao + FILL_COL * 0.5 * ao + KEY_COL * keyK * sh * (0.75 + 0.25 * ao) + sc * S.y * 1.6 * sunVis;
        col *= light;
        // the gusts: blades bowing over show their lighter, drier sides
        float g = gust(xz, uTime) * uWind;
        col *= 1.0 + 0.35 * g * smoothstep(1.5, 5.0, camD) * (1.0 - soil);
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(150, 96).rotateX(-Math.PI / 2), mat);
  ground.position.y = TABLE_Y;
  ground.name = 'ground';
  ground.renderOrder = -5;
  return ground;
}

// ───────────────────────────── the stones of the place ─────────────────────────────
interface StoneSpec { x: number; z: number; s: number; sx: number; sy: number; rot: [number, number, number]; seed: number }
/** where the stones lie (also used by the meadow, which grows around them and darkens against them) */
export const STONES: StoneSpec[] = (() => {
  const rnd = seeded(7);
  const out: StoneSpec[] = [];
  for (let i = 0; i < 12; i++) {
    const s = 0.06 + rnd() * 0.13;
    const sx = 1 + rnd() * 0.6;
    const a = (i / 12) * Math.PI * 2 + rnd() * 0.4, r = 1.55 + rnd() * 0.6;
    out.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, s, sx, sy: 0.62 + rnd() * 0.25, rot: [(rnd() - 0.5) * 0.3, rnd() * 6, (rnd() - 0.5) * 0.3], seed: rnd() * 100 });
  }
  return out;
})();
NATURE.uStones.value.forEach((v, i) => { const st = STONES[i]; v.set(st.x, 0, st.z, st.s * (1 + (st.sx - 1) * 0.5) * 1.05); });

function noise3(): (x: number, y: number, z: number) => number {
  const h = (x: number, y: number, z: number) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
  const sm = (t: number) => t * t * (3 - 2 * t);
  return (x, y, z) => {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const fx = sm(x - ix), fy = sm(y - iy), fz = sm(z - iz);
    const l = (a: number, b: number, t: number) => a + (b - a) * t;
    return l(
      l(l(h(ix, iy, iz), h(ix + 1, iy, iz), fx), l(h(ix, iy + 1, iz), h(ix + 1, iy + 1, iz), fx), fy),
      l(l(h(ix, iy, iz + 1), h(ix + 1, iy, iz + 1), fx), l(h(ix, iy + 1, iz + 1), h(ix + 1, iy + 1, iz + 1), fx), fy), fz);
  };
}

/** The stones of the place: weathered, half sunk in the earth, with lichen and moss on their tops. */
export function createStones(): THREE.Group {
  const g = new THREE.Group();
  const n3 = noise3();
  const fbm = (x: number, y: number, z: number) => n3(x, y, z) * 0.55 + n3(x * 2.1, y * 2.1, z * 2.1) * 0.3 + n3(x * 4.3, y * 4.3, z * 4.3) * 0.15;
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: 0, envMapIntensity: 0.22 });
  for (const st of STONES) {
    const geo = new THREE.IcosahedronGeometry(1, 4);
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let k = 0; k < pos.count; k++) {
      v.fromBufferAttribute(pos, k);
      const o = st.seed;
      let r = 1 + 0.32 * (fbm(v.x * 1.3 + o, v.y * 1.3, v.z * 1.3) - 0.5) + 0.06 * (n3(v.x * 7 + o, v.y * 7, v.z * 7) - 0.5);
      // a few flat faces, as broken stone has
      const facet = Math.max(Math.abs(v.x * 0.9 + v.y * 0.3), Math.abs(v.z * 0.85 - v.y * 0.4));
      r = Math.min(r, 1.02 / Math.max(0.6, facet + 0.25));
      v.multiplyScalar(r);
      if (v.y < -0.35) v.y = -0.35 + (v.y + 0.35) * 0.3; // the buried underside is flat
      pos.setXYZ(k, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    const nor = geo.getAttribute('normal') as THREE.BufferAttribute;
    const col = new Float32Array(pos.count * 3);
    const c = new THREE.Color(), n = new THREE.Vector3();
    const tone = n3(st.seed, 1, 2);
    for (let k = 0; k < pos.count; k++) {
      v.fromBufferAttribute(pos, k);
      n.fromBufferAttribute(nor, k);
      const o = st.seed + 5;
      const grain = n3(v.x * 9 + o, v.y * 9, v.z * 9);
      c.setRGB(0.24 + 0.07 * tone, 0.2 + 0.05 * tone, 0.155).multiplyScalar(0.7 + 0.5 * grain);
      // lichen: pale rosettes, a few rust-orange
      const li = THREE.MathUtils.smoothstep(n3(v.x * 5 + o, v.y * 5, v.z * 5) * 0.7 + n3(v.x * 15, v.y * 15 + o, v.z * 15) * 0.3, 0.6, 0.75);
      c.lerp(n3(v.x * 2, v.y * 2, v.z * 2 + o) > 0.6 ? new THREE.Color(0.42, 0.2, 0.06) : new THREE.Color(0.42, 0.43, 0.33), li * 0.65);
      // moss on the top, where rain and seeds settle
      const moss = THREE.MathUtils.smoothstep(n.y + (n3(v.x * 3, v.y * 3 + o, v.z * 3) - 0.5) * 0.9, 0.45, 0.9);
      c.lerp(new THREE.Color(0.05, 0.085, 0.02), moss * 0.85);
      // darker where it sinks into the earth
      c.multiplyScalar(THREE.MathUtils.lerp(0.35, 1, THREE.MathUtils.smoothstep(v.y, -0.4, 0.15)));
      col.set([c.r, c.g, c.b], k * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(geo, mat);
    m.position.set(st.x, TABLE_Y + st.s * 0.12, st.z);
    m.scale.set(st.s * st.sx, st.s * st.sy, st.s);
    m.rotation.set(...st.rot);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
  }
  g.name = 'stones';
  return g;
}

// ───────────────────────────── the meadow ─────────────────────────────
/** a blade: `segs` pairs of vertices up its length (x = side, y = t) and a tip */
function bladeGeometry(segs: number): THREE.BufferGeometry {
  const pos: number[] = [], idx: number[] = [];
  for (let i = 0; i < segs; i++) { const t = Math.pow(i / segs, 0.85); pos.push(-1, t, 0, 1, t, 0); }
  pos.push(0, 1, 0);
  for (let i = 0; i < segs - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
  const a = (segs - 1) * 2;
  idx.push(a, a + 1, segs * 2);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

/** is a point of ground taken by the trunk's foot, a root or a stone? */
function blocked(x: number, z: number, pad = 0): boolean {
  const r = Math.hypot(x, z);
  if (r < 0.66 + pad) return true;
  const a = Math.atan2(x, z);
  for (const R of ROOTS) {
    const ra = (R.a * Math.PI) / 180;
    const along = x * Math.sin(ra) + z * Math.cos(ra), across = Math.abs(-x * Math.cos(ra) + z * Math.sin(ra));
    const end = 0.85 + R.len;
    if (along > 0.3 && along < end) {
      const w = THREE.MathUtils.lerp(0.11, 0.02, (along - 0.3) / (end - 0.3)) * R.w;
      if (across < w + pad) return true;
    }
    if (r < 1.0 && Math.abs(Math.atan2(Math.sin(a - ra), Math.cos(a - ra))) < 0.22) return true;
  }
  for (const s of STONES) if (Math.hypot(x - s.x, z - s.z) < s.s * (1 + (s.sx - 1) * 0.5) * 0.95 + pad) return true;
  return false;
}

interface Layer { count: number; segs: number; tile: number; inner: number }

/**
 * Blades for one layer. The fixed layer grows around the tree, densest at the ladder's foot; the ring layers fill a
 * square tile that the shader wraps around the camera, so wherever it goes the grass under it is dense and thins with
 * distance (and blades in the distance grow wider, so the field stays full).
 */
function bladeInstances(L: Layer, rnd: () => number): { a: Float32Array; b: Float32Array; n: number } {
  const a = new Float32Array(L.count * 4), b = new Float32Array(L.count * 4);
  let n = 0;
  while (n < L.count) {
    let cx: number, cz: number;
    if (L.tile === 0) {
      // around the tree: uniform in area out to 4.7, a little sparser past 2.4
      let tries = 0;
      do {
        const r = Math.sqrt(0.6 * 0.6 + rnd() * (4.7 * 4.7 - 0.6 * 0.6)), ang = rnd() * Math.PI * 2;
        cx = Math.sin(ang) * r; cz = Math.cos(ang) * r;
        const keep = 1 - 0.45 * THREE.MathUtils.smoothstep(r, 2.4, 4.7);
        if (rnd() < keep && !blocked(cx, cz, 0.02)) break;
      } while (++tries < 50);
    } else { cx = rnd() * L.tile; cz = rnd() * L.tile; }
    // a clump: blades of one kind leaning together
    const size = 5 + Math.floor(rnd() * 14), spread = 0.025 + rnd() * 0.07;
    const hs = 0.7 + rnd() * 0.65, lean = rnd() * Math.PI * 2, curl = 0.15 + rnd() * 0.55, tint = rnd();
    for (let k = 0; k < size && n < L.count; k++) {
      const ang = rnd() * Math.PI * 2, d = spread * Math.sqrt(-2 * Math.log(Math.max(1e-4, rnd()))) * 0.6;
      const x = cx + Math.cos(ang) * d, z = cz + Math.sin(ang) * d;
      const r = Math.hypot(x, z);
      if (L.tile === 0 && (blocked(x, z) || r > 4.7)) continue;
      let h = (0.075 + rnd() * 0.12) * hs;
      if (L.tile === 0 && r < 1.5) h = Math.min(h, 0.15);
      else if (rnd() < 0.035) h *= 1.6;
      const face = lean + (rnd() - 0.5) * 1.6;
      a.set([x, z, face, h], n * 4);
      b.set([0.011 + rnd() * 0.01, curl * (0.6 + rnd() * 0.8), THREE.MathUtils.clamp(tint * 0.6 + rnd() * 0.4, 0, 1), rnd()], n * 4);
      n++;
    }
  }
  return { a, b, n };
}

const BLADE_VERT = /* glsl */ `
  attribute vec4 aBlade; attribute vec4 aLook;
  uniform vec4 uLayer;   // tile size (0: fixed around the tree), inner half-size, blades per unit², far distance
  uniform vec3 uLod;     // blades per unit² wanted next to the camera, distance and power of its falloff
  varying vec3 vCol; varying float vSide;
  #include <fog_pars_vertex>
  void main(){
    vec2 xz = aBlade.xy;
    float seed = aLook.w;
    float h = aBlade.w;
    float keep = 1.0;
    if (uLayer.x > 0.0) {
      vec2 rel = mod(xz - cameraPosition.xz + 0.5 * uLayer.x, uLayer.x) - 0.5 * uLayer.x;
      xz = cameraPosition.xz + rel;
      if (max(abs(rel.x), abs(rel.y)) < uLayer.y) keep = 0.0;
      if (length(xz) < 3.3 + 1.4 * fract(seed * 7.31)) keep = 0.0;   // the meadow around the tree is grown by the fixed layer
      for (int i = 0; i < 12; i++) if (length(xz - uStones[i].xz) < uStones[i].w) keep = 0.0;
    } else if (length(xz) > 3.3 + 1.4 * fract(seed * 5.77)) keep = 0.0;
    vec3 root = vec3(xz.x, GROUND_Y - 0.008, xz.y);
    float camD = distance(root, cameraPosition);
    if (uLayer.x > 0.0) {
      float want = uLod.x / (1.0 + pow(camD / uLod.y, uLod.z));
      if (fract(seed * 13.37) > want / uLayer.z) keep = 0.0;
    }
    h *= 1.0 - smoothstep(uLayer.w * 0.8, uLayer.w, camD);
    if (keep < 0.5 || h < 0.003) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); vCol = vec3(0.0); vSide = 0.0; return; }

    float t = position.y, side = position.x;
    float w = aLook.x * clamp(camD / 5.0, 1.0, 2.2);
    // the blade is an arc of constant length h, bent by its own lean and by the wind
    vec2 fdir = vec2(cos(aBlade.z), sin(aBlade.z));
    vec2 wv = windAt(xz, uTime, seed) * (0.75 + 0.5 * fract(seed * 3.7)) * (0.55 + 3.0 * h);
    vec2 bend = fdir * aLook.y + wv;
    float beta = length(bend) + 1e-4;
    vec2 bdir = bend / beta;
    beta = min(beta, 1.5);
    float ang = beta * t;
    float fwd = h * (1.0 - cos(ang)) / beta, up = h * sin(ang) / beta;
    vec3 tang = vec3(bdir.x * sin(ang), cos(ang), bdir.y * sin(ang));
    vec3 across = normalize(vec3(-fdir.y, 0.0, fdir.x));
    float wt = w * (1.0 - pow(t, 1.5)) * (0.85 + 0.15 * t);
    vec3 wp = root + vec3(bdir.x * fwd, up, bdir.y * fwd) + across * side * wt * 0.5;
    vec3 N = normalize(cross(across, tang) + across * side * 0.45);

    // colour: dark at the foot of the sward, fresh green up the blade, dry gold at the tips of the dry patches
    float dry = clamp(meadowDry(xz) + (aLook.z - 0.5) * 0.6, 0.0, 1.0);
    vec3 c = mix(vec3(0.035, 0.05, 0.016), bladeMid(dry), smoothstep(0.0, 0.5, t));
    c = mix(c, bladeTip(dry), smoothstep(0.4, 1.0, t) * (0.45 + 0.55 * dry));

    // light, per vertex
    vec3 V = normalize(cameraPosition - wp);
    if (dot(N, V) < 0.0) N = -N;
    // from afar we see the tops of the sward, not into it: the dark feet and the glinting tips even out
    float farK = smoothstep(5.0, 14.0, camD);
    float cao = contactAO(wp);
    float ao = mix(mix(0.3, 0.7, farK), 1.0, smoothstep(0.0, 0.75, t)) * cao;
    float sh = keyShadow(wp);
    float NL = dot(N, KEY_DIR);
    float back = pow(max(dot(-V, KEY_DIR), 0.0), 5.0);
    vec3 trans = vec3(0.95, 1.1, 0.42) * (max(-NL, 0.0) * 0.45 + back * 0.9) * smoothstep(0.1, 0.8, t) * (1.0 - 0.55 * farK);  // the low light shining through the blades
    vec3 light = ambient(N) * ao + FILL_COL * max(dot(N, FILL_DIR), 0.0) * ao;
    light += KEY_COL * (max(NL, 0.0) * 0.75 + 0.2 + trans) * sh * mix(0.35, 1.0, t);
    vec3 S; float fall; vec3 sc = sunLight(wp, N, S, fall);
    float sunVis = smoothstep(1.5, 3.0, length(wp.xz));
    light += sc * (max(dot(N, S), 0.0) * 0.9 + pow(max(dot(-V, S), 0.0), 6.0) * 0.9 * t) * sunVis * mix(0.4, 1.0, t);
    vec3 H = normalize(KEY_DIR + V);
    vCol = c * light + KEY_COL * pow(max(dot(N, H), 0.0), 24.0) * 0.05 * sh * t;
    // far off, a blade takes the colour the field has there (the ground carries on with the same model)
    float facing = 0.5 + 0.5 * dot(normalize(V.xz + vec2(1e-4)), normalize(KEY_DIR.xz));
    vec3 fieldL = ambient(vec3(0.0, 0.35, 0.9)) * cao + FILL_COL * 0.5 + KEY_COL * (0.16 + 0.5 * facing + 0.3 * pow(1.0 - facing, 3.0)) * sh;
    vec3 fieldC = mix(bladeMid(dry), bladeTip(dry), 0.2 + 0.5 * t) * (0.7 + 0.5 * t) * fieldL;
    vCol = mix(vCol, fieldC, smoothstep(6.0, 16.0, camD) * 0.75);
    vSide = side;
    vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;

const BLADE_FRAG = /* glsl */ `
  varying vec3 vCol; varying float vSide;
  #include <fog_pars_fragment>
  void main(){
    gl_FragColor = vec4(vCol * (1.0 - 0.22 * vSide * vSide), 1.0);
    #include <fog_fragment>
  }`;

export interface MeadowOpts { grass: [number, number, number, number]; segs: [number, number, number, number]; flowers: number }
export interface Meadow { group: THREE.Group; dispose(): void }

/** The meadow: grass in four layers (around the tree, and near / mid / far around the camera) and the wildflowers. */
export function createMeadow(o: MeadowOpts): Meadow {
  const group = new THREE.Group();
  group.name = 'grass';
  const rnd = seeded(97);
  const [nP, n0, n1, n2] = o.grass;
  // density next to the camera falls off so that it meets each ring's own density at the ring's inner edge
  const T = [3.6, 9, 22];
  const rho0 = n0 / (T[0] * T[0]), rho1 = n1 / (T[1] * T[1]), rho2 = n2 / (T[2] * T[2]);
  // wanted density at distance d from the camera: rho0 / (1 + (d / D0)^P), meeting ring 1 at its inner edge (and ring 2 at its)
  const A = Math.max(0.5, rho0 / Math.max(rho1, 1e-3) - 1);
  const P = n2 > 0 ? THREE.MathUtils.clamp(Math.log((rho0 / rho2 - 1) / A) / Math.log(T[1] / T[0]), 1.5, 4) : 2.4;
  const D0 = T[0] / 2 / Math.pow(A, 1 / P);
  const far = n2 > 0 ? 10.5 : n1 > 0 ? 4.4 : 1.8;
  const layers: (Layer & { rho: number })[] = [
    { count: nP, segs: o.segs[0], tile: 0, inner: 0, rho: 1 },
    { count: n0, segs: o.segs[1], tile: T[0], inner: 0, rho: rho0 },
    { count: n1, segs: o.segs[2], tile: T[1], inner: T[0] / 2, rho: n1 / (T[1] * T[1]) },
    { count: n2, segs: o.segs[3], tile: T[2], inner: T[1] / 2, rho: n2 / (T[2] * T[2]) },
  ];
  for (const L of layers) {
    if (L.count <= 0) continue;
    const inst = bladeInstances(L, rnd);
    const geo = new THREE.InstancedBufferGeometry();
    const blade = bladeGeometry(L.segs);
    geo.index = blade.index;
    geo.setAttribute('position', blade.getAttribute('position'));
    geo.setAttribute('aBlade', new THREE.InstancedBufferAttribute(inst.a, 4));
    geo.setAttribute('aLook', new THREE.InstancedBufferAttribute(inst.b, 4));
    geo.instanceCount = inst.n;
    const mat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      fog: true,
      uniforms: {
        ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...NATURE,
        uLayer: { value: new THREE.Vector4(L.tile, L.inner, L.rho, L.tile === 0 ? 60 : far) },
        uLod: { value: new THREE.Vector3(rho0, D0, P) },
      },
      vertexShader: NATURE_GLSL + BLADE_VERT,
      fragmentShader: BLADE_FRAG,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.name = L.tile === 0 ? 'grass-tree' : 'grass-ring';
    group.add(mesh);
  }
  if (o.flowers > 0) group.add(createFlowers(o.flowers, rnd));
  return {
    group,
    dispose() {
      group.traverse((ob) => {
        const m = ob as THREE.Mesh;
        if (!m.geometry) return;
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
    },
  };
}

/** Wildflowers and seed heads: daisies, buttercups, cornflowers and oat-like spikes, in loose patches. */
function createFlowers(count: number, rnd: () => number): THREE.Mesh {
  const pos: number[] = [], idx: number[] = [];
  const S = 3;
  for (let i = 0; i <= S; i++) pos.push(-1, i / S, 0, 1, i / S, 0);
  for (let i = 0; i < S; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
  const h0 = pos.length / 3;
  pos.push(-1, -1, 1, 1, -1, 1, -1, 1, 1, 1, 1, 1);
  idx.push(h0, h0 + 1, h0 + 2, h0 + 2, h0 + 1, h0 + 3);
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  const a = new Float32Array(count * 4), b = new Float32Array(count * 4);
  let n = 0;
  while (n < count) {
    const r = Math.sqrt(1.8 * 1.8 + rnd() * (9.5 * 9.5 - 1.8 * 1.8)), ang = rnd() * Math.PI * 2;
    const cx = Math.sin(ang) * r, cz = Math.cos(ang) * r;
    const kind = rnd() < 0.3 ? 3 : Math.floor(rnd() * 3);
    const size = 4 + Math.floor(rnd() * 14);
    for (let k = 0; k < size && n < count; k++) {
      const x = cx + (rnd() - 0.5) * 0.9, z = cz + (rnd() - 0.5) * 0.9;
      if (blocked(x, z, 0.03) || Math.hypot(x, z) < 1.7) continue;
      const kk = rnd() < 0.8 ? kind : Math.floor(rnd() * 4);
      const h = kk === 3 ? 0.22 + rnd() * 0.14 : 0.1 + rnd() * 0.12;
      a.set([x, z, h, kk], n * 4);
      b.set([kk === 3 ? 0.022 + rnd() * 0.01 : 0.011 + rnd() * 0.008, rnd(), 0.1 + rnd() * 0.35, rnd()], n * 4);
      n++;
    }
  }
  geo.setAttribute('aF', new THREE.InstancedBufferAttribute(a, 4));
  geo.setAttribute('aG', new THREE.InstancedBufferAttribute(b, 4));
  geo.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...NATURE },
    vertexShader: NATURE_GLSL + /* glsl */ `
      attribute vec4 aF; attribute vec4 aG;
      varying vec3 vLight; varying vec2 vUv; varying float vHead; varying float vKind; varying float vTint;
      #include <fog_pars_vertex>
      void main(){
        vec2 xz = aF.xy; float h = aF.z, kind = aF.w, size = aG.x, seed = aG.y;
        vec3 root = vec3(xz.x, GROUND_Y - 0.005, xz.y);
        float camD = distance(root, cameraPosition);
        float fade = 1.0 - smoothstep(12.0, 16.0, camD);
        if (fade < 0.01) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); return; }
        float la = seed * 6.2832;
        vec2 bend = vec2(cos(la), sin(la)) * aG.z + windAt(xz, uTime, seed) * (0.6 + 2.0 * h);
        float beta = length(bend) + 1e-4; vec2 bd = bend / beta; beta = min(beta, 1.2);
        bool head = position.z > 0.5;
        float t = head ? 1.0 : position.y;
        float an = beta * t;
        vec3 sp = root + vec3(bd.x, 0.0, bd.y) * h * (1.0 - cos(an)) / beta + vec3(0.0, h * sin(an) / beta, 0.0);
        vec3 tang = normalize(vec3(bd.x * sin(an), cos(an), bd.y * sin(an)));
        vec3 V = normalize(cameraPosition - sp);
        vec3 rt = normalize(cross(tang, V));
        vec3 wp;
        if (head) {
          float sz = size * fade;
          vec3 yAx = kind > 2.5 ? tang : normalize(mix(normalize(cross(V, rt)), tang, 0.35));
          vec2 hs = kind > 2.5 ? vec2(0.32, 1.0) * sz : vec2(sz);
          wp = sp + rt * position.x * hs.x + yAx * (position.y * hs.y + (kind > 2.5 ? hs.y * 0.85 : 0.0));
          vUv = position.xy;
        } else {
          wp = sp + rt * position.x * 0.0013 * fade;
          vUv = vec2(position.x, t);
        }
        vHead = head ? 1.0 : 0.0; vKind = kind; vTint = aG.w;
        vec3 N = normalize(V + vec3(0.0, 0.5, 0.0));
        float sh = keyShadow(wp);
        vec3 S; float fall; vec3 sc = sunLight(wp, N, S, fall);
        float back = pow(max(dot(-V, KEY_DIR), 0.0), 4.0);
        vLight = ambient(N) * mix(0.5, 1.0, t) * contactAO(wp) + KEY_COL * (0.18 + back * 0.7) * sh + sc * 0.35 * smoothstep(1.5, 3.0, length(xz));
        vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vLight; varying vec2 vUv; varying float vHead; varying float vKind; varying float vTint;
      #include <fog_pars_fragment>
      void main(){
        vec3 c;
        if (vHead > 0.5) {
          vec2 p = vUv; float r = length(p); float ang = atan(p.y, p.x);
          float a;
          if (vKind < 0.5) {          // daisy
            float pr = 0.5 + 0.5 * pow(abs(cos(ang * 6.5)), 0.7);
            a = step(r, pr * 0.98);
            c = r < 0.3 ? vec3(0.85, 0.55, 0.05) : vec3(0.82, 0.8, 0.74) * (0.8 + 0.2 * (1.0 - r));
          } else if (vKind < 1.5) {   // buttercup
            float pr = 0.72 + 0.28 * cos(ang * 5.0);
            a = step(r, pr * 0.9);
            c = vec3(0.95, 0.66, 0.05) * (0.65 + 0.45 * (1.0 - r));
          } else if (vKind < 2.5) {   // cornflower
            float pr = 0.7 + 0.3 * fract(sin(floor(ang * 2.6 + 9.0) * 91.7) * 43.1);
            a = step(r, pr * 0.95);
            c = mix(vec3(0.22, 0.16, 0.62), vec3(0.42, 0.24, 0.62), vTint) * (0.7 + 0.5 * r);
          } else {                    // seed head
            float w = 0.9 * sqrt(max(1.0 - p.y * p.y, 0.0)) * (0.65 + 0.35 * abs(sin(p.y * 14.0)));
            a = step(abs(p.x), w);
            c = mix(vec3(0.42, 0.33, 0.14), vec3(0.62, 0.5, 0.24), vTint) * (0.75 + 0.25 * p.y);
          }
          if (a < 0.5) discard;
        } else c = mix(vec3(0.05, 0.09, 0.02), vec3(0.14, 0.2, 0.05), vUv.y);
        gl_FragColor = vec4(c * vLight, 1.0);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.name = 'flowers';
  return mesh;
}

/** Soft rays of the sun at the head of the ladder: a stand-in for the god rays where the quality is low. */
export function makeRaysTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const x = c.getContext('2d')!;
  x.translate(256, 256);
  x.filter = 'blur(3px)';
  const rnd = seeded(5);
  for (let i = 0; i < 64; i++) {
    const a = rnd() * Math.PI * 2;
    const len = 120 + rnd() * 130, wd = 0.01 + rnd() * 0.03;
    const g = x.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
    g.addColorStop(0, `rgba(255,236,196,${(0.12 + rnd() * 0.2).toFixed(3)})`);
    g.addColorStop(1, 'rgba(255,214,150,0)');
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(0, 0);
    x.lineTo(Math.cos(a - wd) * len, Math.sin(a - wd) * len);
    x.lineTo(Math.cos(a + wd) * len, Math.sin(a + wd) * len);
    x.fill();
  }
  return new THREE.CanvasTexture(c);
}
