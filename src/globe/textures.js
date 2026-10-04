// Canvas-rendered textures: the "word dust" skin of the globe and close-up text medallions.
import * as THREE from 'three';

const SERIF = '"Frank Ruhl Libre", "Noto Serif Hebrew", serif';

/**
 * Equirectangular texture: faint rows of real prayer words covering the globe,
 * brighter around each region, plus soft colored light where the regions are.
 */
export function makeDustTexture(world, previews, { width = 4096 } = {}) {
  const W = width, H = width / 2;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const toXY = (lat, lon) => [((lon + 180) / 360) * W, ((90 - lat) / 180) * H];

  // region light
  for (const r of world.regions) {
    const [x, y] = toXY(r.lat, r.lon);
    const rad = W * 0.075;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const col = new THREE.Color(r.color);
    const rgb = `${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)}`;
    g.addColorStop(0, `rgba(${rgb},0.30)`);
    g.addColorStop(0.5, `rgba(${rgb},0.10)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y, rad, rad, 0, 0, Math.PI * 2); ctx.fill();
    // wrap horizontally
    for (const dx of [-W, W]) { ctx.save(); ctx.translate(dx, 0); ctx.fill(); ctx.restore(); }
  }

  // word pool
  const pool = [];
  for (const n of world.nodes) {
    const p = previews[n.id];
    if (p) pool.push(...p.split(' ').slice(0, 40));
  }
  if (!pool.length) for (const n of world.nodes) pool.push(...n.title.split(' '));

  // global faint rows of words
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
      const a = 0.07 + 0.05 * Math.sin(k * 1.7);
      ctx.fillStyle = `rgba(240, 210, 150, ${a * polar})`;
      ctx.fillText(w, x, y);
      x -= ctx.measureText(w).width + fs * 0.55;
    }
  }

  // denser, brighter words around each node
  const nfs = Math.round(W / 210);
  ctx.font = `${nfs}px ${SERIF}`;
  for (const n of world.nodes) {
    const words = (previews[n.id] || n.title).split(' ');
    const [cx, cy] = toXY(n.lat, n.lon);
    const rad = (W / 360) * 2.4;
    let wi = 0;
    for (let dy = -rad; dy <= rad && wi < words.length; dy += nfs * 1.25) {
      const half = Math.sqrt(Math.max(0, rad * rad - dy * dy)) / Math.cos((n.lat * Math.PI) / 180) ** 0.5;
      let x = cx + half;
      while (x > cx - half && wi < words.length) {
        const w = words[wi++];
        ctx.fillStyle = `rgba(255, 228, 170, ${0.32 - (Math.abs(dy) / rad) * 0.18})`;
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

/**
 * A round medallion with the opening words of a prayer, laid out RTL inside a circle.
 */
export function makeTileCanvas(title, words, color = '#e8b04a', size = 1024) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const cx = size / 2, cy = size / 2, R = size * 0.47;

  const halo = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R);
  halo.addColorStop(0, 'rgba(10, 12, 28, 0.82)');
  halo.addColorStop(0.85, 'rgba(10, 12, 28, 0.62)');
  halo.addColorStop(1, 'rgba(10, 12, 28, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = color; ctx.globalAlpha = 0.55; ctx.lineWidth = size * 0.004;
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.97, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 0.22;
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.94, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.direction = 'rtl';
  ctx.textBaseline = 'alphabetic';
  // title
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font = `700 ${Math.round(size * 0.058)}px ${SERIF}`;
  ctx.fillText(title, cx, cy - R * 0.62);

  // body words
  const fsz = Math.round(size * 0.047);
  const lh = fsz * 1.62;
  ctx.font = `400 ${fsz}px ${SERIF}`;
  ctx.fillStyle = '#f4e9cf';
  ctx.textAlign = 'right';
  const list = words.split(' ').filter(Boolean);
  let wi = 0;
  const space = ctx.measureText(' ').width * 1.1;
  for (let y = cy - R * 0.46; y < cy + R * 0.8 && wi < list.length; y += lh) {
    const dy = Math.abs(y - fsz * 0.35 - cy);
    const half = Math.sqrt(Math.max(0, (R * 0.86) ** 2 - dy * dy));
    if (half < fsz * 2) continue;
    const right = cx + half, left = cx - half;
    // collect words for this line, then justify
    const line = [];
    let width = 0;
    while (wi < list.length) {
      const w = ctx.measureText(list[wi]).width;
      if (line.length && width + space + w > right - left) break;
      width += (line.length ? space : 0) + w;
      line.push([list[wi], w]);
      wi++;
    }
    const last = y + lh >= cy + R * 0.8 || wi >= list.length;
    const gap = !last && line.length > 1 ? (right - left - (width - space * (line.length - 1))) / (line.length - 1) : space;
    let x = last ? cx + width / 2 : right;
    for (const [w, ww] of line) { ctx.fillText(w, x, y); x -= ww + gap; }
  }
  if (wi < list.length) {
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.font = `400 ${Math.round(fsz * 0.9)}px ${SERIF}`;
    ctx.fillText('· · ·', cx, cy + R * 0.86);
  }
  return c;
}
