import * as THREE from 'three';

export const D2R = Math.PI / 180;

/** Cylindrical (angle in degrees, 0 = +Z, increasing toward +X; radius; height) → world point. */
export function cyl(aDeg: number, r: number, y: number, target = new THREE.Vector3()): THREE.Vector3 {
  return target.set(Math.sin(aDeg * D2R) * r, y, Math.cos(aDeg * D2R) * r);
}

/** Horizontal unit vector pointing outward at an angle (degrees). */
export const radialAt = (aDeg: number, target = new THREE.Vector3()): THREE.Vector3 => target.set(Math.sin(aDeg * D2R), 0, Math.cos(aDeg * D2R));

/** Angle (degrees, 0..360) of a point around the vertical axis. */
export const angleOf = (v: THREE.Vector3): number => ((Math.atan2(v.x, v.z) / D2R) % 360 + 360) % 360;

/** Shortest signed difference b - a between two angles in degrees. */
export const angleDelta = (a: number, b: number): number => ((((b - a) % 360) + 540) % 360) - 180;

export const smoothstep = (e0: number, e1: number, x: number): number => {
  const t = THREE.MathUtils.clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
export const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
