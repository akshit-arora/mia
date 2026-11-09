// Farm Dash: all art is built here ONCE (pre-rendered canvases); the frame loop only calls drawImage on them.
// Flat vector per ART_BIBLE: one INK contour, hard shadows, no gradients, no alpha. Tokens come from the ART_BIBLE palette table.
import { INK, disc, mk, type Cv } from '../../cards/scenes';
import { TOK } from '../forage/sprites';
import { GROUND_Y, HIGH_CLEARANCE, OBSTACLES, type ObstacleDef } from './logic';
import { POSE_DEFS, drawRunner } from './sprites';

type G = CanvasRenderingContext2D;

/** ART_BIBLE tokens used by the scenery and props (the animal tokens live in forage/sprites TOK). */
export const PAL = {
  INK, INK_SOFT: TOK.INK_SOFT, PAPER: TOK.PAPER, SKY: '#86D7F2', WATER: TOK.WATER, SUN: TOK.SUN, LEAF_D: TOK.LEAF_D, LEAF: TOK.LEAF, LEAF_L: '#7BD389',
  BARK: TOK.BARK, BARK_D: TOK.BARK_D, DIRT: TOK.DIRT, DIRT_D: '#B07A3F', SAND: TOK.SAND, CORAL: TOK.CORAL, FARM: '#E8A33B',
} as const;
const P = PAL;

export const RUNNER_PX = 48; // the runner sprite cell; the base line (y = 58 of 64) sits on the ground line
export const RUNNER_BASE = Math.round((58 * RUNNER_PX) / 64); // 44
export const GROUND_TOP = GROUND_Y - 3; // the grass edge starts a little above the runner's feet
export const GROUND_H = 135 - GROUND_TOP;
export const BEAM_Y = 14; // hanging obstacles hang from here

/** A runner pose rendered once at `size` px square. */
export function runnerImage(id: string, pose: number, size = RUNNER_PX): Cv {
  const [c, g] = mk(size, size);
  g.scale(size / 64, size / 64);
  drawRunner(g, id, pose);
  return c;
}
export const POSE_TOTAL = POSE_DEFS.length;

/** The hard contact shadow under the runner: one solid token, never alpha. */
export function shadowImage(w: number): Cv {
  const [c, g] = mk(w, 5);
  g.fillStyle = P.DIRT_D; g.beginPath(); g.ellipse(w / 2, 2.5, w / 2, 2.5, 0, 0, 6.2832); g.fill();
  return c;
}

// ----------------------------------------------------------------- obstacles
const contour = (g: G): void => { g.lineWidth = 2; g.lineJoin = 'round'; g.strokeStyle = P.INK; g.stroke(); };
const rrect = (g: G, x: number, y: number, w: number, h: number, r: number, fill: string): void => {
  g.beginPath(); g.roundRect(x, y, w, h, r); contour(g); g.fillStyle = fill; g.fill();
};

function puddle(o: ObstacleDef): Cv {
  const w = o.w + 4, h = 10;
  const [c, g] = mk(w, h);
  g.beginPath(); g.ellipse(w / 2, h / 2 + 1, o.w / 2, 3.6, 0, 0, 6.2832); contour(g); g.fillStyle = P.WATER; g.fill();
  g.fillStyle = P.PAPER; g.fillRect(w / 2 - 6, h / 2 - 1, 7, 1.5); g.fillRect(w / 2 + 3, h / 2 + 1.5, 4, 1.5);
  return c;
}
function hay(o: ObstacleDef): Cv {
  const w = o.w + 2, h = o.h + 5;
  const [c, g] = mk(w, h);
  rrect(g, 1.5, 1.5, w - 3, h - 3, 3, P.SUN);
  g.fillStyle = P.FARM; g.fillRect(6, 2, 2, h - 4); g.fillRect(w - 8, 2, 2, h - 4);
  g.fillStyle = P.SAND; g.fillRect(3, 4, 3, 1.5); g.fillRect(w - 6, h - 6, 3, 1.5);
  return c;
}
function fence(o: ObstacleDef): Cv {
  const w = o.w + 4, h = o.h + 3;
  const [c, g] = mk(w, h);
  g.fillStyle = P.INK; g.fillRect(1, 5, w - 2, 4); g.fillRect(1, 11, w - 2, 3); // rails
  g.fillStyle = P.SAND; g.fillRect(2, 6, w - 4, 2); g.fillRect(2, 11.5, w - 4, 1.6);
  for (const x of [2, w - 7]) { g.fillStyle = P.INK; g.fillRect(x - 1, 1, 6, h - 1); g.fillStyle = P.BARK; g.fillRect(x, 2, 4, h - 3); }
  return c;
}
/** a hanging leafy branch: from the beam down to HIGH_CLEARANCE above the ground */
function branch(o: ObstacleDef): Cv {
  const w = o.w + 4, h = GROUND_Y - HIGH_CLEARANCE - BEAM_Y + 1;
  const [c, g] = mk(w, h);
  g.fillStyle = P.INK; g.fillRect(w / 2 - 4, 0, 8, h - 12);
  g.fillStyle = P.BARK; g.fillRect(w / 2 - 2.5, 0, 5, h - 12); g.fillStyle = P.BARK_D; g.fillRect(w / 2 + 0.5, 0, 2, h - 12);
  const leaves: [number, number, number, string][] = [[w / 2 - 8, h - 10, 8, P.LEAF_D], [w / 2 + 8, h - 10, 8, P.LEAF_D], [w / 2, h - 12, 9.5, P.LEAF]];
  for (const [x, y, r] of leaves) disc(g, x, y, r + 2, P.INK);
  for (const [x, y, r, col] of leaves) disc(g, x, y, r, col);
  g.fillStyle = P.LEAF_L; g.fillRect(w / 2 - 3, h - 17, 5, 2);
  return c;
}
/** a crate swinging on a rope */
function crate(o: ObstacleDef): Cv {
  const w = o.w + 4, h = GROUND_Y - HIGH_CLEARANCE - BEAM_Y + 1;
  const [c, g] = mk(w, h);
  g.fillStyle = P.INK; g.fillRect(w / 2 - 1.5, 0, 3, h - 16);
  g.fillStyle = P.SAND; g.fillRect(w / 2 - 0.5, 0, 1, h - 16);
  rrect(g, 2, h - 18, w - 4, 17, 2, P.BARK);
  g.fillStyle = P.BARK_D; g.fillRect(4, h - 12, w - 8, 2); g.fillRect(4, h - 7, w - 8, 2);
  g.fillStyle = P.SAND; g.fillRect(4, h - 16, w - 8, 2);
  return c;
}
const MAKE: Record<string, (o: ObstacleDef) => Cv> = { puddle, hay, fence, branch, crate };
/** [kind][variant] obstacle sprites. A LOW sprite is bottom-aligned on the ground, a HIGH sprite hangs from BEAM_Y. */
export const obstacleSprites = (): Record<'low' | 'high', Cv[]> => ({
  low: OBSTACLES.low.map((o) => MAKE[o.id](o)),
  high: OBSTACLES.high.map((o) => MAKE[o.id](o)),
});

// ----------------------------------------------------------------- scenery (tile-wrapped; T = the canvas width, 240)
const wrap = (T: number, x: number, fn: (xx: number) => void): void => { fn(x); if (x < 40) fn(x + T); if (x > T - 40) fn(x - T); };

/** far layer: sky, sun, clouds, hills, the red barn and a silo. Height GROUND_Y. */
export function farLayer(T: number): Cv {
  const [c, g] = mk(T, GROUND_Y);
  g.fillStyle = P.SKY; g.fillRect(0, 0, T, GROUND_Y);
  disc(g, 196, 24, 12, P.INK); disc(g, 196, 24, 10.5, P.SUN);
  for (const [x, y] of [[40, 22], [120, 34], [176, 14]]) wrap(T, x, (xx) => {
    for (const [dx, dy, r] of [[0, 0, 7], [8, -3, 8], [17, 0, 6]]) disc(g, xx + dx, y + dy, r + 1.5, P.INK);
    for (const [dx, dy, r] of [[0, 0, 7], [8, -3, 8], [17, 0, 6]]) disc(g, xx + dx, y + dy, r, P.PAPER);
  });
  for (let i = 0; i < T / 40; i++) wrap(T, i * 40 + 8, (xx) => { disc(g, xx, GROUND_Y - 10, 30 + (i % 3) * 4, P.INK); });
  for (let i = 0; i < T / 40; i++) wrap(T, i * 40 + 8, (xx) => { disc(g, xx, GROUND_Y - 10, 28.5 + (i % 3) * 4, i % 2 ? P.LEAF_L : P.LEAF); });
  // barn
  wrap(T, 60, (bx) => {
    g.fillStyle = P.INK; g.fillRect(bx - 21, 52, 42, 34); g.beginPath(); g.moveTo(bx - 25, 54); g.lineTo(bx, 34); g.lineTo(bx + 25, 54); g.fill();
    g.fillStyle = P.CORAL; g.fillRect(bx - 19, 54, 38, 30);
    g.fillStyle = P.BARK_D; g.beginPath(); g.moveTo(bx - 22, 53); g.lineTo(bx, 37); g.lineTo(bx + 22, 53); g.lineTo(bx + 17, 53); g.lineTo(bx, 42); g.lineTo(bx - 17, 53); g.fill();
    g.fillStyle = P.INK; g.fillRect(bx - 8, 62, 16, 22); g.fillStyle = P.PAPER; g.fillRect(bx - 6, 64, 12, 20);
    g.fillStyle = P.INK; g.fillRect(bx - 6, 63, 12, 2); g.fillRect(bx - 0.75, 64, 1.5, 20);
  });
  // silo
  wrap(T, 112, (sx) => {
    g.fillStyle = P.INK; g.fillRect(sx - 8, 48, 16, 38); disc(g, sx, 48, 8, P.INK);
    g.fillStyle = P.PAPER; g.fillRect(sx - 6, 48, 12, 36); disc(g, sx, 48, 6, P.PAPER);
    g.fillStyle = P.BARK_D; g.fillRect(sx - 6, 62, 12, 2); g.fillRect(sx - 6, 74, 12, 2);
  });
  return c;
}

/** mid layer: field rows, a far fence. Height 135 - 72, shown from y = 72. */
export const MID_Y = 72;
export function midLayer(T: number): Cv {
  const h = GROUND_Y - MID_Y + 2;
  const [c, g] = mk(T, h);
  g.fillStyle = P.LEAF; g.fillRect(0, 0, T, h);
  g.fillStyle = P.LEAF_D; for (let y = 8; y < h; y += 10) g.fillRect(0, y, T, 3);
  g.fillStyle = P.FARM; for (let y = 5; y < h; y += 10) for (let x = 0; x < T; x += 6) g.fillRect(x, y, 3, 2); // wheat tips
  g.fillStyle = P.INK; g.fillRect(0, 0, T, 2);
  for (let x = 6; x < T; x += 30) { g.fillStyle = P.INK; g.fillRect(x - 1, 0, 6, 11); g.fillStyle = P.BARK; g.fillRect(x, 1, 4, 9); }
  g.fillStyle = P.INK; g.fillRect(0, 3, T, 4); g.fillStyle = P.SAND; g.fillRect(0, 4, T, 2);
  return c;
}

/** ground layer: grass edge and dirt path with stones and tufts. Height GROUND_H, scrolls at full speed. */
export function groundLayer(T: number): Cv {
  const [c, g] = mk(T, GROUND_H);
  g.fillStyle = P.INK; g.fillRect(0, 0, T, 6);
  g.fillStyle = P.LEAF_L; g.fillRect(0, 1, T, 4);
  g.fillStyle = P.LEAF; for (let x = 4; x < T; x += 20) { g.fillRect(x, 1, 3, 2); g.fillRect(x + 8, 3, 3, 2); }
  g.fillStyle = P.DIRT; g.fillRect(0, 6, T, GROUND_H - 6);
  g.fillStyle = P.DIRT_D; g.fillRect(0, 6, T, 2);
  for (let i = 0; i < T / 17; i++) g.fillRect((i * 17 + ((i * 7) % 9)) % T, 14 + ((i * 29) % (GROUND_H - 18)), 4, 2);
  g.fillStyle = P.SAND; for (let i = 0; i < T / 23; i++) g.fillRect((i * 23 + ((i * 11) % 13)) % T, 12 + ((i * 17) % (GROUND_H - 16)), 3, 1.5);
  return c;
}

// ----------------------------------------------------------------- small UI sprites
/** Tiny hint arrows (run one only): up for hop, down for duck. */
export function hintArrow(up: boolean): Cv {
  const [c, g] = mk(16, 14);
  g.beginPath();
  if (up) { g.moveTo(8, 2); g.lineTo(14, 12); g.lineTo(2, 12); } else { g.moveTo(8, 12); g.lineTo(14, 2); g.lineTo(2, 2); }
  g.closePath(); contour(g); g.fillStyle = P.PAPER; g.fill();
  return c;
}

/** A floating food on a round paper plate with one INK ring, so every food reads on any background (own foods and decoys alike). */
export function foodPlate(icon: Cv, size: number): Cv {
  const [c, g] = mk(size, size), r = size / 2;
  disc(g, r, r, r, P.INK); disc(g, r, r, r - 1.5, P.PAPER);
  g.imageSmoothingEnabled = true; const s = size - 5; g.drawImage(icon, (size - s) / 2, (size - s) / 2, s, s);
  return c;
}

/** The basket pips: five slots, `n` of them filled with the animal's own food. One canvas per count, built once. */
export function basketPips(icon: Cv, n: number): Cv {
  const slot = 13, w = 5 * slot + 4, h = 17;
  const [c, g] = mk(w, h);
  g.fillStyle = P.INK; g.fillRect(0, 0, w, h);
  g.fillStyle = P.SAND; g.fillRect(1, 1, w - 2, h - 2);
  for (let i = 0; i < 5; i++) {
    const x = 3 + i * slot;
    g.fillStyle = P.INK; g.fillRect(x, 3, 12, 11);
    g.fillStyle = i < n ? P.PAPER : P.BARK_D; g.fillRect(x + 1, 4, 10, 9);
    if (i < n) { g.imageSmoothingEnabled = true; g.drawImage(icon, x + 0.5, 3.5, 11, 11); }
  }
  return c;
}
