// The physical instrument the globe sits in: a graduated dial ring on a four-legged cradle,
// standing on a perforated optical breadboard.
import * as THREE from 'three';
import { makeBreadboard, makeDialTexture } from './textures';

export const TABLE_Y = -1.58;

export function createInstrument(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'instrument';

  const anodized = new THREE.MeshPhysicalMaterial({ color: '#15181e', metalness: 0.7, roughness: 0.36, clearcoat: 0.4, clearcoatRoughness: 0.35 });
  const satin = new THREE.MeshPhysicalMaterial({ color: '#9aa0a8', metalness: 1, roughness: 0.3 });
  const polished = new THREE.MeshPhysicalMaterial({ color: '#dfe3e8', metalness: 1, roughness: 0.12 });

  // dial ring (horizontal, at the equator height of the globe's stand)
  const dialTex = makeDialTexture();
  const dial = new THREE.Mesh(
    new THREE.RingGeometry(1.14, 1.42, 256, 1),
    new THREE.MeshPhysicalMaterial({
      color: '#101318', metalness: 0.65, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3,
      emissive: '#ffffff', emissiveMap: dialTex, emissiveIntensity: 0.9, side: THREE.DoubleSide,
    }),
  );
  dial.rotation.x = -Math.PI / 2;
  dial.receiveShadow = true;
  g.add(dial);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.42, 0.035, 192, 1, true), anodized);
  band.position.y = -0.0175;
  g.add(band);
  for (const [r, t] of [[1.42, 0.009], [1.14, 0.006]] as const) {
    const lip = new THREE.Mesh(new THREE.TorusGeometry(r, t, 12, 256), polished);
    lip.rotation.x = Math.PI / 2;
    g.add(lip);
  }

  // cradle legs
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const curve = new THREE.CatmullRomCurve3([
      dir.clone().multiplyScalar(1.3).setY(-0.03),
      dir.clone().multiplyScalar(1.22).setY(-0.55),
      dir.clone().multiplyScalar(0.86).setY(-1.18),
      dir.clone().multiplyScalar(0.5).setY(TABLE_Y + 0.12),
    ]);
    const leg = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.016, 10, false), satin);
    leg.castShadow = true;
    g.add(leg);
  }
  // pedestal
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.07, 96), anodized);
  foot.position.y = TABLE_Y + 0.035;
  foot.castShadow = foot.receiveShadow = true;
  g.add(foot);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.56, 0.06, 96), satin);
  cap.position.y = TABLE_Y + 0.1;
  cap.castShadow = true;
  g.add(cap);
  const capRing = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.006, 8, 128), new THREE.MeshBasicMaterial({ color: '#5fe0ff' }));
  capRing.rotation.x = Math.PI / 2;
  capRing.position.y = TABLE_Y + 0.132;
  g.add(capRing);

  // breadboard
  const bb = makeBreadboard();
  for (const t of [bb.map, bb.rough]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.5, 2.5); }
  const table = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshPhysicalMaterial({
      map: bb.map, alphaMap: bb.alpha, roughnessMap: bb.rough, roughness: 0.75, metalness: 0.55,
      transparent: true, clearcoat: 0.08, envMapIntensity: 0.5,
    }),
  );
  table.rotation.x = -Math.PI / 2;
  table.position.y = TABLE_Y;
  table.receiveShadow = true;
  table.renderOrder = -1;
  g.add(table);
  return g;
}

/** Floating dust motes catching the light around the instrument. */
export function createMotes(count: number): THREE.Points {
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = 1.6 + Math.random() * 3.2, a = Math.random() * Math.PI * 2;
    pos.set([Math.cos(a) * r, TABLE_Y + 0.2 + Math.random() * 3.6, Math.sin(a) * r], i * 3);
    seed[i] = Math.random() * 100;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPR: { value: 1 } },
    vertexShader: /* glsl */ `attribute float seed; uniform float uTime; uniform float uPR; varying float vA;
      void main(){ vec3 p = position; p.y += sin(uTime*0.15 + seed)*0.12; p.x += cos(uTime*0.11 + seed*1.7)*0.08;
        vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
        vA = (0.35 + 0.65*abs(sin(uTime*0.4 + seed))) * smoothstep(0.8, 2.4, -mv.z);
        gl_PointSize = min(uPR * (1.4 + fract(seed)*1.8) * (6.0 / -mv.z), 5.0 * uPR); }`,
    fragmentShader: /* glsl */ `varying float vA; void main(){ float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5,0.,d)*vA*0.55;
      gl_FragColor = vec4(vec3(0.75,0.9,1.0)*a, a); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat);
  pts.name = 'motes';
  return pts;
}
