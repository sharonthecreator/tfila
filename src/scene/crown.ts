// The shape of the tree's crown: limbs that rise out of the top of the trunk and spread like a great terebinth,
// branching four times, with masses of leaves at the ends of the twigs. Pure geometry (no rendering), seeded, so the
// tree is the same on every visit and on every quality level — only the leaves get denser.
import * as THREE from 'three';

export interface CrownOpts {
  /** radius of the trunk (the pillar of words) */
  trunkR: number;
  /** height of the top of the trunk */
  top: number;
  /** the sun at the head of the ladder: the crown stays open around it */
  sun: THREE.Vector3;
  /** nothing of the crown comes lower than this (it must never hide the ladder) */
  clearY: number;
  /** number of leaf sprigs */
  leaves: number;
}

export interface Branch { pts: THREE.Vector3[]; r0: number; r1: number; level: number }

export interface Crown {
  branches: Branch[];
  /** per leaf sprig: position (xyz) + scale (w) */
  leafPos: Float32Array;
  /** per leaf sprig: rotation as a quaternion */
  leafRot: Float32Array;
  /** per leaf sprig: outward normal of its foliage mass (xyz) + exposure (w: 0 deep inside … 1 on the outer skin) */
  leafMass: Float32Array;
  /** per leaf sprig: base colour (linear rgb) */
  leafCol: Float32Array;
  /** per leaf sprig: atlas cell (x) + a random phase (y) */
  leafVar: Float32Array;
  /** extent of the crown, for framing the camera */
  maxY: number;
  radius: number;
  /** the underside of the leaves (above the sun, so it shines out between the limbs) */
  floorY: number;
}

const LEVELS = 4;
// per level: limbs (0) … twigs (3)
const STEPS = [7, 6, 4, 3];
const WOBBLE = [0.07, 0.13, 0.2, 0.26];
const SPREAD = [0.125, 0.08, 0.04, 0.02]; // limbs lean outward as they rise
const RISE = [0.0, 0.06, 0.1, 0.14]; // small branches turn up to the light
const TAPER = [0.5, 0.42, 0.38, 0.3];
const KIDS = [4, 3, 2];
const T0 = [0.42, 0.3, 0.28];

export function growCrown(o: CrownOpts): Crown {
  let seed = 20231;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const up = new THREE.Vector3(0, 1, 0);
  const outward = (p: THREE.Vector3) => {
    const l = Math.hypot(p.x, p.z);
    return l < 1e-3 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(p.x / l, 0, p.z / l);
  };
  const branches: Branch[] = [];
  // clumps of leaves; each belongs to a mass (all the clumps on one secondary branch), which shades as one body
  const clumps: { c: THREE.Vector3; R: number; tone: number; mass: number }[] = [];
  let masses = 0;

  const grow = (start: THREE.Vector3, dir: THREE.Vector3, len: number, r0: number, level: number, mass: number) => {
    const steps = STEPS[level];
    const pts = [start.clone()];
    const d = dir.clone().normalize(), p = start.clone();
    for (let k = 1; k <= steps; k++) {
      d.addScaledVector(outward(p), SPREAD[level]).addScaledVector(up, RISE[level])
        .add(new THREE.Vector3(rnd() - 0.5, (rnd() - 0.5) * 0.6, rnd() - 0.5).multiplyScalar(WOBBLE[level])).normalize();
      // keep clear of the sun's hollow and of the ladder below
      const next = p.clone().addScaledVector(d, len / steps);
      if (level > 0 && next.y < o.clearY + 0.15) d.y = Math.abs(d.y) * 0.5 + 0.1;
      p.addScaledVector(d.normalize(), len / steps);
      pts.push(p.clone());
    }
    const r1 = r0 * TAPER[level];
    branches.push({ pts, r0, r1, level });
    if (level === LEVELS - 1) {
      clumps.push({ c: p.clone(), R: 0.42 + rnd() * 0.18, tone: rnd(), mass });
      return;
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const n = KIDS[level] + (rnd() > 0.6 ? 1 : 0);
    const phi0 = rnd() * Math.PI * 2;
    for (let i = 0; i < n; i++) {
      const t = T0[level] + ((i + 0.3 + rnd() * 0.5) / n) * (0.97 - T0[level]);
      const at = curve.getPointAt(t), tan = curve.getTangentAt(t);
      // off the parent by 30–55°, around it by the golden angle
      const side = new THREE.Vector3().crossVectors(tan, Math.abs(tan.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : up).normalize();
      side.applyAxisAngle(tan, phi0 + i * 2.39996 + (rnd() - 0.5) * 0.6);
      const th = (30 + rnd() * 25) * THREE.MathUtils.DEG2RAD;
      const cd = tan.clone().multiplyScalar(Math.cos(th)).addScaledVector(side, Math.sin(th));
      // never back into the hollow where the sun stands
      const ow = outward(at), hz = cd.x * ow.x + cd.z * ow.z;
      if (hz < 0.15) cd.addScaledVector(ow, 0.15 - hz * 1.4);
      cd.y += 0.12;
      const rAt = THREE.MathUtils.lerp(r0, r1, Math.pow(t, 0.8));
      grow(at, cd.normalize(), len * (0.6 + rnd() * 0.14) * (1.08 - 0.32 * t), rAt * 0.74, level + 1, level === 0 ? masses++ : mass);
    }
    // the end of a branch carries leaves too
    if (level >= 1) clumps.push({ c: p.clone(), R: 0.5 + rnd() * 0.2 + (level === 1 ? 0.12 : 0), tone: rnd(), mass });
  };

  // the limbs: the trunk divides at its top into six, rising steeply and spreading wide
  const N = 6;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + (rnd() - 0.5) * 0.35;
    // the limbs rise out of the top of the trunk, their bases held within its swelling rim
    const start = new THREE.Vector3(Math.cos(a) * o.trunkR * 0.3, o.top - 0.32, Math.sin(a) * o.trunkR * 0.3);
    const el = (66 + rnd() * 10) * THREE.MathUtils.DEG2RAD;
    const dir = new THREE.Vector3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el));
    grow(start, dir, 1.95 + rnd() * 0.4, o.trunkR * 0.44, 0, masses++);
  }

  // leaves: sprigs in masses around the clumps; the masses are flattened a little, like the layered clouds of an oak
  const floorY = Math.max(o.clearY, o.sun.y + 0.5);
  const hollow = 1.2;
  const n = o.leaves;
  const leafPos = new Float32Array(n * 4), leafRot = new Float32Array(n * 4), leafMass = new Float32Array(n * 4);
  const leafCol = new Float32Array(n * 3), leafVar = new Float32Array(n * 2);
  // a sprig card is sized so that the canopy is equally full at every quality level
  const size = THREE.MathUtils.clamp(0.46 * Math.sqrt(3600 / Math.max(1, n)), 0.36, 0.8);
  let cy = 0, cr = 0;
  for (const c of clumps) { cy += c.c.y; cr = Math.max(cr, Math.hypot(c.c.x, c.c.z)); }
  cy /= clumps.length;
  // the masses: centre, size and a tone of their own
  const mC = Array.from({ length: masses }, () => new THREE.Vector3()), mN = new Array(masses).fill(0), mR = new Array(masses).fill(0.3);
  const mTone = Array.from({ length: masses }, () => rnd());
  for (const c of clumps) { mC[c.mass].add(c.c); mN[c.mass]++; }
  mC.forEach((v, i) => v.divideScalar(Math.max(1, mN[i])));
  for (const c of clumps) mR[c.mass] = Math.max(mR[c.mass], c.c.distanceTo(mC[c.mass]) + c.R);
  const palette = ['#1c3a15', '#24481a', '#2e571e', '#3a6523', '#477329', '#58822e', '#6e9133', '#879e3b'].map((h) => new THREE.Color(h));
  const q = new THREE.Quaternion(), m = new THREE.Matrix4(), g = new THREE.Vector3(), nrm = new THREE.Vector3(), side = new THREE.Vector3();
  const p = new THREE.Vector3(), dir = new THREE.Vector3(), col = new THREE.Color();
  let maxY = -Infinity, radius = 0;
  // weight clumps by volume so big masses get more sprigs
  const cum: number[] = [];
  let acc = 0;
  // a mass hanging below the leaves' floor would be cut flat: let it go bare
  for (const c of clumps) cum.push((acc += c.c.y > floorY - c.R * 0.3 ? c.R * c.R * c.R : 0));
  const floorAt = (r: number) => floorY - 0.18 * THREE.MathUtils.smoothstep(r, 2.4, 3.6);
  const open = (v: THREE.Vector3) => v.y >= floorAt(Math.hypot(v.x, v.z)) && v.distanceTo(o.sun) >= hollow;
  for (let i = 0; i < n; i++) {
    let c = clumps[0], f = 1, tries = 0;
    // a point in a mass, denser towards its skin; the sun's hollow and the space above the ladder stay open
    do {
      const x = rnd() * acc;
      let lo = 0, hi = cum.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < x) lo = mid + 1; else hi = mid; }
      c = clumps[lo];
      dir.set(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1);
      if (dir.lengthSq() < 1e-4) dir.set(0, 1, 0);
      dir.normalize();
      f = 0.3 + 0.7 * Math.pow(rnd(), 0.45);
      p.copy(c.c).add(new THREE.Vector3(dir.x * c.R * f, dir.y * c.R * f * 0.72, dir.z * c.R * f));
      p.lerp(mC[c.mass], 0.12); // each mass a little apart from the next, with sky between
    } while (!open(p) && ++tries < 12);
    const rh = Math.hypot(p.x, p.z);
    if (!open(p)) p.y = Math.max(p.y, floorAt(rh) + rnd() * 0.1);
    // the sprig grows outward from its mass, rolled at random about its own stem
    g.copy(dir).add(new THREE.Vector3((rnd() - 0.5) * 1.1, (rnd() - 0.5) * 1.1 + 0.25, (rnd() - 0.5) * 1.1)).normalize();
    const s = size * (0.75 + rnd() * 0.5);
    if (g.y < 0 && p.y + g.y * s < floorAt(rh)) { g.y = -g.y * 0.5; g.normalize(); } // nothing hangs below the floor
    side.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).cross(g).normalize();
    nrm.crossVectors(side, g).normalize();
    m.makeBasis(side, g, nrm);
    q.setFromRotationMatrix(m);
    p.addScaledVector(g, -s * 0.35); // the card's pivot is the base of the stem
    leafPos.set([p.x, p.y, p.z, s], i * 4);
    leafRot.set([q.x, q.y, q.z, q.w], i * 4);
    // exposure: on the skin of its mass and on the outside of the crown
    const crownOut = THREE.MathUtils.clamp(0.25 + 0.75 * (Math.hypot(rh / (cr + 0.4), (p.y - cy) / 1.1)), 0, 1);
    // in its mass: how far out from the centre (the skin is lit, the inside is dark), and which way its surface faces
    const md = p.clone().sub(mC[c.mass]);
    md.y /= 0.75;
    const mf = THREE.MathUtils.clamp(md.length() / mR[c.mass], 0, 1);
    const exp = THREE.MathUtils.clamp(0.05 + 0.3 * f * f + 0.45 * mf * mf + 0.25 * crownOut, 0, 1);
    const mass = dir.clone().multiplyScalar(0.4).add(md.normalize().multiplyScalar(0.6)).add(outward(p).multiplyScalar(0.15 * crownOut)).normalize();
    leafMass.set([mass.x, mass.y, mass.z, exp], i * 4);
    // colour: each mass its own green; the top and the outside lighter, young and yellow-green
    const tone = THREE.MathUtils.clamp(mTone[c.mass] * 0.45 + c.tone * 0.25 + rnd() * 0.25 + (p.y - cy) * 0.12 + mf * 0.12 - 0.05, 0, 0.999);
    col.copy(palette[Math.floor(tone * palette.length)]).multiplyScalar(0.88 + rnd() * 0.24);
    leafCol.set([col.r, col.g, col.b], i * 3);
    leafVar.set([Math.floor(rnd() * 4), rnd()], i * 2);
    maxY = Math.max(maxY, p.y + s);
    radius = Math.max(radius, rh + s);
  }
  return { branches, leafPos, leafRot, leafMass, leafCol, leafVar, maxY, radius, floorY };
}
