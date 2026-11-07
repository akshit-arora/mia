// Card clash: pre-rendered art (cards, stat tiles, menu pictures). Everything is drawn ONCE into offscreen canvases;
// the frame loop only blits. Card faces are cached per animal and size.
import { cardOf, foodIcon, homeIcon, typeIcon, type ShelfId } from '../../cards/data';
import { statGlyph } from '../../cards/icons';
import type { Kit } from '../../cards/kit';
import { INK, SHELF_COL, SHELF_TINT, disc, mk, type Cv } from '../../cards/scenes';
import { rowsOf, type ClashStat } from './logic';

type G = CanvasRenderingContext2D;
export const STAT_COL: Record<ClashStat, string> = { size: '#4a90e2', speed: '#ff8a1f', strength: '#d94a3a', loudness: '#9b59d0', cuddly: '#e8559a' };
export const SIDE_COL = ['#4a90e2', '#ff8a1f'] as const; // left / right (player one, player two or phone)
export const SIDE_TINT = ['#d6e8ff', '#ffe3c2'] as const;

export interface Geo { cw: number; ch: number; y: number; lx: number; rx: number; mid: number }
export function geo(W: number): Geo {
  const cw = Math.min(100, Math.floor((W - 50) / 2));
  const lx = 3, rx = W - cw - 3;
  return { cw, ch: 106, y: 27, lx, rx, mid: W / 2 };
}

const heart = (g: G, x: number, y: number, s: number, c: string): void => {
  g.fillStyle = c; g.beginPath();
  g.moveTo(x + 8 * s, y + 14 * s); g.lineTo(x + 1 * s, y + 7 * s);
  g.arc(x + 4.5 * s, y + 4.5 * s, 3.7 * s, 2.4, 0, false);
  g.arc(x + 11.5 * s, y + 4.5 * s, 3.7 * s, Math.PI, 0.75, false);
  g.closePath(); g.fill();
};
/** Stat glyph on the 16 px grid, scaled by s. */
export function glyph(g: G, kind: ClashStat, x: number, y: number, s: number, c: string): void {
  if (kind === 'cuddly') { heart(g, x, y + 1 * s, s, c); return; }
  g.save(); g.translate(x, y); g.scale(s, s); statGlyph(g, kind, 0, 0, c); g.restore();
}

const tileCache = new Map<string, Cv>();
/** The big square picture button for a stat: coloured glyph on white with an ink frame. */
export function statTile(kind: ClashStat, size = 30, on = false): Cv {
  const key = `${kind}@${size}@${on}`;
  let c = tileCache.get(key);
  if (c) return c;
  const [cv, g] = mk(size, size);
  g.fillStyle = INK; g.fillRect(0, 0, size, size);
  g.fillStyle = on ? '#ffe680' : '#ffffff'; g.fillRect(1, 1, size - 2, size - 2);
  g.fillStyle = STAT_COL[kind]; g.globalAlpha = 0.22; g.fillRect(1, size - 9, size - 2, 8); g.globalAlpha = 1;
  const s = (size - 8) / 16;
  glyph(g, kind, 4, 3, s, STAT_COL[kind]);
  tileCache.set(key, cv); return cv;
}

const faceCache = new Map<string, Cv>();
/** Card face WITHOUT the animal and the name (drawn separately: the animal moves, the name is real text). */
export function cardFace(kit: Kit, id: string, cw: number, ch: number): Cv {
  const key = `${id}@${cw}x${ch}`;
  let c = faceCache.get(key);
  if (c) return c;
  const card = cardOf(id);
  const [cv, g] = mk(cw, ch);
  g.fillStyle = INK; g.fillRect(0, 0, cw, ch);
  g.fillStyle = SHELF_COL[card.shelf]; g.fillRect(1, 1, cw - 2, ch - 2);
  g.fillStyle = '#ffffff'; g.fillRect(3, 3, cw - 6, ch - 6);
  g.fillStyle = SHELF_COL[card.shelf]; g.globalAlpha = 0.5; g.fillRect(3, 3, cw - 6, 13); g.globalAlpha = 1; // name strip (text is HTML)
  g.fillStyle = SHELF_TINT[card.shelf]; g.fillRect(3, 17, cw - 6, 31); // picture window
  g.fillStyle = INK; g.fillRect(3, 16, cw - 6, 1); g.fillRect(3, 48, cw - 6, 1);
  g.fillStyle = 'rgba(24,16,32,.2)'; g.beginPath(); g.ellipse(cw / 2, 46, 13, 3, 0, 0, 6.2832); g.fill();
  // badges: type, food, home (same icon, same place, every time)
  const ids = [typeIcon(card), foodIcon(card), homeIcon(card)];
  ids.forEach((iid, i) => {
    const x = Math.round(cw / 2 - 25 + i * 18 - 1);
    g.fillStyle = INK; g.fillRect(x, 50, 16, 14); g.fillStyle = '#fff'; g.fillRect(x + 1, 51, 14, 12);
    g.imageSmoothingEnabled = true; g.drawImage(kit.icon(iid, 32), x + 2, 51, 12, 12); g.imageSmoothingEnabled = false;
  });
  // three stat rows: glyph + 10 pips
  const pw = Math.max(5, Math.floor((cw - 8 - 18) / 10));
  rowsOf(id).forEach((r, i) => {
    const y = 66 + i * 12;
    glyph(g, r.kind, 5, y, 0.7, INK);
    for (let p = 0; p < 10; p++) {
      const x = 20 + p * pw;
      g.fillStyle = INK; g.fillRect(x, y + 1, pw, 10);
      g.fillStyle = p < r.value ? STAT_COL[r.kind] : '#e6e8f2'; g.fillRect(x + 1, y + 2, pw - 1, 8);
    }
  });
  faceCache.set(key, cv); return cv;
}
/** Card centre for the animal and the name strip, relative to the card's top-left. */
export const ANIMAL_BOX = { bottom: 47, size: 32 };
export const NAME_Y = 9;

export function cardBack(cw: number, ch: number, side: 0 | 1): Cv {
  const key = `back@${cw}x${ch}@${side}`;
  let c = faceCache.get(key);
  if (c) return c;
  const [cv, g] = mk(cw, ch);
  g.fillStyle = INK; g.fillRect(0, 0, cw, ch);
  g.fillStyle = SIDE_COL[side]; g.fillRect(1, 1, cw - 2, ch - 2);
  g.fillStyle = SIDE_TINT[side]; g.fillRect(5, 5, cw - 10, ch - 10);
  g.fillStyle = SIDE_COL[side]; g.globalAlpha = 0.45;
  for (let y = 5; y < ch - 5; y += 10) for (let x = 5 + ((y / 10) % 2) * 6; x < cw - 11; x += 12) g.fillRect(x, y, 6, 6);
  g.globalAlpha = 1;
  disc(g, cw / 2, ch / 2, 17, INK); disc(g, cw / 2, ch / 2, 15.5, '#ffffff');
  g.fillStyle = INK; const q = ['01110', '10001', '00110', '00000', '00100'];
  for (let r = 0; r < 5; r++) for (let k = 0; k < 5; k++) if (q[r][k] === '1') g.fillRect(Math.round(cw / 2 - 10 + k * 4), Math.round(ch / 2 - 11 + r * 4), 4, 4);
  faceCache.set(key, cv); return cv;
}

/** Two cards crossing with a spark: the picture on the home button. */
export function clashIcon(): Cv {
  const [cv, g] = mk(44, 34);
  disc(g, 22, 17, 17, INK); disc(g, 22, 17, 15.5, '#fff1b8');
  const card = (rot: number, col: string): void => {
    g.save(); g.translate(22, 17); g.rotate(rot);
    g.fillStyle = INK; g.fillRect(-8, -12, 16, 23); g.fillStyle = col; g.fillRect(-7, -11, 14, 21);
    g.fillStyle = '#fff'; g.fillRect(-5, -9, 10, 11);
    g.fillStyle = INK; g.fillRect(-4, 4, 8, 2); g.restore();
  };
  card(-0.45, SIDE_COL[0]); card(0.45, SIDE_COL[1]);
  g.fillStyle = INK; g.beginPath(); g.moveTo(22, 5); g.lineTo(25, 14); g.lineTo(34, 17); g.lineTo(25, 20); g.lineTo(22, 29); g.lineTo(19, 20); g.lineTo(10, 17); g.lineTo(19, 14); g.fill();
  g.fillStyle = '#ffd93d'; g.beginPath(); g.moveTo(22, 8); g.lineTo(24, 15); g.lineTo(31, 17); g.lineTo(24, 19); g.lineTo(22, 26); g.lineTo(20, 19); g.lineTo(13, 17); g.lineTo(20, 15); g.fill();
  return cv;
}

/** Menu pictures, 88x72: the phone (a phone with a card), and two friends (two faces and two cards). */
export function phonePic(): Cv {
  const [cv, g] = mk(88, 72);
  g.fillStyle = INK; g.fillRect(0, 0, 88, 72); g.fillStyle = '#eaf4ff'; g.fillRect(2, 2, 84, 68);
  g.fillStyle = INK; g.fillRect(24, 6, 40, 62); g.fillStyle = '#6b6f86'; g.fillRect(26, 8, 36, 58);
  g.fillStyle = '#bfe3ff'; g.fillRect(28, 12, 32, 48);
  g.fillStyle = INK; g.fillRect(36, 63, 16, 2);
  // a tiny card on the phone screen and a smiling face (the phone is a friend)
  g.fillStyle = INK; g.fillRect(34, 32, 20, 24); g.fillStyle = SIDE_COL[1]; g.fillRect(35, 33, 18, 22); g.fillStyle = '#fff'; g.fillRect(37, 35, 14, 12);
  disc(g, 44, 22, 8, INK); disc(g, 44, 22, 6.8, '#ffd93d');
  g.fillStyle = INK; g.fillRect(41, 20, 2, 3); g.fillRect(46, 20, 2, 3); g.fillRect(41, 25, 7, 1);
  // the child's card at the left
  g.save(); g.translate(13, 48); g.rotate(-0.25); g.fillStyle = INK; g.fillRect(-7, -10, 14, 20); g.fillStyle = SIDE_COL[0]; g.fillRect(-6, -9, 12, 18); g.fillStyle = '#fff'; g.fillRect(-4, -7, 8, 9); g.restore();
  return cv;
}
export function friendsPic(): Cv {
  const [cv, g] = mk(88, 72);
  g.fillStyle = INK; g.fillRect(0, 0, 88, 72); g.fillStyle = '#fff0dc'; g.fillRect(2, 2, 84, 68);
  const kid = (x: number, skin: string, hair: string, col: string, cardCol: string): void => {
    g.fillStyle = INK; g.fillRect(x - 13, 50, 26, 20); g.fillStyle = col; g.fillRect(x - 12, 51, 24, 19);
    disc(g, x, 30, 13.5, INK); disc(g, x, 30, 12, skin);
    g.fillStyle = hair; g.beginPath(); g.arc(x, 27, 12, Math.PI, 0); g.fill();
    g.fillStyle = INK; g.fillRect(x - 5, 30, 2, 3); g.fillRect(x + 3, 30, 2, 3); g.fillRect(x - 4, 37, 8, 1);
    g.fillStyle = INK; g.fillRect(x - 6, 54, 12, 16); g.fillStyle = cardCol; g.fillRect(x - 5, 55, 10, 14); g.fillStyle = '#fff'; g.fillRect(x - 3, 57, 6, 6);
  };
  kid(24, '#f1c27d', '#3b2a20', SIDE_COL[0], SIDE_COL[0]);
  kid(64, '#c68642', '#1b1210', SIDE_COL[1], SIDE_COL[1]);
  g.fillStyle = INK; g.beginPath(); g.moveTo(44, 8); g.lineTo(47, 17); g.lineTo(56, 20); g.lineTo(47, 23); g.lineTo(44, 32); g.lineTo(41, 23); g.lineTo(32, 20); g.lineTo(41, 17); g.fill();
  g.fillStyle = '#ffd93d'; g.beginPath(); g.moveTo(44, 11); g.lineTo(46, 18); g.lineTo(52, 20); g.lineTo(46, 22); g.lineTo(44, 29); g.lineTo(42, 22); g.lineTo(36, 20); g.lineTo(42, 18); g.fill();
  return cv;
}

/** A big pointing hand-over cue for pass-and-play: a hand with a curved arrow, 48x40. */
export function passPic(col: string): Cv {
  const [cv, g] = mk(56, 44);
  g.strokeStyle = INK; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.arc(28, 30, 18, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
  g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); g.arc(28, 30, 18, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
  g.fillStyle = INK; g.beginPath(); g.moveTo(51, 21); g.lineTo(53, 36); g.lineTo(38, 31); g.fill();
  g.fillStyle = col; g.beginPath(); g.moveTo(49, 25); g.lineTo(50, 33); g.lineTo(42, 31); g.fill();
  disc(g, 28, 30, 9, INK); disc(g, 28, 30, 7.5, '#ffd9a8');
  g.fillStyle = INK; g.fillRect(24, 28, 8, 2); g.fillRect(24, 32, 8, 2);
  return cv;
}

/** The "get more friends first" picture: a short shelf with the cards owned and ? slots, and a padlock on a card back. */
export function lockedPanel(kit: Kit, owned: readonly string[], ghost: readonly string[], W: number, H: number): Cv {
  const [cv, g] = mk(W, H);
  g.fillStyle = '#cfe9ff'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#bcdcf5'; for (let x = 0; x < W; x += 14) g.fillRect(x, 0, 5, H);
  const s = 32, n = 4, x0 = Math.round(W / 2 - (n * (s + 4)) / 2 + 2), y0 = 54;
  g.fillStyle = INK; g.fillRect(x0 - 8, y0 + s + 2, n * (s + 4) + 12, 5); g.fillStyle = '#a8742f'; g.fillRect(x0 - 8, y0 + s + 3, n * (s + 4) + 12, 3);
  for (let i = 0; i < n; i++) {
    const have = owned[i];
    g.drawImage(have ? kit.cardThumb(have, 1, s) : kit.unknownSlot(ghost[i % Math.max(1, ghost.length)] ?? 'lion', s), x0 + i * (s + 4), y0);
  }
  // padlock above the slots
  const px = Math.round(W / 2), py = 28;
  g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.arc(px, py - 4, 7, Math.PI, 0); g.stroke();
  g.strokeStyle = '#ffd93d'; g.lineWidth = 2; g.beginPath(); g.arc(px, py - 4, 7, Math.PI, 0); g.stroke();
  g.fillStyle = INK; g.fillRect(px - 11, py - 3, 22, 17); g.fillStyle = '#ffd93d'; g.fillRect(px - 10, py - 2, 20, 15);
  g.fillStyle = INK; g.fillRect(px - 2, py + 2, 4, 5);
  // shelf door picture to point at
  return cv;
}

/** Crown-ish star for the winner and a sparkle for ties. */
export const starIcon = (kit: Kit, size = 14): Cv => kit.icon('ui.star', size);
export const sparkIcon = (kit: Kit, size = 14): Cv => kit.icon('ui.sparkle', size);

export function roundPips(done: number, total: number, tint: string): Cv {
  const w = total * 10 + 4;
  const [cv, g] = mk(w, 12);
  g.fillStyle = INK; g.fillRect(0, 0, w, 12); g.fillStyle = '#ffffff'; g.fillRect(1, 1, w - 2, 10);
  for (let i = 0; i < total; i++) { disc(g, 7 + i * 10, 6, 3.5, INK); disc(g, 7 + i * 10, 6, 2.5, i < done ? tint : '#d6d9e6'); }
  return cv;
}
export type { ShelfId };

