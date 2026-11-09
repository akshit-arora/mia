// Forage Trail: all art is built here ONCE (pre-rendered canvases); the frame loop only calls drawImage on them.
// Food icons come from the shared kit (src/cards/icons.ts + card atlas) so a food looks identical on cards, reveal and here.
import type { Kit } from '../../cards/kit';
import { INK, disc, mk, type Cv } from '../../cards/scenes';
import type { FoodId, RouteId } from './logic';
import { drawAnimal, type Pose } from './sprites';

type G = CanvasRenderingContext2D;
export type Biome = 'jungle' | FoodId;

export const FAR_H = 60;
export const GND_H = 108;

/** Basket with eyes: 0 open, 1 blink, 2 happy */
function basketFace(mode: 0 | 1 | 2): Cv {
  const [c, g] = mk(40, 34);
  g.fillStyle = INK; g.fillRect(6, 2, 28, 3); g.fillRect(5, 4, 3, 8); g.fillRect(32, 4, 3, 8);
  g.fillStyle = '#c98a3e'; g.fillRect(6, 3, 28, 1); g.fillRect(6, 4, 1, 8); g.fillRect(33, 4, 1, 8);
  g.fillStyle = INK; g.beginPath(); g.moveTo(2, 12); g.lineTo(38, 12); g.lineTo(34, 33); g.lineTo(6, 33); g.fill();
  g.fillStyle = '#d9a04e'; g.beginPath(); g.moveTo(4, 13); g.lineTo(36, 13); g.lineTo(32.5, 31.5); g.lineTo(7.5, 31.5); g.fill();
  g.fillStyle = '#b57a30';
  for (let y = 17; y < 31; y += 5) g.fillRect(6, y, 28, 1);
  for (let x = 10; x < 34; x += 6) g.fillRect(x, 13, 1, 18);
  for (const ex of [13, 27]) {
    if (mode === 1) { g.fillStyle = INK; g.fillRect(ex - 4, 22, 9, 2); continue; }
    g.fillStyle = INK; g.fillRect(ex - 5, 15, 11, 13);
    g.fillStyle = '#fff'; g.fillRect(ex - 4, 16, 9, 11);
    g.fillStyle = INK; g.fillRect(ex - 1, mode === 2 ? 18 : 20, 4, 5);
    if (mode === 2) { g.fillStyle = '#fff'; g.fillRect(ex - 4, 16, 9, 2); }
  }
  if (mode === 2) { g.fillStyle = '#e8654a'; g.fillRect(16, 28, 8, 2); }
  return c;
}
export const basketImages = (): Cv[] => [basketFace(0), basketFace(1), basketFace(2)];

/** Signpost board with a food icon on it (36 x 30, or 1.1x for the sign the basket is lined up with; lanes are 33 px apart so neighbours never touch) */
export function signBoard(icon: Cv, scale = 1): Cv {
  const w = Math.round(36 * scale), h = Math.round(30 * scale);
  const [c, g] = mk(w, h);
  g.fillStyle = INK; g.fillRect(0, 0, w, h);
  g.fillStyle = '#e8c27a'; g.fillRect(1, 1, w - 2, h - 2);
  g.fillStyle = '#fff6dc'; g.fillRect(3, 3, w - 6, h - 6);
  g.imageSmoothingEnabled = scale !== 1;
  const s = Math.round(24 * scale);
  g.drawImage(icon, Math.round((w - s) / 2), Math.round((h - s) / 2), s, s);
  return c;
}

export function flowerSprite(): Cv {
  const [c, g] = mk(16, 16);
  for (const [x, y] of [[8, 3], [3, 7], [13, 7], [8, 12], [5, 4], [11, 4], [5, 11], [11, 11]]) disc(g, x, y, 3, INK);
  for (const [x, y] of [[8, 3], [3, 7], [13, 7], [8, 12]]) disc(g, x, y, 2.2, '#ff7aa8');
  disc(g, 8, 7.5, 3.8, INK); disc(g, 8, 7.5, 2.6, '#ffd93d');
  return c;
}

/** butterfly frames: [colour][wings open / wings closed], 10 x 8 */
export function butterflies(): Cv[][] {
  return ['#ff9ad0', '#7fd6ff'].map((col) => [true, false].map((open) => {
    const [c, g] = mk(10, 8);
    g.fillStyle = INK;
    if (open) { g.fillRect(0, 0, 4, 5); g.fillRect(6, 0, 4, 5); g.fillRect(1, 4, 3, 3); g.fillRect(6, 4, 3, 3); g.fillStyle = col; g.fillRect(1, 1, 3, 3); g.fillRect(6, 1, 3, 3); g.fillRect(2, 4, 1, 2); g.fillRect(7, 4, 1, 2); }
    else { g.fillRect(2, 0, 6, 6); g.fillStyle = col; g.fillRect(3, 1, 4, 4); }
    g.fillStyle = INK; g.fillRect(4, 1, 2, 6);
    return c;
  }));
}

export function bushSprite(): Cv {
  const [c, g] = mk(44, 34);
  for (const [x, y, r] of [[12, 22, 11], [32, 22, 11], [22, 15, 13]]) disc(g, x, y, r + 1.5, INK);
  disc(g, 12, 22, 11, '#2c8a3e'); disc(g, 32, 22, 11, '#34a047'); disc(g, 22, 15, 13, '#3dbb52');
  g.fillStyle = '#7ad98a'; g.fillRect(16, 8, 5, 2); g.fillRect(8, 17, 4, 2); g.fillRect(30, 15, 4, 2);
  g.fillStyle = INK; g.fillRect(2, 32, 40, 2);
  return c;
}

/** a flat feeding rock (for the lion and tiger meal) */
export function rockSprite(): Cv {
  const [c, g] = mk(46, 26);
  g.fillStyle = INK; g.beginPath(); g.moveTo(1, 25); g.lineTo(4, 10); g.lineTo(12, 4); g.lineTo(34, 4); g.lineTo(43, 11); g.lineTo(45, 25); g.fill();
  g.fillStyle = '#a9a3b5'; g.beginPath(); g.moveTo(3, 24); g.lineTo(6, 11); g.lineTo(13, 6); g.lineTo(33, 6); g.lineTo(41, 12); g.lineTo(43, 24); g.fill();
  g.fillStyle = '#cfcad9'; g.fillRect(14, 7, 18, 2); g.fillStyle = '#8c869a'; g.fillRect(4, 20, 38, 4);
  return c;
}

// ----------------------------------------------------------------- scenery
const wrapDraw = (T: number, x: number, fn: (xx: number) => void): void => { fn(x); if (x < 40) fn(x + T); if (x > T - 40) fn(x - T); };

function trunkTree(g: G, x: number, canopy: [string, string, string], top = 10): void {
  g.fillStyle = INK; g.fillRect(x - 4, top, 9, 54 - top);
  g.fillStyle = '#7a4b22'; g.fillRect(x - 3, top, 7, 54 - top);
  disc(g, x - 9, top, 12, INK); disc(g, x + 9, top, 12, INK); disc(g, x, top - 7, 14, INK);
  disc(g, x - 9, top, 10.5, canopy[0]); disc(g, x + 9, top, 10.5, canopy[1]); disc(g, x, top - 7, 12.5, canopy[2]);
}

/** far layer (trees, hills) for a biome: width T, height FAR_H, tiles seamlessly. The path covers everything below y = 30, so decor lives in the top 30 px. */
export function farLayer(biome: Biome, T: number): Cv {
  const [c, g] = mk(T, FAR_H);
  const top = biome === 'meal' ? '#f3b961' : biome === 'seeds' ? '#5ab4e8' : '#2f7a3f';
  const bot = biome === 'meal' ? '#ffe3a0' : biome === 'seeds' ? '#cdeeff' : '#8fd18a';
  g.fillStyle = top; g.fillRect(0, 0, T, FAR_H / 2); g.fillStyle = bot; g.fillRect(0, FAR_H / 2, T, FAR_H / 2);
  const hill = biome === 'meal' ? '#d8a54a' : biome === 'seeds' ? '#9bd36b' : biome === 'sugarcane' ? '#6fbf6a' : '#5cae62';
  for (let i = 0; i < T / 26; i++) {
    const x = i * 26 + (i % 3) * 5;
    wrapDraw(T, x, (xx) => disc(g, xx, 52, 18 + (i % 4) * 4, hill));
  }
  const n = Math.round(T / 34);
  const at = (i: number): number => Math.round(((i + 0.5) * T) / n + ((i * 37) % 11) - 5);
  if (biome === 'jungle' || biome === 'fruit' || biome === 'honey') {
    for (let i = 0; i < n; i++) {
      wrapDraw(T, at(i), (xx) => {
        trunkTree(g, xx, ['#2c8a3e', '#34a047', '#3dbb52']);
        if (biome === 'fruit' && i % 2 === 0) { // hanging banana bunches
          for (const [bx, by] of [[-9, 18], [8, 17], [0, 10]]) {
            g.fillStyle = INK; g.fillRect(xx + bx - 2, by - 1, 5, 9);
            g.fillStyle = '#ffd93d'; g.fillRect(xx + bx - 1, by, 3, 7); g.fillStyle = '#e0a800'; g.fillRect(xx + bx + 1, by + 1, 1, 6);
          }
        }
        if (biome === 'honey' && i % 2 === 0) { // beehive on a branch
          g.fillStyle = INK; g.fillRect(xx + 5, 14, 2, 4);
          disc(g, xx + 6, 25, 8, INK); disc(g, xx + 6, 25, 6.5, '#f2a413');
          g.fillStyle = '#b86d00'; g.fillRect(xx + 1, 23, 10, 2); g.fillRect(xx + 2, 28, 8, 2);
          g.fillStyle = INK; g.fillRect(xx + 5, 26, 3, 3);
          g.fillStyle = '#ffd93d'; g.fillRect(xx + 14, 20, 2, 2); g.fillRect(xx - 6, 27, 2, 2);
        }
      });
    }
  } else if (biome === 'sugarcane') {
    for (let i = 0; i < n * 2; i++) { // a field of tall purple canes with green tops
      const x = Math.round(((i + 0.5) * T) / (n * 2) + ((i * 29) % 7) - 3);
      wrapDraw(T, x, (xx) => {
        const h = 36 + ((i * 13) % 12);
        for (let y = 56 - h, k = 0; y < 56; y += 6, k++) {
          g.fillStyle = INK; g.fillRect(xx - 3, y, 6, 7);
          g.fillStyle = k % 2 ? '#a566cc' : '#7d3fa6'; g.fillRect(xx - 2, y + 1, 4, 5);
        }
        g.fillStyle = INK; g.fillRect(xx - 7, 56 - h - 4, 14, 5); g.fillRect(xx - 2, 56 - h - 8, 4, 6);
        g.fillStyle = '#4caf50'; g.fillRect(xx - 6, 56 - h - 3, 12, 3); g.fillRect(xx - 1, 56 - h - 7, 2, 4);
      });
    }
  } else if (biome === 'seeds') {
    for (let i = 0; i < n * 2; i++) { // round bushes full of little brown seeds
      const x = Math.round(((i + 0.5) * T) / (n * 2) + ((i * 31) % 9) - 4);
      wrapDraw(T, x, (xx) => {
        const y = 21 + ((i * 7) % 6); // only the top 30 px of this layer show above the path
        disc(g, xx, y, 11.5, INK); disc(g, xx, y, 10, i % 2 ? '#4cae4f' : '#5cc15d');
        g.fillStyle = '#c98a3e';
        for (const [sx, sy] of [[-5, -3], [2, -5], [5, 1], [-2, 3], [-6, 2], [1, 0]]) g.fillRect(xx + sx, y + sy, 3, 2);
        g.fillStyle = '#e8c27a';
        for (const [sx, sy] of [[-5, -3], [2, -5], [5, 1]]) g.fillRect(xx + sx, y + sy, 1, 1);
      });
    }
  } else { // meal: warm savannah, flat acacia trees and rocks
    for (let i = 0; i < n; i++) {
      wrapDraw(T, at(i), (xx) => {
        if (i % 2 === 0) {
          g.fillStyle = INK; g.fillRect(xx - 2, 14, 5, 20); g.fillRect(xx - 14, 6, 29, 8);
          g.fillStyle = '#7a4b22'; g.fillRect(xx - 1, 14, 3, 20);
          g.fillStyle = '#6a9a3a'; g.fillRect(xx - 13, 7, 27, 6); g.fillStyle = '#8bbf4f'; g.fillRect(xx - 11, 7, 18, 2);
        } else {
          disc(g, xx, 27, 8.5, INK); disc(g, xx, 27, 7, '#b4aebf'); g.fillStyle = '#d8d3e0'; g.fillRect(xx - 4, 22, 5, 2);
        }
      });
    }
  }
  return c;
}

/** ground layer: grass verge, dirt path, flowers. Height GND_H. */
export function groundLayer(T: number): Cv {
  const [c, g] = mk(T, GND_H);
  g.fillStyle = '#4fae4f'; g.fillRect(0, 0, T, 8);
  g.fillStyle = '#3d8f3d'; g.fillRect(0, 7, T, 2);
  g.fillStyle = '#e3b878'; g.fillRect(0, 9, T, GND_H - 9);
  g.fillStyle = '#d3a566';
  for (let y = 9; y < GND_H; y += 33) g.fillRect(0, y, T, 2);
  g.fillStyle = '#c4935a';
  for (let i = 0; i < T / 17; i++) g.fillRect((i * 17 + ((i * 7) % 9)) % T, 14 + ((i * 29) % 92), 3, 2);
  for (let i = 0; i < T / 40; i++) {
    const x = i * 40 + 14; g.fillStyle = i % 2 ? '#ff7aa8' : '#ffd93d'; g.fillRect(x, 3, 3, 3); g.fillRect(x + 1, 2, 1, 5);
  }
  return c;
}

/** Pre-rendered shelf strip: the six wild animals, owned = card thumb, unowned = dark "?" slot. Rebuilt only when ownership changes. */
export function shelfStrip(kit: Kit, ids: readonly string[], levelOf: (id: string) => number): Cv {
  const S = 18, gap = 2;
  const w = ids.length * (S + gap) + gap + 2, h = S + 6;
  const [c, g] = mk(w, h);
  g.fillStyle = INK; g.fillRect(0, 0, w, h);
  g.fillStyle = '#9a6a35'; g.fillRect(1, 1, w - 2, h - 2);
  g.fillStyle = '#7a4f24'; g.fillRect(1, h - 3, w - 2, 2);
  ids.forEach((id, i) => {
    const lv = levelOf(id);
    g.drawImage(lv > 0 ? kit.cardThumb(id, lv, S) : kit.unknownSlot(id, S), 2 + gap + i * (S + gap) - gap, 2);
  });
  return c;
}

/** small white round badge with a food icon (the persistent "what am I collecting" corner icon) */
export function foodBadge(icon: Cv): Cv {
  const [c, g] = mk(30, 30);
  disc(g, 15, 15, 14.5, INK); disc(g, 15, 15, 13, '#ffffff');
  g.imageSmoothingEnabled = true; g.drawImage(icon, 3, 3, 24, 24);
  return c;
}

/** Route signboard with a flat pictogram (river waves, thicket bush, high hill). 36 x 30, bigger when the basket is lined up with it. */
export function routeSign(route: RouteId, scale = 1): Cv {
  const w = Math.round(36 * scale), h = Math.round(30 * scale);
  const [c, g] = mk(w, h);
  g.fillStyle = INK; g.fillRect(0, 0, w, h);
  g.fillStyle = '#e8c27a'; g.fillRect(1, 1, w - 2, h - 2);
  g.fillStyle = '#fff6dc'; g.fillRect(3, 3, w - 6, h - 6);
  g.save(); g.translate(w / 2, h / 2); g.scale(scale, scale);
  if (route === 'river') {
    g.fillStyle = '#3aa0e8';
    for (const y of [-7, -1, 5]) { g.fillRect(-11, y, 6, 3); g.fillRect(-5, y - 2, 6, 3); g.fillRect(1, y, 6, 3); g.fillRect(7, y - 2, 4, 3); }
  } else if (route === 'thicket') {
    disc(g, -6, 3, 6, '#2c8a3e'); disc(g, 6, 3, 6, '#34a047'); disc(g, 0, -3, 7, '#3dbb52');
    g.fillStyle = '#ff7aa8'; g.fillRect(-2, -5, 3, 3); g.fillRect(5, 1, 3, 3);
  } else {
    g.fillStyle = '#8c869a'; g.beginPath(); g.moveTo(-12, 9); g.lineTo(-2, -9); g.lineTo(12, 9); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(-2, -9); g.lineTo(-6, -2); g.lineTo(2, -2); g.fill();
    g.fillStyle = '#ffd93d'; g.fillRect(6, -9, 4, 4);
  }
  g.restore();
  return c;
}

/** hazards: [thorn, bee] each 18 x 18 flat shapes */
export function hazardSprites(): Cv[] {
  const [t, gt] = mk(18, 18);
  gt.fillStyle = INK; gt.beginPath(); gt.moveTo(1, 17); gt.lineTo(5, 3); gt.lineTo(9, 13); gt.lineTo(13, 1); gt.lineTo(17, 17); gt.fill();
  gt.fillStyle = '#7a4b9a'; gt.beginPath(); gt.moveTo(4, 15); gt.lineTo(6, 7); gt.lineTo(9, 14); gt.lineTo(12, 6); gt.lineTo(14, 15); gt.fill();
  const [b, gb] = mk(18, 18);
  disc(gb, 9, 10, 7.5, INK); disc(gb, 9, 10, 6, '#ffd93d');
  gb.fillStyle = INK; gb.fillRect(5, 8, 8, 2); gb.fillRect(5, 12, 8, 2);
  gb.fillStyle = '#d6f1ff'; gb.fillRect(3, 1, 5, 5); gb.fillRect(10, 1, 5, 5);
  return [t, b];
}

/** the hidden token: a gold star badge */
export function secretSprite(): Cv {
  const [c, g] = mk(18, 18);
  disc(g, 9, 9, 8.5, INK); disc(g, 9, 9, 7, '#ffd93d');
  g.fillStyle = INK; g.beginPath(); g.moveTo(9, 3); g.lineTo(11, 8); g.lineTo(16, 8); g.lineTo(12, 11); g.lineTo(13.5, 16); g.lineTo(9, 13); g.lineTo(4.5, 16); g.lineTo(6, 11); g.lineTo(2, 8); g.lineTo(7, 8); g.fill();
  g.fillStyle = '#ffffff'; g.fillRect(8, 7, 2, 2);
  return c;
}

/** choice tile for the Ask board: cardboard square with a sprite centred on it */
export function tile(sprite: Cv, size = 52, hot = false): Cv {
  const [c, g] = mk(size, size);
  g.fillStyle = INK; g.fillRect(0, 0, size, size);
  g.fillStyle = hot ? '#ffd93d' : '#e8c27a'; g.fillRect(2, 2, size - 4, size - 4);
  g.fillStyle = '#fff6dc'; g.fillRect(4, 4, size - 8, size - 8);
  g.drawImage(sprite, Math.round((size - sprite.width) / 2), Math.round((size - sprite.height) / 2));
  return c;
}

/** A flat-vector animal rendered once at `size` px square (see sprites.ts). Returns null when the animal has no vector sprite. */
export function vectorAnimal(id: string, pose: Pose, size: number): Cv | null {
  const [c, g] = mk(size, size);
  g.scale(size / 64, size / 64);
  return drawAnimal(g, id, pose) ? c : null;
}

/**
 * The two optional shortcut gates (v1 buddies): [high branch for Gajju's trunk, vine for Bunty's climb], 30 x 30.
 * Flat shapes, one outline, no gradients. They only ever appear when that buddy came along.
 */
export function shortcutSprites(): Cv[] {
  const [br, gb] = mk(30, 30);
  gb.fillStyle = INK; gb.fillRect(0, 12, 30, 9); gb.fillRect(18, 5, 5, 9);
  gb.fillStyle = '#8a5a2b'; gb.fillRect(1, 13, 28, 6); gb.fillRect(19, 6, 3, 8);
  gb.fillStyle = '#6b4220'; gb.fillRect(1, 17, 28, 2);
  disc(gb, 8, 10, 6.5, INK); disc(gb, 8, 10, 5, '#3dbb52');
  disc(gb, 24, 22, 6.5, INK); disc(gb, 24, 22, 5, '#2c8a3e');
  gb.fillStyle = '#ffd93d'; gb.fillRect(14, 8, 3, 3); // a sparkle that says "up here"
  const [vn, gv] = mk(30, 30);
  gv.fillStyle = INK; gv.fillRect(13, 0, 6, 30);
  gv.fillStyle = '#2c8a3e'; gv.fillRect(14, 0, 4, 30);
  gv.fillStyle = INK; gv.fillRect(6, 7, 9, 6); gv.fillRect(17, 16, 9, 6);
  gv.fillStyle = '#3dbb52'; gv.fillRect(7, 8, 7, 4); gv.fillRect(18, 17, 7, 4);
  disc(gv, 15, 27, 3.5, INK); disc(gv, 15, 27, 2.2, '#ffd93d');
  return [br, vn];
}
