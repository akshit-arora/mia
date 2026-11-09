// Flat-vector animal sprites for the Jungle trail (ART_BIBLE sections 1, 2, 4).
// Pure drawing code on a 64 x 64 grid: base line y = 58, eye line y = 26, facing right. No DOM here, so it is testable with a fake context.
// Rules kept: <= 6 palette tokens per sprite, one INK contour (4 px at 64), one hard shadow, no gradients, no alpha, no rotation of the sprite as a whole.
// art.ts renders each (animal, pose) ONCE into a canvas; the frame loop only calls drawImage.
type G = CanvasRenderingContext2D;

/** ART_BIBLE palette tokens used by these sprites. */
export const TOK = {
  INK: '#181020', INK_SOFT: '#3A2E4A', PAPER: '#FFF6E5', WATER: '#3FA9D9', SUN: '#FFC93C', LEAF_D: '#1E7A46', LEAF: '#2FA85A',
  BARK: '#8B5A2B', BARK_D: '#5A3A22', SAND: '#F0C987', CORAL: '#E8654A', BERRY: '#B23A6B', DIRT: '#D9A45B',
} as const;
const { INK, INK_SOFT, PAPER, WATER, SUN, LEAF_D, LEAF, BARK, BARK_D, SAND, CORAL, BERRY, DIRT } = TOK;

/** The animals that have a hand-drawn vector sprite. Others fall back to the shared kit sprite. */
export const VECTOR_ANIMALS: readonly string[] = ['bear', 'monkey', 'elephant', 'peacock'];
export const hasVector = (id: string): boolean => VECTOR_ANIMALS.includes(id);
/** 0 = idle, 1 = happy (fed / met) */
export type Pose = 0 | 1;
export const POSES: readonly Pose[] = [0, 1];

const ell = (g: G, x: number, y: number, rx: number, ry: number, rot = 0): void => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); };
/** contour first, fill after: later shapes hide the contour under them, so overlapping limbs stay one flat mass */
const solid = (g: G, col: string): void => { g.lineWidth = 4; g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = INK; g.stroke(); g.fillStyle = col; g.fill(); };
const blob = (g: G, col: string, x: number, y: number, rx: number, ry: number, rot = 0): void => { ell(g, x, y, rx, ry, rot); solid(g, col); };
const flat = (g: G, col: string, x: number, y: number, rx: number, ry: number, rot = 0): void => { ell(g, x, y, rx, ry, rot); g.fillStyle = col; g.fill(); };
/** a thick limb or tail: INK under, colour over */
const limb = (g: G, col: string, w: number, trace: () => void): void => {
  g.lineCap = 'round'; g.lineJoin = 'round';
  trace(); g.lineWidth = w + 4; g.strokeStyle = INK; g.stroke();
  trace(); g.lineWidth = w; g.strokeStyle = col; g.stroke();
};
const eye = (g: G, x: number, y: number, happy: boolean): void => {
  if (happy) { g.beginPath(); g.arc(x, y + 1, 2.4, Math.PI * 1.1, Math.PI * 1.9); g.lineWidth = 2; g.lineCap = 'round'; g.strokeStyle = INK; g.stroke(); return; }
  flat(g, INK, x, y, 2.2, 2.8); flat(g, PAPER, x + 0.8, y - 1, 0.9, 0.9);
};

function bear(g: G, happy: boolean): void {
  flat(g, BARK_D, 33, 59, 22, 3);
  g.translate(0, happy ? -3 : 0);
  blob(g, BARK_D, 22, 51, 6, 7); blob(g, BARK_D, 44, 51, 6, 7);
  blob(g, BARK, 30, 40, 20, 15);
  blob(g, BARK, 25, 52, 6, 6.5); blob(g, BARK, 38, 52, 6, 6.5);
  blob(g, BARK, 39, 17, 5, 5); blob(g, BARK, 53, 17, 5, 5);
  blob(g, BARK, 46, 29, 13, 12);
  blob(g, DIRT, 54, 33, 7.5, 5.5);
  flat(g, INK, 58.5, 31, 2.6, 2);
  if (happy) { blob(g, CORAL, 55, 37.5, 4, 3); }
  eye(g, 47, 25.5, happy);
}

function monkey(g: G, happy: boolean): void {
  flat(g, BARK_D, 32, 59, 20, 3);
  g.translate(0, happy ? -3 : 0);
  limb(g, BARK, 3, () => { g.beginPath(); g.moveTo(17, 46); g.bezierCurveTo(3, 46, 2, 24, 14, 27); });
  blob(g, BARK_D, 22, 56, 7, 3.5); blob(g, BARK_D, 36, 56, 7, 3.5);
  blob(g, BARK, 28, 43, 12, 14);
  blob(g, SAND, 31, 45, 7, 9);
  if (happy) blob(g, BARK, 41, 31, 4, 9, 0.5); else blob(g, BARK, 38, 45, 4, 9, -0.25);
  blob(g, BARK, 36, 26, 5, 6); blob(g, BARK, 58, 26, 5, 6);
  blob(g, BARK, 47, 25, 12, 11);
  blob(g, SAND, 51, 28.5, 9, 7.5);
  eye(g, 47, 24, happy); eye(g, 55, 24, happy);
  if (happy) blob(g, CORAL, 51, 32.5, 3.5, 2.5);
  else { g.beginPath(); g.moveTo(48, 32); g.lineTo(54, 32); g.lineWidth = 1.5; g.strokeStyle = INK; g.stroke(); }
}

function elephant(g: G, happy: boolean): void {
  flat(g, INK_SOFT, 33, 59, 24, 3);
  g.translate(0, happy ? -2 : 0);
  blob(g, INK_SOFT, 18, 52, 6.5, 7); blob(g, INK_SOFT, 42, 52, 6.5, 7);
  blob(g, INK_SOFT, 28, 38, 21, 16);
  blob(g, INK_SOFT, 25, 53, 6.5, 6.5); blob(g, INK_SOFT, 34, 53, 6.5, 6.5);
  blob(g, INK_SOFT, 47, 27, 12.5, 11.5);
  blob(g, BERRY, 38, 29, 7, 10.5);
  if (happy) limb(g, INK_SOFT, 6, () => { g.beginPath(); g.moveTo(55, 31); g.bezierCurveTo(65, 30, 67, 14, 60, 10); });
  else limb(g, INK_SOFT, 6, () => { g.beginPath(); g.moveTo(55, 31); g.quadraticCurveTo(64, 42, 57, 55); });
  blob(g, PAPER, 53.5, 38, 2, 4, 0.5);
  eye(g, 50, 24, happy);
}

function peacock(g: G, happy: boolean): void {
  flat(g, LEAF_D, 31, 59, 20, 3);
  g.translate(0, happy ? -2 : 0);
  if (happy) { // the fan: five feathers with eyespots
    for (let i = 0; i < 5; i++) {
      const a = (-175 + i * 30) * Math.PI / 180, cx = 26 + Math.cos(a) * 15, cy = 40 + Math.sin(a) * 15;
      blob(g, i % 2 ? LEAF : LEAF_D, cx, cy, 11, 5.5, a);
      flat(g, SUN, 26 + Math.cos(a) * 24, 40 + Math.sin(a) * 24, 2.6, 2.6); flat(g, WATER, 26 + Math.cos(a) * 24, 40 + Math.sin(a) * 24, 1.2, 1.2);
    }
  } else { // the tail trails behind
    blob(g, LEAF_D, 15, 49, 14, 6, -0.3); flat(g, LEAF, 13, 50, 7, 2.2, -0.3); flat(g, SUN, 3, 46, 2.2, 2.2);
  }
  limb(g, INK, 1.5, () => { g.beginPath(); g.moveTo(30, 50); g.lineTo(30, 58); });
  limb(g, INK, 1.5, () => { g.beginPath(); g.moveTo(38, 50); g.lineTo(38, 58); });
  blob(g, WATER, 34, 42, 14, 10, -0.3);
  limb(g, WATER, 6, () => { g.beginPath(); g.moveTo(41, 38); g.quadraticCurveTo(48, 32, 49, 22); });
  blob(g, WATER, 50, 19, 6.5, 6);
  for (const dx of [-3, 0, 3]) limb(g, SUN, 1.2, () => { g.beginPath(); g.moveTo(50 + dx, 14); g.lineTo(50 + dx * 1.6, 8); });
  g.beginPath(); g.moveTo(55, 17); g.lineTo(61, 20); g.lineTo(55, 23); g.closePath(); solid(g, SUN);
  eye(g, 51, 18, happy);
}

const DRAW: Record<string, (g: G, happy: boolean) => void> = { bear, monkey, elephant, peacock };

/** Draw one animal on the 64 x 64 grid. The caller sets the scale. */
export function drawAnimal(g: G, id: string, pose: Pose): boolean {
  const fn = DRAW[id];
  if (!fn) return false;
  g.save(); fn(g, pose === 1); g.restore();
  return true;
}
