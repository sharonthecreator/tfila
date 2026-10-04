// Canvas-generated textures: the word pillar inside the ladder, prayer medallions, the dial ring,
// and the perforated breadboard the instrument stands on.
import * as THREE from 'three';
import type { World } from '../types';

const SERIF = '"Frank Ruhl Libre", serif';
const SANS = '"Inter Variable", "Heebo Variable", sans-serif';
const MONO = '"JetBrains Mono Variable", monospace';

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

const rgb = (hex: string) => {
  const c = new THREE.Color(hex);
  return `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;
};

/**
 * The pillar inside the ladder: rows of real prayer words wrapped around a cylinder. At every angle and height the
 * words come from the prayers standing on the nearest rung there (same region sector, same world), brightest right
 * behind the rungs — so the text spirals up with the ladder.
 */
export function makePillarTexture(
  world: World, previews: Record<string, string>, geo: { bottom: number; top: number; radius: number }, width = 2048,
): THREE.CanvasTexture {
  const { turnH, base, turns } = world.ladder;
  const W = width;
  const H = Math.round((W * (geo.top - geo.bottom)) / (2 * Math.PI * geo.radius));
  const [c, ctx] = canvas(W, H);
  const sectorOf = new Map(world.regions.map((r) => [Math.floor(r.a / 30), r]));
  const worldIds = world.worlds.map((w) => w.id);
  const pools = new Map<string, string[]>();
  for (const n of world.nodes) {
    const key = `${Math.floor(n.a / 30)}|${worldIds.indexOf(n.world)}`;
    const list = pools.get(key) || [];
    list.push(...(previews[n.id] || n.title).split(' ').slice(0, 60));
    pools.set(key, list);
  }
  const all = world.nodes.flatMap((n) => (previews[n.id] || n.title).split(' ').slice(0, 12));
  const fs = Math.max(9, Math.round(W / 150));
  ctx.font = `${fs}px ${SERIF}`;
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const cursor = new Map<string, number>();
  let k = 0;
  for (let py = fs; py < H; py += fs * 1.55) {
    const y = geo.top - (py / H) * (geo.top - geo.bottom);
    let x = W - ((py * 5.3) % (fs * 5));
    while (x > 0) {
      const a = (x / W) * 360;
      const u = (y - base) / turnH - a / 360;
      const w = Math.round(u);
      const near = Math.max(0, 1 - Math.abs(u - w) * 2);
      const inside = w >= 0 && w < turns;
      const sector = Math.floor(a / 30);
      const key = `${sector}|${w}`;
      const pool = (inside && pools.get(key)) || all;
      const i = cursor.get(key) || 0;
      cursor.set(key, i + 1);
      const word = pool[i % pool.length];
      const col = inside ? rgb(sectorOf.get(sector)?.color || '#9fd8ff') : '150,190,230';
      const alpha = inside ? 0.035 + 0.15 * near * near : 0.025;
      ctx.fillStyle = `rgba(${col}, ${(alpha * (0.85 + 0.15 * Math.sin(k++ * 1.7))).toFixed(3)})`;
      ctx.fillText(word, x, py);
      x -= ctx.measureText(word).width + fs * 0.5;
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/** A round "instrument" medallion with the opening words of a prayer, set RTL inside a dial. */
export function makeMedallion(title: string, meta: string, words: string, color: string, size = 1024): HTMLCanvasElement {
  const [c, ctx] = canvas(size, size);
  const cx = size / 2, cy = size / 2, R = size * 0.47;

  const glass = ctx.createRadialGradient(cx, cy * 0.85, R * 0.1, cx, cy, R);
  glass.addColorStop(0, 'rgba(16, 22, 32, 0.92)');
  glass.addColorStop(0.9, 'rgba(8, 11, 17, 0.86)');
  glass.addColorStop(1, 'rgba(8, 11, 17, 0)');
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();

  // dial: rim + 120 ticks
  ctx.strokeStyle = `rgba(${rgb(color)}, 0.75)`;
  ctx.lineWidth = size * 0.004;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.965, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2;
    const long = i % 10 === 0;
    const r0 = R * (long ? 0.9 : 0.93), r1 = R * 0.95;
    ctx.strokeStyle = `rgba(255,255,255,${long ? 0.45 : 0.16})`;
    ctx.lineWidth = size * (long ? 0.003 : 0.0018);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.stroke();
  }

  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font = `600 ${Math.round(size * 0.026)}px ${MONO}`;
  ctx.fillText(meta, cx, cy - R * 0.72);
  ctx.fillStyle = '#eef2f8';
  ctx.font = `700 ${Math.round(size * 0.056)}px ${SANS}`;
  ctx.fillText(title, cx, cy - R * 0.58);

  const fsz = Math.round(size * 0.056);
  const lh = fsz * 1.6;
  ctx.font = `400 ${fsz}px ${SERIF}`;
  ctx.fillStyle = '#e9eef6';
  ctx.textAlign = 'right';
  const list = words.split(' ').filter(Boolean);
  let wi = 0;
  const space = ctx.measureText(' ').width * 1.1;
  const bottom = cy + R * 0.74;
  for (let y = cy - R * 0.4; y < bottom && wi < list.length; y += lh) {
    const dy = Math.abs(y - fsz * 0.35 - cy);
    const half = Math.sqrt(Math.max(0, (R * 0.82) ** 2 - dy * dy));
    if (half < fsz * 2) continue;
    const right = cx + half, left = cx - half;
    const line: [string, number][] = [];
    let width = 0;
    while (wi < list.length) {
      const w = ctx.measureText(list[wi]).width;
      if (line.length && width + space + w > right - left) break;
      width += (line.length ? space : 0) + w;
      line.push([list[wi], w]);
      wi++;
    }
    const last = y + lh >= bottom || wi >= list.length;
    const gap = !last && line.length > 1 ? (right - left - (width - space * (line.length - 1))) / (line.length - 1) : space;
    let x = last ? cx + width / 2 : right;
    for (const [w, ww] of line) {
      ctx.fillText(w, x, y);
      x -= ww + gap;
    }
  }
  if (wi < list.length) {
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.font = `500 ${Math.round(fsz * 0.8)}px ${MONO}`;
    ctx.fillText('· · ·', cx, cy + R * 0.84);
  }
  return c;
}

/** The graduated dial ring on the bench around the ladder's foot: degree ticks and numerals only. */
export function makeDialTexture(size = 2048): THREE.CanvasTexture {
  const [c, ctx] = canvas(size, size);
  const cx = size / 2, cy = size / 2;
  const R1 = size * 0.5, R0 = size * 0.5 * (1.14 / 1.42); // matches the ring geometry radii
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 360; i++) {
    const a = (i / 360) * Math.PI * 2;
    const major = i % 15 === 0, mid = i % 5 === 0;
    const len = major ? 0.2 : mid ? 0.12 : 0.06;
    const rA = R0 + (R1 - R0) * 0.06, rB = rA + (R1 - R0) * len;
    ctx.strokeStyle = major ? 'rgba(159,240,255,0.85)' : `rgba(255,255,255,${mid ? 0.45 : 0.22})`;
    ctx.lineWidth = major ? 3 : 1.6;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * rA, cy + Math.sin(a) * rA);
    ctx.lineTo(cx + Math.cos(a) * rB, cy + Math.sin(a) * rB);
    ctx.stroke();
  }
  // no Hebrew letters here: the dial lies on the bench, underfoot of the ladder
  ctx.fillStyle = 'rgba(154,166,184,0.6)';
  ctx.font = `500 ${Math.round(size * 0.011)}px ${MONO}`;
  for (let d = 0; d < 360; d += 30) {
    const a = (d / 360) * Math.PI * 2 + Math.PI / 44;
    const r = R0 + (R1 - R0) * 0.85;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(String(d).padStart(3, '0'), 0, 0);
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Optical breadboard: anodized plate with a regular grid of tapped holes; fades out at the rim. */
export function makeBreadboard(cells = 28, px = 2048): { map: THREE.CanvasTexture; alpha: THREE.CanvasTexture; rough: THREE.CanvasTexture } {
  const [c, ctx] = canvas(px, px);
  const g = ctx.createLinearGradient(0, 0, px, px);
  g.addColorStop(0, '#1a1e25');
  g.addColorStop(1, '#121519');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, px, px);
  // fine brushed grain
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`;
    ctx.fillRect(Math.random() * px, Math.random() * px, Math.random() * 60, 1);
  }
  const step = px / cells;
  for (let i = 0; i < cells; i++) for (let j = 0; j < cells; j++) {
    const x = (i + 0.5) * step, y = (j + 0.5) * step;
    const r = step * 0.15;
    const hg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r * 1.25);
    hg.addColorStop(0, '#020203');
    hg.addColorStop(0.75, '#07080a');
    hg.addColorStop(1, 'rgba(120,130,145,0.35)');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.25, 0, Math.PI * 2);
    ctx.fill();
  }
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  const [ca, xa] = canvas(512, 512);
  const ag = xa.createRadialGradient(256, 256, 60, 256, 256, 256);
  ag.addColorStop(0, '#fff');
  ag.addColorStop(0.62, '#fff');
  ag.addColorStop(1, '#000');
  xa.fillStyle = ag;
  xa.fillRect(0, 0, 512, 512);
  const alpha = new THREE.CanvasTexture(ca);

  const [cr, xr] = canvas(512, 512);
  xr.fillStyle = '#9a9a9a';
  xr.fillRect(0, 0, 512, 512);
  const s2 = 512 / cells;
  xr.fillStyle = '#ffffff';
  for (let i = 0; i < cells; i++) for (let j = 0; j < cells; j++) {
    xr.beginPath();
    xr.arc((i + 0.5) * s2, (j + 0.5) * s2, s2 * 0.22, 0, Math.PI * 2);
    xr.fill();
  }
  const rough = new THREE.CanvasTexture(cr);
  return { map, alpha, rough };
}

/** Soft radial studio backdrop (screen-space background). */
export function makeBackdrop(): THREE.CanvasTexture {
  const [c, x] = canvas(1024, 1024);
  const g = x.createRadialGradient(540, 420, 40, 512, 520, 760);
  g.addColorStop(0, '#18202e');
  g.addColorStop(0.35, '#0d121b');
  g.addColorStop(0.7, '#07090e');
  g.addColorStop(1, '#030406');
  x.fillStyle = g;
  x.fillRect(0, 0, 1024, 1024);
  const img = x.getImageData(0, 0, 1024, 1024);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 3;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  x.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
