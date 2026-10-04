// The tfila instrument: a lacquered globe of prayers in a graduated dial, on an optical breadboard.
// The globe turns inside its stand (the camera stays above the bench), so the instrument always
// reads as a physical object. Semantic zoom: region names → titles → prayer-word medallions.
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import type { PrayerNode, Route, World } from '../types';
import { llToVec, vecToLL, frameAt, slerpVec, arcPoints, angleBetween, smoothstep, easeInOutCubic } from './geo';
import { makeDustTexture, makeMedallion, makeBackdrop } from './textures';
import { createStudioEnvironment } from './environment';
import { createInstrument, createMotes, TABLE_Y } from './instrument';
import { Pipeline } from '../render/Pipeline';
import type { QualityPreset } from '../render/quality';

const REL_COLORS: Record<string, string> = { contains: '#ffd27a', adds: '#5dffa2', varies: '#c9a2ff', related: '#7fb2ff' };
export const MIN_ALT = 0.07, MAX_ALT = 6.2, HOME_ALT = 4.6;
const NODE_R = 1.004;

export interface WorldCallbacks {
  onSelect?: (id: string) => void;
  onHover?: (id: string | null, x: number, y: number) => void;
  onBackground?: () => void;
  onFrame?: (alt: number) => void;
  onKeyNav?: (id: string | null) => void;
}

interface Proj { x: number; y: number; z: number; visible: boolean; facing: number }
interface LabelRec { el: HTMLDivElement; w: number; h: number; op: number; shown: boolean; state: number }
interface Tile { mesh: THREE.Mesh; tex: THREE.CanvasTexture; last: number }
interface Flight { from: THREE.Vector3; to: THREE.Vector3; a0: number; a1: number; peak: number; t0: number; d: number; resolve: () => void }

export class PrayerWorld {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(38, 1, 0.003, 200);
  private pipeline!: Pipeline;
  private readonly timer = new THREE.Timer();
  private time = 0;

  private readonly globeGroup = new THREE.Group();
  private globeMat!: THREE.ShaderMaterial;
  private globe!: THREE.Mesh;
  private shell!: THREE.Mesh;
  private atmosphere!: THREE.Mesh;
  private motes: THREE.Points | null = null;
  private keyLight!: THREE.DirectionalLight;

  private world!: World;
  private nodes: PrayerNode[] = [];
  private nodeIndex = new Map<string, number>();
  private nodePos: THREE.Vector3[] = [];
  private nodeWorld: THREE.Vector3[] = [];
  private nodePoints!: THREE.Points;
  private nodeMat!: THREE.ShaderMaterial;
  private relLines: Line2[] = [];
  private relGroup = new THREE.Group();
  private nodeLabels: LabelRec[] = [];
  private regionLabels: { el: HTMLDivElement; pos: THREE.Vector3; w: number; h: number; op: number }[] = [];
  private badges: { el: HTMLDivElement; pos: THREE.Vector3; i: number }[] = [];
  private focusTag!: HTMLDivElement;
  private proj: Proj[] = [];

  private routeGroup: THREE.Group | null = null;
  private routeMat: LineMaterial | null = null;
  private comet: THREE.Sprite | null = null;
  private routePts: THREE.Vector3[] = [];
  private routeCum: number[] = [];
  private beam!: THREE.Group;
  private beamMat!: THREE.ShaderMaterial;

  private tiles = new Map<string, Tile>();
  private tileMeshes: THREE.Mesh[] = [];
  private previews: Record<string, string> = {};

  // camera rig
  focus = llToVec(16, 20);
  alt = HOME_ALT + 1.4;
  private vel = { x: 0, y: 0 };
  private flight: Flight | null = null;
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
    this.scene.background = makeBackdrop();
    this.scene.environment = createStudioEnvironment(this.renderer);
    this.scene.add(this.globeGroup);

    this.buildLights();
    this.buildGlobe();
    this.scene.add(createInstrument());
    this.applyQuality(preset);
    this.bindInput();
    this.resize();
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.renderer.setAnimationLoop(() => this.frame());
  }

  // ───────────────────────────── construction ─────────────────────────────
  private buildLights(): void {
    const key = new THREE.DirectionalLight('#fff3e2', 2.4);
    key.position.set(-3.5, 6.5, 4.5);
    key.castShadow = true;
    key.shadow.camera.left = key.shadow.camera.bottom = -3;
    key.shadow.camera.right = key.shadow.camera.top = 3;
    key.shadow.camera.near = 2;
    key.shadow.camera.far = 16;
    key.shadow.bias = -0.0003;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 5;
    this.keyLight = key;
    const rim = new THREE.DirectionalLight('#9fc4ff', 1.1);
    rim.position.set(2, 3, -6);
    this.scene.add(key, rim, new THREE.HemisphereLight('#2a3446', '#050608', 0.35));
  }

  private buildGlobe(): void {
    this.globeMat = new THREE.ShaderMaterial({
      uniforms: {
        uDust: { value: null }, uHasDust: { value: 0 }, uDustK: { value: 1 },
        uLight: { value: new THREE.Vector3(-0.45, 0.65, 0.6).normalize() },
        uCam: { value: new THREE.Vector3() },
      },
      vertexShader: /* glsl */ `
        varying vec3 vNw; varying vec2 vUv; varying vec3 vW;
        void main(){ vNw = normalize(mat3(modelMatrix) * normal); vUv = uv; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz;
          gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uDust; uniform float uHasDust; uniform float uDustK; uniform vec3 uLight; uniform vec3 uCam;
        varying vec3 vNw; varying vec2 vUv; varying vec3 vW;
        float gridLine(float x, float w){ float f = abs(fract(x)-0.5); return smoothstep(w, 0.0, 0.5-f); }
        void main(){
          vec3 n = normalize(vNw);
          vec3 v = normalize(uCam - vW);
          float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
          float lit = 0.5 + 0.5*dot(n, uLight);
          vec3 base = mix(vec3(0.0025,0.0032,0.006), vec3(0.011,0.015,0.026), lit*lit);
          float lat = vUv.y*180.0, lon = vUv.x*360.0;
          float g = max(gridLine(lat/15.0, 0.010), gridLine(lon/15.0, 0.008*max(0.25, sin(vUv.y*3.14159))));
          base += vec3(0.45,0.75,0.9)*g*0.05;
          vec4 dust = uHasDust > 0.5 ? texture2D(uDust, vUv) : vec4(0.);
          base += dust.rgb * dust.a * (0.85 + 0.35*lit) * uDustK * 1.1;
          base += vec3(0.37,0.88,1.0) * fres * 0.14;
          gl_FragColor = vec4(base, 1.0);
        }`,
    });
    this.globe = new THREE.Mesh(new THREE.SphereGeometry(1, 160, 120), this.globeMat);
    this.globe.castShadow = true;
    this.globeGroup.add(this.globe);

    // lacquer: specular-only clearcoat shell (additive), so the studio lights glint on the globe
    this.shell = new THREE.Mesh(
      new THREE.SphereGeometry(1.0018, 128, 96),
      new THREE.MeshPhysicalMaterial({ color: '#000', roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 0.16, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    this.shell.renderOrder = 6;
    this.scene.add(this.shell);

    this.atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.09, 96, 64),
      new THREE.ShaderMaterial({
        uniforms: { uCam: { value: new THREE.Vector3() } },
        vertexShader: /* glsl */ `varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(normal); vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
        fragmentShader: /* glsl */ `uniform vec3 uCam; varying vec3 vN; varying vec3 vW;
          void main(){ float d = dot(normalize(vN), normalize(uCam - vW)); float a = pow(clamp(-d*2.4, 0.0, 1.0), 2.6) * 0.2;
            gl_FragColor = vec4(vec3(0.37,0.85,1.0)*a, a); }`,
        side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }),
    );
    this.scene.add(this.atmosphere);

    // focus beam: the "plane of focus" of this instrument — a light shaft rising from the selected prayer
    this.beamMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOp: { value: 0 } },
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: /* glsl */ `varying vec2 vUv; uniform float uTime; uniform float uOp;
        void main(){ float a = (1.0 - vUv.y) * (1.0 - vUv.y) * uOp; float s = 0.75 + 0.25*sin(vUv.y*40.0 - uTime*3.0);
          gl_FragColor = vec4(vec3(0.62,0.94,1.0)*a*s*1.6, a*s); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.42, 12, 1, true).translate(0, 0.21, 0), this.beamMat);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.017, 0.0205, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#9ff0ff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.beam = new THREE.Group();
    this.beam.add(shaft, ring);
    this.beam.visible = false;
    this.globeGroup.add(this.beam);
  }

  applyQuality(p: QualityPreset): void {
    const first = !this.preset;
    this.preset = p;
    this.renderer.setPixelRatio(p.dpr);
    this.keyLight.castShadow = p.shadows;
    this.keyLight.shadow.mapSize.set(p.shadowSize, p.shadowSize);
    this.keyLight.shadow.map?.dispose();
    (this.keyLight.shadow as unknown as { map: THREE.WebGLRenderTarget | null }).map = null;
    this.shell.visible = p.shell;
    if (this.motes) { this.scene.remove(this.motes); this.motes.geometry.dispose(); }
    this.motes = createMotes(p.motes);
    this.scene.add(this.motes);
    if (first) this.pipeline = new Pipeline(this.renderer, this.scene, this.camera, p.msaa, p.bloomLevels);
    else this.pipeline.setMultisampling(p.msaa);
    if (!first && this.world) {
      for (const t of this.tiles.values()) this.disposeTile(t);
      this.tiles.clear();
      this.setPreviews(this.previews);
    }
    this.resize();
  }

  // ───────────────────────────── world data ─────────────────────────────
  setWorld(world: World): void {
    this.world = world;
    this.nodes = world.nodes;
    this.nodeIndex = new Map(this.nodes.map((n, i) => [n.id, i]));
    this.nodePos = this.nodes.map((n) => llToVec(n.lat, n.lon, NODE_R));
    this.nodeWorld = this.nodePos.map((p) => p.clone());
    this.buildNodes();
    this.buildRelations();
    this.buildLabels();
  }

  private buildNodes(): void {
    const N = this.nodes.length;
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), st = new Float32Array(N);
    this.nodes.forEach((n, i) => {
      pos.set(this.nodePos[i].toArray(), i * 3);
      const c = new THREE.Color(this.world.regionMap.get(n.region)!.color);
      col.set([c.r, c.g, c.b], i * 3);
      size[i] = 6 + n.imp * 3;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('size', new THREE.BufferAttribute(size, 1));
    g.setAttribute('state', new THREE.BufferAttribute(st, 1));
    this.nodeMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPR: { value: 1 }, uAlt: { value: 1 }, uMotion: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute vec3 color; attribute float size; attribute float state;
        uniform float uTime; uniform float uPR; uniform float uAlt; uniform float uMotion;
        varying vec3 vC; varying float vS; varying float vPulse;
        void main(){
          vec4 mv = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mv;
          float s = size * clamp(1.6/(uAlt+0.35), 0.8, 2.8);
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
    this.globeGroup.add(this.nodePoints);
  }

  private lineMat(color: string, width: number, o: { opacity?: number; dashed?: boolean; dashSize?: number; gapSize?: number } = {}): LineMaterial {
    const m = new LineMaterial({
      color: new THREE.Color(color), linewidth: width, transparent: true, opacity: o.opacity ?? 0.8,
      dashed: !!o.dashed, dashSize: o.dashSize ?? 0.02, gapSize: o.gapSize ?? 0.01, depthWrite: false, worldUnits: false,
    });
    m.blending = THREE.AdditiveBlending;
    m.resolution.set(this.width * this.renderer.getPixelRatio(), this.height * this.renderer.getPixelRatio());
    return m;
  }

  private buildRelations(): void {
    this.relGroup.clear();
    this.relLines = [];
    for (const n of this.nodes) {
      for (const r of n.rel) {
        const ti = this.nodeIndex.get(r.target);
        if (ti == null) continue;
        const pts = arcPoints(this.nodePos[this.nodeIndex.get(n.id)!], this.nodePos[ti], { segments: 64 });
        const geo = new LineGeometry();
        geo.setPositions(pts.flatMap((p) => [p.x, p.y, p.z]));
        const dashed = r.type === 'adds' || r.type === 'varies';
        const mat = this.lineMat(REL_COLORS[r.type], 1.5, { dashed, dashSize: r.type === 'adds' ? 0.012 : 0.004, gapSize: r.type === 'adds' ? 0.008 : 0.007, opacity: 0.2 });
        const line = new Line2(geo, mat);
        line.computeLineDistances();
        line.renderOrder = 2;
        line.userData = { from: n.id, to: r.target };
        this.relGroup.add(line);
        this.relLines.push(line);
      }
    }
    this.globeGroup.add(this.relGroup);
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
      const members = this.nodes.filter((n) => n.region === r.id);
      el.innerHTML = `<span class="dot" style="color:${r.color}"></span>${r.name}<span class="v">${members.length}</span>`;
      this.labelsEl.appendChild(el);
      const maxLat = Math.max(...members.map((n) => n.lat));
      return { el, pos: llToVec(Math.min(maxLat + 4, 84), r.lon, 1.01), w: 0, h: 0, op: 0 };
    });
    this.focusTag = document.createElement('div');
    this.focusTag.className = 'label plane';
    this.labelsEl.appendChild(this.focusTag);
    requestAnimationFrame(() => this.measureLabels());
  }

  measureLabels(): void {
    for (const l of this.nodeLabels) { l.w = l.el.offsetWidth; l.h = l.el.offsetHeight; }
    for (const r of this.regionLabels) { r.w = r.el.offsetWidth; r.h = r.el.offsetHeight; }
  }

  setPreviews(previews: Record<string, string>): void {
    this.previews = previews;
    const old = this.globeMat.uniforms.uDust.value as THREE.Texture | null;
    this.globeMat.uniforms.uDust.value = makeDustTexture(this.world, previews, this.preset.dustWidth);
    this.globeMat.uniforms.uHasDust.value = 1;
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
      this.globeGroup.remove(this.routeGroup);
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
    const node = this.nodes[this.nodeIndex.get(s.n)!];
    if (s.occTotal <= 1) return llToVec(node.lat, node.lon, NODE_R);
    const { north, east, up } = frameAt(node.lat, node.lon);
    const ang = ((s.occ - 1) / s.occTotal) * Math.PI * 2 - Math.PI / 2;
    return up.clone().addScaledVector(east, Math.cos(ang) * 0.016).addScaledVector(north, Math.sin(ang) * 0.016).normalize().multiplyScalar(NODE_R);
  }

  private buildRoute(route: Route, nusach: string): void {
    const g = new THREE.Group();
    const stopPts = route.stops.map((_, i) => this.stopPoint(i));
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < stopPts.length - 1; i++) {
      const a = stopPts[i], b = stopPts[i + 1];
      const ang = angleBetween(a, b);
      const lift = Math.min(0.075, 0.008 + ang * 0.06) * (1 + (i % 3) * 0.25);
      const seg = ang < 1e-4 ? [a.clone(), b.clone()] : arcPoints(a, b, { segments: 56, lift, base: NODE_R });
      if (pts.length) seg.shift();
      pts.push(...seg);
    }
    this.routePts = pts;
    if (pts.length >= 2) {
      const flat = pts.flatMap((p) => [p.x, p.y, p.z]);
      const under = new LineGeometry();
      under.setPositions(flat);
      const glow = new Line2(under, this.lineMat('#5fe0ff', 5, { opacity: 0.07 }));
      glow.computeLineDistances();
      const over = new LineGeometry();
      over.setPositions(flat);
      this.routeMat = this.lineMat('#c9f6ff', 2, { dashed: true, dashSize: 0.022, gapSize: 0.014, opacity: 0.9 });
      const line = new Line2(over, this.routeMat);
      line.computeLineDistances();
      glow.renderOrder = line.renderOrder = 4;
      g.add(glow, line);

      const cc = document.createElement('canvas');
      cc.width = cc.height = 64;
      const x = cc.getContext('2d')!;
      const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.25, 'rgba(160,240,255,0.85)');
      gr.addColorStop(1, 'rgba(95,224,255,0)');
      x.fillStyle = gr;
      x.fillRect(0, 0, 64, 64);
      this.comet = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      this.comet.renderOrder = 5;
      g.add(this.comet);
      this.routeCum = [0];
      for (let i = 1; i < pts.length; i++) this.routeCum.push(this.routeCum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    }
    this.routeGroup = g;
    this.globeGroup.add(g);

    route.stops.forEach((s, i) => {
      const el = document.createElement('div');
      const off = s.omit || (!!s.only && !s.only.includes(nusach as never));
      el.className = 'badge' + (s.omit ? ' omit' : off ? ' off' : '');
      el.textContent = String(i + 1);
      this.labelsEl.appendChild(el);
      this.badges.push({ el, pos: stopPts[i].clone().multiplyScalar(1.002), i });
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
      let op = this.relView ? 0.2 : 0;
      if (this.route) op = this.relView && onRoute.has(from) && onRoute.has(to) ? 0.7 : 0;
      const focusId = cur || this.selectedId;
      if (focusId && (from === focusId || to === focusId)) op = 0.95;
      (line.material as LineMaterial).opacity = op;
      line.visible = op > 0;
    }
    // focus beam on the selected prayer
    const fid = cur || this.selectedId;
    if (fid) {
      const n = this.nodes[this.nodeIndex.get(fid)!];
      const { up } = frameAt(n.lat, n.lon);
      this.beam.position.copy(up.clone().multiplyScalar(1.001));
      this.beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
      this.beam.visible = true;
      this.beam.userData.id = fid;
    } else this.beam.visible = false;
  }

  // ───────────────────────────── camera ─────────────────────────────
  get focusLL(): { lat: number; lon: number } { return vecToLL(this.focus); }

  flyTo(lat: number, lon: number, alt = 0.32, opts: { duration?: number } = {}): Promise<void> {
    const to = llToVec(lat, lon);
    const from = this.focus.clone();
    const ang = angleBetween(from, to);
    const a0 = this.alt, a1 = THREE.MathUtils.clamp(alt, MIN_ALT, MAX_ALT);
    this.flight?.resolve();
    if (this.reduceMotion) {
      this.focus.copy(to);
      this.alt = a1;
      this.flight = null;
      return Promise.resolve();
    }
    const d = opts.duration ?? THREE.MathUtils.clamp(900 + ang * 900 + Math.abs(Math.log(a1 / a0)) * 300, 900, 2600);
    const peak = Math.max(a0, a1, Math.min(2.2, ang * 1.15));
    return new Promise((resolve) => {
      this.flight = { from, to, a0, a1, peak, t0: performance.now(), d, resolve };
      this.vel.x = this.vel.y = 0;
    });
  }

  flyToNode(id: string, alt = 0.3): Promise<void> {
    const n = this.nodes[this.nodeIndex.get(id)!];
    if (!n) return Promise.resolve();
    return this.flyTo(n.lat - Math.min(1.6, alt * 3.2), n.lon, alt);
  }

  overview(): Promise<void> {
    if (this.route) {
      const vs = this.route.stops.map((s) => this.nodePos[this.nodeIndex.get(s.n)!]);
      const c = vs.reduce((acc, v) => acc.add(v), new THREE.Vector3()).normalize();
      const spread = Math.max(...vs.map((v) => angleBetween(v, c)));
      const ll = vecToLL(c);
      return this.flyTo(ll.lat, ll.lon, THREE.MathUtils.clamp(0.75 + spread * 1.9, 0.9, HOME_ALT));
    }
    const ll = this.focusLL;
    return this.flyTo(ll.lat, ll.lon, HOME_ALT);
  }

  zoomBy(f: number): void {
    this.alt = THREE.MathUtils.clamp(this.alt * f, MIN_ALT, MAX_ALT);
    this.flight = null;
    this.touch();
  }

  pan(dxDeg: number, dyDeg: number): void {
    const { lat, lon } = this.focusLL;
    this.focus = llToVec(THREE.MathUtils.clamp(lat + dyDeg, -82, 82), lon + dxDeg);
    this.flight = null;
    this.touch();
  }

  setInsets(i: Partial<typeof this.insets>): void { this.insets = { left: 0, right: 0, top: 0, bottom: 0, ...i }; }
  get focusScreen(): { x: number; y: number } { return { x: this.width / 2 - this.viewOff.x, y: this.height / 2 - this.viewOff.y }; }
  private touch(): void { this.lastInteraction = performance.now(); }

  private updateCamera(): void {
    const f = this.flight;
    if (f) {
      const t = Math.min(1, (performance.now() - f.t0) / f.d);
      const e = easeInOutCubic(t);
      slerpVec(f.from, f.to, e, this.focus);
      const u = 1 - e;
      this.alt = u * u * f.a0 + 2 * u * e * f.peak + e * e * f.a1;
      if (t >= 1) { this.flight = null; f.resolve(); }
    } else if (Math.abs(this.vel.x) + Math.abs(this.vel.y) > 1e-4) {
      this.pan(this.vel.x, this.vel.y);
      this.vel.x *= 0.92;
      this.vel.y *= 0.92;
    } else if (!this.reduceMotion && !this.route && !this.selectedId && !this.dragging && performance.now() - this.lastInteraction > 9000 && this.alt > 1.8) {
      const { lat, lon } = this.focusLL;
      this.focus = llToVec(lat, lon - 0.02);
    }

    // turn the globe so the focus point faces the camera, north up — the stand stays put
    const elev = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(10, 24, smoothstep(1.2, 4.2, this.alt)));
    const U0 = new THREE.Vector3(0, Math.sin(elev), Math.cos(elev));
    const N0 = new THREE.Vector3(0, 1, 0).addScaledVector(U0, -U0.y).normalize();
    const E0 = new THREE.Vector3().crossVectors(N0, U0);
    const { lat, lon } = this.focusLL;
    const fr = frameAt(lat, lon);
    const B0 = new THREE.Matrix4().makeBasis(E0, N0, U0);
    const Bf = new THREE.Matrix4().makeBasis(fr.east, fr.north, fr.up);
    const M = B0.multiply(Bf.transpose());
    this.globeGroup.quaternion.setFromRotationMatrix(M);
    this.globeGroup.updateMatrixWorld(true);

    const tilt = THREE.MathUtils.degToRad(30 * smoothstep(1.4, 0.5, this.alt) * (0.35 + 0.65 * smoothstep(0.07, 0.4, this.alt)));
    const cam = U0.clone().addScaledVector(U0, this.alt * Math.cos(tilt)).addScaledVector(N0, -this.alt * Math.sin(tilt));
    // never dip under the bench
    cam.y = Math.max(cam.y, TABLE_Y + 0.25);
    this.camera.position.copy(cam);
    this.camera.up.copy(N0.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(U0, Math.sin(tilt)).normalize());
    // at a distance, aim between the globe and its stand so the whole instrument is framed
    const look = U0.clone().multiplyScalar(1 - smoothstep(1.8, 4.6, this.alt)).add(new THREE.Vector3(0, -0.35 * smoothstep(2.2, 4.6, this.alt), 0));
    this.camera.lookAt(look);
    this.camera.near = Math.max(0.002, this.alt * 0.05);

    const k = this.reduceMotion ? 1 : 0.12;
    this.viewOff.x += ((this.insets.right - this.insets.left) / 2 - this.viewOff.x) * k;
    this.viewOff.y += ((this.insets.bottom - this.insets.top) / 2 - this.viewOff.y) * k;
    if (Math.abs(this.viewOff.x) + Math.abs(this.viewOff.y) > 0.5) this.camera.setViewOffset(this.width, this.height, this.viewOff.x, this.viewOff.y, this.width, this.height);
    else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();

    const camPos = this.camera.position;
    (this.globeMat.uniforms.uCam.value as THREE.Vector3).copy(camPos);
    ((this.atmosphere.material as THREE.ShaderMaterial).uniforms.uCam.value as THREE.Vector3).copy(camPos);
    this.globeMat.uniforms.uDustK.value = 0.1 + 0.9 * smoothstep(0.15, 1.0, this.alt);
    // the lacquer glint belongs to the distant product shot; it would wash out close-up reading
    const shellK = 0.45 * smoothstep(3.0, 4.6, this.alt);
    (this.shell.material as THREE.MeshPhysicalMaterial).opacity = shellK;
    this.shell.visible = this.preset.shell && shellK > 0.01;
    this.nodeMat.uniforms.uAlt.value = this.alt;
    for (let i = 0; i < this.nodePos.length; i++) this.nodeWorld[i].copy(this.nodePos[i]).applyQuaternion(this.globeGroup.quaternion);
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
      this.flight = null;
      this.vel.x = this.vel.y = 0;
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
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchD > 0) this.zoomBy(pinchD / d);
        pinchD = d;
        moved += 10;
        return;
      }
      const dx = cur.x - prev.x, dy = cur.y - prev.y;
      moved += Math.abs(dx) + Math.abs(dy);
      const k = this.degPerPx();
      const lonScale = 1 / Math.max(0.2, Math.cos(THREE.MathUtils.degToRad(this.focusLL.lat)));
      this.pan(-dx * k * lonScale, dy * k);
      const now = performance.now();
      const dt = Math.max(8, now - lastMove);
      lastMove = now;
      this.vel.x = -dx * k * lonScale * (16 / dt);
      this.vel.y = dy * k * (16 / dt);
    });
    const end = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchD = 0;
      if (pointers.size === 0) {
        this.dragging = false;
        if (performance.now() - lastMove > 80 || this.reduceMotion) this.vel.x = this.vel.y = 0;
        if (moved < 6 && downAt) this.click(e);
      }
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('pointerleave', () => { if (!this.dragging) this.setHover(null, 0, 0); });
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      const f = Math.exp(e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0016));
      const before = this.alt;
      this.zoomBy(f);
      if (f < 1) {
        const hit = this.surfaceAt(e.clientX, e.clientY);
        if (hit) slerpVec(this.focus.clone(), hit, (1 - this.alt / before) * 0.9, this.focus);
      }
    }, { passive: false });
    c.addEventListener('keydown', (e) => {
      const k = this.degPerPx() * 60;
      const pick = () => { const id = this.pickCenter(); if (id) this.cb.onSelect?.(id); };
      const map: Record<string, () => void> = {
        ArrowLeft: () => this.pan(-k, 0), ArrowRight: () => this.pan(k, 0), ArrowUp: () => this.pan(0, k), ArrowDown: () => this.pan(0, -k),
        '+': () => this.zoomBy(0.8), '=': () => this.zoomBy(0.8), '-': () => this.zoomBy(1.25), _: () => this.zoomBy(1.25),
        PageUp: () => this.zoomBy(0.8), PageDown: () => this.zoomBy(1.25), Enter: pick, ' ': pick,
      };
      if (map[e.key]) {
        e.preventDefault();
        map[e.key]();
        this.cb.onKeyNav?.(this.pickCenter());
      }
    });
  }

  private degPerPx(): number {
    const span = 2 * this.alt * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    return Math.min(0.4, (span / (this.height || 800)) * (180 / Math.PI));
  }

  private ndc(x: number, y: number): THREE.Vector2 {
    const r = this.canvas.getBoundingClientRect();
    return new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
  }

  /** Surface point under the cursor, in the globe's own frame. */
  private surfaceAt(x: number, y: number): THREE.Vector3 | null {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(this.ndc(x, y), this.camera);
    const hit = ray.intersectObject(this.globe)[0];
    return hit ? hit.point.clone().applyQuaternion(this.globeGroup.quaternion.clone().invert()).normalize() : null;
  }

  private nearestNode(x: number, y: number, maxPx = 22): string | null {
    const r = this.canvas.getBoundingClientRect();
    let best: string | null = null, bd = maxPx;
    this.proj.forEach((p, i) => {
      if (!p?.visible) return;
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
    const region = this.world.regionMap.get(n.region)!.name;
    const canvas = makeMedallion(n.title, region, words || n.d, color, this.preset.tileSize);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    const size = 0.078;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    const { up, north, east } = frameAt(n.lat, n.lon);
    mesh.position.copy(up.clone().multiplyScalar(1.0025).addScaledVector(north, -size * 0.5 - 0.004));
    mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(east, north, up));
    mesh.renderOrder = 1;
    mesh.userData = { id: n.id };
    this.globeGroup.add(mesh);
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
    this.globeGroup.remove(t.mesh);
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
    this.relLines.forEach((l) => (l.material as LineMaterial).resolution.copy(res));
    this.routeGroup?.traverse((o) => { const m = (o as Line2).material as LineMaterial | undefined; m?.resolution?.copy(res); });
    if (this.nodeMat) this.nodeMat.uniforms.uPR.value = pr;
    if (this.motes) (this.motes.material as THREE.ShaderMaterial).uniforms.uPR.value = pr;
  }

  setReduceMotion(v: boolean): void {
    this.reduceMotion = v;
    if (this.nodeMat) this.nodeMat.uniforms.uMotion.value = v ? 0 : 1;
    if (v) this.vel.x = this.vel.y = 0;
  }

  private frame(): void {
    if (document.hidden) return;
    this.timer.update();
    const dt = Math.min(0.05, this.timer.getDelta());
    this.time += dt;
    this.trackFps(dt);
    this.updateCamera();
    const t = this.reduceMotion ? 0 : this.time;
    if (this.nodeMat) this.nodeMat.uniforms.uTime.value = this.time;
    if (this.motes) (this.motes.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
    this.beamMat.uniforms.uTime.value = t;
    const beamTarget = this.beam.visible ? 0.55 + 0.45 * smoothstep(1.6, 0.4, this.alt) : 0;
    this.beamMat.uniforms.uOp.value += (beamTarget - this.beamMat.uniforms.uOp.value) * 0.1;
    ((this.beam.children[1] as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = this.beamMat.uniforms.uOp.value;
    this.beam.scale.setScalar(THREE.MathUtils.clamp(this.alt * 1.4, 0.35, 2.2));

    if (this.routeMat) {
      if (!this.reduceMotion) this.routeMat.dashOffset = -this.time * 0.06;
      this.routeMat.opacity = 0.3 + 0.6 * smoothstep(0.2, 0.85, this.alt);
    }
    if (this.comet && this.routePts.length > 1) {
      const total = this.routeCum[this.routeCum.length - 1];
      const d = this.reduceMotion ? 0 : (this.time * Math.max(0.06, total / 22)) % total;
      let i = 1;
      while (i < this.routeCum.length - 1 && this.routeCum[i] < d) i++;
      const segLen = this.routeCum[i] - this.routeCum[i - 1] || 1;
      this.comet.position.copy(this.routePts[i - 1]).lerp(this.routePts[i], (d - this.routeCum[i - 1]) / segLen);
      this.comet.visible = !this.reduceMotion;
      this.comet.scale.setScalar(THREE.MathUtils.clamp(this.alt * 0.035, 0.008, 0.05));
    }

    if (this.nodes.length) {
      this.updateLabels();
      this.updateTiles();
    }
    this.pipeline.bloom.intensity = (this.route ? 0.6 : 0.85) + 0.3 * smoothstep(0.4, 2.0, this.alt);
    this.pipeline.render(dt);
    this.cb.onFrame?.(this.alt);
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

  private updateLabels(): void {
    const cam = this.camera.position;
    const alt = this.alt, W = this.width, H = this.height;
    const fc = this.focusScreen;
    const cands: { i: number; p: Proj; vis: number; prio: number; scale?: number }[] = [];
    this.nodes.forEach((n, i) => {
      const pos = this.nodeWorld[i];
      const facing = pos.dot(cam) - 1;
      const p = (this.proj[i] ||= { x: 0, y: 0, z: 0, visible: false, facing: 0 });
      this.project(pos, p);
      p.visible = facing > 0 && p.z < 1 && p.x > -50 && p.x < W + 50 && p.y > -50 && p.y < H + 50;
      p.facing = smoothstep(0, 0.06 * Math.max(0.4, alt), facing);
      if (!p.visible) return;
      const l = this.nodeLabels[i];
      const need = n.imp >= 3 ? 3.4 : n.imp === 2 ? 1.45 : 0.85;
      let vis = smoothstep(need + 0.25, need - 0.15, alt);
      if (l.state >= 2) vis = Math.max(vis, smoothstep(2.8, 1.6, alt));
      if (l.state >= 3) vis = 1;
      if (l.state === 1) vis *= 0.45;
      const cd = Math.hypot(p.x - fc.x, p.y - fc.y) / Math.hypot(W / 2, H / 2);
      const prio = (l.state >= 3 ? 100 : 0) + (l.state === 2 ? 20 : 0) + n.imp * 5 - cd * 6 + (this.hoverId === n.id ? 50 : 0);
      if (vis * p.facing > 0.02) cands.push({ i, p, vis: vis * p.facing, prio });
    });
    cands.sort((a, b) => b.prio - a.prio);
    const placed: { x0: number; x1: number; y0: number; y1: number }[] = [];
    const shown = new Set<number>();
    const scale = THREE.MathUtils.clamp(1.12 - alt * 0.1, 0.85, 1.15);
    for (const c of cands) {
      const l = this.nodeLabels[c.i];
      const w = (l.w || 80) * scale, h = (l.h || 22) * scale;
      const box = { x0: c.p.x - w / 2 - 4, x1: c.p.x + w / 2 + 4, y0: c.p.y - h - 14, y1: c.p.y - 8 };
      if (c.prio < 90 && placed.some((b) => b.x0 < box.x1 && b.x1 > box.x0 && b.y0 < box.y1 && b.y1 > box.y0)) continue;
      placed.push(box);
      shown.add(c.i);
      c.scale = scale;
    }
    const cmap = new Map(cands.map((c) => [c.i, c]));
    this.nodeLabels.forEach((l, i) => {
      const c = cmap.get(i);
      const target = c && shown.has(i) ? c.vis : 0;
      l.op += (target - l.op) * (this.reduceMotion ? 1 : 0.2);
      if (l.op < 0.01) {
        if (l.shown) { l.el.style.opacity = '0'; l.el.style.transform = 'translate3d(-9999px,0,0)'; l.shown = false; }
        return;
      }
      l.shown = true;
      const p = this.proj[i];
      l.el.style.opacity = l.op.toFixed(3);
      l.el.style.transform = `translate3d(${(p.x - (l.w || 0) / 2).toFixed(1)}px, ${(p.y - (l.h || 0) - 10).toFixed(1)}px, 0) scale(${(c?.scale || 1).toFixed(3)})`;
    });

    for (const r of this.regionLabels) {
      const wp = r.pos.clone().applyQuaternion(this.globeGroup.quaternion);
      const facing = wp.dot(cam) - 1.01;
      const p = this.project(wp);
      const vis = facing > 0 && !this.route ? smoothstep(0, 0.25, facing) * smoothstep(0.55, 1.25, alt) : 0;
      r.op += (vis - r.op) * (this.reduceMotion ? 1 : 0.15);
      r.el.style.opacity = r.op < 0.01 ? '0' : r.op.toFixed(3);
      r.el.style.transform = r.op < 0.01 ? 'translate3d(-9999px,0,0)' : `translate3d(${(p.x - r.w / 2).toFixed(1)}px, ${(p.y - r.h / 2).toFixed(1)}px, 0)`;
    }

    for (const b of this.badges) {
      const wp = b.pos.clone().applyQuaternion(this.globeGroup.quaternion);
      const facing = wp.dot(cam) - 1;
      const p = this.project(wp);
      const vis = facing > 0 ? smoothstep(0, 0.04, facing) * smoothstep(3.2, 1.2, alt) : 0;
      b.el.style.opacity = vis.toFixed(3);
      b.el.style.transform = vis > 0.01 ? `translate3d(${(p.x + 4).toFixed(1)}px, ${(p.y + 2).toFixed(1)}px, 0)` : 'translate3d(-9999px,0,0)';
    }

    // focus tag at the top of the light shaft
    const fid = this.beam.visible ? (this.beam.userData.id as string) : null;
    if (fid) {
      const i = this.nodeIndex.get(fid)!;
      const n = this.nodes[i];
      const top = this.nodePos[i].clone().normalize().multiplyScalar(1.004 + 0.42 * this.beam.scale.x * 0.92).applyQuaternion(this.globeGroup.quaternion);
      const facing = this.nodeWorld[i].dot(cam) - 1;
      const p = this.project(top);
      const occ = this.route && this.stopIndex >= 0 ? `${this.stopIndex + 1}/${this.route.stops.length}` : this.world.regionMap.get(n.region)!.name;
      const html = `בפוקוס <span class="v">${occ}</span>`;
      if (this.focusTag.dataset.html !== html) { this.focusTag.innerHTML = html; this.focusTag.dataset.html = html; }
      const vis = facing > 0 ? this.beamMat.uniforms.uOp.value * smoothstep(0.08, 0.3, alt) : 0;
      this.focusTag.style.opacity = vis.toFixed(3);
      this.focusTag.style.transform = `translate3d(${(p.x - this.focusTag.offsetWidth / 2).toFixed(1)}px, ${(p.y - 26).toFixed(1)}px, 0)`;
    } else this.focusTag.style.opacity = '0';
  }

  private updateTiles(): void {
    const global = smoothstep(0.62, 0.36, this.alt);
    const want = new Set<string>();
    if (global > 0.01) {
      const fc = this.focusScreen, W = this.width, H = this.height;
      const list: { i: number; d: number }[] = [];
      this.nodes.forEach((_, i) => {
        const p = this.proj[i];
        if (!p?.visible) return;
        const d = Math.hypot(p.x - fc.x, p.y - fc.y) / Math.hypot(W / 2, H / 2);
        if (d < 0.95) list.push({ i, d });
      });
      list.sort((a, b) => a.d - b.d);
      for (const { i, d } of list.slice(0, this.preset.visibleTiles)) {
        want.add(this.nodes[i].id);
        const t = this.tileFor(i);
        t.last = performance.now();
        const dim = this.nodeLabels[i].state === 1 ? 0.35 : 1;
        const target = global * smoothstep(1.0, 0.55, d) * this.proj[i].facing * dim;
        const m = t.mesh.material as THREE.MeshBasicMaterial;
        m.opacity += (target - m.opacity) * (this.reduceMotion ? 1 : 0.12);
        t.mesh.visible = m.opacity > 0.01;
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
