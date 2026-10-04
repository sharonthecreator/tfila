// The tfila world: a WebGL globe of prayers with semantic zoom, relation arcs and routes.
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { llToVec, frameAt, slerpVec, arcPoints, angleBetween, smoothstep, easeInOutCubic, vecToLL } from './geo.js';
import { makeDustTexture, makeTileCanvas } from './textures.js';

const REL_COLORS = { contains: '#f2c86b', adds: '#8ee0a6', varies: '#c9a2ff', related: '#8fb6ff' };
const REL_DASH = { contains: [1, 0], adds: [0.012, 0.008], varies: [0.004, 0.007], related: [1, 0] };
const MIN_ALT = 0.07, MAX_ALT = 4.6, HOME_ALT = 3.1;
const NODE_R = 1.004;

export class Globe {
  constructor(canvas, labelsEl, opts = {}) {
    this.canvas = canvas;
    this.labelsEl = labelsEl;
    this.opts = opts;
    this.reduceMotion = !!opts.reduceMotion;
    this.mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 760;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    if (!renderer.getContext()) throw new Error('WebGL unavailable');
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.mobile ? 1.75 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x05060d, 1);
    this.renderer = renderer;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.003, 200);
    this.clock = new THREE.Timer();
    this.time = 0;

    // camera rig state
    this.focus = llToVec(18, 30); // unit vector
    this.alt = HOME_ALT;
    this.vel = { x: 0, y: 0 };
    this.flight = null;
    this.lastInteraction = performance.now();
    this.dirty = true;

    this.insets = { left: 0, right: 0, bottom: 0, top: 0 };
    this.viewOff = { x: 0, y: 0 };
    this.selectedId = null;
    this.route = null;
    this.stopIndex = -1;
    this.hoverId = null;

    this._buildBackdrop();
    this._buildGlobe();
    this._setupComposer();
    this._bindInput();
    this.resize();
    this._ro = new ResizeObserver(() => this.resize());
    this._ro.observe(canvas);
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  // ───────────────────────── scene construction ─────────────────────────
  _buildBackdrop() {
    // stars
    const N = this.mobile ? 1600 : 3200;
    const pos = new Float32Array(N * 3), size = new Float32Array(N), seed = new Float32Array(N);
    const v = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      v.randomDirection().multiplyScalar(60 + Math.random() * 40);
      pos.set([v.x, v.y, v.z], i * 3);
      size[i] = Math.pow(Math.random(), 3) * 3 + 0.6;
      seed[i] = Math.random() * 100;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('size', new THREE.BufferAttribute(size, 1));
    g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    this.starMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPR: { value: this.renderer.getPixelRatio() } },
      vertexShader: /* glsl */ `
        attribute float size; attribute float seed; uniform float uTime; uniform float uPR; varying float vA;
        void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix*mv;
          vA = 0.55 + 0.45*sin(uTime*0.8 + seed); gl_PointSize = size*uPR; }`,
      fragmentShader: /* glsl */ `
        varying float vA; void main(){ float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5,0.0,d);
          gl_FragColor = vec4(vec3(1.0,0.95,0.85)*a*vA*0.9, a*vA); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.stars = new THREE.Points(g, this.starMat);
    this.scene.add(this.stars);

    // nebula glow behind the globe
    const nebCanvas = document.createElement('canvas');
    nebCanvas.width = nebCanvas.height = 256;
    const nctx = nebCanvas.getContext('2d');
    const grd = nctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, 'rgba(120,110,255,0.35)');
    grd.addColorStop(0.4, 'rgba(232,176,74,0.10)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    nctx.fillStyle = grd; nctx.fillRect(0, 0, 256, 256);
    const neb = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(nebCanvas), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    neb.scale.set(9, 9, 1);
    neb.renderOrder = -2;
    this.nebula = neb;
    this.scene.add(neb);
  }

  _buildGlobe() {
    const geo = new THREE.SphereGeometry(1, 160, 120);
    this.globeMat = new THREE.ShaderMaterial({
      uniforms: {
        uDust: { value: null }, uTime: { value: 0 }, uHasDust: { value: 0 }, uDustK: { value: 1 },
        uLight: { value: new THREE.Vector3(-0.5, 0.6, 0.8).normalize() },
        uCam: { value: new THREE.Vector3() },
      },
      vertexShader: /* glsl */ `
        varying vec3 vN; varying vec2 vUv; varying vec3 vW;
        void main(){ vN = normalize(normal); vUv = uv; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz;
          gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uDust; uniform float uHasDust; uniform float uDustK; uniform float uTime; uniform vec3 uLight; uniform vec3 uCam;
        varying vec3 vN; varying vec2 vUv; varying vec3 vW;
        float gridLine(float x, float w){ float f = abs(fract(x)-0.5); return smoothstep(w, 0.0, 0.5-f); }
        void main(){
          vec3 n = normalize(vN);
          vec3 v = normalize(uCam - vW);
          float fres = pow(1.0 - max(dot(n, v), 0.0), 2.6);
          float lit = 0.5 + 0.5*dot(n, uLight);
          vec3 base = mix(vec3(0.006,0.009,0.028), vec3(0.030,0.042,0.098), lit);
          // astrolabe grid: every 15 degrees
          float lat = vUv.y*180.0, lon = vUv.x*360.0;
          float g = max(gridLine(lat/15.0, 0.012), gridLine(lon/15.0, 0.010*max(0.25, sin(vUv.y*3.14159))));
          base += vec3(0.55,0.42,0.20)*g*0.10;
          vec4 dust = uHasDust > 0.5 ? texture2D(uDust, vUv) : vec4(0.);
          base += dust.rgb * dust.a * (0.9 + 0.25*lit) * uDustK;
          base += mix(vec3(0.95,0.70,0.32), vec3(0.45,0.55,1.0), 0.5) * fres * 0.3;
          gl_FragColor = vec4(base, 1.0);
        }`,
    });
    this.globe = new THREE.Mesh(geo, this.globeMat);
    this.scene.add(this.globe);

    // atmosphere
    const atm = new THREE.Mesh(
      new THREE.SphereGeometry(1.12, 96, 64),
      new THREE.ShaderMaterial({
        uniforms: { uCam: { value: new THREE.Vector3() } },
        vertexShader: /* glsl */ `varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(normal); vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
        fragmentShader: /* glsl */ `uniform vec3 uCam; varying vec3 vN; varying vec3 vW;
          void main(){ vec3 v = normalize(uCam - vW); float d = dot(normalize(vN), v);
            float a = pow(clamp(-d*2.1, 0.0, 1.0), 2.2) * 0.42;
            vec3 c = mix(vec3(0.42,0.5,1.0), vec3(1.0,0.76,0.38), 0.35);
            gl_FragColor = vec4(c*a, a); }`,
        side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }),
    );
    this.atmosphere = atm;
    this.scene.add(atm);

    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);
  }

  _setupComposer() {
    this.composer = null;
    if (this.mobile) return;
    try {
      const composer = new EffectComposer(this.renderer);
      composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.5, 0.38, 0.78);
      composer.addPass(this.bloom);
      composer.addPass(new OutputPass());
      this.composer = composer;
    } catch (e) {
      console.warn('bloom disabled', e);
    }
  }

  // ───────────────────────── world data ─────────────────────────
  setWorld(world) {
    this.world = world;
    this.nodes = world.nodes;
    this.nodeIndex = new Map(this.nodes.map((n, i) => [n.id, i]));
    this.regionMap = new Map(world.regions.map((r) => [r.id, r]));
    this.nodePos = this.nodes.map((n) => llToVec(n.lat, n.lon, NODE_R));
    this._buildNodes();
    this._buildRelations();
    this._buildLabels();
    this.tiles = new Map();
    this.dirty = true;
  }

  _buildNodes() {
    const N = this.nodes.length;
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), st = new Float32Array(N);
    this.nodes.forEach((n, i) => {
      const p = this.nodePos[i];
      pos.set([p.x, p.y, p.z], i * 3);
      const c = new THREE.Color(this.regionMap.get(n.region).color);
      col.set([c.r, c.g, c.b], i * 3);
      size[i] = 7 + n.imp * 3.5;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('size', new THREE.BufferAttribute(size, 1));
    g.setAttribute('state', new THREE.BufferAttribute(st, 1));
    this.nodeMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPR: { value: this.renderer.getPixelRatio() }, uAlt: { value: 1 }, uMotion: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute vec3 color; attribute float size; attribute float state;
        uniform float uTime; uniform float uPR; uniform float uAlt; uniform float uMotion;
        varying vec3 vC; varying float vS; varying float vPulse;
        void main(){
          vec4 mv = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mv;
          float zoomScale = clamp(1.6/(uAlt+0.35), 0.8, 2.8);
          float s = size * zoomScale;
          // state: 0 normal, 1 dimmed, 2 on route, 3 current stop, 4 selected
          if (state > 0.5 && state < 1.5) s *= 0.55;
          if (state > 1.5) s *= 1.35;
          if (state > 2.5) s *= 1.25;
          vPulse = state > 2.5 ? 0.5 + 0.5*sin(uTime*3.0*uMotion) : 0.0;
          gl_PointSize = s * uPR * (1.0 + vPulse*0.35);
          vC = color; vS = state;
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vC; varying float vS; varying float vPulse;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float core = smoothstep(0.16, 0.0, d);
          float glow = smoothstep(0.5, 0.0, d);
          float ring = smoothstep(0.03, 0.0, abs(d - 0.40)) * step(2.5, vS);
          vec3 c = mix(vC, vec3(1.0), 0.35);
          float a = glow*0.55 + core;
          if (vS > 0.5 && vS < 1.5) { c = mix(c, vec3(0.35,0.38,0.5), 0.75); a *= 0.45; }
          if (vS > 1.5) { c = mix(c, vec3(1.0,0.86,0.55), 0.5); }
          vec3 col = c*(glow*0.8 + core*1.6) + vec3(1.0,0.9,0.7)*ring*(0.6+vPulse);
          gl_FragColor = vec4(col, clamp(a + ring, 0.0, 1.0));
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.nodePoints = new THREE.Points(g, this.nodeMat);
    this.nodePoints.renderOrder = 3;
    this.worldGroup.add(this.nodePoints);
  }

  _makeLineMat(color, width, opts = {}) {
    const m = new LineMaterial({
      color: new THREE.Color(color), linewidth: width, transparent: true, opacity: opts.opacity ?? 0.8,
      dashed: !!opts.dashed, dashSize: opts.dashSize ?? 0.02, gapSize: opts.gapSize ?? 0.01, depthWrite: false,
      worldUnits: false,
    });
    m.blending = THREE.AdditiveBlending;
    m.resolution.set(this.width || 1, this.height || 1);
    return m;
  }

  _buildRelations() {
    if (this.relGroup) this.worldGroup.remove(this.relGroup);
    this.relGroup = new THREE.Group();
    this.relLines = [];
    for (const n of this.nodes) {
      for (const r of n.rel) {
        const ti = this.nodeIndex.get(r.target);
        if (ti == null) continue;
        const a = this.nodePos[this.nodeIndex.get(n.id)], b = this.nodePos[ti];
        const pts = arcPoints(a, b, { segments: 64 });
        const geo = new LineGeometry();
        geo.setPositions(pts.flatMap((p) => [p.x, p.y, p.z]));
        const [dash, gap] = REL_DASH[r.type] || [1, 0];
        const mat = this._makeLineMat(REL_COLORS[r.type] || '#fff', 1.4, { dashed: r.type === 'adds' || r.type === 'varies', dashSize: dash, gapSize: gap, opacity: 0.22 });
        const line = new Line2(geo, mat);
        line.computeLineDistances();
        line.renderOrder = 2;
        line.userData = { from: n.id, to: r.target, type: r.type };
        this.relGroup.add(line);
        this.relLines.push(line);
      }
    }
    this.worldGroup.add(this.relGroup);
  }

  _buildLabels() {
    this.labelsEl.textContent = '';
    this.nodeLabels = this.nodes.map((n) => {
      const el = document.createElement('div');
      el.className = `lbl node imp${n.imp}` + (n.tags.includes('kabbalah') ? ' kab' : '');
      el.textContent = n.title;
      el.style.opacity = '0';
      this.labelsEl.appendChild(el);
      return { el, w: 0, h: 0, shown: false, op: 0 };
    });
    this.regionLabels = this.world.regions.map((r) => {
      const el = document.createElement('div');
      el.className = 'lbl region';
      el.innerHTML = `${r.name}`;
      el.style.opacity = '0';
      this.labelsEl.appendChild(el);
      // region label sits north of its cluster
      const members = this.nodes.filter((n) => n.region === r.id);
      const maxLat = Math.max(...members.map((n) => n.lat));
      return { el, region: r, pos: llToVec(Math.min(maxLat + 5, 84), r.lon, 1.01), w: 0, op: 0 };
    });
    this.badgeEls = [];
    requestAnimationFrame(() => this.measureLabels());
  }

  measureLabels() {
    for (const l of [...this.nodeLabels, ...this.regionLabels]) {
      l.w = l.el.offsetWidth; l.h = l.el.offsetHeight;
    }
    this.dirty = true;
  }

  /** Rebuild the word skin and close-up medallions for a nusach. */
  setPreviews(previews) {
    this.previews = previews || {};
    const tex = makeDustTexture(this.world, this.previews, { width: this.mobile ? 2048 : 4096 });
    if (this.globeMat.uniforms.uDust.value) this.globeMat.uniforms.uDust.value.dispose();
    this.globeMat.uniforms.uDust.value = tex;
    this.globeMat.uniforms.uHasDust.value = 1;
    for (const t of this.tiles.values()) this._disposeTile(t);
    this.tiles.clear();
    this.dirty = true;
  }

  // ───────────────────────── selection & routes ─────────────────────────
  setSelected(id) {
    this.selectedId = id;
    this._refreshStates();
  }

  setRoute(route, { nusach } = {}) {
    this.route = route;
    this.stopIndex = -1;
    this.routeNusach = nusach;
    if (this.routeGroup) { this.worldGroup.remove(this.routeGroup); this.routeGroup.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); }); }
    this.routeGroup = null;
    for (const b of this.badgeEls) b.el.remove();
    this.badgeEls = [];
    if (route) this._buildRoute(route, nusach);
    this._refreshStates();
    this.dirty = true;
  }

  _stopPoint(i) {
    // occurrences of the same node are spread around it so repeated visits stay distinguishable
    const s = this.route.stops[i];
    const node = this.nodes[this.nodeIndex.get(s.n)];
    if (s.occTotal <= 1) return llToVec(node.lat, node.lon, NODE_R);
    const { north, east, up } = frameAt(node.lat, node.lon);
    const ang = ((s.occ - 1) / s.occTotal) * Math.PI * 2 - Math.PI / 2;
    const rad = 0.016;
    return up.clone().addScaledVector(east, Math.cos(ang) * rad).addScaledVector(north, Math.sin(ang) * rad).normalize().multiplyScalar(NODE_R);
  }

  _buildRoute(route, nusach) {
    const g = new THREE.Group();
    const pts = [];
    const legStarts = [];
    const stopPts = route.stops.map((_, i) => this._stopPoint(i));
    for (let i = 0; i < stopPts.length - 1; i++) {
      const a = stopPts[i], b = stopPts[i + 1];
      const ang = angleBetween(a, b);
      // vary lift so repeated legs between the same places don't overlap
      const lift = Math.min(0.075, 0.008 + ang * 0.06) * (1 + (i % 3) * 0.25);
      const seg = ang < 1e-4 ? [a.clone(), b.clone()] : arcPoints(a, b, { segments: 56, lift, base: NODE_R });
      legStarts.push(pts.length);
      if (pts.length) seg.shift();
      pts.push(...seg);
    }
    this.routePts = pts;
    this.routeLegStarts = legStarts;
    if (pts.length >= 2) {
      const flat = pts.flatMap((p) => [p.x, p.y, p.z]);
      const under = new LineGeometry(); under.setPositions(flat);
      const glow = new Line2(under, this._makeLineMat('#e8b04a', 6, { opacity: 0.1 }));
      glow.computeLineDistances();
      const over = new LineGeometry(); over.setPositions(flat);
      this.routeMat = this._makeLineMat('#ffe2a0', 2.2, { dashed: true, dashSize: 0.022, gapSize: 0.014, opacity: 0.85 });
      const line = new Line2(over, this.routeMat);
      line.computeLineDistances();
      glow.renderOrder = line.renderOrder = 4;
      g.add(glow, line);

      // comet travelling along the path to show direction
      const cometCanvas = document.createElement('canvas');
      cometCanvas.width = cometCanvas.height = 64;
      const cc = cometCanvas.getContext('2d');
      const gr = cc.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,220,150,0.8)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
      cc.fillStyle = gr; cc.fillRect(0, 0, 64, 64);
      this.comet = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cometCanvas), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      this.comet.scale.setScalar(0.03);
      this.comet.renderOrder = 5;
      g.add(this.comet);
      // cumulative lengths for comet speed
      this.routeCum = [0];
      for (let i = 1; i < pts.length; i++) this.routeCum.push(this.routeCum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    }
    this.routeGroup = g;
    this.worldGroup.add(g);

    // numbered badges
    route.stops.forEach((s, i) => {
      const el = document.createElement('div');
      const off = s.omit || (s.only && !s.only.includes(nusach));
      el.className = 'lbl badge' + (s.omit ? ' omit' : off ? ' off' : '');
      el.textContent = String(i + 1);
      this.labelsEl.appendChild(el);
      this.badgeEls.push({ el, pos: stopPts[i].clone().multiplyScalar(1.002), i, op: 0 });
    });
  }

  setStop(i) {
    this.stopIndex = i;
    this.badgeEls.forEach((b) => b.el.classList.toggle('current', b.i === i));
    this._refreshStates();
  }

  _refreshStates() {
    if (!this.nodePoints) return;
    const st = this.nodePoints.geometry.getAttribute('state');
    const onRoute = new Set(this.route ? this.route.stops.map((s) => s.n) : []);
    const cur = this.route && this.stopIndex >= 0 ? this.route.stops[this.stopIndex].n : null;
    this.nodes.forEach((n, i) => {
      let s = 0;
      if (this.route) s = onRoute.has(n.id) ? 2 : 1;
      if (n.id === cur || n.id === this.selectedId) s = 3;
      st.setX(i, s);
      const l = this.nodeLabels[i];
      l.el.classList.toggle('active', s >= 3);
      l.el.classList.toggle('dimmed', s === 1);
      l.state = s;
    });
    st.needsUpdate = true;
    // relation visibility
    for (const line of this.relLines) {
      const { from, to } = line.userData;
      let op = 0.2;
      if (this.route) op = onRoute.has(from) && onRoute.has(to) ? 0.75 : 0.04;
      if (this.selectedId && (from === this.selectedId || to === this.selectedId)) op = 0.95;
      line.material.opacity = op;
    }
    this.dirty = true;
  }

  // ───────────────────────── camera ─────────────────────────
  get focusLL() { return vecToLL(this.focus); }

  flyTo(lat, lon, alt = 0.32, { duration } = {}) {
    const to = llToVec(lat, lon);
    const from = this.focus.clone();
    const ang = angleBetween(from, to);
    const a0 = this.alt, a1 = THREE.MathUtils.clamp(alt, MIN_ALT, MAX_ALT);
    if (this.reduceMotion) { this.focus.copy(to); this.alt = a1; this.flight = null; this.dirty = true; return Promise.resolve(); }
    const d = duration ?? THREE.MathUtils.clamp(900 + ang * 900 + Math.abs(Math.log(a1 / a0)) * 300, 900, 2600);
    const peak = Math.max(a0, a1, Math.min(2.2, ang * 1.15));
    return new Promise((resolve) => {
      this.flight = { from, to, a0, a1, peak, t0: performance.now(), d, resolve };
      this.vel.x = this.vel.y = 0;
    });
  }

  flyToNode(id, alt = 0.3, opts) {
    const n = this.nodes[this.nodeIndex.get(id)];
    if (!n) return Promise.resolve();
    // aim slightly south of the node so the title and its words share the screen
    return this.flyTo(n.lat - Math.min(1.6, alt * 3.2), n.lon, alt, opts);
  }

  flyToStop(i, alt = 0.34) {
    if (!this.route) return Promise.resolve();
    const s = this.route.stops[i];
    return this.flyToNode(s.n, alt);
  }

  overview(alt = HOME_ALT) {
    if (this.route) {
      // frame the whole route
      const vs = this.route.stops.map((s) => this.nodePos[this.nodeIndex.get(s.n)]);
      const c = vs.reduce((acc, v) => acc.add(v), new THREE.Vector3()).normalize();
      const spread = Math.max(...vs.map((v) => angleBetween(v, c)));
      const ll = vecToLL(c);
      return this.flyTo(ll.lat, ll.lon, THREE.MathUtils.clamp(0.75 + spread * 1.9, 0.9, HOME_ALT));
    }
    const ll = this.focusLL;
    return this.flyTo(ll.lat, ll.lon, alt);
  }

  zoomBy(f) { this.alt = THREE.MathUtils.clamp(this.alt * f, MIN_ALT, MAX_ALT); this.flight = null; this.dirty = true; this._touch(); }

  pan(dxDeg, dyDeg) {
    const { lat, lon } = this.focusLL;
    this.focus = llToVec(THREE.MathUtils.clamp(lat + dyDeg, -82, 82), lon + dxDeg);
    this.flight = null;
    this.dirty = true;
    this._touch();
  }

  _touch() { this.lastInteraction = performance.now(); }

  _updateCamera() {
    const f = this.flight;
    if (f) {
      const t = Math.min(1, (performance.now() - f.t0) / f.d);
      const e = easeInOutCubic(t);
      slerpVec(f.from, f.to, e, this.focus);
      // quadratic bezier for altitude: rise then descend
      const u = 1 - e;
      this.alt = u * u * f.a0 + 2 * u * e * f.peak + e * e * f.a1;
      this.dirty = true;
      if (t >= 1) { this.flight = null; f.resolve(); }
    } else if (Math.abs(this.vel.x) + Math.abs(this.vel.y) > 1e-4) {
      this.pan(this.vel.x, this.vel.y);
      this.vel.x *= 0.92; this.vel.y *= 0.92;
    } else if (!this.reduceMotion && !this.route && !this.selectedId && !this.dragging && performance.now() - this.lastInteraction > 9000 && this.alt > 1.2) {
      const { lat, lon } = this.focusLL;
      this.focus = llToVec(lat, lon - 0.018);
      this.dirty = true;
    }

    const { lat, lon } = this.focusLL;
    const { up, north } = frameAt(lat, lon);
    const tiltDeg = 30 * smoothstep(1.4, 0.5, this.alt) * (0.35 + 0.65 * smoothstep(0.07, 0.4, this.alt));
    const tilt = THREE.MathUtils.degToRad(tiltDeg);
    const P = up.clone();
    const cam = P.clone().addScaledVector(up, this.alt * Math.cos(tilt)).addScaledVector(north, -this.alt * Math.sin(tilt));
    this.camera.position.copy(cam);
    this.camera.up.copy(north.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(up, Math.sin(tilt)).normalize());
    // look slightly above the surface point so the horizon reads well when tilted
    this.camera.lookAt(P);
    this.camera.near = Math.max(0.002, this.alt * 0.05);
    // keep the focus point centred in the area not covered by panels
    const tx = (this.insets.right - this.insets.left) / 2, ty = (this.insets.bottom - this.insets.top) / 2;
    const k = this.reduceMotion ? 1 : 0.12;
    this.viewOff.x += (tx - this.viewOff.x) * k;
    this.viewOff.y += (ty - this.viewOff.y) * k;
    if (Math.abs(this.viewOff.x) + Math.abs(this.viewOff.y) > 0.5) this.camera.setViewOffset(this.width, this.height, this.viewOff.x, this.viewOff.y, this.width, this.height);
    else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
    this.globeMat.uniforms.uCam.value.copy(cam);
    this.atmosphere.material.uniforms.uCam.value.copy(cam);
    this.nebula.position.copy(cam.clone().normalize().multiplyScalar(-6));
    this.nodeMat.uniforms.uAlt.value = this.alt;
    this.globeMat.uniforms.uDustK.value = 0.18 + 0.82 * smoothstep(0.12, 0.85, this.alt);
  }

  // ───────────────────────── input ─────────────────────────
  _bindInput() {
    const c = this.canvas;
    const pointers = new Map();
    let downAt = null, moved = 0, pinchD = 0, lastMove = 0;

    c.addEventListener('pointerdown', (e) => {
      c.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
      moved = 0;
      this.dragging = true;
      this.flight = null;
      this.vel.x = this.vel.y = 0;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchD = Math.hypot(a.x - b.x, a.y - b.y);
      }
      this._touch();
    });
    c.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) { this._hover(e); return; }
      const prev = pointers.get(e.pointerId);
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
      const k = this._degPerPx();
      const { lat } = this.focusLL;
      const lonScale = 1 / Math.max(0.2, Math.cos(THREE.MathUtils.degToRad(lat)));
      this.pan(-dx * k * lonScale, dy * k);
      const now = performance.now();
      const dt = Math.max(8, now - lastMove);
      lastMove = now;
      this.vel.x = (-dx * k * lonScale) * (16 / dt);
      this.vel.y = (dy * k) * (16 / dt);
    });
    const end = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchD = 0;
      if (pointers.size === 0) {
        this.dragging = false;
        if (performance.now() - lastMove > 80) this.vel.x = this.vel.y = 0;
        if (this.reduceMotion) this.vel.x = this.vel.y = 0;
        if (moved < 6 && downAt) this._click(e);
      }
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('pointerleave', () => { if (!this.dragging) this._setHover(null); });
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      const f = Math.exp(e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0016));
      const before = this.alt;
      this.zoomBy(f);
      // zoom toward the cursor
      if (f < 1) {
        const hit = this._surfaceAt(e.clientX, e.clientY);
        if (hit) {
          const k = (1 - this.alt / before) * 0.9;
          slerpVec(this.focus.clone(), hit, k, this.focus);
        }
      }
    }, { passive: false });
    c.addEventListener('keydown', (e) => {
      const k = this._degPerPx() * 60;
      const map = {
        ArrowLeft: () => this.pan(-k, 0), ArrowRight: () => this.pan(k, 0),
        ArrowUp: () => this.pan(0, k), ArrowDown: () => this.pan(0, -k),
        '+': () => this.zoomBy(0.8), '=': () => this.zoomBy(0.8), '-': () => this.zoomBy(1.25), _: () => this.zoomBy(1.25),
        PageUp: () => this.zoomBy(0.8), PageDown: () => this.zoomBy(1.25),
        Enter: () => { const id = this.pickCenter(); if (id) this.opts.onSelect?.(id, { source: 'keyboard' }); },
        ' ': () => { const id = this.pickCenter(); if (id) this.opts.onSelect?.(id, { source: 'keyboard' }); },
      };
      if (map[e.key]) { e.preventDefault(); map[e.key](); this.opts.onKeyNav?.(this.pickCenter()); }
    });
  }

  _degPerPx() {
    const h = this.height || 800;
    const span = 2 * this.alt * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    return Math.min(0.4, (span / h) * (180 / Math.PI));
  }

  _surfaceAt(x, y) {
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const hit = ray.intersectObject(this.globe)[0];
    return hit ? hit.point.clone().normalize() : null;
  }

  _projected(i) {
    const p = this._proj?.[i];
    return p;
  }

  _nearestNode(x, y, maxPx = 22) {
    const rect = this.canvas.getBoundingClientRect();
    let best = null, bd = maxPx;
    this._proj?.forEach((p, i) => {
      if (!p || !p.visible) return;
      const d = Math.hypot(p.x + rect.left - x, p.y + rect.top - y);
      if (d < bd) { bd = d; best = this.nodes[i].id; }
    });
    // medallions
    if (!best && this.tileMeshes?.length) {
      const ndc = new THREE.Vector2(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
      const ray = new THREE.Raycaster();
      ray.setFromCamera(ndc, this.camera);
      const hit = ray.intersectObjects(this.tileMeshes.filter((m) => m.visible && m.material.opacity > 0.3))[0];
      if (hit) best = hit.object.userData.id;
    }
    return best;
  }

  setInsets(insets) { this.insets = { left: 0, right: 0, bottom: 0, top: 0, ...insets }; this.dirty = true; }

  /** Screen point that the camera focus maps to (centre of the free area). */
  get focusScreen() { return { x: this.width / 2 - this.viewOff.x, y: this.height / 2 - this.viewOff.y }; }

  pickCenter() {
    const r = this.canvas.getBoundingClientRect(), c = this.focusScreen;
    return this._nearestNode(c.x + r.left, c.y + r.top, 140);
  }

  _hover(e) {
    const id = this._nearestNode(e.clientX, e.clientY);
    this._setHover(id, e.clientX, e.clientY);
  }

  _setHover(id, x, y) {
    if (id !== this.hoverId) { this.hoverId = id; this.canvas.style.cursor = id ? 'pointer' : 'grab'; }
    this.opts.onHover?.(id, x, y);
  }

  _click(e) {
    const id = this._nearestNode(e.clientX, e.clientY, this.mobile ? 30 : 22);
    if (id) this.opts.onSelect?.(id, { source: 'pointer' });
    else this.opts.onBackground?.();
  }

  // ───────────────────────── medallions (semantic zoom) ─────────────────────────
  _tileFor(i) {
    const n = this.nodes[i];
    if (this.tiles.has(n.id)) return this.tiles.get(n.id);
    const words = this.previews?.[n.id];
    const color = this.regionMap.get(n.region).color;
    const canvas = makeTileCanvas(n.title, words || n.d, color, this.mobile ? 768 : 1024);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    const size = 0.078;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false }));
    const { up, north, east } = frameAt(n.lat, n.lon);
    const center = up.clone().multiplyScalar(1.0025).addScaledVector(north, -size * 0.5 - 0.004);
    mesh.position.copy(center);
    const m = new THREE.Matrix4().makeBasis(east, north, up);
    mesh.quaternion.setFromRotationMatrix(m);
    mesh.renderOrder = 1;
    mesh.userData = { id: n.id, approximate: !words };
    this.worldGroup.add(mesh);
    const t = { mesh, tex, last: performance.now() };
    this.tiles.set(n.id, t);
    this.tileMeshes = [...this.tiles.values()].map((x) => x.mesh);
    // LRU eviction
    const maxTiles = this.mobile ? 12 : 26;
    if (this.tiles.size > maxTiles) {
      const oldest = [...this.tiles.entries()].sort((a, b) => a[1].last - b[1].last).slice(0, this.tiles.size - maxTiles);
      for (const [id, tt] of oldest) { this._disposeTile(tt); this.tiles.delete(id); }
      this.tileMeshes = [...this.tiles.values()].map((x) => x.mesh);
    }
    return t;
  }

  _disposeTile(t) {
    this.worldGroup.remove(t.mesh);
    t.mesh.geometry.dispose();
    t.mesh.material.dispose();
    t.tex.dispose();
  }

  // ───────────────────────── per-frame ─────────────────────────
  resize() {
    const w = this.canvas.clientWidth || innerWidth, h = this.canvas.clientHeight || innerHeight;
    this.width = w; this.height = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.composer?.setSize(w, h);
    const pr = this.renderer.getPixelRatio();
    const res = new THREE.Vector2(w * pr, h * pr);
    this.relLines?.forEach((l) => l.material.resolution.copy(res));
    this.routeGroup?.traverse((o) => o.material?.resolution?.copy(res));
    this.dirty = true;
  }

  setReduceMotion(v) {
    this.reduceMotion = v;
    this.nodeMat && (this.nodeMat.uniforms.uMotion.value = v ? 0 : 1);
    if (v) this.vel.x = this.vel.y = 0;
  }

  _loop() {
    requestAnimationFrame(this._loop);
    if (document.hidden) return;
    this.clock.update(); const dt = Math.min(0.05, this.clock.getDelta());
    this.time += dt;
    this._updateCamera();
    const t = this.time;
    this.starMat.uniforms.uTime.value = this.reduceMotion ? 0 : t;
    this.nodeMat && (this.nodeMat.uniforms.uTime.value = t);

    if (this.routeMat) {
      if (!this.reduceMotion) this.routeMat.dashOffset = -t * 0.06;
      // let the prayer words win when reading up close
      this.routeMat.opacity = 0.28 + 0.57 * smoothstep(0.2, 0.85, this.alt);
    }
    if (this.comet && this.routePts?.length > 1) {
      const total = this.routeCum[this.routeCum.length - 1];
      const speed = Math.max(0.06, total / 22);
      const d = this.reduceMotion ? 0 : (t * speed) % total;
      let i = 1;
      while (i < this.routeCum.length - 1 && this.routeCum[i] < d) i++;
      const a = this.routePts[i - 1], b = this.routePts[i];
      const segLen = this.routeCum[i] - this.routeCum[i - 1] || 1;
      this.comet.position.copy(a).lerp(b, (d - this.routeCum[i - 1]) / segLen);
      this.comet.visible = !this.reduceMotion;
      this.comet.scale.setScalar(THREE.MathUtils.clamp(this.alt * 0.035, 0.008, 0.05));
    }

    this._updateLabels();
    this._updateTiles();

    if (this.composer) {
      this.bloom.strength = (this.route ? 0.22 : 0.35) + (this.route ? 0.12 : 0.3) * smoothstep(0.3, 1.8, this.alt);
      this.composer.render();
    } else this.renderer.render(this.scene, this.camera);
    this.opts.onFrame?.(this.alt);
  }

  _project(v, out) {
    const p = v.clone().project(this.camera);
    out.x = (p.x * 0.5 + 0.5) * this.width;
    out.y = (-p.y * 0.5 + 0.5) * this.height;
    out.z = p.z;
    return out;
  }

  _updateLabels() {
    if (!this.nodes) return;
    const cam = this.camera.position;
    const alt = this.alt;
    const W = this.width, H = this.height;
    this._proj = this._proj || [];
    const candidates = [];
    const camN = cam.clone().normalize();
    this.nodes.forEach((n, i) => {
      const pos = this.nodePos[i];
      const facing = pos.dot(cam) - 1; // >0 visible
      const p = this._proj[i] || (this._proj[i] = {});
      this._project(pos, p);
      const horizon = smoothstep(0.0, 0.06 * Math.max(0.4, alt), facing);
      p.visible = facing > 0 && p.z < 1 && p.x > -50 && p.x < W + 50 && p.y > -50 && p.y < H + 50;
      p.facing = horizon;
      if (!p.visible) return;
      const l = this.nodeLabels[i];
      // semantic zoom: which titles appear at which distance
      const need = n.imp >= 3 ? 3.4 : n.imp === 2 ? 1.45 : 0.85;
      let vis = smoothstep(need + 0.25, need - 0.15, alt);
      if (l.state >= 2) vis = Math.max(vis, smoothstep(2.8, 1.6, alt));
      if (l.state >= 3) vis = 1;
      if (l.state === 1) vis *= 0.45;
      const fc = this.focusScreen;
      const centerDist = Math.hypot(p.x - fc.x, p.y - fc.y) / Math.hypot(W / 2, H / 2);
      const prio = (l.state >= 3 ? 100 : 0) + (l.state === 2 ? 20 : 0) + n.imp * 5 - centerDist * 6 + (this.hoverId === n.id ? 50 : 0);
      if (vis * horizon > 0.02) candidates.push({ i, p, vis: vis * horizon, prio });
    });

    // greedy collision avoidance
    candidates.sort((a, b) => b.prio - a.prio);
    const placed = [];
    const shown = new Set();
    const scale = THREE.MathUtils.clamp(1.15 - alt * 0.12, 0.85, 1.2);
    for (const c of candidates) {
      const l = this.nodeLabels[c.i];
      const w = (l.w || 80) * scale, h = (l.h || 20) * scale;
      const box = { x0: c.p.x - w / 2 - 4, x1: c.p.x + w / 2 + 4, y0: c.p.y - h - 12, y1: c.p.y - 6 };
      if (placed.some((b) => b.x0 < box.x1 && b.x1 > box.x0 && b.y0 < box.y1 && b.y1 > box.y0) && c.prio < 90) continue;
      placed.push(box);
      shown.add(c.i);
      c.scale = scale;
    }
    const cmap = new Map(candidates.map((c) => [c.i, c]));
    this.nodeLabels.forEach((l, i) => {
      const c = cmap.get(i);
      const target = c && shown.has(i) ? c.vis : 0;
      l.op += (target - l.op) * (this.reduceMotion ? 1 : 0.2);
      if (l.op < 0.01) { if (l.shown) { l.el.style.opacity = '0'; l.shown = false; } return; }
      l.shown = true;
      const p = this._proj[i];
      l.el.style.opacity = l.op.toFixed(3);
      l.el.style.transform = `translate(${(p.x - (l.w || 0) / 2).toFixed(1)}px, ${(p.y - (l.h || 0) - 9).toFixed(1)}px) scale(${(c?.scale || 1).toFixed(3)})`;
    });

    // region labels
    for (const r of this.regionLabels) {
      const facing = r.pos.dot(cam) - 1.01;
      const p = this._project(r.pos, {});
      const vis = facing > 0 && !this.route ? smoothstep(0.0, 0.25, facing) * smoothstep(0.55, 1.25, alt) : 0;
      r.op += (vis - r.op) * (this.reduceMotion ? 1 : 0.15);
      r.el.style.opacity = r.op < 0.01 ? '0' : r.op.toFixed(3);
      if (r.op >= 0.01) {
        const s = THREE.MathUtils.clamp(1.6 / (alt + 0.4), 0.6, 1.1);
        r.el.style.transform = `translate(${(p.x - (r.w || 0) / 2).toFixed(1)}px, ${(p.y - (r.h || 30) / 2).toFixed(1)}px) scale(${s.toFixed(3)})`;
      }
    }

    // route badges
    for (const b of this.badgeEls) {
      const facing = b.pos.dot(cam) - 1;
      const p = this._project(b.pos, {});
      const vis = facing > 0 ? smoothstep(0, 0.04, facing) * smoothstep(3.2, 1.2, alt) : 0;
      b.el.style.opacity = vis.toFixed(3);
      if (vis > 0.01) b.el.style.transform = `translate(${(p.x + 4).toFixed(1)}px, ${(p.y + 2).toFixed(1)}px)`;
    }
  }

  _updateTiles() {
    if (!this.nodes) return;
    const alt = this.alt;
    const global = smoothstep(0.62, 0.36, alt);
    const want = new Set();
    if (global > 0.01) {
      const W = this.width, H = this.height;
      const list = [];
      this.nodes.forEach((n, i) => {
        const p = this._proj[i];
        if (!p?.visible) return;
        const fc = this.focusScreen;
        const d = Math.hypot(p.x - fc.x, p.y - fc.y) / Math.hypot(W / 2, H / 2);
        if (d < 0.95) list.push({ i, d });
      });
      list.sort((a, b) => a.d - b.d);
      const max = this.mobile ? 6 : 12;
      for (const { i, d } of list.slice(0, max)) {
        want.add(this.nodes[i].id);
        const t = this._tileFor(i);
        t.last = performance.now();
        const route = this.nodeLabels[i].state === 1 ? 0.35 : 1;
        const target = global * smoothstep(1.0, 0.55, d) * this._proj[i].facing * route;
        t.mesh.material.opacity += (target - t.mesh.material.opacity) * (this.reduceMotion ? 1 : 0.12);
        t.mesh.visible = t.mesh.material.opacity > 0.01;
      }
    }
    for (const [id, t] of this.tiles) {
      if (want.has(id)) continue;
      t.mesh.material.opacity *= this.reduceMotion ? 0 : 0.85;
      t.mesh.visible = t.mesh.material.opacity > 0.01;
    }
  }

  screenPosOf(id) {
    const i = this.nodeIndex.get(id);
    return this._proj?.[i];
  }
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}
