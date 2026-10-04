// Canvas-generated textures: the word skin of the globe, prayer medallions, the dial ring,
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

/** Equirectangular skin: faint rows of real prayer words, denser around each prayer, region light. */
export function makeDustTexture(world: World, previews: Record<string, string>, width = 4096): THREE.CanvasTexture {
  const W = width, H = width / 2;
  const [c, ctx] = canvas(W, H);
  const toXY = (lat: number, lon: number): [number, number] => [((lon + 180) / 360) * W, ((90 - lat) / 180) * H];

  for (const r of world.regions) {
    const [x, y] = toXY(r.lat, r.lon);
    const rad = W * 0.045;
    for (const dx of [-W, 0, W]) {
      const g = ctx.createRadialGradient(x + dx, y, 0, x + dx, y, rad);
      g.addColorStop(0, `rgba(${rgb(r.color)},0.11)`);
      g.addColorStop(0.55, `rgba(${rgb(r.color)},0.03)`);
      g.addColorStop(1, `rgba(${rgb(r.color)},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x + dx - rad, y - rad, rad * 2, rad * 2);
    }
  }

  const pool: string[] = [];
  for (const n of world.nodes) pool.push(...(previews[n.id] || n.title).split(' ').slice(0, 40));

  const fs = Math.round(W / 300);
  ctx.font = `${fs}px ${SERIF}`;
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  let k = 0;
  for (let y = fs; y < H; y += fs * 1.7) {
    const lat = 90 - (y / H) * 180;
    const polar = Math.max(0, Math.min(1, (78 - Math.abs(lat)) / 18));
    if (polar <= 0) continue;
    let x = W - ((y * 7.3) % (fs * 6));
    while (x > 0) {
      const w = pool[k++ % pool.length];
      ctx.fillStyle = `rgba(170, 215, 255, ${(0.032 + 0.022 * Math.sin(k * 1.7)) * polar})`;
      ctx.fillText(w, x, y);
      x -= ctx.measureText(w).width + fs * 0.55;
    }
  }

  const nfs = Math.round(W / 210);
  ctx.font = `${nfs}px ${SERIF}`;
  for (const n of world.nodes) {
    const words = (previews[n.id] || n.title).split(' ');
    const [cx, cy] = toXY(n.lat, n.lon);
    const col = rgb(world.regionMap.get(n.region)!.color);
    const rad = (W / 360) * 2.3;
    let wi = 0;
    for (let dy = -rad; dy <= rad && wi < words.length; dy += nfs * 1.25) {
      const half = Math.sqrt(Math.max(0, rad * rad - dy * dy)) / Math.sqrt(Math.max(0.2, Math.cos((n.lat * Math.PI) / 180)));
      let x = cx + half;
      while (x > cx - half && wi < words.length) {
        const w = words[wi++];
        ctx.fillStyle = `rgba(${col}, ${0.2 - (Math.abs(dy) / rad) * 0.13})`;
        ctx.fillText(w, x, cy + dy);
        x -= ctx.measureText(w).width + nfs * 0.5;
      }
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

/** The graduated dial ring around the globe: degree ticks and the 22 letters. */
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
  const letters = 'אבגדהוזחטיכלמנסעפצקרשת';
  ctx.fillStyle = 'rgba(238,242,248,0.75)';
  ctx.font = `600 ${Math.round(size * 0.022)}px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const rL = R0 + (R1 - R0) * 0.6;
  [...letters].forEach((ch, i) => {
    const a = (i / letters.length) * Math.PI * 2 - Math.PI / 2;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * rL, cy + Math.sin(a) * rL);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
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
