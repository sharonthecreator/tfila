// The bench the ladder stands on ("מוצב ארצה"): a perforated optical breadboard, a turned pedestal
// and a graduated dial ring lying on the bench around the ladder's foot.
import * as THREE from 'three';
import { makeBreadboard, makeDialTexture } from './textures';

export const TABLE_Y = -1.58;

export function createBase(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'base';

  const anodized = new THREE.MeshPhysicalMaterial({ color: '#15181e', metalness: 0.7, roughness: 0.36, clearcoat: 0.4, clearcoatRoughness: 0.35 });
  const satin = new THREE.MeshPhysicalMaterial({ color: '#9aa0a8', metalness: 1, roughness: 0.3 });
  const polished = new THREE.MeshPhysicalMaterial({ color: '#dfe3e8', metalness: 1, roughness: 0.12 });

  // dial ring on the bench (inner/outer radii keep the texture's 1.14 : 1.42 proportion)
  const r0 = 1.62, r1 = (r0 * 1.42) / 1.14;
  const dial = new THREE.Mesh(
    new THREE.RingGeometry(r0, r1, 256, 1),
    new THREE.MeshPhysicalMaterial({
      color: '#101318', metalness: 0.65, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3,
      emissive: '#ffffff', emissiveMap: makeDialTexture(), emissiveIntensity: 0.7,
    }),
  );
  dial.rotation.x = -Math.PI / 2;
  dial.position.y = TABLE_Y + 0.012;
  dial.receiveShadow = true;
  g.add(dial);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(r1, r1, 0.024, 192, 1, true), anodized);
  band.position.y = TABLE_Y + 0.012;
  g.add(band);
  for (const [r, t] of [[r1, 0.008], [r0, 0.006]] as const) {
    const lip = new THREE.Mesh(new THREE.TorusGeometry(r, t, 12, 256), polished);
    lip.rotation.x = Math.PI / 2;
    lip.position.y = TABLE_Y + 0.024;
    g.add(lip);
  }

  // pedestal under the ladder
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.56, 0.07, 128), anodized);
  foot.position.y = TABLE_Y + 0.035;
  foot.castShadow = foot.receiveShadow = true;
  g.add(foot);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.44, 1.48, 0.05, 128), satin);
  cap.position.y = TABLE_Y + 0.095;
  cap.castShadow = cap.receiveShadow = true;
  g.add(cap);
  const capRing = new THREE.Mesh(new THREE.TorusGeometry(1.46, 0.005, 8, 192), new THREE.MeshBasicMaterial({ color: '#5fe0ff' }));
  capRing.rotation.x = Math.PI / 2;
  capRing.position.y = TABLE_Y + 0.121;
  g.add(capRing);

  // breadboard
  const bb = makeBreadboard();
  for (const t of [bb.map, bb.rough]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); }
  const table = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 18),
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
    const r = 1.7 + Math.random() * 3.4, a = Math.random() * Math.PI * 2;
    pos.set([Math.cos(a) * r, TABLE_Y + 0.6 + Math.random() * 4.2, Math.sin(a) * r], i * 3);
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
      gl_FragColor = vec4(vec3(1.0,0.9,0.68)*a, a); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat);
  pts.name = 'motes';
  return pts;
}
