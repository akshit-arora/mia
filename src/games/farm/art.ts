// Morning Round: all art is built here ONCE (pre-rendered canvases); the frame loop only calls drawImage on them.
// Food icons come from the shared kit (src/cards/icons.ts + card atlas), so a food looks identical on cards, reveal and here.
import { INK, disc, mk, type Cv } from '../../cards/scenes';
import { LANE_Y, doorX, type ChoreKind } from './logic';

type G = CanvasRenderingContext2D;

export const FAR_H = 60;
export const GND_Y = 36; // the ground layer starts here
export const GND_H = 99;
export const DOOR_W = 26, DOOR_H = 34, DOOR_TOP = 64;

/** outlined rectangle */
const r = (g: G, x: number, y: number, w: number, h: number, col: string): void => { g.fillStyle = INK; g.fillRect(x - 1, y - 1, w + 2, h + 2); g.fillStyle = col; g.fillRect(x, y, w, h); };
const poly = (g: G, pts: number[][], col: string, outline = true): void => {
  const path = (): void => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); };
  if (outline) { path(); g.strokeStyle = INK; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke(); }
  path(); g.fillStyle = col; g.fill();
};
const grad = (g: G, y0: number, y1: number, a: string, b: string): CanvasGradient => { const q = g.createLinearGradient(0, y0, 0, y1); q.addColorStop(0, a); q.addColorStop(1, b); return q; };

// ----------------------------------------------------------------- the cart (Bholu pulling a little hay trailer)
export function cartSprite(truck: Cv): Cv {
  const [c, g] = mk(76, 30);
  r(g, 2, 13, 22, 9, '#c98a3e'); // trailer bed
  g.fillStyle = INK; g.fillRect(3, 8, 20, 6); g.fillStyle = '#f2d24a'; g.fillRect(4, 9, 18, 5);
  g.fillStyle = '#e0b020'; g.fillRect(6, 10, 4, 1); g.fillRect(13, 12, 5, 1);
  disc(g, 12, 24, 5, INK); disc(g, 12, 24, 2.5, '#cfcfcf');
  g.fillStyle = INK; g.fillRect(24, 19, 5, 2); // hitch
  g.drawImage(truck, 28, 0);
  return c;
}

// ----------------------------------------------------------------- the ride
export function farLayer(T: number): Cv {
  const [c, g] = mk(T, FAR_H);
  g.fillStyle = grad(g, 0, FAR_H, '#7fcbf2', '#e6f6ff'); g.fillRect(0, 0, T, FAR_H);
  const wrap = (x: number, fn: (xx: number) => void): void => { fn(x); if (x < 40) fn(x + T); if (x > T - 40) fn(x - T); };
  for (let i = 0; i < 3; i++) wrap(Math.round(((i + 0.3) * T) / 3), (x) => { disc(g, x, 9, 6, '#ffffff'); disc(g, x + 8, 11, 5, '#ffffff'); disc(g, x - 8, 11, 5, '#ffffff'); });
  for (let i = 0; i < T / 26; i++) wrap(i * 26 + (i % 3) * 5, (x) => disc(g, x, 56, 16 + (i % 4) * 3, i % 2 ? '#8fd18a' : '#7cc47a'));
  const n = Math.max(3, Math.round(T / 80));
  for (let i = 0; i < n; i++) {
    wrap(Math.round(((i + 0.5) * T) / n), (x) => {
      if (i % 3 === 0) { r(g, x - 9, 24, 18, 14, '#c8372d'); poly(g, [[x - 11, 24], [x, 15], [x + 11, 24]], '#7a2a22'); g.fillStyle = '#fff'; g.fillRect(x - 3, 29, 6, 9); } // far barn
      else if (i % 3 === 1) { disc(g, x, 30, 9, INK); disc(g, x, 30, 7.5, '#f2d24a'); g.fillStyle = INK; g.fillRect(x - 8, 36, 16, 3); } // haystack
      else { r(g, x - 1, 22, 3, 16, '#7a4b22'); disc(g, x, 20, 9.5, INK); disc(g, x, 20, 8, '#3dbb52'); } // tree
    });
  }
  return c;
}

/** The road, fences and flowers. Starts at GND_Y. Road centre is y = 85 on screen. */
export function groundLayer(T: number): Cv {
  const [c, g] = mk(T, GND_H);
  g.fillStyle = '#58b84a'; g.fillRect(0, 0, T, GND_H);
  g.fillStyle = '#4aa33f'; g.fillRect(0, 0, T, 3);
  // fence along the back
  for (let x = 4; x < T; x += 20) { g.fillStyle = INK; g.fillRect(x - 1, 5, 5, 15); g.fillStyle = '#c98a3e'; g.fillRect(x, 6, 3, 13); }
  g.fillStyle = INK; g.fillRect(0, 9, T, 4); g.fillRect(0, 15, T, 3);
  g.fillStyle = '#e8c27a'; g.fillRect(0, 10, T, 2); g.fillRect(0, 16, T, 1);
  // road
  const top = 30, h = 38; // screen y 66..104
  g.fillStyle = INK; g.fillRect(0, top - 1, T, h + 2);
  g.fillStyle = '#e3b878'; g.fillRect(0, top, T, h);
  g.fillStyle = '#d3a566'; g.fillRect(0, top, T, 2); g.fillRect(0, top + h - 2, T, 2);
  g.fillStyle = '#c4935a';
  for (let i = 0; i < T / 17; i++) g.fillRect((i * 17 + ((i * 7) % 9)) % T, top + 5 + ((i * 11) % 26), 3, 2);
  // flowers and tufts in the grass
  for (let i = 0; i < T / 26; i++) {
    const x = (i * 26 + 9) % T, y = i % 2 ? 78 : 22 + (i % 3) * 5;
    g.fillStyle = i % 3 ? '#ff7aa8' : '#ffd93d'; g.fillRect(x, y, 3, 3); g.fillRect(x + 1, y - 1, 1, 5);
  }
  return c;
}

/** The fork: width W, starts at GND_Y. The road splits into three; each ends at a hedge where its signpost stands. */
export function forkLayer(W: number): Cv {
  const [c, g] = mk(W, GND_H);
  g.fillStyle = '#58b84a'; g.fillRect(0, 0, W, GND_H);
  g.fillStyle = '#4aa33f'; g.fillRect(0, 0, W, 3);
  const ys = LANE_Y.map((y) => y - GND_Y); // 16, 49, 82
  const band = (cy: number, h: number, col: string): void => {
    g.fillStyle = col;
    g.beginPath(); g.moveTo(0, 49 - 19); g.lineTo(34, 49 - 19); g.bezierCurveTo(54, 49 - 19, 56, cy - h / 2, 76, cy - h / 2); g.lineTo(W, cy - h / 2);
    g.lineTo(W, cy + h / 2); g.lineTo(76, cy + h / 2); g.bezierCurveTo(56, cy + h / 2, 54, 49 + 19, 34, 49 + 19); g.lineTo(0, 49 + 19); g.closePath(); g.fill();
  };
  for (const cy of ys) band(cy, 26, INK);
  for (const cy of ys) band(cy, 24, '#e3b878');
  g.fillStyle = '#c4935a';
  for (let i = 0; i < W / 19; i++) for (const cy of ys) g.fillRect(70 + ((i * 19) % (W - 70)), cy - 8 + ((i * 7 + cy) % 14), 3, 2);
  for (let i = 0; i < 6; i++) { const x = 90 + ((i * 41) % Math.max(40, W - 150)); for (const y of [32, 66]) { g.fillStyle = i % 2 ? '#ff7aa8' : '#ffd93d'; g.fillRect(x, y - 2 + (i % 2) * 3, 3, 3); } }
  // hedge wall at the end of the three roads
  for (let y = -6; y < GND_H + 10; y += 12) { disc(g, W - 4, y, 11, INK); }
  for (let y = -6; y < GND_H + 10; y += 12) { disc(g, W - 4, y, 9.5, y % 24 ? '#2c8a3e' : '#3dbb52'); }
  return c;
}

// ----------------------------------------------------------------- the homes (full-screen scenes, opaque)
export const HOME_OF: Record<string, 'coop' | 'barn' | 'shed' | 'pen' | 'stable'> = { hen: 'coop', cow: 'barn', buffalo: 'shed', goat: 'pen', horse: 'stable' };

export function stationScene(animal: string, W: number, H: number): Cv {
  const [c, g] = mk(W, H);
  const home = HOME_OF[animal] ?? 'coop';
  const dx = doorX(W);
  g.fillStyle = grad(g, 0, 64, home === 'stable' ? '#f4b5a0' : '#7fcbf2', home === 'stable' ? '#ffe6c9' : '#e6f6ff'); g.fillRect(0, 0, W, 66);
  for (const [x, y] of [[W * 0.2, 12], [W * 0.62, 20]]) { disc(g, x, y, 6, '#fff'); disc(g, x + 8, y + 2, 5, '#fff'); disc(g, x - 8, y + 2, 5, '#fff'); }
  for (let i = 0; i < W / 30 + 1; i++) disc(g, i * 30 + 6, 70, 20 + (i % 3) * 4, i % 2 ? '#8fd18a' : '#7cc47a');
  g.fillStyle = '#58b84a'; g.fillRect(0, 64, W, H - 64);
  g.fillStyle = '#4aa33f'; g.fillRect(0, 64, W, 3);
  for (let i = 0; i < W / 22; i++) { const x = (i * 22 + 11) % W, y = 72 + (i % 3) * 5; g.fillStyle = i % 3 ? '#ff7aa8' : '#ffd93d'; g.fillRect(x, y, 3, 3); g.fillRect(x + 1, y - 1, 1, 5); }
  // the yard road
  g.fillStyle = INK; g.fillRect(0, 98, W, H - 98);
  g.fillStyle = '#e3b878'; g.fillRect(0, 99, W, H - 99);
  g.fillStyle = '#d3a566'; g.fillRect(0, 99, W, 2);
  g.fillStyle = '#c4935a'; for (let i = 0; i < W / 16; i++) g.fillRect((i * 16 + ((i * 5) % 7)) % W, 106 + ((i * 11) % 24), 3, 2);
  const doorway = (): void => { r(g, dx - DOOR_W / 2, DOOR_TOP, DOOR_W, DOOR_H, '#3a2a22'); g.fillStyle = '#6b4a2c'; g.fillRect(dx - 11, 90, 22, 8); g.fillStyle = '#f2d24a'; g.fillRect(dx - 8, 88, 16, 3); };
  const tuft = (x: number): void => { g.fillStyle = INK; g.fillRect(x, 95, 3, 4); g.fillRect(x + 4, 93, 3, 6); g.fillStyle = '#58b84a'; g.fillRect(x + 1, 95, 1, 3); g.fillRect(x + 5, 94, 1, 4); };
  if (home === 'coop') {
    r(g, dx - 34, 56, 68, 42, '#c98a3e');
    g.fillStyle = '#b57a30'; for (let y = 62; y < 98; y += 6) g.fillRect(dx - 34, y, 68, 1);
    poly(g, [[dx - 42, 58], [dx, 34], [dx + 42, 58]], '#d8453a');
    g.fillStyle = '#f08070'; g.fillRect(dx - 20, 48, 14, 2);
    doorway();
    poly(g, [[dx - 13, 98], [dx + 13, 98], [dx + 19, 104], [dx - 19, 104]], '#a06a2a');
    r(g, dx - 30, 66, 10, 10, '#bfe9ff'); // window
    for (let x = dx - 76; x < dx - 40; x += 9) { g.fillStyle = '#7a4b22'; g.fillRect(x, 82, 3, 18); g.fillStyle = '#e0b878'; g.fillRect(x, 82, 1, 18); } // wooden fence posts (light, not black)
    g.fillStyle = '#d9a85f'; g.fillRect(dx - 77, 84, 38, 2); g.fillRect(dx - 77, 92, 38, 2); g.fillStyle = '#9a6a2e'; g.fillRect(dx - 77, 86, 38, 1); g.fillRect(dx - 77, 94, 38, 1);
    tuft(dx + 24);
  } else if (home === 'barn') {
    disc(g, dx - 62, 40, 8, INK); r(g, dx - 70, 40, 16, 58, '#b9c0cc'); disc(g, dx - 62, 40, 6.5, '#d4dae4'); // silo
    r(g, dx - 44, 52, 88, 46, '#c8372d');
    poly(g, [[dx - 52, 54], [dx - 36, 32], [dx + 36, 32], [dx + 52, 54]], '#7a2a22');
    r(g, dx - 7, 38, 14, 11, '#fff6dc'); g.fillStyle = INK; g.fillRect(dx - 1, 38, 2, 11);
    g.fillStyle = '#fff'; g.fillRect(dx - 44, 52, 88, 2); g.fillRect(dx - 44, 96, 88, 2);
    doorway();
    g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(dx - 15, DOOR_TOP - 2, 30, DOOR_H + 2); g.beginPath(); g.moveTo(dx - 15, DOOR_TOP - 2); g.lineTo(dx + 15, DOOR_TOP + DOOR_H); g.moveTo(dx + 15, DOOR_TOP - 2); g.lineTo(dx - 15, DOOR_TOP + DOOR_H); g.stroke();
    tuft(dx + 48);
  } else if (home === 'shed') {
    r(g, dx - 40, 52, 4, 46, '#7a4b22'); r(g, dx + 36, 52, 4, 46, '#7a4b22');
    r(g, dx - 32, 58, 64, 40, '#b88a5a');
    poly(g, [[dx - 50, 62], [dx - 34, 36], [dx + 34, 36], [dx + 50, 62]], '#d9b445');
    g.fillStyle = '#b08a20'; for (let x = dx - 40; x < dx + 40; x += 7) g.fillRect(x, 44, 1, 14);
    doorway();
    r(g, dx - 82, 66, 4, 32, '#7a4b22'); disc(g, dx - 80, 62, 14, INK); disc(g, dx - 80, 62, 12.5, '#2c8a3e'); disc(g, dx - 72, 56, 9, '#3dbb52'); // neem tree
    tuft(dx + 44);
  } else if (home === 'pen') {
    poly(g, [[dx - 62, 98], [dx - 46, 68], [dx - 24, 50], [dx + 4, 42], [dx + 30, 54], [dx + 54, 98]], '#9a94a8');
    poly(g, [[dx - 24, 52], [dx + 4, 44], [dx - 6, 62]], '#c9c4d6', false);
    for (const [x, y, w] of [[dx - 60, 90, 14], [dx + 36, 88, 16], [dx + 50, 92, 12]]) r(g, x, y, w, 8, '#b4aebf');
    doorway();
    for (const x of [dx - 20, dx + 20]) r(g, x - 2, 72, 5, 26, '#7a4b22');
    g.fillStyle = INK; g.fillRect(dx - 40, 80, 80, 3); g.fillRect(dx - 40, 90, 80, 3); g.fillStyle = '#a06a2a'; g.fillRect(dx - 40, 81, 80, 1); g.fillRect(dx - 40, 91, 80, 1);
  } else {
    r(g, dx - 40, 54, 80, 44, '#3a8fb7');
    g.fillStyle = '#2f7aa0'; for (let x = dx - 40; x < dx + 40; x += 8) g.fillRect(x, 54, 1, 44);
    poly(g, [[dx - 48, 56], [dx - 34, 36], [dx + 34, 36], [dx + 48, 56]], '#7a4b22');
    g.fillStyle = '#a06a2a'; g.fillRect(dx - 24, 42, 46, 2);
    doorway();
    g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(dx - 15, DOOR_TOP - 2, 30, DOOR_H + 2);
    g.strokeStyle = '#e8e0ff'; g.lineWidth = 2; g.beginPath(); g.arc(dx, 50, 4, 0.6, 5.7); g.stroke(); // horseshoe
    r(g, dx - 72, 82, 16, 16, '#f2d24a'); g.fillStyle = '#e0b020'; g.fillRect(dx - 70, 86, 12, 1); g.fillRect(dx - 70, 92, 12, 1); // hay bale: left of the stable (the right side of the yard is the canvas edge on narrow screens)
  }
  // hedge at the left edge, where the fork's hedge meets this scene
  for (let y = -6; y < H + 10; y += 12) disc(g, 4, y, 11, INK);
  for (let y = -6; y < H + 10; y += 12) disc(g, 4, y, 9.5, y % 24 ? '#2c8a3e' : '#3dbb52');
  return c;
}

/** The closed door that hides the animal (26 x 34, drawn over the doorway) */
export function doorPanel(animal: string): Cv {
  const [c, g] = mk(DOOR_W, DOOR_H);
  const home = HOME_OF[animal] ?? 'coop';
  const col = home === 'coop' ? '#c98a3e' : home === 'barn' ? '#d8453a' : home === 'shed' ? '#d9b45a' : home === 'pen' ? '#8a5a2b' : '#2f6fb0';
  g.fillStyle = INK; g.fillRect(0, 0, DOOR_W, DOOR_H);
  g.fillStyle = col; g.fillRect(1, 1, DOOR_W - 2, DOOR_H - 2);
  g.fillStyle = 'rgba(0,0,0,.18)';
  if (home === 'shed') for (let x = 4; x < DOOR_W; x += 5) g.fillRect(x, 1, 1, DOOR_H - 2);
  else if (home === 'pen') { g.fillRect(1, 8, DOOR_W - 2, 2); g.fillRect(1, 22, DOOR_W - 2, 2); }
  else for (let y = 6; y < DOOR_H; y += 7) g.fillRect(1, y, DOOR_W - 2, 1);
  if (home === 'barn') { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(2, 2); g.lineTo(DOOR_W - 2, DOOR_H - 2); g.moveTo(DOOR_W - 2, 2); g.lineTo(2, DOOR_H - 2); g.stroke(); }
  g.fillStyle = '#ffd93d'; g.fillRect(DOOR_W - 7, 17, 3, 4); g.fillStyle = INK; g.fillRect(DOOR_W - 7, 17, 3, 1);
  return c;
}

// ----------------------------------------------------------------- chore props: frames[k] = after k taps (k = 0..need)
export function propFrames(kind: ChoreKind, need: number, foodIcon: Cv): Cv[] {
  const out: Cv[] = [];
  const frames = need + 1;
  for (let k = 0; k < frames; k++) {
    const [c, g] = mk(36, 32);
    const f = k / need;
    if (kind === 'feed') { // a sack with the food on top
      poly(g, [[4, 30], [32, 30], [30, 12], [6, 12]], '#d9b88a');
      g.fillStyle = '#b8966a'; g.fillRect(8, 16, 20, 1); g.fillRect(8, 22, 20, 1);
      g.fillStyle = INK; g.fillRect(8, 10, 20, 4);
      g.imageSmoothingEnabled = true; g.drawImage(foodIcon, 7, 0, 22, 22);
    } else if (kind === 'water') { // trough
      r(g, 3, 14, 30, 14, '#a06a2a'); g.fillStyle = INK; g.fillRect(5, 16, 26, 7);
      g.fillStyle = '#5fc3f0'; const wh = Math.round(f * 7); g.fillRect(5, 23 - wh, 26, wh); if (wh) { g.fillStyle = '#bfe9ff'; g.fillRect(7, 23 - wh, 8, 1); }
      r(g, 5, 28, 4, 3, '#7a4b22'); r(g, 27, 28, 4, 3, '#7a4b22');
    } else if (kind === 'milk') { // pail
      g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.arc(18, 12, 8, Math.PI, 0); g.stroke();
      poly(g, [[6, 12], [30, 12], [27, 30], [9, 30]], '#b9c0cc');
      g.fillStyle = INK; g.fillRect(6, 11, 24, 3);
      const mh = Math.round(f * 12); g.fillStyle = '#ffffff'; g.fillRect(9, 14, 18, 1); if (mh) { g.fillRect(10, 29 - mh, 16, mh); g.fillStyle = '#dce8f4'; g.fillRect(10, 29 - mh, 16, 1); }
      g.fillStyle = '#e8eef6'; g.fillRect(8, 16, 2, 12);
    } else if (kind === 'eggs') { // nest, eggs appear
      disc(g, 18, 26, 15, INK); g.fillStyle = INK; g.fillRect(3, 14, 30, 12);
      disc(g, 18, 26, 13.5, '#d9a04e'); g.fillStyle = '#d9a04e'; g.fillRect(4, 16, 28, 10);
      g.fillStyle = '#f2d24a'; for (const x of [5, 12, 20, 27]) g.fillRect(x, 20 + (x % 3), 4, 1);
      for (let e = 0; e < k; e++) { const ex = 8 + e * 9; disc(g, ex + 3, 17, 5.5, INK); disc(g, ex + 3, 17, 4.2, '#fff6dc'); g.fillStyle = '#fff'; g.fillRect(ex + 1, 14, 2, 2); }
    } else if (kind === 'mud') { // puddle, more ripples
      g.fillStyle = INK; g.beginPath(); g.ellipse(18, 22, 17, 9, 0, 0, 6.2832); g.fill();
      g.fillStyle = '#8a5a2b'; g.beginPath(); g.ellipse(18, 22, 15.5, 7.5, 0, 0, 6.2832); g.fill();
      g.fillStyle = '#a06a3a'; g.beginPath(); g.ellipse(14, 20, 6, 2.5, 0, 0, 6.2832); g.fill();
      g.strokeStyle = '#c99a60'; g.lineWidth = 1;
      for (let i = 0; i < k; i++) { g.beginPath(); g.ellipse(10 + i * 8, 23, 3 + i, 1.5 + i * 0.5, 0, 0, 6.2832); g.stroke(); }
      g.fillStyle = '#6a3f1e'; g.fillRect(4, 16 - k, 3, 3); g.fillRect(29, 17 - k, 3, 3);
    } else if (kind === 'rock') { // a stepping rock
      poly(g, [[3, 30], [6, 16], [14, 8], [26, 8], [32, 17], [34, 30]], '#a9a3b5');
      g.fillStyle = '#cfcad9'; g.fillRect(14, 10, 10, 2); g.fillStyle = '#8c869a'; g.fillRect(5, 25, 28, 4);
      if (k > 0) { g.fillStyle = '#ffd93d'; g.fillRect(2, 6, 2, 2); g.fillRect(32, 4, 2, 2); }
    } else if (kind === 'hay') { // hay bale; a little smaller each time
      const s = 1 - f * 0.25;
      const w = Math.round(30 * s), h = Math.round(20 * s);
      r(g, Math.round(18 - w / 2), 30 - h, w, h, '#f2d24a');
      g.fillStyle = '#e0b020'; for (let x = 0; x < w; x += 5) g.fillRect(Math.round(18 - w / 2) + x + 1, 30 - h + 2, 1, h - 4);
      g.fillStyle = '#c98a3e'; g.fillRect(Math.round(18 - w / 2), 30 - Math.round(h * 0.6), w, 2);
    } else if (kind === 'brush') { // a brush on a post
      r(g, 16, 10, 5, 20, '#7a4b22');
      r(g, 8, 4, 22, 8, '#c98a3e'); g.fillStyle = INK; for (let x = 9; x < 29; x += 3) g.fillRect(x, 12, 1, 6);
      g.fillStyle = '#e8e0ff'; for (let x = 9; x < 29; x += 3) g.fillRect(x, 12, 1, 5);
    }
    out.push(c);
  }
  return out;
}

// ----------------------------------------------------------------- fx sprites and small things
export interface Fx { drop: Cv; milk: Cv; egg: Cv; mud: Cv; straw: Cv; dust: Cv; leaf: Cv }
export function fxSprites(): Fx {
  const one = (w: number, h: number, fn: (g: G) => void): Cv => { const [c, g] = mk(w, h); fn(g); return c; };
  return {
    drop: one(6, 8, (g) => { g.fillStyle = INK; g.fillRect(2, 0, 2, 1); g.fillRect(1, 1, 4, 6); g.fillRect(2, 7, 2, 1); g.fillStyle = '#5fc3f0'; g.fillRect(2, 1, 2, 1); g.fillRect(2, 2, 3, 4); g.fillStyle = '#d6f1ff'; g.fillRect(2, 3, 1, 2); }),
    milk: one(6, 8, (g) => { g.fillStyle = INK; g.fillRect(2, 0, 2, 1); g.fillRect(1, 1, 4, 6); g.fillRect(2, 7, 2, 1); g.fillStyle = '#ffffff'; g.fillRect(2, 1, 2, 1); g.fillRect(2, 2, 3, 4); }),
    egg: one(9, 11, (g) => { g.fillStyle = INK; g.fillRect(3, 0, 3, 11); g.fillRect(1, 2, 7, 7); g.fillRect(2, 1, 5, 9); g.fillStyle = '#fff6dc'; g.fillRect(3, 1, 3, 9); g.fillRect(2, 3, 5, 5); g.fillStyle = '#fff'; g.fillRect(3, 2, 1, 2); }),
    mud: one(8, 7, (g) => { disc(g, 4, 3.5, 3.6, INK); disc(g, 4, 3.5, 2.6, '#8a5a2b'); }),
    straw: one(8, 4, (g) => { g.fillStyle = INK; g.fillRect(0, 1, 8, 3); g.fillStyle = '#f2d24a'; g.fillRect(1, 2, 6, 1); }),
    dust: one(10, 8, (g) => { disc(g, 5, 4, 4, '#ffffff'); disc(g, 5, 4, 3, '#e8e0ff'); }),
    leaf: one(8, 8, (g) => { g.fillStyle = INK; g.fillRect(1, 1, 6, 6); g.fillStyle = '#4caf50'; g.fillRect(2, 2, 4, 4); g.fillStyle = '#9be564'; g.fillRect(2, 2, 2, 1); }),
  };
}

/** soft glowing ring around the thing to tap (48 x 48) */
export function glowRing(): Cv {
  const [c, g] = mk(48, 48);
  const q = g.createRadialGradient(24, 24, 6, 24, 24, 23);
  q.addColorStop(0, 'rgba(255,246,170,.0)'); q.addColorStop(0.7, 'rgba(255,240,120,.5)'); q.addColorStop(1, 'rgba(255,240,120,0)');
  g.fillStyle = q; g.fillRect(0, 0, 48, 48);
  g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.arc(24, 24, 20, 0, 6.2832); g.stroke();
  g.strokeStyle = '#ffe14a'; g.lineWidth = 1.6; g.beginPath(); g.arc(24, 24, 20, 0, 6.2832); g.stroke();
  return c;
}

/** a bobbing "tap here" arrow (12 x 12) */
export function arrowDown(): Cv {
  const [c, g] = mk(14, 12);
  poly(g, [[7, 11], [1, 3], [13, 3]], '#ffffff');
  return c;
}

/** four little dots: how many chores are done (frames 0..n) */
export function pipFrames(n: number): Cv[] {
  const out: Cv[] = [];
  for (let k = 0; k <= n; k++) {
    const w = n * 12 + 4;
    const [c, g] = mk(w, 14);
    g.fillStyle = INK; g.fillRect(0, 1, w, 12); g.fillStyle = '#fff6dc'; g.fillRect(1, 2, w - 2, 10);
    for (let i = 0; i < n; i++) { disc(g, 8 + i * 12, 7, 4, INK); disc(g, 8 + i * 12, 7, 3, i < k ? '#ffd93d' : '#d8cfae'); }
    out.push(c);
  }
  return out;
}

/** the little tractor/hen gags on the ride are simple sprites from the kit; this is the flat sun */
export function sunSprite(): Cv {
  const [c, g] = mk(22, 22);
  g.fillStyle = '#ffd93d'; for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; g.fillRect(Math.round(11 + Math.cos(a) * 9) - 1, Math.round(11 + Math.sin(a) * 9) - 1, 3, 3); }
  disc(g, 11, 11, 7.5, INK); disc(g, 11, 11, 6.2, '#ffd93d');
  return c;
}
