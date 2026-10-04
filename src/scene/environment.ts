import * as THREE from 'three';

/**
 * A small procedural photo studio — dark cyclorama, a large overhead soft box, two tall strip
 * lights and a cool rim — baked once into a PMREM so lacquer and metal get crisp product-shot reflections.
 */
export function createStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const env = new THREE.Scene();
  env.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(40, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        vertexShader: /* glsl */ `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
        fragmentShader: /* glsl */ `varying vec3 vD; void main(){ float y = vD.y;
          vec3 c = y > 0. ? mix(vec3(.02,.024,.03), vec3(.05,.058,.07), pow(y,.7)) : mix(vec3(.02,.022,.028), vec3(.004), pow(-y,.5));
          gl_FragColor = vec4(c,1.); }`,
      }),
    ),
  );
  const panel = (w: number, h: number, color: string, k: number, pos: [number, number, number], look: [number, number, number]) => {
    const m = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, toneMapped: false });
    m.color.multiplyScalar(k);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    p.position.set(...pos);
    p.lookAt(...look);
    env.add(p);
  };
  panel(18, 10, '#fff3e4', 5, [3, 18, 5], [0, 0, 0]);
  panel(2.4, 20, '#e9f0ff', 6, [-18, 6, 6], [0, 2, 0]);
  panel(2.4, 20, '#fff0e0', 4, [18, 6, 3], [0, 2, 0]);
  panel(24, 2.4, '#a9c8ff', 3.5, [0, 8, -18], [0, 1, 0]);
  panel(24, 8, '#ffffff', 0.8, [0, 4, 20], [0, 1, 0]);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(env, 0.04);
  pmrem.dispose();
  env.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    }
  });
  return rt.texture;
}
