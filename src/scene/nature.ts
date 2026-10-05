// The world around the ladder: a sky at the hour of Jacob's dream ("וילן שם כי בא השמש"), a meadow with grass that
// moves in the wind, the stones of the place ("ויקח מאבני המקום"), and the tree whose trunk is the pillar of words —
// its roots in the earth and its branches fanning out around the sun at the head of the ladder.
import * as THREE from 'three';
import { TABLE_Y } from './instrument';

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

/** A tube whose radius tapers from r0 to r1 along a curve. */
function taperedTube(curve: THREE.Curve<THREE.Vector3>, segs: number, radial: number, r0: number, r1: number): THREE.BufferGeometry {
  const frames = curve.computeFrenetFrames(segs, false);
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const p = curve.getPointAt(t);
    const r = THREE.MathUtils.lerp(r0, r1, Math.pow(t, 0.8));
    for (let j = 0; j <= radial; j++) {
      const v = (j / radial) * Math.PI * 2;
      const n = frames.normals[i].clone().multiplyScalar(Math.cos(v)).addScaledVector(frames.binormals[i], Math.sin(v));
      pos.push(p.x + n.x * r, p.y + n.y * r, p.z + n.z * r);
      nor.push(n.x, n.y, n.z);
      uv.push(j / radial, t);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

function barkMaterial(): THREE.MeshStandardMaterial {
  const [c, x] = canvas(256, 512);
  x.fillStyle = '#4a3523';
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
  tex.repeat.set(2, 3);
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0, color: '#c8b49a' });
}

export interface TreeOpts { trunkR: number; bottom: number; top: number; leaves: number }

/**
 * Roots running from the trunk into the grass, and branches that fan out above the ladder's head into a crown of
 * leaves — open in the middle, where the sun stands.
 */
export function createTree(o: TreeOpts): { group: THREE.Group; leaves: THREE.InstancedMesh; tips: THREE.Vector3[] } {
  const group = new THREE.Group();
  group.name = 'tree';
  const bark = barkMaterial();
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // roots
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rnd() * 0.3;
    const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const len = 0.5 + rnd() * 0.5;
    const curve = new THREE.CatmullRomCurve3([
      dir.clone().multiplyScalar(o.trunkR * 0.85).setY(o.bottom + 0.35),
      dir.clone().multiplyScalar(o.trunkR + len * 0.35).setY(TABLE_Y + 0.06),
      dir.clone().multiplyScalar(o.trunkR + len).setY(TABLE_Y - 0.01),
    ]);
    const m = new THREE.Mesh(taperedTube(curve, 16, 8, 0.11, 0.015), bark);
    m.castShadow = m.receiveShadow = true;
    group.add(m);
  }

  // branches
  const tips: THREE.Vector3[] = [];
  const branch = (start: THREE.Vector3, dir: THREE.Vector3, len: number, r: number, depth: number) => {
    const bend = new THREE.Vector3(rnd() - 0.5, 0.12 + rnd() * 0.3, rnd() - 0.5).multiplyScalar(len * 0.35);
    const mid = start.clone().addScaledVector(dir, len * 0.5).add(bend);
    const end = start.clone().addScaledVector(dir, len).add(bend.multiplyScalar(1.4));
    const curve = new THREE.CatmullRomCurve3([start, mid, end]);
    const m = new THREE.Mesh(taperedTube(curve, 14, 8, r, r * 0.45), bark);
    m.castShadow = true;
    group.add(m);
    if (depth <= 0) { tips.push(end); return; }
    const n = 2 + (rnd() > 0.5 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const t = 0.55 + rnd() * 0.4;
      const p = curve.getPointAt(t);
      const d = dir.clone().add(new THREE.Vector3((rnd() - 0.5) * 1.2, 0.1 + rnd() * 0.35, (rnd() - 0.5) * 1.2)).normalize();
      branch(p, d, len * (0.55 + rnd() * 0.2), r * 0.5, depth - 1);
    }
    tips.push(end);
  };
  const N = 8;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + rnd() * 0.35;
    const start = new THREE.Vector3(Math.cos(a) * o.trunkR * 0.55, o.top - 0.05, Math.sin(a) * o.trunkR * 0.55);
    const dir = new THREE.Vector3(Math.cos(a), 0.42 + rnd() * 0.3, Math.sin(a)).normalize();
    branch(start, dir, 0.95 + rnd() * 0.3, 0.085, 2);
  }

  // leaves: clusters around the branch tips and along the outer branches
  const [lc, lx] = canvas(64, 64);
  lx.translate(32, 32);
  const lg = lx.createLinearGradient(0, -28, 0, 28);
  lg.addColorStop(0, '#ffffff');
  lg.addColorStop(1, '#cfd8c0');
  lx.fillStyle = lg;
  lx.beginPath();
  lx.moveTo(0, -30);
  lx.bezierCurveTo(22, -14, 18, 18, 0, 30);
  lx.bezierCurveTo(-18, 18, -22, -14, 0, -30);
  lx.fill();
  lx.strokeStyle = 'rgba(80,100,60,0.5)';
  lx.lineWidth = 1.5;
  lx.beginPath();
  lx.moveTo(0, -26);
  lx.lineTo(0, 28);
  lx.stroke();
  const leafTex = new THREE.CanvasTexture(lc);
  leafTex.colorSpace = THREE.SRGBColorSpace;
  const leafMat = new THREE.MeshStandardMaterial({
    map: leafTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7, metalness: 0,
    emissive: new THREE.Color('#3a4a10'), emissiveIntensity: 0.35,
  });
  const leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.15, 0.15), leafMat, o.leaves);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const greens = ['#3f6b2a', '#5a8a34', '#7aa241', '#a7b84a', '#c9b45a', '#4e7a30'].map((h) => new THREE.Color(h));
  for (let i = 0; i < o.leaves; i++) {
    const tip = tips[Math.floor(rnd() * tips.length)];
    p.set((rnd() - 0.5) * 0.7, (rnd() - 0.4) * 0.45, (rnd() - 0.5) * 0.7).add(tip);
    // keep the middle open, so the sun shows through
    const rh = Math.hypot(p.x, p.z);
    if (rh < 0.55) p.multiplyScalar(0.55 / Math.max(0.05, rh)).setY(tip.y + (rnd() - 0.5) * 0.3);
    p.y = Math.max(p.y, o.top + 0.18);
    e.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI);
    q.setFromEuler(e);
    s.setScalar(0.7 + rnd() * 0.7);
    m4.compose(p, q, s);
    leaves.setMatrixAt(i, m4);
    leaves.setColorAt(i, greens[Math.floor(rnd() * greens.length)].clone().multiplyScalar(0.85 + rnd() * 0.3));
  }
  leaves.castShadow = true;
  group.add(leaves);
  return { group, leaves, tips };
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
