// Canvas-drawn 32x32 icons for facts that have no good emoji. Drawn once into small canvases (see kit.ts).
// Style matches the baked atlas: flat colours, 1 px dark outline. Each has its own SHAPE and COLOUR
// (declared in src/data/card-icons.json; tools/validate-pack.mjs checks the pairs are distinct per group).
// Keep the key format `  'group.id': (g) =>` : the validator reads the ids from this file.
type G = CanvasRenderingContext2D;
const INK = '#181020';

const disc = (g: G, x: number, y: number, r: number, c: string): void => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill(); };
const outDisc = (g: G, x: number, y: number, r: number, c: string): void => { disc(g, x, y, r + 1.5, INK); disc(g, x, y, r, c); };
const box = (g: G, x: number, y: number, w: number, h: number, c: string): void => { g.fillStyle = INK; g.fillRect(x - 1, y - 1, w + 2, h + 2); g.fillStyle = c; g.fillRect(x, y, w, h); };
function poly(g: G, pts: number[], c: string): void {
  g.beginPath(); g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.closePath(); g.lineJoin = 'round';
  g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); g.fillStyle = c; g.fill();
}
function paw(g: G, cx: number, cy: number, s: number, c: string): void {
  disc(g, cx, cy + 2 * s, 3.4 * s, c);
  disc(g, cx - 4.2 * s, cy - 1.8 * s, 1.9 * s, c); disc(g, cx - 1.6 * s, cy - 4.6 * s, 1.9 * s, c);
  disc(g, cx + 1.6 * s, cy - 4.6 * s, 1.9 * s, c); disc(g, cx + 4.2 * s, cy - 1.8 * s, 1.9 * s, c);
}

export const DRAWN: Record<string, (g: G) => void> = {
  // lime tuft of grass blades
  'food.grass': (g) => {
    poly(g, [6, 29, 8, 12, 12, 24, 13, 7, 17, 24, 20, 3, 22, 26, 26, 11, 27, 29], '#9be03c');
    g.fillStyle = '#5aa21e'; g.fillRect(8, 26, 19, 3);
    g.fillStyle = '#d7f59a'; g.fillRect(13, 10, 1, 8); g.fillRect(20, 7, 1, 8);
  },
  // purple sugarcane stalks with joints and green leaves
  'food.sugarcane': (g) => {
    const stalk = (x: number, y0: number, tilt: number): void => {
      for (let y = y0, k = 0; y < 30; y += 6, k++) {
        const dx = Math.round(((y - y0) * tilt) / 24);
        box(g, x + dx, y, 6, 6, k % 2 ? '#a566cc' : '#7d3fa6');
      }
    };
    stalk(7, 9, -1); stalk(19, 4, 1);
    poly(g, [3, 8, 11, 2, 12, 8], '#4caf50'); poly(g, [17, 3, 28, 0, 25, 7], '#4caf50');
  },
  // brown heap of seeds
  'food.seeds': (g) => {
    const seed = (x: number, y: number, a: number): void => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = INK; g.beginPath(); g.ellipse(0, 0, 4.6, 3, 0, 0, 6.2832); g.fill(); g.fillStyle = '#c98a3e'; g.beginPath(); g.ellipse(0, 0, 3.4, 2, 0, 0, 6.2832); g.fill(); g.restore(); };
    for (const [x, y, a] of [[8, 26, 0.3], [16, 27, -0.2], [24, 26, 0.4], [12, 20, -0.5], [20, 20, 0.5], [16, 14, 0.1], [6, 21, 0.9], [26, 21, -0.7]] as number[][]) seed(x, y, a);
    g.fillStyle = '#e8c27a'; g.fillRect(15, 13, 2, 1); g.fillRect(11, 19, 2, 1); g.fillRect(19, 19, 2, 1);
  },
  // plain covered meal bowl: grey dome lid on a red bowl. No food shown on purpose (no drumstick, no prey).
  'food.meal': (g) => {
    outDisc(g, 16, 8, 2.5, '#e8eef5');
    g.beginPath(); g.moveTo(3, 21); g.arc(16, 21, 13, Math.PI, 0); g.closePath(); g.lineJoin = 'round';
    g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); g.fillStyle = '#cfd8e3'; g.fill();
    g.fillStyle = '#f4f8fc'; g.fillRect(7, 14, 5, 2); g.fillRect(6, 17, 3, 1);
    box(g, 2, 21, 28, 3, '#9aa7b8');
    poly(g, [4, 25, 28, 25, 24, 30, 8, 30], '#d94a3a');
  },
  // saucer of milk: blue bowl, white milk
  'food.milk': (g) => {
    poly(g, [2, 14, 30, 14, 26, 27, 6, 27], '#3f95e0');
    g.fillStyle = '#7dbcf2'; g.fillRect(6, 17, 20, 2);
    g.beginPath(); g.ellipse(16, 14, 14, 4.5, 0, 0, 6.2832); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); g.fillStyle = '#ffffff'; g.fill();
    g.fillStyle = '#dbe9f7'; g.beginPath(); g.ellipse(16, 14.5, 10, 2.4, 0, 0, 6.2832); g.fill();
    box(g, 9, 28, 14, 2, '#2a6db0');
  },
  // red barn with white cross door and dark roof
  'home.farm': (g) => {
    poly(g, [2, 14, 16, 3, 30, 14, 28, 29, 4, 29], '#d9473a');
    poly(g, [1, 15, 16, 2, 31, 15, 29, 17, 16, 6, 3, 17], '#6b3b2a');
    g.fillStyle = '#ffffff'; g.fillRect(10, 17, 12, 12);
    g.strokeStyle = '#d9473a'; g.lineWidth = 2; g.strokeRect(11, 18, 10, 10);
    g.beginPath(); g.moveTo(11, 18); g.lineTo(21, 28); g.moveTo(21, 18); g.lineTo(11, 28); g.stroke();
    g.fillStyle = INK; g.fillRect(14, 9, 4, 3);
  },
  // wild: green diamond with a paw
  'type.wild': (g) => {
    poly(g, [16, 1, 31, 16, 16, 31, 1, 16], '#3cb043');
    paw(g, 16, 16, 1.35, '#ffffff');
  },
  // farm: yellow rounded square with a cart wheel
  'type.farm': (g) => {
    box(g, 3, 3, 26, 26, '#ffc93c');
    outDisc(g, 16, 16, 8, '#ffffff'); disc(g, 16, 16, 5.5, '#ffc93c'); disc(g, 16, 16, 2, '#8a5a2b');
    g.strokeStyle = '#8a5a2b'; g.lineWidth = 1.6; g.beginPath();
    for (let a = 0; a < 4; a++) { const r = a * 0.7854; g.moveTo(16 - Math.cos(r) * 8, 16 - Math.sin(r) * 8); g.lineTo(16 + Math.cos(r) * 8, 16 + Math.sin(r) * 8); }
    g.stroke();
  },
  // pet: pink heart
  'type.pet': (g) => {
    g.beginPath(); g.moveTo(16, 29); g.bezierCurveTo(-4, 16, 4, 1, 16, 10); g.bezierCurveTo(28, 1, 36, 16, 16, 29); g.closePath(); g.lineJoin = 'round';
    g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); g.fillStyle = '#ff7aa8'; g.fill();
    paw(g, 16, 16, 0.9, '#ffffff');
  },
};

/** Ids of all canvas-drawn icons. */
export const DRAWN_IDS: string[] = Object.keys(DRAWN);

/** Tiny 5x5-style stat glyphs, drawn on a 16x16 grid (used on the card next to each bar). */
export function statGlyph(g: G, kind: string, x: number, y: number, c: string): void {
  g.fillStyle = c;
  if (kind === 'size') { g.fillRect(x, y + 2, 2, 12); g.fillRect(x + 14, y + 2, 2, 12); g.fillRect(x + 2, y + 7, 12, 2); g.fillRect(x + 2, y + 5, 2, 6); g.fillRect(x + 12, y + 5, 2, 6); }
  else if (kind === 'speed') { g.fillRect(x, y + 3, 7, 2); g.fillRect(x + 3, y + 7, 7, 2); g.fillRect(x, y + 11, 7, 2); g.beginPath(); g.moveTo(x + 9, y + 1); g.lineTo(x + 16, y + 8); g.lineTo(x + 9, y + 15); g.fill(); }
  else if (kind === 'strength') { g.fillRect(x + 1, y + 4, 3, 8); g.fillRect(x + 12, y + 4, 3, 8); g.fillRect(x + 4, y + 7, 8, 2); g.fillRect(x, y + 6, 1, 4); g.fillRect(x + 15, y + 6, 1, 4); }
  else { g.fillRect(x, y + 5, 4, 6); g.beginPath(); g.moveTo(x + 4, y + 5); g.lineTo(x + 9, y + 1); g.lineTo(x + 9, y + 15); g.lineTo(x + 4, y + 11); g.fill(); g.fillRect(x + 11, y + 5, 2, 6); g.fillRect(x + 14, y + 3, 2, 10); }
}
