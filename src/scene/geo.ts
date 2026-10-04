import * as THREE from 'three';

const D2R = Math.PI / 180;

/** lat/lon (degrees) → point on a sphere. lon=0 faces +Z, north is +Y (in the globe's own frame). */
export function llToVec(lat: number, lon: number, r = 1, target = new THREE.Vector3()): THREE.Vector3 {
  const φ = lat * D2R, λ = lon * D2R;
  return target.set(Math.cos(φ) * Math.sin(λ) * r, Math.sin(φ) * r, Math.cos(φ) * Math.cos(λ) * r);
}

export function vecToLL(v: THREE.Vector3): { lat: number; lon: number } {
  const n = v.clone().normalize();
  return { lat: Math.asin(THREE.MathUtils.clamp(n.y, -1, 1)) / D2R, lon: Math.atan2(n.x, n.z) / D2R };
}

export interface Frame { up: THREE.Vector3; north: THREE.Vector3; east: THREE.Vector3 }

/** Local tangent frame at a point of the unit sphere. */
export function frameAt(lat: number, lon: number): Frame {
  const φ = lat * D2R, λ = lon * D2R;
  return {
    up: new THREE.Vector3(Math.cos(φ) * Math.sin(λ), Math.sin(φ), Math.cos(φ) * Math.cos(λ)),
    north: new THREE.Vector3(-Math.sin(φ) * Math.sin(λ), Math.cos(φ), -Math.sin(φ) * Math.cos(λ)),
    east: new THREE.Vector3(Math.cos(λ), 0, -Math.sin(λ)),
  };
}

export function slerpVec(a: THREE.Vector3, b: THREE.Vector3, t: number, target = new THREE.Vector3()): THREE.Vector3 {
  const ω = Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1));
  if (ω < 1e-5) return target.copy(a);
  const s = Math.sin(ω);
  return target.copy(a).multiplyScalar(Math.sin((1 - t) * ω) / s).addScaledVector(b, Math.sin(t * ω) / s);
}

export const angleBetween = (a: THREE.Vector3, b: THREE.Vector3): number =>
  Math.acos(THREE.MathUtils.clamp(a.clone().normalize().dot(b.clone().normalize()), -1, 1));

/** Points along a lifted great-circle arc between two surface points. */
export function arcPoints(a: THREE.Vector3, b: THREE.Vector3, { segments = 48, lift = null as number | null, base = 1.004 } = {}): THREE.Vector3[] {
  const A = a.clone().normalize(), B = b.clone().normalize();
  const ang = angleBetween(A, B);
  const h = lift ?? Math.min(0.09, 0.008 + ang * 0.06);
  const n = Math.max(6, Math.round(segments * Math.min(1, 0.25 + ang)));
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push(slerpVec(A, B, t).multiplyScalar(base + Math.sin(Math.PI * t) * h));
  }
  return pts;
}

export const smoothstep = (e0: number, e1: number, x: number): number => {
  const t = THREE.MathUtils.clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
export const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
