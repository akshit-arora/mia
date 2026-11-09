// Flat-vector runner sprites for Farm Dash: hen, cow, goat (ART_BIBLE sections 1, 2, 4).
// Pure drawing code on the same 64 x 64 grid as the Jungle animals: base line y = 58, facing right, one INK contour, <= 6 palette tokens per
// sprite, no gradients, no alpha, no rotation of the whole sprite. The contact shadow is NOT drawn here: art.ts draws one hard shadow on the
// ground so it stays put while the animal hops. art.ts renders each (animal, pose) ONCE; the frame loop only calls drawImage.
// Poses: 0, 1, 2 = run cycle, 3 = jump, 4 = duck, 5 = stumble, 6 = happy (the basket is full / fed).
import { TOK, blob, eye, flat, limb } from '../forage/sprites';

type G = CanvasRenderingContext2D;
const { INK, INK_SOFT, PAPER, SUN, BARK_D, SAND, CORAL, DIRT } = TOK;

/** [dx, lift] of a foot relative to its hip. */
type Foot = readonly [number, number];
interface PoseDef {
  dy: number; // whole-body drop (a bob, a squat)
  sq: number; // body squash (1 = none)
  legs: readonly [Foot, Foot, Foot, Foot]; // back far, back near, front far, front near (a hen uses the first two)
  head: readonly [number, number]; // head offset
  eyes: 'open' | 'happy' | 'dizzy';
  tailUp: boolean;
  stars: boolean; // dizzy stars over the head (stumble)
}
const F = (dx: number, lift: number): Foot => [dx, lift];
export const POSE_DEFS: readonly PoseDef[] = [
  { dy: 0, sq: 1, legs: [F(-5, 0), F(1, 3), F(5, 0), F(-1, 3)], head: [0, 0], eyes: 'open', tailUp: false, stars: false },
  { dy: -1, sq: 1, legs: [F(0, 3), F(3, 3), F(0, 3), F(3, 3)], head: [0, -1], eyes: 'open', tailUp: false, stars: false },
  { dy: 0, sq: 1, legs: [F(1, 3), F(-5, 0), F(-1, 3), F(5, 0)], head: [0, 0], eyes: 'open', tailUp: false, stars: false },
  { dy: -1, sq: 1, legs: [F(-8, 3), F(-5, 5), F(8, 3), F(5, 5)], head: [1, -1], eyes: 'open', tailUp: true, stars: false },
  { dy: 9, sq: 0.72, legs: [F(-4, 0), F(2, 0), F(5, 0), F(-1, 0)], head: [4, 9], eyes: 'open', tailUp: false, stars: false },
  { dy: 3, sq: 1, legs: [F(-4, 6), F(-1, 7), F(4, 0), F(7, 0)], head: [5, 9], eyes: 'dizzy', tailUp: true, stars: true },
  { dy: -2, sq: 1, legs: [F(-1, 0), F(2, 0), F(1, 0), F(4, 0)], head: [0, -1], eyes: 'happy', tailUp: false, stars: false },
];

const dizzy = (g: G, x: number, y: number): void => {
  g.lineWidth = 1.6; g.lineCap = 'round'; g.strokeStyle = INK;
  g.beginPath(); g.moveTo(x - 2, y - 2); g.lineTo(x + 2, y + 2); g.moveTo(x + 2, y - 2); g.lineTo(x - 2, y + 2); g.stroke();
};
const eyes = (g: G, p: PoseDef, x: number, y: number): void => { if (p.eyes === 'dizzy') dizzy(g, x, y); else eye(g, x, y, p.eyes === 'happy'); };
const stars = (g: G, x: number, y: number): void => { for (const [dx, dy] of [[-6, 0], [1, -4], [7, 1]]) { flat(g, SUN, x + dx, y + dy, 2, 2); } };
/** one leg: hip to foot, INK contour under colour; `hoof` is a small cap at the foot */
const leg = (g: G, col: string, hoof: string, w: number, hx: number, hy: number, f: Foot): void => {
  const fx = hx + f[0], fy = 58 - f[1];
  limb(g, col, w, () => { g.beginPath(); g.moveTo(hx, hy); g.lineTo(fx, fy - 1); });
  flat(g, hoof, fx, fy - 0.5, w / 2 + 0.6, 1.8);
};

function cow(g: G, pose: number): void {
  const p = POSE_DEFS[pose], dy = p.dy, [hx, hy] = p.head, hipY = 46 + dy * 0.5;
  // far legs first, then the body, then the near legs
  leg(g, PAPER, INK_SOFT, 5, 15, hipY, p.legs[0]); leg(g, PAPER, INK_SOFT, 5, 38, hipY, p.legs[2]);
  limb(g, INK_SOFT, 2, () => { g.beginPath(); g.moveTo(9, 33 + dy); if (p.tailUp) g.quadraticCurveTo(3, 24 + dy, 7, 18 + dy); else g.quadraticCurveTo(3, 40 + dy, 6, 48 + dy); });
  blob(g, PAPER, 29, 39 + dy, 21, 13 * p.sq);
  flat(g, INK_SOFT, 22, 34 + dy * 0.9, 5.5, 4 * p.sq); flat(g, INK_SOFT, 35, 41 + dy, 4.5, 3.5 * p.sq);
  blob(g, PAPER, 42, 33 + dy * 0.9 + hy * 0.4, 8, 9);
  limb(g, SAND, 2.2, () => { g.beginPath(); g.moveTo(47 + hx, 21 + hy + dy); g.quadraticCurveTo(46 + hx, 15 + hy + dy, 43 + hx, 14 + hy + dy); });
  blob(g, PAPER, 43 + hx, 23 + hy + dy, 4.5, 3, -0.6);
  blob(g, PAPER, 49 + hx, 28 + hy + dy, 10, 9);
  blob(g, CORAL, 56 + hx, 32 + hy + dy, 6, 4.8);
  flat(g, INK, 58 + hx, 31.5 + hy + dy, 1.1, 1.3); flat(g, INK, 55 + hx, 31.5 + hy + dy, 1.1, 1.3);
  eyes(g, p, 49 + hx, 25 + hy + dy);
  leg(g, PAPER, INK_SOFT, 5, 21, hipY, p.legs[1]); leg(g, PAPER, INK_SOFT, 5, 44, hipY, p.legs[3]);
  if (p.stars) stars(g, 48 + hx, 12 + hy + dy);
}

function goat(g: G, pose: number): void {
  const p = POSE_DEFS[pose], dy = p.dy, [hx, hy] = p.head, hipY = 45 + dy * 0.5;
  leg(g, DIRT, BARK_D, 3.6, 18, hipY, p.legs[0]); leg(g, DIRT, BARK_D, 3.6, 36, hipY, p.legs[2]);
  blob(g, DIRT, p.tailUp ? 12 : 11, p.tailUp ? 30 + dy : 34 + dy, 3, 4.5, p.tailUp ? -0.3 : 0.4);
  blob(g, DIRT, 28, 39 + dy, 17, 11 * p.sq);
  flat(g, PAPER, 29, 44 + dy, 9, 4 * p.sq);
  blob(g, DIRT, 40, 33 + dy * 0.9 + hy * 0.4, 6, 8);
  limb(g, BARK_D, 3, () => { g.beginPath(); g.moveTo(44 + hx, 21 + hy + dy); g.quadraticCurveTo(41 + hx, 11 + hy + dy, 34 + hx, 14 + hy + dy); });
  blob(g, DIRT, 40 + hx, 25 + hy + dy, 5, 2.5, -0.25);
  blob(g, DIRT, 46 + hx, 27 + hy + dy, 8.5, 7.5);
  blob(g, SAND, 53 + hx, 30 + hy + dy, 5.2, 4.2);
  blob(g, PAPER, 52 + hx, 37 + hy + dy, 2.4, 4.4);
  flat(g, INK, 56 + hx, 29.5 + hy + dy, 1.2, 1.3);
  eyes(g, p, 47 + hx, 24 + hy + dy);
  if (p.eyes === 'happy') { g.beginPath(); g.moveTo(52 + hx, 33 + hy + dy); g.quadraticCurveTo(54 + hx, 35 + hy + dy, 56 + hx, 33 + hy + dy); g.lineWidth = 1.4; g.strokeStyle = INK; g.stroke(); }
  leg(g, DIRT, BARK_D, 3.6, 23, hipY, p.legs[1]); leg(g, DIRT, BARK_D, 3.6, 41, hipY, p.legs[3]);
  if (p.stars) stars(g, 46 + hx, 10 + hy + dy);
}

function hen(g: G, pose: number): void {
  const p = POSE_DEFS[pose], dy = p.dy, [hx, hy] = p.head;
  const jump = pose === 3;
  leg(g, SUN, SUN, 2.2, 28, 49 + dy * 0.5, p.legs[0]); leg(g, SUN, SUN, 2.2, 34, 49 + dy * 0.5, p.legs[1]);
  blob(g, DIRT, 14, p.tailUp ? 30 + dy : 36 + dy, 5, 10, p.tailUp ? 0.3 : -0.5); // the tail feathers
  blob(g, PAPER, 30, 42 + dy, 15, 12 * p.sq);
  blob(g, DIRT, 28, jump ? 38 + dy : 43 + dy, 8.5, 5.5 * (p.sq < 1 ? 0.8 : 1), jump ? -0.6 : 0.2); // the wing (up when hopping)
  blob(g, PAPER, 41 + hx * 0.7, 32 + dy * 0.9 + hy * 0.5, 6, 8); // the neck
  blob(g, CORAL, 43 + hx, 20 + hy + dy, 3.4, 3.2); blob(g, CORAL, 47 + hx, 21 + hy + dy, 2.6, 2.6); // the comb
  blob(g, PAPER, 44 + hx, 27 + hy + dy, 7, 7);
  g.beginPath(); g.moveTo(49 + hx, 25 + hy + dy); g.lineTo(57 + hx, 28 + hy + dy); g.lineTo(49 + hx, 31 + hy + dy); g.closePath();
  g.lineWidth = 3.4; g.lineJoin = 'round'; g.strokeStyle = INK; g.stroke(); g.fillStyle = SUN; g.fill(); // the beak
  blob(g, CORAL, 49 + hx, 34 + hy + dy, 2.2, 3.2); // the wattle
  eyes(g, p, 44 + hx, 25 + hy + dy);
  if (p.stars) stars(g, 44 + hx, 12 + hy + dy);
}

const DRAW: Record<string, (g: G, pose: number) => void> = { hen, cow, goat };
export const hasDashSprite = (id: string): boolean => id in DRAW;

/** Draw one runner pose on the 64 x 64 grid. The caller sets the scale. */
export function drawRunner(g: G, id: string, pose: number): boolean {
  const fn = DRAW[id];
  if (!fn || pose < 0 || pose >= POSE_DEFS.length) return false;
  g.save(); fn(g, pose); g.restore();
  return true;
}
