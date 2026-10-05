// סולם יעקב — the tfila instrument. "סֻלָּם מֻצָּב אַרְצָה וְרֹאשׁוֹ מַגִּיעַ הַשָּׁמָיְמָה" (Genesis 28:12):
// a spiral ladder of prayers standing on an optical bench and reaching into light. One turn of the helix per
// world of the Ari — עשיה, יצירה, בריאה, אצילות, bottom to top — and a 30° sector of every turn per region,
// so a service that climbs from preparation to the Amidah literally climbs the ladder. Lights travel up and
// down the rails ("מלאכי אלהים עולים ויורדים בו"). Inside, a pillar of the prayers' own words.
// Semantic zoom: worlds and regions → titles → prayer-word medallions on the rungs.
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import type { PrayerNode, Route, World } from '../types';
import { cyl, radialAt, angleOf, angleDelta, smoothstep, easeInOutCubic, D2R } from './geo';
import { makePillarTexture, makeMedallion } from './textures';
import { createSkyEnvironment } from './environment';
import { createMotes, TABLE_Y } from './instrument';
import { createSky, createGround, createMeadow, createStones, makeRaysTexture, SKY, type Meadow } from './nature';
import { createTree, createTrunkMaterial, type Tree } from './tree';
import { installAtmosphere, NATURE, KEY_DIR, KEY_COLOR, KEY_INTENSITY, FILL_DIR } from './atmosphere';
import { Pipeline } from '../render/Pipeline';
import type { QualityPreset } from '../render/quality';

const REL_COLORS: Record<string, string> = { contains: '#ffd27a', adds: '#5dffa2', varies: '#c9a2ff', related: '#7fb2ff' };
export const MIN_D = 0.14, MAX_D = 26;
const PILLAR_R = 0.47;
/** the sun stands this high above the ladder's head */
const SUN_H = 0.95;
const TILE = 0.1;
const TILT = 34 * D2R; // medallions lean back toward a camera looking down the steps
const ROMAN = ['I', 'II', 'III', 'IV'];

export interface WorldCallbacks {
  onSelect?: (id: string) => void;
  onHover?: (id: string | null, x: number, y: number) => void;
  onBackground?: () => void;
  onFrame?: (d: number) => void;
  onKeyNav?: (id: string | null) => void;
}

interface Proj { x: number; y: number; z: number; visible: boolean; facing: number }
interface LabelRec { el: HTMLDivElement; w: number; h: number; op: number; shown: boolean; state: number }
interface Tile { mesh: THREE.Mesh; tex: THREE.CanvasTexture; last: number }
interface View { t: THREE.Vector3; az: number; d: number }
interface Flight { from: View; to: View; peak: number; t0: number; dur: number; resolve: () => void }
interface Angel { u: number; dir: number; speed: number; r: number }

/** Cutaway: rails and rungs right next to a close camera are cut away, so the rung in focus stays unobstructed. */
const CUT = { pos: { value: new THREE.Vector3() }, r: { value: 0 } };
function withCutaway<T extends THREE.Material>(m: T): T {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uCutPos = CUT.pos;
    sh.uniforms.uCutR = CUT.r;
    sh.vertexShader = 'varying vec3 vCutW;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      #ifdef USE_INSTANCING
        vCutW = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
      #else
        vCutW = (modelMatrix * vec4(transformed, 1.0)).xyz;
      #endif`);
    sh.fragmentShader = 'uniform vec3 uCutPos; uniform float uCutR; varying vec3 vCutW;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n  if (uCutR > 0.0 && distance(vCutW, uCutPos) < uCutR) discard;');
  };
  return m;
}

function glowTexture(stops: [number, string][]): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [o, col] of stops) g.addColorStop(o, col);
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export class PrayerWorld {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(38, 1, 0.003, 200);
  private pipeline!: Pipeline;
  private readonly timer = new THREE.Timer();
  private time = 0;

  private keyLight!: THREE.DirectionalLight;
  private motes: THREE.Points | null = null;
  private sky!: THREE.Mesh;
  private grass: Meadow | null = null;
  private ground!: THREE.Mesh;
  /** the sun at the head of the ladder as the source of the god rays (rendered only by that effect) */
  private sunSource = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffcf90').multiplyScalar(1.0), transparent: true, depthWrite: false, fog: false }));
  private rays: THREE.Sprite | null = null;
  private tree: Tree | null = null;
  /** top of the crown and its horizontal reach, for framing the overview */
  private crown = { top: 5.4, r: 3.4 };
  private ladder = new THREE.Group();
  private pillar!: THREE.Mesh;
  private pillarMat!: THREE.ShaderMaterial;
  private heaven!: THREE.Group;
  private angels: Angel[] = [];
  private angelPoints!: THREE.Points;
  private angelMat!: THREE.ShaderMaterial;
  private railMats: LineMaterial[] = [];
  private metalMats: THREE.MeshPhysicalMaterial[] = [];

  private world!: World;
  private L = { turnH: 0.9, rIn: 0.74, rOut: 1.36, base: -1.32, turns: 4, top: 2.28 };
  private nodes: PrayerNode[] = [];
  private nodeIndex = new Map<string, number>();
  private nodePos: THREE.Vector3[] = [];
  private nodePoints!: THREE.Points;
  private nodeMat!: THREE.ShaderMaterial;
  private relLines: Line2[] = [];
  private relGroup = new THREE.Group();
  private nodeLabels: LabelRec[] = [];
  private regionLabels: { el: HTMLDivElement; a: number; w: number; h: number; op: number }[] = [];
  private worldLabels: { el: HTMLDivElement; y: number; w: number; h: number; op: number }[] = [];
  private captions: { el: HTMLDivElement; pos: THREE.Vector3; w: number; h: number; op: number; far: number }[] = [];
  private badges: { el: HTMLDivElement; pos: THREE.Vector3; i: number }[] = [];
  private focusTag!: HTMLDivElement;
  private proj: Proj[] = [];

  private routeGroup: THREE.Group | null = null;
  private routeMat: LineMaterial | null = null;
  private comet: THREE.Sprite | null = null;
  private routePts: THREE.Vector3[] = [];
  private routeCum: number[] = [];
  /** the route between stop i and i+1, along the ladder's lane */
  private segPts: THREE.Vector3[][] = [];
  private travel: { pts: THREE.Vector3[]; cum: number[]; ang: number[]; from: View; t0: number; dur: number; dMid: number; resolve: () => void } | null = null;
  /** pace of travel along the ladder (1 = normal) */
  speed = 1;
  private beam!: THREE.Group;
  private beamMat!: THREE.ShaderMaterial;

  private tiles = new Map<string, Tile>();
  private tileMeshes: THREE.Mesh[] = [];
  private previews: Record<string, string> = {};

  // camera rig: a target, an azimuth around the ladder's axis and a distance
  view: View = { t: new THREE.Vector3(0, 0.4, 0), az: 0.3, d: 9 };
  private flight: Flight | null = null;
  /** the camera rests on (or is flying to) the overview of the whole tree, and follows it when the panels or the crown change */
  private atHome = false;
  private vel = { az: 0, y: 0 };
  private dragging = false;
  private lastInteraction = performance.now();
  private insets = { left: 0, right: 0, top: 0, bottom: 0 };
  private viewOff = { x: 0, y: 0 };
  private width = 1;
  private height = 1;

  selectedId: string | null = null;
  route: Route | null = null;
  routeNusach = 'em';
  stopIndex = -1;
  hoverId: string | null = null;
  reduceMotion = false;
  relView = true;
  private preset!: QualityPreset;
  private fpsSamples: number[] = [];
  onSlow: (() => void) | null = null;

  constructor(readonly canvas: HTMLCanvasElement, readonly labelsEl: HTMLElement, preset: QualityPreset, readonly cb: WorldCallbacks = {}) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, stencil: false, depth: true, powerPreference: 'high-performance' });
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    // the evening of Jacob's dream: sky, haze, a meadow, the stones of the place
    installAtmosphere();
    this.sky = createSky();
    this.scene.add(this.sky);
    this.scene.environment = createSkyEnvironment(this.renderer, this.sky);
    this.scene.fog = new THREE.FogExp2(SKY.fog, 0.012);
    this.scene.add(this.ladder);
    this.buildLights();
    this.buildBeam();
    this.ground = createGround(preset.grass[3] === 0);
    this.scene.add(this.ground, createStones());
    this.applyQuality(preset);
    this.bindInput();
    this.resize();
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.renderer.setAnimationLoop(() => this.frame());
  }

  // ───────────────────────────── construction ─────────────────────────────
  private buildLights(): void {
    // the sun stands at the head of the ladder; its light falls warm and high
    // the evening light: low, warm, from behind the tree (the glow where the sun went down); the sky fills the other side
    const key = new THREE.DirectionalLight(KEY_COLOR, KEY_INTENSITY);
    key.position.copy(KEY_DIR).multiplyScalar(12).add(new THREE.Vector3(0, 0.2, 0));
    key.castShadow = true;
    key.shadow.camera.left = key.shadow.camera.bottom = -3.4;
    key.shadow.camera.right = key.shadow.camera.top = 3.4;
    key.shadow.camera.near = 3;
    key.shadow.camera.far = 26;
    key.shadow.bias = -0.0003;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 5;
    key.target.position.set(0, 0.2, 0);
    this.keyLight = key;
    const fill = new THREE.DirectionalLight('#9fbcff', 0.7);
    fill.position.copy(FILL_DIR).multiplyScalar(10);
    this.scene.add(key, key.target, fill, new THREE.HemisphereLight('#7f9ccc', '#3b3a24', 0.7));
  }

  private buildBeam(): void {
    // the plane of focus of this instrument: a thin shaft of light rising from the selected prayer
    this.beamMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOp: { value: 0 } },
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: /* glsl */ `varying vec2 vUv; uniform float uTime; uniform float uOp;
        void main(){ float a = (1.0 - vUv.y) * (1.0 - vUv.y) * uOp; float s = 0.75 + 0.25*sin(vUv.y*40.0 - uTime*3.0);
          gl_FragColor = vec4(vec3(0.62,0.94,1.0)*a*s*1.6, a*s); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.36, 12, 1, true).translate(0, 0.18, 0), this.beamMat);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.017, 0.0205, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#9ff0ff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.beam = new THREE.Group();
    this.beam.add(shaft, ring);
    this.beam.visible = false;
    this.scene.add(this.beam);
  }

  applyQuality(p: QualityPreset): void {
    const first = !this.preset;
    this.preset = p;
    this.renderer.setPixelRatio(p.dpr);
    this.keyLight.castShadow = p.shadows;
    this.keyLight.shadow.mapSize.set(p.shadowSize, p.shadowSize);
    this.keyLight.shadow.map?.dispose();
    (this.keyLight.shadow as unknown as { map: THREE.WebGLRenderTarget | null }).map = null;
    if (this.motes) { this.scene.remove(this.motes); this.motes.geometry.dispose(); }
    this.motes = createMotes(p.motes);
    this.scene.add(this.motes);
    if (this.grass) { this.scene.remove(this.grass.group); this.grass.dispose(); }
    this.grass = createMeadow({ grass: p.grass, segs: p.grassSegs, flowers: p.flowers });
    this.scene.add(this.grass.group);
    if (first) this.pipeline = new Pipeline(this.renderer, this.scene, this.camera, p, this.sunSource);
    else this.pipeline.setQuality(p);
    if (this.ground) {
      const gm = this.ground.material as THREE.ShaderMaterial;
      const lq = p.grass[3] === 0;
      if (!!gm.defines.LQ !== lq) { if (lq) gm.defines.LQ = 1; else delete gm.defines.LQ; gm.needsUpdate = true; }
    }
    if (this.pillarMat) {
      if (!!this.pillarMat.defines.BARK_HQ !== p.barkHQ) { if (p.barkHQ) this.pillarMat.defines.BARK_HQ = 1; else delete this.pillarMat.defines.BARK_HQ; this.pillarMat.needsUpdate = true; }
    }
    if (this.rays) this.rays.visible = p.godRays === 0;
    if (!first && this.world) {
      this.buildTree();
      for (const t of this.tiles.values()) this.disposeTile(t);
      this.tiles.clear();
      this.setPreviews(this.previews);
    }
    this.resize();
  }

  // ───────────────────────────── world data ─────────────────────────────
  setWorld(world: World): void {
    this.world = world;
    const l = world.ladder;
    this.L = { turnH: l.turnH, rIn: l.rIn, rOut: l.rOut, base: l.base, turns: l.turns, top: l.base + l.turns * l.turnH };
    this.nodes = world.nodes;
    this.nodeIndex = new Map(this.nodes.map((n, i) => [n.id, i]));
    this.nodePos = this.nodes.map((n) => cyl(n.a, n.r, n.y + 0.012));
    this.buildLadder();
    this.buildNodes();
    this.buildRelations();
    this.buildLabels();
    this.view = { t: new THREE.Vector3(0, this.midY, 0), az: 0.35, d: Math.min(MAX_D, this.homeD() * 1.25) };
  }

  /** the overview frames the whole tree: from the grass at its foot to the caption above its crown */
  private get frameY(): [number, number] { return [TABLE_Y - 0.3, this.crown.top + 0.5]; }
  /** height the overview looks at: the middle of the frame, or — when the space between the panels is too small for the
   * whole tree — just low enough that the crown and the sun stay in view (the meadow at the foot goes under the panel) */
  private get midY(): number {
    const [y0, y1] = this.frameY;
    const freeH = Math.max(0.35, (this.height - this.insets.top - this.insets.bottom) / this.height);
    const half = (this.homeD() / 1.03) * Math.tan((this.camera.fov * D2R) / 2) * freeH;
    return Math.max((y0 + y1) / 2, y1 - half);
  }

  /** unwrapped helix angle (deg) of a node: world index × 360 + its sector angle */
  private unwrapped(n: PrayerNode): number { return this.world.worlds.findIndex((w) => w.id === n.world) * 360 + n.a; }
  private helixY(u: number): number { return this.L.base + (u / 360) * this.L.turnH; }

  /** the tree: roots into the meadow, and a great crown of branches and leaves spreading above the ladder's head */
  private buildTree(): void {
    if (this.tree) { this.ladder.remove(this.tree.group); this.tree.dispose(); }
    const top = this.L.top;
    this.tree = createTree({
      trunkR: PILLAR_R, bottom: TABLE_Y, top: top + 0.12, sun: new THREE.Vector3(0, top + SUN_H, 0), clearY: top + 0.35,
      leaves: this.preset.leaves, sparks: this.preset.sparks, leafTex: this.preset.leafTex, a2c: this.preset.msaa > 0, hq: this.preset.barkHQ,
    });
    this.pillarMat.uniforms.uLimbA.value = this.tree.limbAngles.slice(0, 6).concat([0, 0, 0, 0, 0, 0]).slice(0, 6);
    this.crown = { top: this.tree.maxY, r: this.tree.radius };
    this.tree.setPixelHeight(this.height * this.renderer.getPixelRatio());
    this.ladder.add(this.tree.group);
    this.reframeHome();
  }

  private buildLadder(): void {
    const { rIn, rOut, turns, top } = this.L;
    this.ladder.clear();
    const polished = withCutaway(new THREE.MeshPhysicalMaterial({ color: '#efe2c2', metalness: 1, roughness: 0.2, clearcoat: 0.3 }));
    const satin = withCutaway(new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 1, roughness: 0.32 }));
    // close up, the metal steps back to a ghost so the medallion and its words carry the view
    for (const m of [polished, satin]) { m.transparent = true; m.userData.base = 1; }
    this.metalMats = [polished, satin];
    const worldColors = this.world.worlds.map((w) => new THREE.Color(w.color));

    // two rails: helices of one turn per world
    const U = turns * 360;
    this.railMats = [];
    for (const r of [rIn, rOut]) {
      const pts: THREE.Vector3[] = [];
      for (let u = 0; u <= U; u += 3) pts.push(cyl(u, r, this.helixY(u)));
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 0.011, 8, false), polished);
      tube.castShadow = true;
      this.ladder.add(tube);
      // a hairline of each world's light along the rail
      const geo = new LineGeometry();
      geo.setPositions(pts.flatMap((p) => [p.x * 1.0, p.y + 0.0, p.z]));
      geo.setColors(pts.flatMap((_, i) => worldColors[Math.min(turns - 1, Math.floor((i * 3) / 360))].toArray()));
      const m = this.lineMat('#ffffff', 1.4, { opacity: 0.32 });
      m.vertexColors = true;
      this.railMats.push(m);
      const glow = new Line2(geo, m);
      glow.computeLineDistances();
      glow.renderOrder = 2;
      this.ladder.add(glow);
      // posts down to the pedestal, and finials at the top
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, this.L.base - TABLE_Y, 10), polished);
      post.position.copy(cyl(0, r, (this.L.base + TABLE_Y) / 2));
      post.castShadow = true;
      this.ladder.add(post);
      const fin = new THREE.Mesh(new THREE.SphereGeometry(0.026, 20, 14), new THREE.MeshBasicMaterial({ color: '#fff6dc' }));
      fin.position.copy(cyl(0, r, top));
      this.ladder.add(fin);
    }

    // rungs: one under every prayer, and plain rungs every 7.5° in between
    const nodeU = this.nodes.map((n) => this.unwrapped(n));
    const rungs: { u: number; color: THREE.Color }[] = this.nodes.map((n, i) => ({ u: nodeU[i], color: new THREE.Color(this.world.regionMap.get(n.region)!.color).lerp(new THREE.Color('#ffffff'), 0.35) }));
    for (let u = 3.75; u < U; u += 7.5) if (!nodeU.some((x) => Math.abs(x - u) < 2.8)) rungs.push({ u, color: new THREE.Color('#9aa0a8') });
    const len = rOut - rIn;
    const rungGeo = new THREE.CylinderGeometry(0.0068, 0.0068, len, 8);
    const inst = new THREE.InstancedMesh(rungGeo, satin, rungs.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), s1 = new THREE.Vector3(1, 1, 1);
    rungs.forEach((g, i) => {
      const a = g.u % 360;
      q.setFromUnitVectors(up, radialAt(a));
      m4.compose(cyl(a, (rIn + rOut) / 2, this.helixY(g.u)), q, s1);
      inst.setMatrixAt(i, m4);
      inst.setColorAt(i, g.color);
    });
    inst.castShadow = true;
    this.ladder.add(inst);

    // pillar of words
    const bottom = TABLE_Y, ptop = top + 0.12;
    this.pillarMat = createTrunkMaterial({ foot: bottom, top: ptop, base: this.L.base, turnH: this.L.turnH, turns, worldColors, hq: this.preset.barkHQ });
    NATURE.uTrunkTop.value = ptop;
    NATURE.uSunPos.value.set(0, top + SUN_H, 0);
    // a little below the ground, so the buttresses sink into it (the words are laid out from the ground up in the shader)
    const sunk = 0.08, crown = 0.32;
    this.pillar = new THREE.Mesh(new THREE.CylinderGeometry(PILLAR_R, PILLAR_R, ptop - bottom + sunk + crown, 200, 120, true).translate(0, (ptop + crown + bottom - sunk) / 2, 0), this.pillarMat);
    this.pillar.castShadow = true;
    this.ladder.add(this.pillar);
    // the tree: roots into the meadow, and a crown of branches and leaves fanning out above the ladder's head
    this.buildTree();

    // world boundaries: faint level rings where each turn ends
    for (let w = 0; w <= turns; w++) {
      const pts: number[] = [];
      for (let a = 0; a <= 360; a += 3) pts.push(...cyl(a, rOut + 0.1, this.L.base + w * this.L.turnH).toArray());
      const geo = new LineGeometry();
      geo.setPositions(pts);
      const ring = new Line2(geo, this.lineMat(this.world.worlds[Math.min(w, turns - 1)].color, 1, { opacity: 0.16, dashed: true, dashSize: 0.03, gapSize: 0.03 }));
      ring.computeLineDistances();
      this.ladder.add(ring);
    }

    // heaven: the ladder's head reaches into light
    this.heaven = new THREE.Group();
    // the sun at the head of the ladder, crowning the tree
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture([[0, 'rgba(255,248,225,0.95)'], [0.16, 'rgba(255,214,150,0.45)'], [0.45, 'rgba(255,170,90,0.1)'], [1, 'rgba(255,150,80,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    halo.scale.setScalar(3.6);
    this.rays = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeRaysTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.55 }));
    this.rays.scale.setScalar(5.2);
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture([[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,240,200,0.6)'], [1, 'rgba(255,240,200,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    core.scale.setScalar(0.95);
    this.heaven.add(halo, core, this.rays);
    this.heaven.position.y = top + SUN_H;
    this.sunSource.position.set(0, top + SUN_H, 0);
    this.sunSource.updateMatrix(); // it lives outside the scene graph (the god rays render it on their own)
    this.rays.visible = this.preset.godRays === 0;
    this.ladder.add(this.heaven);

    // angels ascending and descending
    const count = 14;
    this.angels = Array.from({ length: count }, (_, i) => ({
      u: (i / count) * U, dir: i % 2 ? -1 : 1, speed: 10 + (i % 5) * 2.2, r: rIn + (rOut - rIn) * (0.25 + 0.5 * ((i * 0.37) % 1)),
    }));
    const ag = new THREE.BufferGeometry();
    ag.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    ag.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(count), 1));
    ag.setAttribute('dir', new THREE.BufferAttribute(new Float32Array(this.angels.map((a) => a.dir)), 1));
    this.angelMat = new THREE.ShaderMaterial({
      uniforms: { uPR: { value: 1 } },
      vertexShader: /* glsl */ `attribute float alpha; attribute float dir; uniform float uPR; varying float vA; varying float vDir;
        void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mv; vA = alpha; vDir = dir;
          gl_PointSize = clamp(uPR * 26.0 / -mv.z, 2.0*uPR, 14.0*uPR); }`,
      fragmentShader: /* glsl */ `varying float vA; varying float vDir; void main(){ float d = length(gl_PointCoord-0.5);
        float a = (smoothstep(0.5,0.0,d)*0.6 + smoothstep(0.12,0.0,d)) * vA;
        vec3 c = vDir > 0.0 ? vec3(0.8,0.95,1.0) : vec3(1.0,0.86,0.6);
        gl_FragColor = vec4(c*a*1.4, a); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.angelPoints = new THREE.Points(ag, this.angelMat);
    this.angelPoints.frustumCulled = false;
    this.ladder.add(this.angelPoints);
  }

  private buildNodes(): void {
    const N = this.nodes.length;
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), st = new Float32Array(N);
    this.nodes.forEach((n, i) => {
      pos.set(this.nodePos[i].toArray(), i * 3);
      const c = new THREE.Color(this.world.regionMap.get(n.region)!.color);
      col.set([c.r, c.g, c.b], i * 3);
      size[i] = 5 + n.imp * 2.6;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('size', new THREE.BufferAttribute(size, 1));
    g.setAttribute('state', new THREE.BufferAttribute(st, 1));
    this.nodeMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPR: { value: 1 }, uD: { value: 1 }, uMotion: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute vec3 color; attribute float size; attribute float state;
        uniform float uTime; uniform float uPR; uniform float uD; uniform float uMotion;
        varying vec3 vC; varying float vS; varying float vPulse;
        void main(){
          vec4 mv = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mv;
          float s = size * clamp(3.2/(uD+0.6), 0.75, 2.6);
          if (state > 0.5 && state < 1.5) s *= 0.55;
          if (state > 1.5) s *= 1.3;
          vPulse = state > 2.5 ? 0.5 + 0.5*sin(uTime*3.0*uMotion) : 0.0;
          gl_PointSize = s * uPR * (1.0 + vPulse*0.3);
          vC = color; vS = state;
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vC; varying float vS; varying float vPulse;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float core = smoothstep(0.15, 0.0, d);
          float glow = smoothstep(0.5, 0.0, d);
          float ring = smoothstep(0.03, 0.0, abs(d - 0.40)) * step(2.5, vS);
          vec3 c = vC;
          float a = glow*0.5 + core;
          if (vS > 0.5 && vS < 1.5) { c = mix(c, vec3(0.3,0.33,0.4), 0.7); a *= 0.4; }
          vec3 col = c*(glow*0.9 + core*2.2) + vec3(0.62,0.94,1.0)*ring*(1.0+vPulse)*1.5;
          gl_FragColor = vec4(col, clamp(a + ring, 0.0, 1.0));
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.nodePoints = new THREE.Points(g, this.nodeMat);
    this.nodePoints.renderOrder = 3;
    this.ladder.add(this.nodePoints);
  }

  private lineMat(color: string, width: number, o: { opacity?: number; dashed?: boolean; dashSize?: number; gapSize?: number } = {}): LineMaterial {
    const m = new LineMaterial({
      color: new THREE.Color(color), linewidth: width, transparent: true, opacity: o.opacity ?? 0.8,
      dashed: !!o.dashed, dashSize: o.dashSize ?? 0.02, gapSize: o.gapSize ?? 0.01, depthWrite: false, worldUnits: false,
    });
    m.blending = THREE.AdditiveBlending;
    m.fog = false;
    m.resolution.set(this.width * this.renderer.getPixelRatio(), this.height * this.renderer.getPixelRatio());
    return m;
  }

  /** A path between two points on the ladder that wraps around the outside of it and never cuts the pillar. */
  private arc(a: THREE.Vector3, b: THREE.Vector3, bulge = 1): THREE.Vector3[] {
    const aa = angleOf(a), ab = angleOf(b);
    const ra = Math.hypot(a.x, a.z), rb = Math.hypot(b.x, b.z);
    const dA = angleDelta(aa, ab), dY = b.y - a.y;
    const span = Math.abs(dA) / 90 + Math.abs(dY) / 1.1;
    const lift = (0.05 + 0.2 * Math.min(1, span)) * bulge;
    const n = Math.max(8, Math.round(10 + Math.abs(dA) / 3 + Math.abs(dY) * 30));
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const e = t * t * (3 - 2 * t) * 0.35 + t * 0.65;
      pts.push(cyl(aa + dA * t, THREE.MathUtils.lerp(ra, rb, t) + Math.sin(Math.PI * t) * lift, a.y + dY * e));
    }
    return pts;
  }

  private buildRelations(): void {
    this.relGroup.clear();
    this.relLines = [];
    for (const n of this.nodes) {
      for (const r of n.rel) {
        const ti = this.nodeIndex.get(r.target);
        if (ti == null) continue;
        const pts = this.arc(this.nodePos[this.nodeIndex.get(n.id)!], this.nodePos[ti], 0.6);
        const geo = new LineGeometry();
        geo.setPositions(pts.flatMap((p) => [p.x, p.y, p.z]));
        const dashed = r.type === 'adds' || r.type === 'varies';
        const mat = this.lineMat(REL_COLORS[r.type], 1.4, { dashed, dashSize: r.type === 'adds' ? 0.016 : 0.005, gapSize: r.type === 'adds' ? 0.01 : 0.009, opacity: 0.16 });
        const line = new Line2(geo, mat);
        line.computeLineDistances();
        line.renderOrder = 2;
        line.userData = { from: n.id, to: r.target };
        this.relGroup.add(line);
        this.relLines.push(line);
      }
    }
    this.ladder.add(this.relGroup);
  }

  private buildLabels(): void {
    this.labelsEl.textContent = '';
    this.nodeLabels = this.nodes.map((n) => {
      const el = document.createElement('div');
      const color = this.world.regionMap.get(n.region)!.color;
      el.className = 'label node' + (n.imp >= 2 ? '' : ' minor') + (n.tags.includes('kabbalah') ? ' kab' : '');
      el.style.color = color;
      el.innerHTML = `<span class="dot"></span><span class="t"></span>`;
      (el.querySelector('.t') as HTMLElement).textContent = n.title;
      this.labelsEl.appendChild(el);
      return { el, w: 0, h: 0, op: 0, shown: false, state: 0 };
    });
    this.regionLabels = this.world.regions.map((r) => {
      const el = document.createElement('div');
      el.className = 'label region';
      const count = this.nodes.filter((n) => n.region === r.id).length;
      el.innerHTML = `<span class="dot" style="color:${r.color}"></span>${r.name}<span class="v">${count}</span>`;
      this.labelsEl.appendChild(el);
      return { el, a: r.a, w: 0, h: 0, op: 0 };
    });
    this.worldLabels = this.world.worlds.map((w, i) => {
      const el = document.createElement('div');
      el.className = 'label world';
      el.style.setProperty('--wc', w.color);
      el.innerHTML = `<span class="n">${ROMAN[i]}</span><span class="he">${w.he}</span><span class="en">${w.en.toUpperCase()}</span>`;
      this.labelsEl.appendChild(el);
      return { el, y: this.L.base + (i + 0.5) * this.L.turnH, w: 0, h: 0, op: 0 };
    });
    const caption = (html: string, pos: THREE.Vector3, far: number) => {
      const el = document.createElement('div');
      el.className = 'label caption';
      el.innerHTML = html;
      this.labelsEl.appendChild(el);
      return { el, pos, w: 0, h: 0, op: 0, far };
    };
    this.captions = [
      caption('וְרֹאשׁוֹ מַגִּיעַ הַשָּׁמָיְמָה<span class="v">בראשית כח, יב</span>', new THREE.Vector3(0, this.crown.top + 0.2, 0), 3.2),
      caption('סֻלָּם מֻצָּב אַרְצָה', new THREE.Vector3(0, this.L.base + 0.05, 0), 3.2),
    ];
    this.focusTag = document.createElement('div');
    this.focusTag.className = 'label plane';
    this.labelsEl.appendChild(this.focusTag);
    requestAnimationFrame(() => this.measureLabels());
  }

  measureLabels(): void {
    for (const l of this.nodeLabels) { l.w = l.el.offsetWidth; l.h = l.el.offsetHeight; }
    for (const r of [...this.regionLabels, ...this.worldLabels, ...this.captions]) { r.w = r.el.offsetWidth; r.h = r.el.offsetHeight; }
  }

  setPreviews(previews: Record<string, string>): void {
    this.previews = previews;
    const old = this.pillarMat.uniforms.uWords.value as THREE.Texture | null;
    this.pillarMat.uniforms.uWords.value = makePillarTexture(this.world, previews, { bottom: TABLE_Y, top: this.L.top + 0.12, radius: PILLAR_R }, Math.min(2048, this.preset.dustWidth / 2));
    this.pillarMat.uniforms.uHas.value = 1;
    old?.dispose();
    for (const t of this.tiles.values()) this.disposeTile(t);
    this.tiles.clear();
    this.tileMeshes = [];
  }

  // ───────────────────────────── selection & routes ─────────────────────────────
  setSelected(id: string | null): void {
    this.selectedId = id;
    this.refreshStates();
  }

  setRelView(v: boolean): void {
    this.relView = v;
    this.refreshStates();
  }

  setRoute(route: Route | null, nusach: string): void {
    this.route = route;
    this.routeNusach = nusach;
    this.stopIndex = -1;
    if (this.routeGroup) {
      this.ladder.remove(this.routeGroup);
      this.routeGroup.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        (m.material as THREE.Material | undefined)?.dispose();
      });
    }
    this.routeGroup = null;
    this.routeMat = null;
    this.comet = null;
    for (const b of this.badges) b.el.remove();
    this.badges = [];
    if (route) this.buildRoute(route, nusach);
    this.refreshStates();
  }

  private stopPoint(i: number): THREE.Vector3 {
    const s = this.route!.stops[i];
    const p = this.nodePos[this.nodeIndex.get(s.n)!].clone();
    if (s.occTotal <= 1) return p;
    const n = this.nodes[this.nodeIndex.get(s.n)!];
    const ang = ((s.occ - 1) / s.occTotal) * Math.PI * 2;
    const tangent = new THREE.Vector3(Math.cos(n.a * D2R), 0, -Math.sin(n.a * D2R));
    return p.addScaledVector(tangent, Math.cos(ang) * 0.02).add(new THREE.Vector3(0, Math.sin(ang) * 0.02, 0)).addScaledVector(radialAt(n.a), 0.01);
  }

  /** unwrapped helix angle (deg) of a route stop's node */
  private stopU(i: number): number { return this.unwrapped(this.nodes[this.nodeIndex.get(this.route!.stops[i].n)!]); }

  /**
   * The way from one stop to the next along the ladder itself: off the rung onto the lane, along the spiral (up or
   * down, as the ladder goes), and onto the next rung. Ascents keep to the outer lane, descents to the inner one —
   * "עולים ויורדים בו".
   */
  private lanePath(a: THREE.Vector3, ua: number, b: THREE.Vector3, ub: number, k: number): THREE.Vector3[] {
    const { rIn, rOut } = this.L;
    const du = ub - ua;
    if (Math.abs(du) < 0.5) return [a.clone(), b.clone()];
    const lane = du > 0 ? rOut - 0.11 : rIn + 0.11;
    const laneR = lane + ((k % 3) - 1) * 0.022;
    const ra = Math.hypot(a.x, a.z), rb = Math.hypot(b.x, b.z);
    const n = Math.max(6, Math.ceil(Math.abs(du) / 2.5));
    const ramp = Math.min(0.5, 9 / Math.abs(du)); // the part of the way spent stepping on / off the lane
    const lift = 0.03;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const u = ua + du * t;
      const on = smoothstep(0, ramp, t) * smoothstep(1, 1 - ramp, t);
      const r = THREE.MathUtils.lerp(t < 0.5 ? ra : rb, laneR, on);
      const yEnd = t < 0.5 ? a.y : b.y;
      const y = THREE.MathUtils.lerp(yEnd, this.helixY(u) + lift, on);
      pts.push(cyl(u % 360, r, y));
    }
    pts[0].copy(a);
    pts[n].copy(b);
    return pts;
  }

  private buildRoute(route: Route, nusach: string): void {
    const g = new THREE.Group();
    const stopPts = route.stops.map((_, i) => this.stopPoint(i));
    const pts: THREE.Vector3[] = [];
    const cols: number[] = [];
    const up = new THREE.Color('#c9f6ff'), down = new THREE.Color('#ffc46b'), level = new THREE.Color('#8fd6ff');
    this.segPts = [];
    for (let i = 0; i < stopPts.length - 1; i++) {
      const a = stopPts[i], b = stopPts[i + 1];
      const ua = this.stopU(i), ub = this.stopU(i + 1);
      const seg = this.lanePath(a, ua, b, ub, i);
      this.segPts.push(seg.map((p) => p.clone()));
      const c = ub - ua > 30 ? up : ub - ua < -30 ? down : level;
      const s2 = pts.length ? seg.slice(1) : seg;
      for (const p of s2) { pts.push(p); cols.push(c.r, c.g, c.b); }
    }
    this.routePts = pts;
    if (pts.length >= 2) {
      const flat = pts.flatMap((p) => [p.x, p.y, p.z]);
      const under = new LineGeometry();
      under.setPositions(flat);
      under.setColors(cols);
      const glowMat = this.lineMat('#ffffff', 5, { opacity: 0.08 });
      glowMat.vertexColors = true;
      const glow = new Line2(under, glowMat);
      glow.computeLineDistances();
      const over = new LineGeometry();
      over.setPositions(flat);
      over.setColors(cols);
      this.routeMat = this.lineMat('#ffffff', 2, { dashed: true, dashSize: 0.03, gapSize: 0.018, opacity: 0.92 });
      this.routeMat.vertexColors = true;
      const line = new Line2(over, this.routeMat);
      line.computeLineDistances();
      glow.renderOrder = line.renderOrder = 4;
      g.add(glow, line);

      this.comet = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture([[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(160,240,255,0.85)'], [1, 'rgba(95,224,255,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      this.comet.renderOrder = 5;
      g.add(this.comet);
      this.routeCum = [0];
      for (let i = 1; i < pts.length; i++) this.routeCum.push(this.routeCum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    }
    this.routeGroup = g;
    this.ladder.add(g);

    route.stops.forEach((s, i) => {
      const el = document.createElement('div');
      const off = s.omit || (!!s.only && !s.only.includes(nusach as never));
      el.className = 'badge' + (s.omit ? ' omit' : off ? ' off' : '');
      el.textContent = String(i + 1);
      this.labelsEl.appendChild(el);
      this.badges.push({ el, pos: stopPts[i].clone(), i });
    });
  }

  setStop(i: number): void {
    this.stopIndex = i;
    this.badges.forEach((b) => b.el.classList.toggle('current', b.i === i));
    this.refreshStates();
  }

  private refreshStates(): void {
    if (!this.nodePoints) return;
    const st = this.nodePoints.geometry.getAttribute('state') as THREE.BufferAttribute;
    const onRoute = new Set(this.route ? this.route.stops.map((s) => s.n) : []);
    const cur = this.route && this.stopIndex >= 0 ? this.route.stops[this.stopIndex].n : null;
    this.nodes.forEach((n, i) => {
      let s = this.route ? (onRoute.has(n.id) ? 2 : 1) : 0;
      if (n.id === cur || n.id === this.selectedId) s = 3;
      st.setX(i, s);
      const l = this.nodeLabels[i];
      l.state = s;
      l.el.classList.toggle('active', s >= 3);
      l.el.classList.toggle('dimmed', s === 1);
    });
    st.needsUpdate = true;
    for (const line of this.relLines) {
      const { from, to } = line.userData as { from: string; to: string };
      let op = this.relView ? 0.16 : 0;
      if (this.route) op = this.relView && onRoute.has(from) && onRoute.has(to) ? 0.55 : 0;
      const focusId = cur || this.selectedId;
      if (focusId && (from === focusId || to === focusId)) op = 0.95;
      (line.material as LineMaterial).opacity = op;
      line.visible = op > 0;
    }
    const fid = cur || this.selectedId;
    if (fid) {
      const i = this.nodeIndex.get(fid)!;
      this.beam.position.copy(this.nodePos[i]);
      this.beam.visible = true;
      this.beam.userData.id = fid;
      this.pillarMat.uniforms.uSel.value.set(this.nodes[i].a * D2R, this.nodePos[i].y, 1);
    } else {
      this.beam.visible = false;
      this.pillarMat.uniforms.uSel.value.z = 0;
    }
  }

  // ───────────────────────────── camera ─────────────────────────────
  /** distance that frames the whole ladder, from its foot to the light above it, in the free area between panels */
  homeD(): number {
    const fov = this.camera.fov * D2R;
    const freeH = Math.max(0.35, (this.height - this.insets.top - this.insets.bottom) / this.height);
    const freeW = Math.max(0.35, (this.width - this.insets.left - this.insets.right) / this.width);
    const [y0, y1] = this.frameY;
    const byH = (y1 - y0) / 2 / Math.tan(fov / 2) / freeH;
    // on a narrow screen the tips of the widest branches may run past the sides; the ladder and the sun may not
    const w = Math.max(6.2, 2 * this.crown.r * (this.camera.aspect * freeW < 1 ? 0.8 : 1));
    const byW = w / 2 / Math.tan(fov / 2) / (this.camera.aspect * freeW);
    return THREE.MathUtils.clamp(Math.max(byH, byW) * 1.03, 4, MAX_D);
  }

  /** distance that frames the ladder itself with the sun above it (not the whole crown): regions and routes are seen from here */
  private ladderD(): number {
    const fov = this.camera.fov * D2R;
    const freeH = Math.max(0.35, (this.height - this.insets.top - this.insets.bottom) / this.height);
    const freeW = Math.max(0.35, (this.width - this.insets.left - this.insets.right) / this.width);
    const byH = (this.L.top + 2.1 - TABLE_Y) / 2 / Math.tan(fov / 2) / freeH;
    const byW = 6.2 / 2 / Math.tan(fov / 2) / (this.camera.aspect * freeW);
    return THREE.MathUtils.clamp(Math.max(byH, byW) * 1.3, 4, 17);
  }

  /** close up the camera looks down onto the rungs (like down a stair); far away, level with the ladder */
  private elevation(d: number): number {
    // from far away, nearly level with the sun at the head of the ladder, so it shines out under the crown
    const far = THREE.MathUtils.lerp(7, 3.5, smoothstep(9, 20, d));
    return THREE.MathUtils.lerp(34, far, smoothstep(0.6, 5, d)) * D2R;
  }

  flyTo(to: View, opts: { duration?: number } = {}): Promise<void> {
    const from: View = { t: this.view.t.clone(), az: this.view.az, d: this.view.d };
    to = { t: to.t.clone(), az: from.az + angleDelta(from.az / D2R, to.az / D2R) * D2R, d: THREE.MathUtils.clamp(to.d, MIN_D, MAX_D) };
    this.flight?.resolve();
    this.atHome = false;
    if (this.travel) { const tr = this.travel; this.travel = null; tr.resolve(); }
    this.vel.az = this.vel.y = 0;
    if (this.reduceMotion) {
      this.view = to;
      this.flight = null;
      return Promise.resolve();
    }
    const travel = from.t.distanceTo(to.t) + Math.abs(to.az - from.az) * 0.6;
    const dur = opts.duration ?? THREE.MathUtils.clamp(900 + travel * 380 + Math.abs(Math.log(to.d / from.d)) * 260, 900, 2600);
    const peak = Math.max(from.d, to.d, Math.min(this.ladderD() * 0.6, travel * 0.9));
    return new Promise((resolve) => { this.flight = { from, to, peak, t0: performance.now(), dur, resolve }; });
  }

  flyHome(opts: { duration?: number } = {}): Promise<void> {
    const p = this.flyTo({ t: new THREE.Vector3(0, this.midY, 0), az: this.view.az, d: this.homeD() }, opts);
    this.atHome = true;
    return p;
  }

  /** keep the overview framed when the space between the panels changes (they settle after the first flight starts) */
  private reframeHome(): void {
    if (!this.atHome || !this.world) return;
    const to = this.flight?.to ?? this.view;
    if (Math.abs(Math.log(this.homeD() / to.d)) > 0.03 || Math.abs(to.t.y - this.midY) > 0.05) void this.flyHome({ duration: 1400 });
  }

  flyToNode(id: string, d = 0.46): Promise<void> {
    const i = this.nodeIndex.get(id);
    if (i == null) return Promise.resolve();
    const n = this.nodes[i];
    const t = this.nodePos[i].clone().addScaledVector(radialAt(n.a), 0.03).add(new THREE.Vector3(0, -0.035, 0));
    return this.flyTo({ t, az: n.a * D2R, d });
  }

  /**
   * Travel from one stop of the route to the next along the ladder's lane: the camera rides the path, passing the
   * prayers in between, and settles on the new stop. Falls back to a direct flight for non-adjacent stops.
   */
  travelTo(from: number, to: number): Promise<void> {
    const seg = to === from + 1 ? this.segPts[from] : to === from - 1 ? this.segPts[to] && [...this.segPts[to]].reverse() : null;
    const node = this.route?.stops[to]?.n;
    if (!seg || seg.length < 3 || this.reduceMotion || !node) return node ? this.flyToNode(node) : Promise.resolve();
    this.cancelFlight();
    this.atHome = false;
    this.travel?.resolve();
    const cum = [0];
    for (let i = 1; i < seg.length; i++) cum.push(cum[i - 1] + seg[i].distanceTo(seg[i - 1]));
    const ang: number[] = [];
    let prev = angleOf(seg[0]);
    let acc = prev;
    for (const p of seg) { const a = angleOf(p); acc += angleDelta(prev, a); prev = a; ang.push(acc * D2R); }
    const total = cum[cum.length - 1];
    const dur = THREE.MathUtils.clamp((0.7 + total / 2.4) / this.speed, 0.45, 16) * 1000;
    return new Promise((resolve) => {
      this.travel = { pts: seg, cum, ang, from: { t: this.view.t.clone(), az: this.view.az, d: this.view.d }, t0: performance.now(), dur, dMid: THREE.MathUtils.clamp(0.55 + total * 0.04, 0.6, 1.1), resolve };
      this.vel.az = this.vel.y = 0;
    });
  }

  private stepTravel(): void {
    const tr = this.travel!;
    const t = Math.min(1, (performance.now() - tr.t0) / tr.dur);
    const e = t * t * (3 - 2 * t);
    const s = e * tr.cum[tr.cum.length - 1];
    let i = 1;
    while (i < tr.cum.length - 1 && tr.cum[i] < s) i++;
    const f = (s - tr.cum[i - 1]) / (tr.cum[i] - tr.cum[i - 1] || 1);
    const p = tr.pts[i - 1].clone().lerp(tr.pts[i], f);
    const az = THREE.MathUtils.lerp(tr.ang[i - 1], tr.ang[i], f);
    const target = p.clone().addScaledVector(radialAt(az / D2R), 0.03).add(new THREE.Vector3(0, -0.035, 0));
    const d = 0.46 + (tr.dMid - 0.46) * Math.sin(Math.PI * e);
    // ease in from wherever the camera was; keep the azimuth continuous with it
    const w = smoothstep(0, 0.18, t);
    const fromAz = tr.from.az;
    const pathAz = az + Math.round((fromAz - tr.ang[0]) / (Math.PI * 2)) * Math.PI * 2;
    this.view.t.lerpVectors(tr.from.t, target, w);
    this.view.az = THREE.MathUtils.lerp(fromAz, pathAz, w);
    this.view.d = Math.exp(THREE.MathUtils.lerp(Math.log(tr.from.d), Math.log(d), w));
    if (t >= 1) { this.travel = null; tr.resolve(); }
  }

  flyToRegion(id: string): Promise<void> {
    const r = this.world.regionMap.get(id);
    if (!r) return Promise.resolve();
    return this.flyTo({ t: cyl(r.a, 0.7, (this.L.base + this.L.top) / 2), az: r.a * D2R, d: this.ladderD() * 0.72 });
  }

  overview(): Promise<void> {
    if (!this.route) return this.flyHome();
    const pts = this.route.stops.map((s) => this.nodePos[this.nodeIndex.get(s.n)!]);
    let sx = 0, sz = 0, y0 = Infinity, y1 = -Infinity;
    for (const p of pts) {
      const a = angleOf(p) * D2R;
      sx += Math.sin(a);
      sz += Math.cos(a);
      y0 = Math.min(y0, p.y);
      y1 = Math.max(y1, p.y);
    }
    const k = Math.hypot(sx, sz) / pts.length; // 1 = the route keeps to one side of the ladder
    const az = Math.atan2(sx, sz);
    const fov = this.camera.fov * D2R;
    const freeH = Math.max(0.35, (this.height - this.insets.top - this.insets.bottom) / this.height);
    const d = THREE.MathUtils.clamp(((y1 - y0 + 0.7) / 2 / Math.tan(fov / 2) / freeH) * (1 + (1 - k) * 0.5), 1.6, this.ladderD());
    return this.flyTo({ t: cyl(az / D2R, 0.95 * k, (y0 + y1) / 2), az, d });
  }

  zoomBy(f: number): void {
    this.view.d = THREE.MathUtils.clamp(this.view.d * f, MIN_D, MAX_D);
    this.cancelFlight();
    this.touch();
  }

  /** orbit around the ladder's axis (radians) and climb (world units) */
  orbit(dAz: number, dy: number): void {
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dAz);
    this.view.t.applyQuaternion(q);
    this.view.az += dAz;
    this.view.t.y = THREE.MathUtils.clamp(this.view.t.y + dy, TABLE_Y + 0.1, Math.max(this.L.top + 0.9, this.midY));
    this.cancelFlight();
    this.touch();
  }

  /** stop a camera flight; whoever awaits it carries on (a journey must never hang on an interrupted flight) */
  private cancelFlight(): void {
    const f = this.flight, tr = this.travel;
    this.flight = null;
    this.travel = null;
    f?.resolve();
    tr?.resolve();
  }

  setInsets(i: Partial<typeof this.insets>): void {
    this.insets = { left: 0, right: 0, top: 0, bottom: 0, ...i };
    this.reframeHome();
  }
  get focusScreen(): { x: number; y: number } { return { x: this.width / 2 - this.viewOff.x, y: this.height / 2 - this.viewOff.y }; }
  get distance(): number { return this.view.d; }
  private touch(): void { this.lastInteraction = performance.now(); this.atHome = false; }
  private unitsPerPx(): number { return (2 * this.view.d * Math.tan((this.camera.fov * D2R) / 2)) / (this.height || 800); }

  private updateCamera(): void {
    const f = this.flight;
    if (this.travel) this.stepTravel();
    else if (f) {
      const t = Math.min(1, (performance.now() - f.t0) / f.dur);
      const e = easeInOutCubic(t);
      this.view.t.lerpVectors(f.from.t, f.to.t, e);
      this.view.az = THREE.MathUtils.lerp(f.from.az, f.to.az, e);
      const u = 1 - e;
      const ld = u * u * Math.log(f.from.d) + 2 * u * e * Math.log(f.peak) + e * e * Math.log(f.to.d);
      this.view.d = Math.exp(ld);
      if (t >= 1) { this.flight = null; f.resolve(); }
    } else if (Math.abs(this.vel.az) + Math.abs(this.vel.y) > 1e-5) {
      this.orbit(this.vel.az, this.vel.y);
      this.vel.az *= 0.92;
      this.vel.y *= 0.92;
    } else if (!this.reduceMotion && !this.route && !this.selectedId && !this.dragging && performance.now() - this.lastInteraction > 9000 && this.view.d > 2.5) {
      this.view.az -= 0.0007;
      this.view.t.applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.0007);
    }

    const { t, az, d } = this.view;
    const el = this.elevation(d);
    const cam = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d).add(t);
    cam.y = Math.max(cam.y, TABLE_Y + 0.12);
    this.camera.position.copy(cam);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(t);
    this.camera.near = Math.max(0.002, d * 0.04);

    const k = this.reduceMotion ? 1 : 0.12;
    this.viewOff.x += ((this.insets.right - this.insets.left) / 2 - this.viewOff.x) * k;
    this.viewOff.y += ((this.insets.bottom - this.insets.top) / 2 - this.viewOff.y) * k;
    if (Math.abs(this.viewOff.x) + Math.abs(this.viewOff.y) > 0.5) this.camera.setViewOffset(this.width, this.height, this.viewOff.x, this.viewOff.y, this.width, this.height);
    else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();

    (this.pillarMat.uniforms.uCam.value as THREE.Vector3).copy(this.camera.position);
    CUT.pos.value.copy(this.camera.position);
    CUT.r.value = d < 1.5 ? THREE.MathUtils.clamp(d * 0.86, 0.1, 0.9) * smoothstep(1.5, 1.1, d) : 0;
    this.pillarMat.uniforms.uWordsK.value = 0.12 + 0.88 * smoothstep(0.7, 2.2, d);
    this.nodeMat.uniforms.uD.value = d;
  }

  // ───────────────────────────── input ─────────────────────────────
  private bindInput(): void {
    const c = this.canvas;
    const pointers = new Map<number, { x: number; y: number }>();
    let downAt: { x: number; y: number } | null = null, moved = 0, pinchD = 0, lastMove = 0;

    c.addEventListener('pointerdown', (e) => {
      c.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      downAt = { x: e.clientX, y: e.clientY };
      moved = 0;
      this.dragging = true;
      this.cancelFlight();
      this.vel.az = this.vel.y = 0;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchD = Math.hypot(a.x - b.x, a.y - b.y);
      }
      this.touch();
    });
    c.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) { this.hover(e); return; }
      const prev = pointers.get(e.pointerId)!;
      const cur = { x: e.clientX, y: e.clientY };
      pointers.set(e.pointerId, cur);
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dd = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchD > 0) this.zoomBy(pinchD / dd);
        pinchD = dd;
        moved += 10;
        return;
      }
      const dx = cur.x - prev.x, dy = cur.y - prev.y;
      moved += Math.abs(dx) + Math.abs(dy);
      const [dAz, dY] = this.dragDelta(dx, dy);
      this.orbit(dAz, dY);
      const now = performance.now();
      const dt = Math.max(8, now - lastMove);
      lastMove = now;
      this.vel.az = dAz * (16 / dt);
      this.vel.y = dY * (16 / dt);
    });
    const end = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchD = 0;
      if (pointers.size === 0) {
        this.dragging = false;
        if (performance.now() - lastMove > 80 || this.reduceMotion) this.vel.az = this.vel.y = 0;
        if (moved < 6 && downAt) this.click(e);
      }
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('pointerleave', () => { if (!this.dragging) this.setHover(null, 0, 0); });
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      const f = Math.exp(e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0016));
      const at = this.pointAtTargetDepth(e.clientX, e.clientY);
      this.zoomBy(f);
      if (f < 1 && at) this.view.t.lerp(at, Math.min(1, (1 - f) * 1.1));
    }, { passive: false });
    c.addEventListener('keydown', (e) => {
      const step = 60;
      const pick = () => { const id = this.pickCenter(); if (id) this.cb.onSelect?.(id); };
      const drag = (dx: number, dy: number) => { const [a, y] = this.dragDelta(dx, dy); this.orbit(a, y); };
      const map: Record<string, () => void> = {
        ArrowLeft: () => drag(step, 0), ArrowRight: () => drag(-step, 0), ArrowUp: () => drag(0, step), ArrowDown: () => drag(0, -step),
        '+': () => this.zoomBy(0.8), '=': () => this.zoomBy(0.8), '-': () => this.zoomBy(1.25), _: () => this.zoomBy(1.25),
        PageUp: () => drag(0, step * 4), PageDown: () => drag(0, -step * 4), Home: () => void this.flyHome(), Enter: pick, ' ': pick,
      };
      if (map[e.key]) {
        e.preventDefault();
        map[e.key]();
        this.cb.onKeyNav?.(this.pickCenter());
      }
    });
  }

  /** screen drag → (azimuth change, climb). Close up, the ladder slides under the finger; far away it turns. */
  private dragDelta(dx: number, dy: number): [number, number] {
    const upp = this.unitsPerPx();
    const rT = Math.hypot(this.view.t.x, this.view.t.z);
    const dAz = -dx * Math.min(0.006, upp / Math.max(0.3, rT));
    return [dAz, dy * upp];
  }

  private ndc(x: number, y: number): THREE.Vector2 {
    const r = this.canvas.getBoundingClientRect();
    return new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
  }

  private pointAtTargetDepth(x: number, y: number): THREE.Vector3 | null {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(this.ndc(x, y), this.camera);
    const fwd = this.camera.getWorldDirection(new THREE.Vector3());
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(fwd, this.view.t);
    const hit = ray.ray.intersectPlane(plane, new THREE.Vector3());
    if (!hit) return null;
    hit.y = THREE.MathUtils.clamp(hit.y, TABLE_Y + 0.1, this.L.top + 0.9);
    return hit;
  }

  private nearestNode(x: number, y: number, maxPx = 22): string | null {
    const r = this.canvas.getBoundingClientRect();
    let best: string | null = null, bd = maxPx;
    this.proj.forEach((p, i) => {
      if (!p?.visible || p.facing < 0.3) return;
      const d = Math.hypot(p.x + r.left - x, p.y + r.top - y);
      if (d < bd) { bd = d; best = this.nodes[i].id; }
    });
    if (!best && this.tileMeshes.length) {
      const ray = new THREE.Raycaster();
      ray.setFromCamera(this.ndc(x, y), this.camera);
      const hit = ray.intersectObjects(this.tileMeshes.filter((m) => m.visible && (m.material as THREE.MeshBasicMaterial).opacity > 0.3))[0];
      if (hit) best = hit.object.userData.id as string;
    }
    return best;
  }

  pickCenter(): string | null {
    const r = this.canvas.getBoundingClientRect(), c = this.focusScreen;
    return this.nearestNode(c.x + r.left, c.y + r.top, 140);
  }

  private hover(e: PointerEvent): void { this.setHover(this.nearestNode(e.clientX, e.clientY), e.clientX, e.clientY); }
  private setHover(id: string | null, x: number, y: number): void {
    if (id !== this.hoverId) { this.hoverId = id; this.canvas.style.cursor = id ? 'pointer' : 'grab'; }
    this.cb.onHover?.(id, x, y);
  }
  private click(e: PointerEvent): void {
    const id = this.nearestNode(e.clientX, e.clientY, matchMedia('(pointer: coarse)').matches ? 30 : 22);
    if (id) this.cb.onSelect?.(id);
    else this.cb.onBackground?.();
  }

  // ───────────────────────────── medallions ─────────────────────────────
  private tileFor(i: number): Tile {
    const n = this.nodes[i];
    const have = this.tiles.get(n.id);
    if (have) return have;
    const words = this.previews[n.id];
    const color = this.world.regionMap.get(n.region)!.color;
    const meta = `${this.world.regionMap.get(n.region)!.name} · ${this.world.worldMap.get(n.world)!.he}`;
    const canvas = makeMedallion(n.title, meta, words || n.d, color, this.preset.tileSize);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(TILE, TILE), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    // the medallion leans back from the rung toward a camera looking down the steps
    const radial = radialAt(n.a);
    const up = new THREE.Vector3(0, 1, 0);
    const N = radial.clone().multiplyScalar(Math.cos(TILT)).addScaledVector(up, Math.sin(TILT));
    const Y = up.clone().multiplyScalar(Math.cos(TILT)).addScaledVector(radial, -Math.sin(TILT));
    const X = new THREE.Vector3().crossVectors(Y, N);
    mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, N));
    mesh.position.copy(this.nodePos[i]).addScaledVector(Y, -(TILE * 0.5 + 0.012)).addScaledVector(N, 0.004);
    mesh.renderOrder = 1;
    mesh.userData = { id: n.id };
    this.ladder.add(mesh);
    const t = { mesh, tex, last: performance.now() };
    this.tiles.set(n.id, t);
    if (this.tiles.size > this.preset.maxTiles) {
      const oldest = [...this.tiles.entries()].sort((a, b) => a[1].last - b[1].last).slice(0, this.tiles.size - this.preset.maxTiles);
      for (const [id, tt] of oldest) { this.disposeTile(tt); this.tiles.delete(id); }
    }
    this.tileMeshes = [...this.tiles.values()].map((x) => x.mesh);
    return t;
  }

  private disposeTile(t: Tile): void {
    this.ladder.remove(t.mesh);
    t.mesh.geometry.dispose();
    (t.mesh.material as THREE.Material).dispose();
    t.tex.dispose();
  }

  // ───────────────────────────── frame ─────────────────────────────
  resize(): void {
    const w = this.canvas.clientWidth || innerWidth, h = this.canvas.clientHeight || innerHeight;
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.pipeline?.setSize(w, h);
    const pr = this.renderer.getPixelRatio();
    const res = new THREE.Vector2(w * pr, h * pr);
    this.ladder.traverse((o) => { const m = (o as Line2).material as LineMaterial | undefined; if (m && 'resolution' in m) m.resolution.copy(res); });
    if (this.nodeMat) this.nodeMat.uniforms.uPR.value = pr;
    if (this.angelMat) this.angelMat.uniforms.uPR.value = pr;
    if (this.motes) (this.motes.material as THREE.ShaderMaterial).uniforms.uPR.value = pr;
    this.tree?.setPixelHeight(h * pr);
  }

  setReduceMotion(v: boolean): void {
    this.reduceMotion = v;
    if (this.nodeMat) this.nodeMat.uniforms.uMotion.value = v ? 0 : 1;
    if (v) this.vel.az = this.vel.y = 0;
  }

  private frame(): void {
    if (document.hidden) return;
    this.timer.update();
    const dt = Math.min(0.05, this.timer.getDelta());
    this.time += dt;
    this.trackFps(dt);
    if (!this.world) { this.pipeline.render(dt); return; }
    this.updateCamera();
    const t = this.reduceMotion ? 0 : this.time;
    const d = this.view.d;
    this.nodeMat.uniforms.uTime.value = this.time;
    this.pillarMat.uniforms.uTime.value = t;
    if (this.motes) (this.motes.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
    this.beamMat.uniforms.uTime.value = t;
    const beamTarget = this.beam.visible ? 0.75 * smoothstep(0.5, 1.4, d) + 0.15 : 0; // the medallion takes over close up
    this.beamMat.uniforms.uOp.value += (beamTarget - this.beamMat.uniforms.uOp.value) * 0.1;
    ((this.beam.children[1] as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = this.beamMat.uniforms.uOp.value;
    this.beam.scale.setScalar(THREE.MathUtils.clamp(d * 0.55, 0.25, 2.2));
    this.updateAngels(dt);
    this.heaven.children[0].scale.setScalar(3.6 + (this.reduceMotion ? 0 : Math.sin(this.time * 0.6) * 0.15));
    if (this.rays) this.rays.material.rotation = t * 0.02;
    // one wind for the meadow and the crown; still when motion is reduced
    NATURE.uTime.value = t;
    NATURE.uWind.value = this.reduceMotion ? 0 : 1;
    this.tree?.update(t, this.reduceMotion ? 0 : 1);
    // god rays through the crown: full in the overview, gone in the close-ups of the prayers
    this.pipeline.setRays(0.55 * smoothstep(1.6, 3.6, d));
    for (const m of this.railMats) m.opacity = 0.18 + 0.2 * smoothstep(0.6, 3, d);
    const ghost = 0.16 + 0.84 * smoothstep(0.75, 1.5, d);
    for (const m of this.metalMats) { m.opacity = ghost; m.depthWrite = ghost > 0.95; }

    if (this.routeMat) {
      if (!this.reduceMotion) this.routeMat.dashOffset = -this.time * 0.08 * this.speed;
      this.routeMat.opacity = 0.45 + 0.5 * smoothstep(0.25, 1.2, d);
    }
    if (this.comet && this.routePts.length > 1) {
      const total = this.routeCum[this.routeCum.length - 1];
      const dd = this.reduceMotion ? 0 : (this.time * this.speed * Math.max(0.08, total / 40)) % total;
      let i = 1;
      while (i < this.routeCum.length - 1 && this.routeCum[i] < dd) i++;
      const segLen = this.routeCum[i] - this.routeCum[i - 1] || 1;
      this.comet.position.copy(this.routePts[i - 1]).lerp(this.routePts[i], (dd - this.routeCum[i - 1]) / segLen);
      this.comet.visible = !this.reduceMotion;
      this.comet.scale.setScalar(THREE.MathUtils.clamp(d * 0.03, 0.012, 0.09));
    }

    this.updateLabels();
    this.updateTiles();
    this.pipeline.bloom.intensity = (this.route ? 0.6 : 0.8) + 0.25 * smoothstep(0.6, 3.0, d);
    this.pipeline.render(dt, this.reduceMotion);
    this.cb.onFrame?.(d);
  }

  private updateAngels(dt: number): void {
    const U = this.L.turns * 360;
    const pos = this.angelPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
    const alpha = this.angelPoints.geometry.getAttribute('alpha') as THREE.BufferAttribute;
    this.angels.forEach((a, i) => {
      if (!this.reduceMotion) a.u = (a.u + a.dir * a.speed * dt + U) % U;
      const p = cyl(a.u % 360, a.r, this.helixY(a.u) + 0.045);
      pos.setXYZ(i, p.x, p.y, p.z);
      const edge = Math.min(a.u, U - a.u) / 40;
      alpha.setX(i, this.reduceMotion ? 0 : Math.min(1, edge) * 0.9);
    });
    pos.needsUpdate = true;
    alpha.needsUpdate = true;
  }

  private trackFps(dt: number): void {
    if (!this.onSlow || dt <= 0) return;
    this.fpsSamples.push(dt);
    if (this.fpsSamples.length >= 120) {
      const avg = this.fpsSamples.reduce((a, b) => a + b, 0) / this.fpsSamples.length;
      this.fpsSamples = [];
      if (1 / avg < 28) this.onSlow();
    }
  }

  private project(v: THREE.Vector3, out: Partial<Proj> = {}): Proj {
    const p = v.clone().project(this.camera);
    out.x = (p.x * 0.5 + 0.5) * this.width;
    out.y = (-p.y * 0.5 + 0.5) * this.height;
    out.z = p.z;
    return out as Proj;
  }

  /** 1 on the side of the ladder facing the camera, 0 behind the pillar */
  private facing(p: THREE.Vector3): number {
    const cam = this.camera.position;
    const ch = Math.hypot(cam.x, cam.z) || 1, ph = Math.hypot(p.x, p.z) || 1;
    const dot = (cam.x * p.x + cam.z * p.z) / (ch * ph);
    const over = smoothstep(0.35, 1.2, (cam.y - p.y) / Math.max(0.5, ch)); // seen from above, the far side shows too
    return Math.max(smoothstep(-0.3, 0.15, dot), over * 0.6);
  }

  private place(el: HTMLElement, op: number, x: number, y: number): void {
    el.style.opacity = op < 0.01 ? '0' : op.toFixed(3);
    el.style.transform = op < 0.01 ? 'translate3d(-9999px,0,0)' : `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  }

  private updateLabels(): void {
    const d = this.view.d, W = this.width, H = this.height;
    const fc = this.focusScreen;
    const ease = this.reduceMotion ? 1 : 0.2;
    const cands: { i: number; p: Proj; vis: number; prio: number }[] = [];
    this.nodes.forEach((n, i) => {
      const pos = this.nodePos[i];
      const p = (this.proj[i] ||= { x: 0, y: 0, z: 0, visible: false, facing: 0 });
      this.project(pos, p);
      p.facing = this.facing(pos);
      p.visible = p.z < 1 && p.x > -50 && p.x < W + 50 && p.y > -50 && p.y < H + 50 && pos.distanceTo(this.camera.position) > this.camera.near * 2;
      if (!p.visible) return;
      const l = this.nodeLabels[i];
      const need = n.imp >= 3 ? 6.2 : n.imp === 2 ? 3.0 : 1.7;
      let vis = smoothstep(need + 0.4, need - 0.3, d);
      if (l.state >= 2) vis = Math.max(vis, smoothstep(5.5, 3.5, d));
      if (l.state >= 3) vis = 1;
      if (l.state === 1) vis *= 0.45;
      vis *= p.facing;
      const cd = Math.hypot(p.x - fc.x, p.y - fc.y) / Math.hypot(W / 2, H / 2);
      const prio = (l.state >= 3 ? 100 : 0) + (l.state === 2 ? 20 : 0) + n.imp * 5 - cd * 6 - (1 - p.facing) * 8 + (this.hoverId === n.id ? 50 : 0);
      if (vis > 0.02) cands.push({ i, p, vis, prio });
    });
    cands.sort((a, b) => b.prio - a.prio);
    const placed: { x0: number; x1: number; y0: number; y1: number }[] = [];
    const shown = new Map<number, number>();
    const scale = THREE.MathUtils.clamp(1.1 - d * 0.04, 0.85, 1.12);
    for (const c of cands) {
      const l = this.nodeLabels[c.i];
      const w = (l.w || 80) * scale, h = (l.h || 22) * scale;
      const box = { x0: c.p.x - w / 2 - 4, x1: c.p.x + w / 2 + 4, y0: c.p.y - h - 14, y1: c.p.y - 8 };
      if (c.prio < 90 && placed.some((b) => b.x0 < box.x1 && b.x1 > box.x0 && b.y0 < box.y1 && b.y1 > box.y0)) continue;
      placed.push(box);
      shown.set(c.i, c.vis);
    }
    this.nodeLabels.forEach((l, i) => {
      const target = shown.get(i) ?? 0;
      l.op += (target - l.op) * ease;
      if (l.op < 0.01) {
        if (l.shown) { l.el.style.opacity = '0'; l.el.style.transform = 'translate3d(-9999px,0,0)'; l.shown = false; }
        return;
      }
      l.shown = true;
      const p = this.proj[i];
      l.el.style.opacity = l.op.toFixed(3);
      l.el.style.transform = `translate3d(${(p.x - (l.w || 0) / 2).toFixed(1)}px, ${(p.y - (l.h || 0) - 10).toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
    });

    // region names on the bench, around the ladder's foot, like a compass rose
    for (const r of this.regionLabels) {
      const wp = cyl(r.a, 2.28, TABLE_Y + 0.03);
      const p = this.project(wp);
      const vis = !this.route ? this.facing(wp) * smoothstep(1.6, 3.2, d) : 0;
      r.op += (vis - r.op) * ease;
      this.place(r.el, r.op, p.x - r.w / 2, p.y - r.h / 2);
    }
    // the four worlds, as a scale beside the ladder (always on the camera's left)
    const side = this.view.az / D2R - 64;
    for (const w of this.worldLabels) {
      const wp = cyl(side, this.L.rOut + 0.42, w.y);
      const p = this.project(wp);
      const vis = smoothstep(0.9, 1.8, d) * (p.z < 1 ? 1 : 0);
      w.op += (vis - w.op) * ease;
      this.place(w.el, w.op, p.x - w.w / 2, p.y - w.h / 2);
    }
    for (const c of this.captions) {
      const p = this.project(c.pos);
      const vis = !this.route ? smoothstep(c.far, c.far + 1.5, d) : 0;
      c.op += (vis - c.op) * ease;
      this.place(c.el, c.op, p.x - c.w / 2, p.y - c.h / 2);
    }

    for (const b of this.badges) {
      const p = this.project(b.pos);
      const vis = this.facing(b.pos) * smoothstep(5.5, 2.4, d) * (p.z < 1 ? 1 : 0);
      this.place(b.el, vis, p.x + 4, p.y + 2);
    }

    // focus tag at the top of the light shaft
    const fid = this.beam.visible ? (this.beam.userData.id as string) : null;
    if (fid) {
      const i = this.nodeIndex.get(fid)!;
      const n = this.nodes[i];
      const top = this.nodePos[i].clone().add(new THREE.Vector3(0, 0.36 * this.beam.scale.x * 0.92, 0));
      const p = this.project(top);
      const occ = this.route && this.stopIndex >= 0 ? `${this.stopIndex + 1}/${this.route.stops.length}` : this.world.worldMap.get(n.world)!.he;
      const html = `בפוקוס <span class="v">${occ}</span>`;
      if (this.focusTag.dataset.html !== html) { this.focusTag.innerHTML = html; this.focusTag.dataset.html = html; }
      const vis = this.beamMat.uniforms.uOp.value * smoothstep(0.1, 0.3, d) * this.facing(this.nodePos[i]);
      this.focusTag.style.opacity = vis.toFixed(3);
      this.focusTag.style.transform = `translate3d(${(p.x - this.focusTag.offsetWidth / 2).toFixed(1)}px, ${(p.y - 26).toFixed(1)}px, 0)`;
    } else this.focusTag.style.opacity = '0';
  }

  private updateTiles(): void {
    const global = smoothstep(1.3, 0.75, this.view.d);
    const want = new Set<string>();
    if (global > 0.01) {
      const fc = this.focusScreen, W = this.width, H = this.height;
      const list: { i: number; d: number }[] = [];
      this.nodes.forEach((_, i) => {
        const p = this.proj[i];
        if (!p?.visible || p.facing < 0.5) return;
        const d = Math.hypot(p.x - fc.x, p.y - fc.y) / Math.hypot(W / 2, H / 2);
        if (d < 0.95) list.push({ i, d });
      });
      list.sort((a, b) => a.d - b.d);
      const cam = this.camera.position;
      for (const { i, d } of list.slice(0, this.preset.visibleTiles)) {
        want.add(this.nodes[i].id);
        const t = this.tileFor(i);
        t.last = performance.now();
        const dim = this.nodeLabels[i].state === 1 ? 0.35 : 1;
        const target = global * smoothstep(1.0, 0.55, d) * this.proj[i].facing * dim;
        const m = t.mesh.material as THREE.MeshBasicMaterial;
        m.opacity += (target - m.opacity) * (this.reduceMotion ? 1 : 0.12);
        t.mesh.visible = m.opacity > 0.01;
        t.mesh.renderOrder = 1 + Math.round(10 - Math.min(10, t.mesh.position.distanceTo(cam) * 4));
      }
    }
    for (const [id, t] of this.tiles) {
      if (want.has(id)) continue;
      const m = t.mesh.material as THREE.MeshBasicMaterial;
      m.opacity *= this.reduceMotion ? 0 : 0.85;
      t.mesh.visible = m.opacity > 0.01;
    }
  }
}

export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}
