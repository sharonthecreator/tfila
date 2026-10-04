import * as THREE from 'three';

const D2R = Math.PI / 180;

/** lat/lon (degrees) → unit vector. lon=0 faces +Z, north is +Y. */
export function llToVec(lat, lon, r = 1, target = new THREE.Vector3()) {
  const φ = lat * D2R, λ = lon * D2R;
  return target.set(Math.cos(φ) * Math.sin(λ) * r, Math.sin(φ) * r, Math.cos(φ) * Math.cos(λ) * r);
}

export function vecToLL(v) {
  const n = v.clone().normalize();
  return { lat: Math.asin(THREE.MathUtils.clamp(n.y, -1, 1)) / D2R, lon: Math.atan2(n.x, n.z) / D2R };
}

/** Local tangent frame at a unit-sphere point: up (normal), north, east. */
export function frameAt(lat, lon) {
  const φ = lat * D2R, λ = lon * D2R;
  const up = new THREE.Vector3(Math.cos(φ) * Math.sin(λ), Math.sin(φ), Math.cos(φ) * Math.cos(λ));
  const north = new THREE.Vector3(-Math.sin(φ) * Math.sin(λ), Math.cos(φ), -Math.sin(φ) * Math.cos(λ));
  const east = new THREE.Vector3(Math.cos(λ), 0, -Math.sin(λ));
  return { up, north, east };
}

export function slerpVec(a, b, t, target = new THREE.Vector3()) {
  const dot = THREE.MathUtils.clamp(a.dot(b), -1, 1);
  const ω = Math.acos(dot);
  if (ω < 1e-5) return target.copy(a);
  const s = Math.sin(ω);
  return target.copy(a).multiplyScalar(Math.sin((1 - t) * ω) / s).addScaledVector(b, Math.sin(t * ω) / s);
}

export const angleBetween = (a, b) => Math.acos(THREE.MathUtils.clamp(a.clone().normalize().dot(b.clone().normalize()), -1, 1));

/** Points along a lifted great-circle arc between two surface points. */
export function arcPoints(a, b, { segments = 48, lift = null, base = 1.004 } = {}) {
  const A = a.clone().normalize(), B = b.clone().normalize();
  const ang = angleBetween(A, B);
  const h = lift ?? Math.min(0.09, 0.008 + ang * 0.06);
  const pts = [];
  const n = Math.max(6, Math.round(segments * Math.min(1, 0.25 + ang)));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = slerpVec(A, B, t);
    const r = base + Math.sin(Math.PI * t) * h;
    pts.push(p.multiplyScalar(r));
  }
  return pts;
}

export const smoothstep = (e0, e1, x) => {
  const t = THREE.MathUtils.clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
