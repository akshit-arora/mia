// Play Yard: all art is built here ONCE (pre-rendered canvases); the frame loop only calls drawImage on them.
// Food icons come from the shared kit (src/cards/icons.ts + card atlas), so bone / milk / carrot look the same on cards and here.
import type { Kit } from '../../cards/kit';
import { INK, disc, mk, type Cv } from '../../cards/scenes';
import { FOOD_OF, HOME_Y, PETS, SLOT_Y, homeX, slotX, type PetId } from './logic';

type G = CanvasRenderingContext2D;

/** Colour + pattern choices: red plain, blue dots, yellow stripes (so colour is never the only cue). */
export const PAL = ['#e8654a', '#4aa3ff', '#ffd93d'] as const;
export const PAL_DARK = ['#b8402b', '#2a73cc', '#d4a800'] as const;
export const PAL_LIGHT = ['#ff9a85', '#9bd0ff', '#fff0a0'] as const;

export function fillPat(g: G, i: number, x: number, y: number, w: number, h: number): void {
  g.fillStyle = PAL[i]; g.fillRect(x, y, w, h);
  if (i === 1) {
    g.fillStyle = '#ffffff';
    for (let yy = y + 1, r = 0; yy < y + h - 1; yy += 4, r++) for (let xx = x + 1 + (r % 2) * 3; xx < x + w - 1; xx += 6) g.fillRect(xx, yy, 2, 2);
  } else if (i === 2) {
    g.fillStyle = PAL_DARK[2];
    for (let yy = y + 2; yy < y + h; yy += 5) g.fillRect(x, yy, w, 2);
  }
}
function patDisc(g: G, i: number, cx: number, cy: number, r: number): void {
  disc(g, cx, cy, r + 1.5, INK);
  g.save(); g.beginPath(); g.arc(cx, cy, r, 0, 6.2832); g.clip();
  fillPat(g, i, Math.floor(cx - r), Math.floor(cy - r), Math.ceil(r * 2) + 1, Math.ceil(r * 2) + 1);
  g.restore();
}
const box = (g: G, x: number, y: number, w: number, h: number, c: string): void => { g.fillStyle = INK; g.fillRect(x - 1, y - 1, w + 2, h + 2); g.fillStyle = c; g.fillRect(x, y, w, h); };
function poly(g: G, pts: number[], c: string): void {
  g.beginPath(); g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.closePath(); g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = 2.4; g.stroke(); g.fillStyle = c; g.fill();
}

// ----------------------------------------------------------------- the yard (one picture, rebuilt when the width or a decoration changes)
function kennel(g: G, cx: number, deco: number): void {
  const b = HOME_Y + 4;
  box(g, cx - 16, b - 26, 32, 26, '#c98a4e');
  g.fillStyle = '#a8703a'; for (let x = cx - 14; x < cx + 14; x += 7) g.fillRect(x, b - 25, 1, 24);
  // roof: two slopes, painted with the chosen decoration
  poly(g, [cx - 21, b - 24, cx, b - 44, cx + 21, b - 24], PAL[deco]);
  g.save(); g.beginPath(); g.moveTo(cx - 19, b - 25); g.lineTo(cx, b - 42); g.lineTo(cx + 19, b - 25); g.closePath(); g.clip();
  fillPat(g, deco, cx - 21, b - 44, 42, 22); g.restore();
  g.fillStyle = INK; g.beginPath(); g.moveTo(cx - 8, b); g.lineTo(cx - 8, b - 12); g.quadraticCurveTo(cx, b - 22, cx + 8, b - 12); g.lineTo(cx + 8, b); g.fill();
  g.fillStyle = '#3a2a20'; g.fillRect(cx - 7, b - 11, 14, 11);
}
function hutch(g: G, cx: number, deco: number): void {
  const b = HOME_Y + 4;
  g.fillStyle = INK; g.fillRect(cx - 16, b - 6, 4, 8); g.fillRect(cx + 12, b - 6, 4, 8);
  g.fillStyle = '#9a6a35'; g.fillRect(cx - 15, b - 6, 2, 7); g.fillRect(cx + 13, b - 6, 2, 7);
  box(g, cx - 18, b - 26, 36, 20, '#d9a05a');
  g.fillStyle = '#7a4f24'; g.fillRect(cx - 17, b - 12, 34, 1);
  // mesh door
  g.fillStyle = INK; g.fillRect(cx - 12, b - 23, 24, 15); g.fillStyle = '#4a3a30'; g.fillRect(cx - 11, b - 22, 22, 13);
  g.fillStyle = '#c9c4d6'; for (let x = cx - 10; x < cx + 11; x += 4) g.fillRect(x, b - 22, 1, 13);
  for (let y = b - 20; y < b - 9; y += 4) g.fillRect(cx - 11, y, 22, 1);
  // painted roof: a sloped slab in the chosen decoration
  poly(g, [cx - 24, b - 26, cx - 17, b - 37, cx + 17, b - 37, cx + 24, b - 26], PAL[deco]);
  g.save(); g.beginPath(); g.moveTo(cx - 22, b - 27); g.lineTo(cx - 16, b - 36); g.lineTo(cx + 16, b - 36); g.lineTo(cx + 22, b - 27); g.closePath(); g.clip();
  fillPat(g, deco, cx - 24, b - 38, 48, 12); g.restore();
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(cx - 22, b - 28, 44, 2);
}
function basket(g: G, cx: number, deco: number): void {
  const b = HOME_Y + 4;
  g.fillStyle = INK; g.beginPath(); g.ellipse(cx, b - 6, 20, 10, 0, 0, 6.2832); g.fill();
  g.fillStyle = '#d9a04e'; g.beginPath(); g.ellipse(cx, b - 6, 18.5, 8.5, 0, 0, 6.2832); g.fill();
  g.fillStyle = '#b57a30'; for (let x = cx - 14; x < cx + 15; x += 5) g.fillRect(x, b - 3, 1, 5);
  // cushion with the chosen decoration
  g.save(); g.beginPath(); g.ellipse(cx, b - 9, 15, 5, 0, 0, 6.2832); g.clip(); fillPat(g, deco, cx - 16, b - 15, 32, 12); g.restore();
  g.strokeStyle = INK; g.lineWidth = 1.2; g.beginPath(); g.ellipse(cx, b - 9, 15, 5, 0, 0, 6.2832); g.stroke();
}

export function yardScene(W: number, H: number, deco: Record<PetId, number>): Cv {
  const [c, g] = mk(W, H);
  const sky = g.createLinearGradient(0, 0, 0, 66);
  sky.addColorStop(0, '#8fd6ff'); sky.addColorStop(1, '#e4f5ff');
  g.fillStyle = sky; g.fillRect(0, 0, W, 66);
  disc(g, W * 0.64, 15, 8, '#ffe066');
  for (const [x, y] of [[W * 0.3, 14], [W * 0.46, 26]]) { disc(g, x, y, 6, '#ffffff'); disc(g, x + 7, y + 1, 5, '#ffffff'); disc(g, x - 6, y + 2, 4, '#ffffff'); }
  // hills + fence
  for (let i = 0; i < W / 40 + 1; i++) disc(g, i * 40 + 10, 66, 22 + (i % 3) * 5, i % 2 ? '#7fc77a' : '#8fd18a');
  g.fillStyle = '#7fd16a'; g.fillRect(0, 60, W, H - 60);
  g.fillStyle = INK; g.fillRect(0, 62, W, 2); g.fillRect(0, 70, W, 2);
  for (let x = 4; x < W; x += 9) { g.fillStyle = INK; g.fillRect(x - 1, 56, 6, 18); g.fillStyle = '#fff1d6'; g.fillRect(x, 57, 4, 16); g.fillStyle = INK; g.fillRect(x + 1, 55, 2, 2); }
  // lawn: stripes, a worn play patch, path from the house
  g.fillStyle = '#74c860'; for (let y = 78; y < H; y += 14) g.fillRect(0, y, W, 7);
  g.fillStyle = '#9be37e'; g.beginPath(); g.ellipse(W * 0.5, 112, W * 0.42, 22, 0, 0, 6.2832); g.fill();
  g.fillStyle = '#e8c88a'; for (let k = 0; k < 4; k++) g.fillRect(W - 62 + k * 5, 82 + k * 9, 20, 5);
  g.fillStyle = '#ff7aa8'; for (let x = 12; x < W; x += 31) { g.fillRect(x, 128 - (x % 5), 3, 3); }
  g.fillStyle = '#ffd93d'; for (let x = 22; x < W; x += 47) { g.fillRect(x, 124 + (x % 4), 3, 3); }
  // the house
  const hx = W - 76, hy = 80;
  box(g, hx, 30, 66, hy - 30, '#fff1d6');
  g.fillStyle = '#ecd7b0'; for (let y = 36; y < hy; y += 8) g.fillRect(hx + 1, y, 64, 1);
  poly(g, [hx - 6, 32, hx + 33, 6, hx + 72, 32], '#b8402b'); g.fillStyle = '#e8654a'; g.fillRect(hx + 12, 17, 44, 3);
  box(g, hx + 49, 8, 8, 14, '#9a6a35');
  box(g, hx + 8, 44, 22, 36, '#9a6a35'); g.fillStyle = '#b57a3e'; g.fillRect(hx + 11, 48, 7, 12); g.fillRect(hx + 20, 48, 7, 12); disc(g, hx + 26, 64, 1.6, '#ffd93d');
  box(g, hx + 38, 44, 20, 18, '#7ad1ff'); g.fillStyle = '#ffffff'; g.fillRect(hx + 38, 44, 20, 3); g.fillStyle = INK; g.fillRect(hx + 47, 44, 2, 18); g.fillRect(hx + 38, 53, 20, 2);
  // the three homes, in the chosen colours
  kennel(g, homeX('dog', W), deco.dog);
  hutch(g, homeX('rabbit', W), deco.rabbit);
  basket(g, homeX('cat', W), deco.cat);
  return c;
}

// ----------------------------------------------------------------- pantry shelf, bowls, swatches, small pieces
export function shelfPanel(W: number): { img: Cv; x: number; y: number } {
  const x0 = slotX(0, W) - 24, x1 = slotX(2, W) + 24, w = x1 - x0, h = 52;
  const [c, g] = mk(w, h);
  g.fillStyle = INK; g.fillRect(0, 0, w, h);
  g.fillStyle = '#9a6a35'; g.fillRect(1, 1, w - 2, h - 2);
  g.fillStyle = '#7a4f24'; g.fillRect(1, h - 5, w - 2, 4);
  for (let i = 0; i < 3; i++) {
    const sx = slotX(i, W) - x0;
    g.fillStyle = INK; g.fillRect(sx - 20, 4, 40, 42);
    g.fillStyle = '#ffe9c4'; g.fillRect(sx - 19, 5, 38, 40);
    g.fillStyle = '#ecd2a0'; g.fillRect(sx - 19, 37, 38, 8);
  }
  return { img: c, x: x0, y: SLOT_Y - 26 };
}

/** The food bowl: 4 stages, full -> empty (food shrinks with each munch) */
export function bowlStages(kit: Kit, food: string): Cv[] {
  const icon = kit.icon('food.' + food, 32);
  const out: Cv[] = [];
  for (let s = 0; s < 4; s++) {
    const [c, g] = mk(30, 26);
    const k = [1, 0.7, 0.38, 0][s];
    g.fillStyle = INK; g.beginPath(); g.ellipse(15, 18, 14, 7, 0, 0, 6.2832); g.fill();
    g.fillStyle = '#ff8fb1'; g.beginPath(); g.ellipse(15, 17, 12.5, 5.5, 0, 0, 6.2832); g.fill();
    g.fillStyle = '#ffd0df'; g.beginPath(); g.ellipse(15, 16, 9, 3, 0, 0, 6.2832); g.fill();
    if (k > 0) { // the food sits in the bowl: icon on top, then the front rim over its foot
      const sz = Math.round(19 * k); g.imageSmoothingEnabled = true; g.drawImage(icon, Math.round(15 - sz / 2), Math.round(18 - sz * 0.9), sz, sz);
      g.fillStyle = INK; g.beginPath(); g.ellipse(15, 18, 14, 7, 0, 0.15, Math.PI - 0.15); g.lineTo(15, 18); g.fill();
      g.fillStyle = '#ff8fb1'; g.beginPath(); g.ellipse(15, 17.6, 12.5, 5.2, 0, 0.1, Math.PI - 0.1); g.lineTo(15, 17.6); g.fill();
    } else { g.fillStyle = '#e0a0b8'; g.fillRect(8, 19, 14, 1); }
    out.push(c);
  }
  return out;
}

/** toy sprites, 12 x 12 */
export function toySprite(pet: PetId, deco: number): Cv {
  const [c, g] = mk(14, 14);
  if (pet === 'dog') { patDisc(g, deco, 7, 7, 5); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(4, 4, 2, 2); }
  else if (pet === 'cat') { // a ball of yarn with a loose thread
    patDisc(g, deco, 7, 7, 5);
    g.strokeStyle = INK; g.lineWidth = 1; g.beginPath(); g.moveTo(3, 5); g.quadraticCurveTo(7, 9, 11, 4); g.moveTo(3.5, 8); g.quadraticCurveTo(7, 11, 11, 7); g.stroke();
    g.strokeStyle = PAL[deco]; g.lineWidth = 1.4; g.beginPath(); g.moveTo(11, 10); g.quadraticCurveTo(13, 12, 9, 13); g.stroke();
  } else { // leaf ball: a green leaf ball tied with a ribbon in the chosen colour
    disc(g, 7, 7, 6.2, INK); disc(g, 7, 7, 4.8, '#4cae4f'); g.fillStyle = '#7ad98a'; g.fillRect(3, 4, 3, 2); g.fillRect(8, 8, 3, 2);
    g.fillStyle = INK; g.fillRect(2, 6, 10, 3); fillPat(g, deco, 3, 7, 8, 1); g.fillStyle = PAL[deco]; g.fillRect(3, 7, 8, 1);
    g.fillStyle = PAL[deco]; g.fillRect(6, 3, 3, 2);
  }
  return c;
}

/** paint blob for the decoration choice, 36 x 36 */
export function swatchSprite(i: number): Cv {
  const [c, g] = mk(30, 30);
  disc(g, 15, 17, 13, 'rgba(0,0,0,.18)');
  patDisc(g, i, 15, 14, 12);
  g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(7, 6, 4, 3);
  return c;
}

/** the pantry hand: a soft white dot with a ring */
export function handSprite(): Cv {
  const [c, g] = mk(22, 22);
  disc(g, 11, 11, 10.5, INK); disc(g, 11, 11, 9, '#ffffff'); disc(g, 11, 11, 5.5, '#ffd93d'); disc(g, 11, 11, 2.5, '#ffffff');
  return c;
}

export function zSprites(): Cv[] {
  return [2, 2].map((s) => {
    const [c, g] = mk(5 * s + 2, 5 * s + 2);
    const bits = ['11111', '00010', '00100', '01000', '11111'];
    g.fillStyle = INK; for (let r = 0; r < 5; r++) for (let k = 0; k < 5; k++) if (bits[r][k] === '1') g.fillRect(1 + k * s - 1 + 0, 1 + r * s - 1 + 0, s + 2, s + 2);
    g.fillStyle = '#ffffff'; for (let r = 0; r < 5; r++) for (let k = 0; k < 5; k++) if (bits[r][k] === '1') g.fillRect(1 + k * s, 1 + r * s, s, s);
    return c;
  });
}

const HEART = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'];
/** The heart meter as one picture: `filled` of `need` hearts. */
export function meterStrip(need: number, filled: number): Cv {
  const hw = 11, w = need * hw + 6, h = 14;
  const [c, g] = mk(w, h);
  g.fillStyle = INK; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.fillRect(1, 1, w - 2, h - 2);
  for (let i = 0; i < need; i++) {
    const x = 3 + i * hw + 1, on = i < filled;
    g.fillStyle = INK; for (let r = 0; r < 6; r++) for (let k = 0; k < 7; k++) if (HEART[r][k] === '1') g.fillRect(x + k - 0, 3 + r, 1, 1);
    for (let r = 0; r < 6; r++) for (let k = 0; k < 7; k++) if (HEART[r][k] === '1') { g.fillStyle = on ? '#ff4d79' : '#d9d4e4'; g.fillRect(x + k, 4 + r, 1, 1); }
    if (on) { g.fillStyle = '#ffb3c6'; g.fillRect(x + 1, 5, 2, 1); }
  }
  return c;
}

// ----------------------------------------------------------------- the pets: variants of the shared animal sprite
export interface PetArt {
  /** [facing left, facing right] */
  stand: [Cv, Cv]; crouch: [Cv, Cv]; tangled: [Cv, Cv]; head: [Cv, Cv];
  curled: Cv; size: number;
}
/** Which way each shared sprite faces. Checked by eye on the baked atlas (see the report). */
const FACES_RIGHT: Record<PetId, boolean> = { dog: false, cat: false, rabbit: false };

export function petArt(kit: Kit, pet: PetId): PetArt {
  const S = 30;
  const base = kit.animal(pet, 32);
  const make = (draw: (g: G, src: Cv, flip: boolean) => void, w: number, h: number): [Cv, Cv] => {
    return [false, true].map((right) => {
      const flip = right !== FACES_RIGHT[pet];
      const [c, g] = mk(w, h);
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.save(); if (flip) { g.translate(w, 0); g.scale(-1, 1); }
      draw(g, base, flip); g.restore();
      return c;
    }) as [Cv, Cv];
  };
  const stand = make((g, s) => g.drawImage(s, 0, 0, S, S), S, S);
  const crouch = make((g, s) => g.drawImage(s, -1, 8, S + 2, S - 9), S, S);
  const head = make((g, s) => { g.translate(S / 2, S); g.rotate(-0.35); g.drawImage(s, -S / 2, -S, S, S); }, S + 6, S + 4);
  const tangled = make((g, s) => {
    g.drawImage(s, 0, 0, S, S);
    g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(2, 12); g.lineTo(28, 24); g.moveTo(3, 22); g.lineTo(27, 10); g.moveTo(14, 4); g.lineTo(16, 29); g.stroke();
    g.strokeStyle = '#ff7aa8'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(2, 12); g.lineTo(28, 24); g.moveTo(3, 22); g.lineTo(27, 10); g.moveTo(14, 4); g.lineTo(16, 29); g.stroke();
  }, S, S);
  const [curled, cg] = mk(26, 17);
  cg.imageSmoothingEnabled = true; cg.imageSmoothingQuality = 'high';
  cg.drawImage(base, 0, 0, 26, 17);
  return { stand, crouch, tangled, head, curled, size: S };
}

/** Everything the game draws that does not depend on the window size: built once at game start */
export function buildPieces(kit: Kit): {
  pets: Record<PetId, PetArt>; bowls: Record<PetId, Cv[]>; icons: Record<PetId, Cv>; swatches: Cv[]; hand: Cv; z: Cv[]; sparkle: Cv;
} {
  const pets = {} as Record<PetId, PetArt>, bowls = {} as Record<PetId, Cv[]>, icons = {} as Record<PetId, Cv>;
  for (const p of PETS) { pets[p] = petArt(kit, p); bowls[p] = bowlStages(kit, FOOD_OF[p]); icons[p] = kit.icon('food.' + FOOD_OF[p], 32); }
  return { pets, bowls, icons, swatches: [0, 1, 2].map(swatchSprite), hand: handSprite(), z: zSprites(), sparkle: kit.icon('ui.sparkle', 16) };
}
