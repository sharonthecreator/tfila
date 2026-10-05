// The world around the ladder: a sky at the hour of Jacob's dream ("וילן שם כי בא השמש"), a meadow with grass that
// moves in the wind, the stones of the place ("ויקח מאבני המקום"), and the tree whose trunk is the pillar of words —
// its roots in the earth and its branches fanning out around the sun at the head of the ladder.
import * as THREE from 'three';
import { TABLE_Y } from './instrument';
import { growCrown } from './crown';

export const SKY = {
  zenith: new THREE.Color('#0a1530'),
  mid: new THREE.Color('#25427a'),
  horizon: new THREE.Color('#e9a46c'),
  ground: new THREE.Color('#1a2a16'),
  fog: new THREE.Color('#9c8579'),
};

/** Sky dome: deep blue above, a warm band at the horizon, soft clouds and the first stars. */
export function createSky(): THREE.Mesh {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTime: { value: 0 },
      uZenith: { value: SKY.zenith }, uMid: { value: SKY.mid }, uHorizon: { value: SKY.horizon }, uGround: { value: SKY.ground },
      uSun: { value: new THREE.Vector3(0, 1, 0) },
    },
    vertexShader: /* glsl */ `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uZenith; uniform vec3 uMid; uniform vec3 uHorizon; uniform vec3 uGround; uniform vec3 uSun;
      varying vec3 vD;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++){ v += a*noise(p); p *= 2.03; a *= .5; } return v; }
      void main(){
        vec3 d = normalize(vD);
        float y = d.y;
        vec3 haze = vec3(0.612, 0.522, 0.475);
        vec3 c = y > 0. ? mix(mix(haze, uHorizon, smoothstep(0.0, 0.04, y)), uMid, smoothstep(0.04, 0.3, y)) : haze;
        if (y > 0.) c = mix(c, uZenith, smoothstep(0.25, 0.95, y));
        // a soft glow around the sun overhead
        float s = max(dot(d, normalize(uSun)), 0.);
        c += vec3(1.0, 0.85, 0.6) * pow(s, 6.) * 0.35;
        // clouds: thin, lit warm from below near the horizon
        vec2 uv = d.xz / max(0.12, y + 0.18) * 1.4 + vec2(uTime * 0.004, 0.);
        float cl = smoothstep(0.52, 0.8, fbm(uv)) * smoothstep(0.02, 0.2, y) * (1. - smoothstep(0.55, 0.9, y));
        vec3 cloud = mix(vec3(1.0, 0.72, 0.5), vec3(0.55, 0.62, 0.8), smoothstep(0.05, 0.45, y));
        c = mix(c, cloud, cl * 0.55);
        // the first stars, high up
        vec2 g = d.xz / (y + 1.0) * 220.;
        float st = step(0.9975, hash(floor(g))) * smoothstep(0.45, 0.9, y) * (0.6 + 0.4*sin(uTime*1.3 + hash(floor(g))*30.));
        c += vec3(st) * 0.8;
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(80, 48, 32), mat);
  sky.frustumCulled = false;
  sky.renderOrder = -10;
  sky.name = 'sky';
  return sky;
}

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

/** Meadow: a large field whose grass texture fades into the evening haze. */
export function createGround(): THREE.Mesh {
  const [c, x] = canvas(1024, 1024);
  x.fillStyle = '#2c4a22';
  x.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 26000; i++) {
    const g = 60 + Math.random() * 70, r = 30 + Math.random() * 40, b = 18 + Math.random() * 20;
    x.strokeStyle = `rgba(${r},${g},${b},${0.25 + Math.random() * 0.4})`;
    x.lineWidth = 1 + Math.random() * 1.4;
    const px = Math.random() * 1024, py = Math.random() * 1024;
    x.beginPath();
    x.moveTo(px, py);
    x.lineTo(px + (Math.random() - 0.5) * 6, py - 4 - Math.random() * 10);
    x.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(26, 26);
  tex.anisotropy = 8;
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(60, 96).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0, color: '#9fb88f' }),
  );
  ground.position.y = TABLE_Y;
  ground.receiveShadow = true;
  ground.name = 'ground';
  return ground;
}

/** Blades of grass around the ladder's foot, swaying in a slow wind. */
export function createGrass(count: number): THREE.Mesh {
  const blade = new THREE.BufferGeometry();
  // a thin tapered blade: 5 vertices, 3 triangles
  blade.setAttribute('position', new THREE.Float32BufferAttribute([-0.008, 0, 0, 0.008, 0, 0, -0.005, 0.5, 0, 0.005, 0.5, 0, 0, 1, 0], 3));
  blade.setIndex([0, 1, 2, 2, 1, 3, 2, 3, 4]);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = blade.index;
  geo.setAttribute('position', blade.getAttribute('position'));
  const off = new Float32Array(count * 4), tint = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    // denser near the foot of the ladder, thinning out into the meadow; clear inside the trunk
    const r = 0.55 + Math.pow(Math.random(), 1.6) * 9;
    const a = Math.random() * Math.PI * 2;
    off.set([Math.cos(a) * r, Math.sin(a) * r, Math.random() * Math.PI * 2, 0.07 + Math.random() * 0.13], i * 4);
    tint[i] = Math.random();
  }
  geo.setAttribute('offset', new THREE.InstancedBufferAttribute(off, 4));
  geo.setAttribute('tint', new THREE.InstancedBufferAttribute(tint, 1));
  geo.instanceCount = count;
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uWind: { value: 1 } }]),
    vertexShader: /* glsl */ `
      attribute vec4 offset; attribute float tint; uniform float uTime; uniform float uWind;
      varying float vH; varying float vT;
      #include <fog_pars_vertex>
      void main(){
        float h = offset.w; float rot = offset.z;
        vec3 p = position; p.y *= h;
        float c = cos(rot), s = sin(rot);
        p = vec3(p.x*c - p.z*s, p.y, p.x*s + p.z*c);
        float bend = position.y * position.y * uWind * (0.035 + 0.02*sin(uTime*1.1 + offset.x*1.7 + offset.y*1.3));
        p.x += bend; p.z += bend * 0.4;
        vec3 w = vec3(offset.x, ${TABLE_Y.toFixed(3)}, offset.y) + p;
        vec4 mvPosition = modelViewMatrix * vec4(w, 1.);
        gl_Position = projectionMatrix * mvPosition;
        vH = position.y; vT = tint;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      varying float vH; varying float vT;
      #include <fog_pars_fragment>
      void main(){
        vec3 base = mix(vec3(0.07,0.15,0.05), vec3(0.16,0.28,0.09), vT);
        vec3 tip = mix(vec3(0.42,0.52,0.2), vec3(0.75,0.62,0.32), vT*0.6);
        gl_FragColor = vec4(mix(base, tip, vH*vH), 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.name = 'grass';
  return mesh;
}

/** The stones of the place, around the foot of the ladder. */
export function createStones(): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#8d877a', roughness: 0.92, metalness: 0, flatShading: true });
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 12; i++) {
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let k = 0; k < pos.count; k++) pos.setXYZ(k, pos.getX(k) * (0.8 + rnd() * 0.4), pos.getY(k) * (0.8 + rnd() * 0.4), pos.getZ(k) * (0.8 + rnd() * 0.4));
    geo.computeVertexNormals();
    const s = 0.06 + rnd() * 0.13;
    const m = new THREE.Mesh(geo, mat);
    const a = (i / 12) * Math.PI * 2 + rnd() * 0.4, r = 1.55 + rnd() * 0.6;
    m.position.set(Math.cos(a) * r, TABLE_Y + s * 0.35, Math.sin(a) * r);
    m.scale.set(s * (1 + rnd() * 0.6), s * 0.7, s);
    m.rotation.set(rnd(), rnd() * 6, rnd());
    m.castShadow = m.receiveShadow = true;
    g.add(m);
  }
  g.name = 'stones';
  return g;
}

/** Tubes whose radius tapers along their curves, merged into one geometry; uv.y runs along the bark in world units. */
function branchGeometry(list: { curve: THREE.Curve<THREE.Vector3>; segs: number; radial: number; r0: number; r1: number; flare?: number }[]): THREE.BufferGeometry {
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
  for (const b of list) {
    const frames = b.curve.computeFrenetFrames(b.segs, false);
    const len = b.curve.getLength();
    const v0 = pos.length / 3;
    for (let i = 0; i <= b.segs; i++) {
      const t = i / b.segs;
      const p = b.curve.getPointAt(t);
      // taper, and a swelling where a limb leaves the trunk
      const r = THREE.MathUtils.lerp(b.r0, b.r1, Math.pow(t, 0.75)) * (1 + (b.flare ?? 0) * Math.pow(1 - t, 4));
      for (let j = 0; j <= b.radial; j++) {
        const v = (j / b.radial) * Math.PI * 2;
        const n = frames.normals[i].clone().multiplyScalar(Math.cos(v)).addScaledVector(frames.binormals[i], Math.sin(v));
        pos.push(p.x + n.x * r, p.y + n.y * r, p.z + n.z * r);
        nor.push(n.x, n.y, n.z);
        uv.push(j / b.radial, t * len * 1.3);
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
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** Bark, lit warm by the sun at the head of the ladder: the sides of the limbs that face it, and a glowing rim where they stand against it. */
function barkMaterial(sun: THREE.Vector3): THREE.MeshStandardMaterial {
  const [c, x] = canvas(256, 512);
  x.fillStyle = '#6e5640';
  x.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 900; i++) {
    const px = Math.random() * 256;
    x.strokeStyle = `rgba(${20 + Math.random() * 40},${14 + Math.random() * 26},${8 + Math.random() * 14},${0.3 + Math.random() * 0.5})`;
    x.lineWidth = 1 + Math.random() * 3;
    x.beginPath();
    x.moveTo(px, Math.random() * 512);
    x.lineTo(px + (Math.random() - 0.5) * 8, Math.random() * 512);
    x.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0, color: '#c9b9a2' });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uSun = { value: sun };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vBarkW; varying vec3 vBarkN;')
      .replace('#include <fog_vertex>', '#include <fog_vertex>\nvBarkW = (modelMatrix * vec4(transformed, 1.0)).xyz; vBarkN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uSun; varying vec3 vBarkW; varying vec3 vBarkN;')
      .replace('#include <emissivemap_fragment>', /* glsl */ `#include <emissivemap_fragment>
        {
          vec3 bn = normalize(vBarkN); vec3 bv = normalize(cameraPosition - vBarkW);
          vec3 bl = uSun - vBarkW; float bd = length(bl); bl /= bd;
          float fall = 1.0 / (1.0 + bd * bd * 0.55);
          float face = max(dot(bn, bl), 0.0);
          float rim = pow(1.0 - max(dot(bn, bv), 0.0), 2.5) * pow(max(dot(-bv, bl), 0.0), 2.0);
          totalEmissiveRadiance += (diffuseColor.rgb * vec3(1.0, 0.7, 0.4) * face * 2.2 + vec3(1.0, 0.66, 0.32) * rim * 0.9) * fall;
        }`);
  };
  return mat;
}

/** Sprigs of leaves for the crown: four variants in a 2×2 atlas. r: light across each leaf, g: which leaf (a hue jitter), a: shape. */
function sprigAtlas(): THREE.CanvasTexture {
  const S = 256;
  const [c, x] = canvas(S * 2, S * 2);
  let seed = 3;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
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
    // two halves of the leaf folded along the midrib: one catches the light
    x.fillStyle = `rgb(228,${g},0)`;
    x.fillRect(-W, -L, W, L);
    x.fillStyle = `rgb(182,${g},0)`;
    x.fillRect(0, -L, W, L);
    x.strokeStyle = `rgb(120,${g},0)`;
    x.lineWidth = 2.2;
    x.beginPath();
    x.moveTo(0, 0);
    x.lineTo(0, -L * 0.96);
    x.stroke();
    x.lineWidth = 1;
    for (let k = 1; k < 6; k++) {
      const y = -L * (0.12 + k * 0.13);
      x.beginPath();
      x.moveTo(0, y);
      x.lineTo(-W * 0.8, y - L * 0.12);
      x.moveTo(0, y);
      x.lineTo(W * 0.8, y - L * 0.12);
      x.stroke();
    }
    x.restore();
    x.restore();
  };
  for (let v = 0; v < 4; v++) {
    x.save();
    x.translate((v % 2) * S + S / 2, Math.floor(v / 2) * S + S - 8); // the base of the stem at the bottom of the cell
    const bend = (rnd() - 0.5) * 0.5;
    const n = 5 + (v % 2) * 2;
    const tip = new THREE.Vector2(bend * 60, -S * 0.62);
    const at = (t: number) => new THREE.Vector2(tip.x * t * t, tip.y * t);
    x.strokeStyle = 'rgb(80,0,0)';
    x.lineWidth = 4;
    x.beginPath();
    x.moveTo(0, 0);
    x.quadraticCurveTo(0, tip.y * 0.5, tip.x, tip.y);
    x.stroke();
    for (let k = 0; k < n - 1; k++) {
      const t = 0.2 + (k / (n - 1)) * 0.75;
      const p = at(t), side = k % 2 ? 1 : -1;
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
}

export interface Tree {
  group: THREE.Group;
  /** height of the top of the crown and its horizontal radius, for framing */
  maxY: number;
  radius: number;
  /** wind and light: t is the (motion-respecting) time, wind 0 (still) … 1 */
  update(t: number, wind: number): void;
  /** drawing-buffer height in px, for sizing the points */
  setPixelHeight(h: number): void;
  dispose(): void;
}

/**
 * Roots running from the trunk into the grass; above the ladder's head the trunk divides into great limbs that branch
 * four times and spread into a wide crown of leaves, open in the middle where the sun stands. The leaves glow where
 * the sun shines through them and move in the wind; motes of light rise in the crown and a few leaves drift down.
 */
export function createTree(o: TreeOpts): Tree {
  const group = new THREE.Group();
  group.name = 'tree';
  const bark = barkMaterial(o.sun);
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // roots
  const roots: Parameters<typeof branchGeometry>[0] = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rnd() * 0.3;
    const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const len = 0.5 + rnd() * 0.5;
    const curve = new THREE.CatmullRomCurve3([
      dir.clone().multiplyScalar(o.trunkR * 0.85).setY(o.bottom + 0.35),
      dir.clone().multiplyScalar(o.trunkR + len * 0.35).setY(TABLE_Y + 0.06),
      dir.clone().multiplyScalar(o.trunkR + len).setY(TABLE_Y - 0.01),
    ]);
    roots.push({ curve, segs: 16, radial: 8, r0: 0.11, r1: 0.015 });
  }
  const rootMesh = new THREE.Mesh(branchGeometry(roots), bark);
  rootMesh.castShadow = rootMesh.receiveShadow = true;
  group.add(rootMesh);

  // the crown sways about the top of the trunk
  const pivot = new THREE.Group();
  pivot.position.y = o.top;
  const crownG = new THREE.Group();
  crownG.position.y = -o.top;
  pivot.add(crownG);
  group.add(pivot);

  const crown = growCrown({ trunkR: o.trunkR, top: o.top, sun: o.sun, clearY: o.clearY, leaves: o.leaves });
  const RADIAL = [12, 8, 6, 4], SEGS = [5, 4, 3, 2];
  const limbs = new THREE.Mesh(branchGeometry(crown.branches.map((b) => ({
    curve: new THREE.CatmullRomCurve3(b.pts), segs: b.pts.length * SEGS[b.level], radial: RADIAL[b.level], r0: b.r0, r1: b.r1, flare: b.level === 0 ? 0.35 : 0.12,
  }))), bark);
  limbs.name = 'branches';
  crownG.add(limbs);

  // leaves
  const n = o.leaves;
  const card = new THREE.PlaneGeometry(1, 1, 2, 3).translate(0, 0.5, 0);
  const cp = card.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < cp.count; i++) cp.setZ(i, -Math.abs(cp.getX(i)) * 0.22 + cp.getY(i) * cp.getY(i) * 0.12); // folded and curled
  card.computeVertexNormals();
  card.setAttribute('aMass', new THREE.InstancedBufferAttribute(crown.leafMass, 4));
  card.setAttribute('aCol', new THREE.InstancedBufferAttribute(crown.leafCol, 3));
  card.setAttribute('aVar', new THREE.InstancedBufferAttribute(crown.leafVar, 2));
  const key = new THREE.Vector3(-3, 9, 4).normalize();
  const leafMat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uMap: { value: null }, uTime: { value: 0 }, uWind: { value: 1 }, uSun: { value: new THREE.Vector3() }, uKey: { value: key },
    }]),
    vertexShader: /* glsl */ `
      attribute vec4 aMass; attribute vec3 aCol; attribute vec2 aVar;
      uniform float uTime; uniform float uWind;
      varying vec2 vUv; varying vec3 vCol; varying vec3 vW; varying vec3 vN; varying vec3 vMass; varying float vExp; varying float vTip;
      #include <fog_pars_vertex>
      void main(){
        vUv = (uv + vec2(mod(aVar.x, 2.0), 1.0 - floor(aVar.x / 2.0))) * 0.5;
        vec3 root = instanceMatrix[3].xyz;
        vec4 ip = instanceMatrix * vec4(position, 1.0);
        // wind: slow gusts through the whole crown, stronger at its edges, and every sprig fluttering on its stem
        float ph = aVar.y * 6.2831853;
        float reach = 0.35 + smoothstep(0.6, 3.4, length(root.xz));
        vec3 gust = vec3(sin(uTime * 0.7 + root.x * 0.45) + 0.5 * sin(uTime * 1.31 + root.z * 0.9), 0.25 * sin(uTime * 0.9 + root.y), 0.7 * cos(uTime * 0.55 + root.z * 0.4)) * 0.035 * reach;
        vec3 flutter = vec3(sin(uTime * 2.3 + ph * 3.0), 0.6 * sin(uTime * 2.9 + ph * 5.0), cos(uTime * 1.9 + ph * 4.0)) * 0.03 * uv.y;
        ip.xyz += (gust * (0.4 + 0.6 * uv.y) + flutter) * uWind;
        vec4 w = modelMatrix * ip;
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        vMass = normalize(mat3(modelMatrix) * aMass.xyz);
        vExp = aMass.w; vCol = aCol; vTip = uv.y;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap; uniform vec3 uSun; uniform vec3 uKey;
      varying vec2 vUv; varying vec3 vCol; varying vec3 vW; varying vec3 vN; varying vec3 vMass; varying float vExp; varying float vTip;
      #include <fog_pars_fragment>
      void main(){
        vec4 tx = texture2D(uMap, vUv);
        if (tx.a < 0.42) discard;
        vec3 V = normalize(cameraPosition - vW);
        vec3 nf = normalize(vN); if (dot(nf, V) < 0.0) nf = -nf;   // the face turned to us
        vec3 N = normalize(mix(nf, normalize(vMass), 0.75));       // shaded as part of its mass
        vec3 S = uSun - vW; float ds = length(S); S /= ds;
        float fall = 1.0 / (1.0 + ds * ds * 0.45);
        // colour: the leaf's own green, varied leaf by leaf; warmer and golden near the sun
        vec3 base = vCol * mix(0.62, 1.1, tx.r) * mix(vec3(0.86, 0.95, 0.82), vec3(1.16, 1.06, 0.82), tx.g);
        base = mix(base, base * vec3(1.45, 1.2, 0.5) + vec3(0.035, 0.026, 0.0), clamp(fall * 1.3, 0.0, 1.0) * 0.6 * max(dot(N, S) * 0.7 + 0.3, 0.0));
        float occl = mix(0.12, 1.0, vExp * vExp);                 // deep inside the foliage it is dark
        float hemi = 0.5 + 0.5 * N.y;
        vec3 amb = mix(vec3(0.02, 0.03, 0.02), vec3(0.16, 0.21, 0.3), hemi);
        float key = max(dot(N, uKey), 0.0);
        vec3 col = base * (amb * 1.3 + vec3(1.0, 0.8, 0.55) * key * 0.85) * occl;
        // the sun at the head of the ladder lights the crown from within
        col += base * vec3(1.0, 0.76, 0.4) * max(dot(N, S), 0.0) * fall * 3.0 * mix(0.25, 1.0, vExp);
        // and shines through the leaves: gold-green where we look towards it
        float behind = max(dot(-V, S), 0.0);
        float through = pow(behind, 3.0) + 0.4 * max(dot(-nf, S), 0.0) * smoothstep(0.0, 0.7, behind);
        col += vec3(0.62, 0.66, 0.1) * mix(0.35, 1.0, tx.r) * through * fall * 2.0 * mix(0.3, 1.0, vExp);
        // a cool rim of evening sky along the outside of the crown
        col += vec3(0.1, 0.13, 0.18) * pow(1.0 - max(dot(N, V), 0.0), 3.0) * vExp * 0.5;
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
  leafMat.uniforms.uMap.value = sprigAtlas();
  leafMat.uniforms.uSun.value = o.sun;
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
        gl_FragColor = vec4(mix(vec3(0.16, 0.24, 0.04), vec3(0.62, 0.55, 0.12), vLit) * (0.8 + 0.4 * vA), vA);
      }`,
    transparent: true, depthWrite: false,
  }));
  falling.name = 'falling-leaves';
  crownG.add(motes, falling);

  return {
    group,
    maxY: crown.maxY,
    radius: crown.radius,
    update(t, wind) {
      leafMat.uniforms.uTime.value = t;
      leafMat.uniforms.uWind.value = wind;
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
          if (m instanceof THREE.ShaderMaterial) for (const u of Object.values(m.uniforms)) if (u.value instanceof THREE.Texture) u.value.dispose();
          m.dispose();
        }
      });
    },
  };
}


/** Rays of the sun at the head of the ladder. */
export function makeRaysTexture(): THREE.CanvasTexture {
  const [c, x] = canvas(512, 512);
  x.translate(256, 256);
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2 + (i % 2) * 0.05;
    const len = 180 + (i % 3) * 50;
    const g = x.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
    g.addColorStop(0, 'rgba(255,240,200,0.55)');
    g.addColorStop(1, 'rgba(255,220,160,0)');
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(0, 0);
    x.lineTo(Math.cos(a - 0.035) * len, Math.sin(a - 0.035) * len);
    x.lineTo(Math.cos(a + 0.035) * len, Math.sin(a + 0.035) * len);
    x.fill();
  }
  return new THREE.CanvasTexture(c);
}
