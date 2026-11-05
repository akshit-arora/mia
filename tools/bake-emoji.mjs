// Bakes Twemoji SVGs (CC-BY 4.0 art) into one shared-palette pixel-art atlas.
// Usage: node tools/bake-emoji.mjs [--size 32] [--out src/gen/atlas.png] [--only a,b,c]
//        [--colors 32] [--outline 1] [--contrast 1] [--sat 1] [--sharpen 0] [--icons]
// Deterministic: no randomness, stable sort everywhere.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : args[i + 1]; };
const flag = (n) => args.includes('--' + n);

const CELL = +opt('size', 32);
const OUT = resolve(root, opt('out', 'src/gen/atlas.png'));
const MAXCOL = +opt('colors', 32);      // incl. transparent + outline
const CONTRAST = +opt('contrast', 1.25);
const SAT = +opt('sat', 1.2);
const SHARPEN = +opt('sharpen', 0.6);
const OUTLINE = opt('outline', '1') !== '0';
const OUTLINE_RGB = [24, 16, 32];
const ONLY = opt('only', '') ? opt('only').split(',') : null;
const COLS = +opt('cols', 4);
const ALPHA_T = 128;

const entities = JSON.parse(readFileSync(join(root, 'src/data/entities.json'), 'utf8'))
  .filter((e) => !ONLY || ONLY.includes(e.id));
const svgDir = join(root, 'node_modules/@twemoji/svg');
const missing = entities.filter((e) => !existsSync(join(svgDir, e.emoji + '.svg')));
if (missing.length) { console.error('MISSING codepoints:', missing.map((e) => `${e.id}:${e.emoji}`).join(' ')); process.exit(1); }

const pad = OUTLINE ? 1 : 0;
const inner = CELL - 2 * pad;

async function raster(e) {
  const svg = readFileSync(join(svgDir, e.emoji + '.svg'));
  let img = sharp(svg, { density: 72 * (inner * 8) / 36 }).resize(inner * 4, inner * 4);
  // box (area) average down from 4x supersample; then lanczos is avoided to keep it crisp
  img = sharp(await img.png().toBuffer()).resize(inner, inner, { kernel: 'mitchell' });
  if (SHARPEN) img = img.sharpen({ sigma: SHARPEN });
  const { data } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = new Uint8Array(CELL * CELL * 4);
  for (let y = 0; y < inner; y++) for (let x = 0; x < inner; x++) {
    const s = (y * inner + x) * 4, d = ((y + pad) * CELL + x + pad) * 4;
    let a = data[s + 3];
    if (a < ALPHA_T) continue;
    let r = data[s], g = data[s + 1], b = data[s + 2];
    // un-premultiply is handled by sharp; apply contrast/saturation
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    r = l + (r - l) * SAT; g = l + (g - l) * SAT; b = l + (b - l) * SAT;
    r = (r - 128) * CONTRAST + 128; g = (g - 128) * CONTRAST + 128; b = (b - 128) * CONTRAST + 128;
    px[d] = Math.max(0, Math.min(255, Math.round(r)));
    px[d + 1] = Math.max(0, Math.min(255, Math.round(g)));
    px[d + 2] = Math.max(0, Math.min(255, Math.round(b)));
    px[d + 3] = 255;
  }
  return px;
}

// Median cut over weighted unique colours (deterministic).
function medianCut(counts, k) {
  let boxes = [[...counts.entries()].map(([key, n]) => ({ r: key >> 16, g: (key >> 8) & 255, b: key & 255, n }))];
  const range = (bx, c) => { let lo = 255, hi = 0; for (const p of bx) { lo = Math.min(lo, p[c]); hi = Math.max(hi, p[c]); } return hi - lo; };
  while (boxes.length < k) {
    let bi = -1, best = 0, bc = 'r';
    boxes.forEach((bx, i) => {
      if (bx.length < 2) return;
      for (const c of ['r', 'g', 'b']) { const v = range(bx, c) * Math.sqrt(bx.reduce((s, p) => s + p.n, 0)); if (v > best) { best = v; bi = i; bc = c; } }
    });
    if (bi < 0) break;
    const bx = boxes[bi].slice().sort((p, q) => p[bc] - q[bc] || p.r - q.r || p.g - q.g || p.b - q.b);
    const tot = bx.reduce((s, p) => s + p.n, 0); let acc = 0, cut = 1;
    for (let i = 0; i < bx.length - 1; i++) { acc += bx[i].n; cut = i + 1; if (acc >= tot / 2) break; }
    boxes.splice(bi, 1, bx.slice(0, cut), bx.slice(cut));
  }
  return boxes.map((bx) => {
    const t = bx.reduce((s, p) => s + p.n, 0);
    return [Math.round(bx.reduce((s, p) => s + p.r * p.n, 0) / t), Math.round(bx.reduce((s, p) => s + p.g * p.n, 0) / t), Math.round(bx.reduce((s, p) => s + p.b * p.n, 0) / t)];
  }).sort((p, q) => (p[0] + p[1] + p[2]) - (q[0] + q[1] + q[2]) || p[0] - q[0] || p[1] - q[1]);
}

const sprites = [];
for (const e of entities) sprites.push({ id: e.id, px: await raster(e) });

// shared palette from all opaque pixels
const counts = new Map();
for (const s of sprites) for (let i = 0; i < s.px.length; i += 4) if (s.px[i + 3]) {
  const key = (s.px[i] << 16) | (s.px[i + 1] << 8) | s.px[i + 2];
  counts.set(key, (counts.get(key) || 0) + 1);
}
const nFree = MAXCOL - 1 - (OUTLINE ? 1 : 0);
const palette = medianCut(counts, nFree);
const nearest = (r, g, b) => { let bi = 0, bd = 1e9; palette.forEach((p, i) => { const d = (p[0] - r) ** 2 * 2 + (p[1] - g) ** 2 * 4 + (p[2] - b) ** 2 * 3; if (d < bd) { bd = d; bi = i; } }); return bi; };

// index: 0 = transparent, 1 = outline, 2.. = palette
const OFF = OUTLINE ? 2 : 1;
const rows = Math.ceil(sprites.length / COLS);
const W = COLS * CELL, H = rows * CELL;
const idx = new Uint8Array(W * H);
const coords = {};
sprites.forEach((s, n) => {
  const ox = (n % COLS) * CELL, oy = Math.floor(n / COLS) * CELL;
  coords[s.id] = { x: ox, y: oy };
  const op = (x, y) => x >= 0 && y >= 0 && x < CELL && y < CELL && s.px[(y * CELL + x) * 4 + 3] > 0;
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
    const i = (y * CELL + x) * 4;
    let v = 0;
    if (s.px[i + 3]) v = OFF + nearest(s.px[i], s.px[i + 1], s.px[i + 2]);
    else if (OUTLINE && (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1))) v = 1;
    idx[(oy + y) * W + ox + x] = v;
  }
});

const full = [[0, 0, 0], ...(OUTLINE ? [OUTLINE_RGB] : []), ...palette];
const rgba = Buffer.alloc(W * H * 4);
for (let i = 0; i < idx.length; i++) { const c = full[idx[i]]; rgba.set([...c, idx[i] ? 255 : 0], i * 4); }
const png = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
  .png({ palette: true, colors: MAXCOL, dither: 0, compressionLevel: 9, effort: 10 }).toBuffer();
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, png);
const json = { cell: CELL, cols: COLS, sprites: coords };
writeFileSync(OUT.replace(/\.png$/, '.json'), JSON.stringify(json) + '\n');
console.log(`${OUT}: ${W}x${H}, ${sprites.length} sprites, ${full.length} colours, ${png.length} B (gzip ${gzipSync(png).length} B)`);

// app icons: lion on solid #1d2b53, nearest-neighbour upscale
if (flag('icons')) {
  const pick = coords.lion || Object.values(coords)[0];
  const cell = await sharp(png).extract({ left: pick.x, top: pick.y, width: CELL, height: CELL }).toBuffer();
  for (const size of [192, 512]) {
    const scale = Math.floor((size * 0.78) / CELL), art = CELL * scale;
    const sprite = await sharp(cell).resize(art, art, { kernel: 'nearest' }).toBuffer();
    const off = Math.floor((size - art) / 2);
    await sharp({ create: { width: size, height: size, channels: 4, background: '#1d2b53' } })
      .composite([{ input: sprite, left: off, top: off }]).png({ palette: true, compressionLevel: 9 })
      .toFile(join(root, `public/icon-${size}.png`));
  }
  console.log('icons written');
}
