// Pre-rendered backgrounds and sprites for the card game. Everything here is drawn ONCE into offscreen
// canvases (rebuilt only on resize); the frame loop only blits them. No DOM access except creating canvases.
import type { ShelfId } from './data';

export type Cv = HTMLCanvasElement;
type G = CanvasRenderingContext2D;
export const INK = '#181020';
/** Identity colour per shelf / animal type (also the card frame colour). */
export const SHELF_COL: Record<ShelfId, string> = { jungle: '#3cb043', farm: '#ffc93c', house: '#ff7aa8' };
export const SHELF_TINT: Record<ShelfId, string> = { jungle: '#d9f7c4', farm: '#fff1b8', house: '#ffe0ec' };

export function mk(w: number, h: number): [Cv, G] {
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  const g = c.getContext('2d')!; g.imageSmoothingEnabled = false;
  return [c, g];
}
export const disc = (g: G, x: number, y: number, r: number, col: string): void => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill(); };
const grad = (g: G, y0: number, y1: number, a: string, b: string): CanvasGradient => { const q = g.createLinearGradient(0, y0, 0, y1); q.addColorStop(0, a); q.addColorStop(1, b); return q; };

function tree(g: G, x: number, top: number, trunkH: number, s = 1): void {
  g.fillStyle = INK; g.fillRect(x - 4 * s, top, 9 * s, trunkH);
  g.fillStyle = '#7a4b22'; g.fillRect(x - 3 * s, top, 7 * s, trunkH);
  disc(g, x - 9 * s, top, 12 * s, INK); disc(g, x + 9 * s, top, 12 * s, INK); disc(g, x, top - 7 * s, 14 * s, INK);
  disc(g, x - 9 * s, top, 10.5 * s, '#2c8a3e'); disc(g, x + 9 * s, top, 10.5 * s, '#34a047'); disc(g, x, top - 7 * s, 12.5 * s, '#3dbb52');
}

export function jungleScene(W: number, H: number): Cv {
  const [c, g] = mk(W, H);
  g.fillStyle = grad(g, 0, 90, '#2f7a3f', '#8fd18a'); g.fillRect(0, 0, W, 90);
  for (let i = 0; i < W / 28; i++) disc(g, i * 28 + (i % 3) * 5, 80, 16 + (i % 4) * 4, '#5cae62');
  g.fillStyle = '#4fae4f'; g.fillRect(0, 84, W, H - 84);
  g.fillStyle = '#e3b878'; g.beginPath(); g.ellipse(W * 0.45, H - 18, W * 0.5, 22, 0, 0, 6.2832); g.fill();
  g.fillStyle = '#d3a566'; g.beginPath(); g.ellipse(W * 0.45, H - 14, W * 0.38, 12, 0, 0, 6.2832); g.fill();
  for (let i = 0; i < 4; i++) tree(g, 14 + i * 24, 22 + (i % 2) * 6, 56, 0.8);
  for (let i = 0; i < 3; i++) tree(g, W - 18 - i * 20, 26 + (i % 2) * 5, 58, 1); // the thick trees at the right: the entrance
  for (let i = 0; i < W / 40; i++) { g.fillStyle = i % 2 ? '#ff7aa8' : '#ffd93d'; g.fillRect(i * 40 + 18, H - 6, 3, 3); }
  return c;
}

export function farmScene(W: number, H: number, icon: (id: string, size: number) => Cv): Cv {
  const [c, g] = mk(W, H);
  g.fillStyle = grad(g, 0, 80, '#7ad1ff', '#dff4ff'); g.fillRect(0, 0, W, 90);
  disc(g, 36, 22, 11, '#ffe066'); disc(g, 36, 22, 8, '#ffd93d');
  g.fillStyle = '#ffffff'; g.fillRect(90, 18, 24, 5); g.fillRect(96, 14, 14, 5); g.fillRect(180, 26, 26, 5); g.fillRect(186, 22, 14, 5);
  for (let i = 0; i < W / 40 + 1; i++) disc(g, i * 40, 88, 24, i % 2 ? '#6fcf6a' : '#5cbf5c');
  g.fillStyle = '#7ccf5a'; g.fillRect(0, 84, W, H - 84);
  g.fillStyle = '#6bbd4a'; for (let y = 96; y < H; y += 12) g.fillRect(0, y, W, 4);
  g.fillStyle = INK; for (let x = 8; x < W - 70; x += 14) { g.fillRect(x, 78, 4, 14); } g.fillRect(8, 82, W - 78, 3); g.fillRect(8, 88, W - 78, 3);
  g.fillStyle = '#e9c98c'; for (let x = 9; x < W - 70; x += 14) g.fillRect(x, 79, 2, 12); g.fillRect(9, 83, W - 80, 1); g.fillRect(9, 89, W - 80, 1);
  g.imageSmoothingEnabled = false;
  g.drawImage(icon('home.farm', 32), 0, 0, 32, 32, W - 74, 44, 64, 64); // the barn at the right: the entrance
  return c;
}

export function houseScene(W: number, H: number): Cv {
  const [c, g] = mk(W, H);
  g.fillStyle = '#ffe8c2'; g.fillRect(0, 0, W, 96);
  g.fillStyle = '#ffd9a0'; for (let x = 0; x < W; x += 16) g.fillRect(x, 0, 6, 96);
  g.fillStyle = INK; g.fillRect(0, 94, W, 2);
  g.fillStyle = '#c98a4e'; g.fillRect(0, 96, W, H - 96);
  g.fillStyle = '#b57a3e'; for (let y = 104; y < H; y += 11) g.fillRect(0, y, W, 1); for (let x = 10; x < W; x += 34) g.fillRect(x, 96, 1, H - 96);
  // window with curtains
  g.fillStyle = INK; g.fillRect(24, 16, 50, 46); g.fillStyle = '#7ad1ff'; g.fillRect(26, 18, 46, 42);
  g.fillStyle = '#ffffff'; g.fillRect(26, 18, 46, 6); disc(g, 56, 36, 6, '#ffe066');
  g.fillStyle = INK; g.fillRect(48, 18, 2, 42); g.fillRect(26, 38, 46, 2);
  g.fillStyle = '#ff7aa8'; g.fillRect(20, 14, 10, 50); g.fillRect(68, 14, 10, 50);
  // rug
  g.fillStyle = INK; g.beginPath(); g.ellipse(W * 0.4, H - 16, 56, 12, 0, 0, 6.2832); g.fill();
  g.fillStyle = '#e8654a'; g.beginPath(); g.ellipse(W * 0.4, H - 16, 54, 10, 0, 0, 6.2832); g.fill();
  g.fillStyle = '#ffd93d'; g.beginPath(); g.ellipse(W * 0.4, H - 16, 36, 6, 0, 0, 6.2832); g.fill();
  // door at the right: the entrance
  g.fillStyle = INK; g.fillRect(W - 50, 30, 38, 68); g.fillStyle = '#9a6a35'; g.fillRect(W - 48, 32, 34, 64);
  g.fillStyle = '#b57a3e'; g.fillRect(W - 44, 38, 11, 22); g.fillRect(W - 30, 38, 11, 22); g.fillRect(W - 44, 64, 11, 24); g.fillRect(W - 30, 64, 11, 24);
  disc(g, W - 20, 66, 2, '#ffd93d');
  return c;
}

export function sceneFor(shelf: ShelfId, W: number, H: number, icon: (id: string, size: number) => Cv): Cv {
  return shelf === 'jungle' ? jungleScene(W, H) : shelf === 'farm' ? farmScene(W, H, icon) : houseScene(W, H);
}

/** The home screen world: sky, hills, a path; the three doors are separate sprites. */
export function worldScene(W: number, H: number): Cv {
  const [c, g] = mk(W, H);
  g.fillStyle = grad(g, 0, 100, '#5cc4ff', '#e6f7ff'); g.fillRect(0, 0, W, 100);
  disc(g, W - 34, 24, 13, '#ffe066'); disc(g, W - 34, 24, 10, '#ffd93d');
  g.fillStyle = '#ffffff';
  for (const [x, y] of [[26, 14], [W * 0.45, 10], [W * 0.7, 30]]) { g.fillRect(x, y, 26, 6); g.fillRect(x + 6, y - 4, 14, 5); }
  for (let i = 0; i < W / 50 + 1; i++) disc(g, i * 50 + 8, 96, 30 + (i % 3) * 5, i % 2 ? '#6fcf6a' : '#58b85c');
  g.fillStyle = '#7ccf5a'; g.fillRect(0, 92, W, H - 92);
  g.fillStyle = '#6bbd4a'; g.fillRect(0, 92, W, 3);
  // path along the bottom
  g.fillStyle = '#e3b878'; g.beginPath(); g.ellipse(W / 2, H + 6, W * 0.62, 32, 0, 0, 6.2832); g.fill();
  g.fillStyle = '#d3a566'; g.beginPath(); g.ellipse(W / 2, H + 10, W * 0.5, 22, 0, 0, 6.2832); g.fill();
  for (let i = 0; i < W / 36; i++) { g.fillStyle = i % 2 ? '#ff7aa8' : '#ffd93d'; g.fillRect(i * 36 + 12, 99 + (i % 3) * 3, 3, 3); }
  return c;
}

export const DOOR_W = 56, DOOR_H = 66;
/** A doorway to a place: arch frame in the shelf colour; open = the place shows inside, closed = friendly wooden door. */
export function doorSprite(shelf: ShelfId, open: boolean, icon: (id: string, size: number) => Cv, scene: Cv | null): Cv {
  const [c, g] = mk(DOOR_W, DOOR_H);
  const arch = (inset: number, col: string): void => {
    const x = inset, w = DOOR_W - inset * 2, r = w / 2;
    g.fillStyle = col; g.beginPath(); g.moveTo(x, DOOR_H - inset); g.lineTo(x, r + inset); g.arc(DOOR_W / 2, r + inset, r, Math.PI, 0); g.lineTo(x + w, DOOR_H - inset); g.closePath(); g.fill();
  };
  arch(0, INK); arch(1, SHELF_COL[shelf]); arch(6, INK);
  if (open && scene) {
    g.save(); g.beginPath(); g.moveTo(7, DOOR_H - 7); g.lineTo(7, 28); g.arc(DOOR_W / 2, 28, 21, Math.PI, 0); g.lineTo(DOOR_W - 7, DOOR_H - 7); g.closePath(); g.clip();
    g.drawImage(scene, Math.round(scene.width * 0.62 - 21), 8, 42, 58, 7, 7, 42, 58);
    g.restore();
  } else {
    arch(7, '#b5753a');
    g.fillStyle = '#8f5a2a'; for (const x of [18, 28, 38]) g.fillRect(x, 24, 1, DOOR_H - 30);
    g.fillStyle = '#c98a4e'; g.fillRect(9, 36, DOOR_W - 18, 2); g.fillRect(9, 52, DOOR_W - 18, 2);
    disc(g, 41, 44, 3, INK); disc(g, 41, 44, 2, '#ffd93d');
  }
  // place sign above the door (the picture says which place, no reading)
  disc(g, DOOR_W / 2, 11, 12, INK); disc(g, DOOR_W / 2, 11, 10.5, '#ffffff');
  g.imageSmoothingEnabled = true; g.drawImage(icon('home.' + shelf, 32), 0, 0, 32, 32, DOOR_W / 2 - 9, 2, 18, 18); g.imageSmoothingEnabled = false;
  return c;
}

/** Bholu the truck (the character), 48x30. */
export function truckSprite(): Cv {
  const [c, g] = mk(48, 30);
  const r = (x: number, y: number, w: number, h: number, col: string): void => { g.fillStyle = INK; g.fillRect(x - 1, y - 1, w + 2, h + 2); g.fillStyle = col; g.fillRect(x, y, w, h); };
  r(2, 10, 26, 12, '#ff7a2f'); r(28, 4, 17, 18, '#ff7a2f');
  r(33, 7, 9, 7, '#bfe9ff');
  g.fillStyle = '#ffffff'; g.fillRect(30, 15, 4, 4); g.fillRect(38, 15, 4, 4); g.fillStyle = INK; g.fillRect(32, 16, 2, 3); g.fillRect(40, 16, 2, 3);
  g.fillStyle = INK; g.fillRect(33, 20, 8, 1);
  r(10, 7, 14, 3, '#ffd93d');
  disc(g, 11, 24, 5, INK); disc(g, 11, 24, 2.5, '#cfcfcf'); disc(g, 37, 24, 5, INK); disc(g, 37, 24, 2.5, '#cfcfcf');
  return c;
}

/** Wooden shelf-with-cards button art, 44x34. */
export function shelfButton(cards: Cv[]): Cv {
  const [c, g] = mk(44, 34);
  g.fillStyle = INK; g.fillRect(0, 0, 44, 34); g.fillStyle = '#e8b66a'; g.fillRect(1, 1, 42, 32);
  g.fillStyle = '#b57a30'; g.fillRect(1, 26, 42, 7);
  for (let i = 0; i < 3; i++) {
    const x = 5 + i * 13;
    g.fillStyle = INK; g.fillRect(x - 1, 4, 13, 22); g.fillStyle = '#ffffff'; g.fillRect(x, 5, 11, 20);
    if (cards[i]) { g.imageSmoothingEnabled = true; g.drawImage(cards[i], x, 8, 11, 11); g.imageSmoothingEnabled = false; }
    else { g.fillStyle = '#9aa0b5'; g.fillRect(x + 4, 10, 3, 3); g.fillRect(x + 4, 16, 3, 2); }
  }
  return c;
}
