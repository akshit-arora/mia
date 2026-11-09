// Pre-rendered living room scene and cached sprites for Cushion Trick-Shot.
// Drawn ONCE into offscreen canvases; frame loop only blits them (draw budget <= 25 calls/frame).
// Strict adherence to ART_BIBLE: flat vector, no gradients, no alpha, no shadow blur.
import { INK, disc, mk, type Cv } from '../../cards/scenes';
import { BOX_TABLE, FLOOR_Y, ROOM_H, ROOM_W, SHELF, SOFA, STAR_POS, type PetId } from './logic';
import {
  drawBowl, drawCat, drawContactShadow, drawDog, drawRabbit, drawSecretStar, drawShelf, drawSofa,
  drawTableAndBoxes, drawToy,
} from './sprites';

type G = CanvasRenderingContext2D;

const P = {
  WALL: '#FBF6EB',
  WALL_STRIPE: '#F3EBDD',
  FLOOR: '#D9A45B',
  FLOOR_DARK: '#B8823B',
  SKIRTING: '#8B5A2B',
  RUG: '#E8654A',
  RUG_INNER: '#F08D78',
  PAPER: '#FFF6E5',
  SKY: '#3FA9D9',
  GREEN: '#2FA85A',
  FRAME: '#FFFDF5',
  INK: '#181020',
};

/** Pre-renders the cozy living room background scene (W x H). */
export function roomScene(W = ROOM_W, H = ROOM_H): Cv {
  const [c, g] = mk(W, H);

  // 1. Wallpaper background
  g.fillStyle = P.WALL;
  g.fillRect(0, 0, W, FLOOR_Y);

  // Subtle wallpaper stripes
  g.fillStyle = P.WALL_STRIPE;
  for (let x = 12; x < W; x += 16) {
    g.fillRect(x, 0, 4, FLOOR_Y);
  }

  // 2. Window on left wall (x: 10, y: 16, w: 42, h: 48)
  g.fillStyle = P.INK;
  g.fillRect(10, 16, 42, 48);
  g.fillStyle = P.SKY;
  g.fillRect(12, 18, 38, 44);

  // Little green hill / garden shrub outside
  g.fillStyle = P.GREEN;
  g.beginPath();
  g.arc(24, 62, 16, Math.PI, 0);
  g.arc(42, 62, 12, Math.PI, 0);
  g.fill();

  // White window frame & panes
  g.fillStyle = P.FRAME;
  g.fillRect(10, 16, 42, 3); // top
  g.fillRect(10, 61, 42, 3); // bottom sill
  g.fillRect(10, 16, 3, 48); // left
  g.fillRect(49, 16, 3, 48); // right
  g.fillRect(30, 16, 2, 48); // vertical bar
  g.fillRect(10, 38, 42, 2); // horizontal bar

  // 3. Skirting board (baseboard)
  g.fillStyle = P.INK;
  g.fillRect(0, FLOOR_Y - 4, W, 4);
  g.fillStyle = P.SKIRTING;
  g.fillRect(0, FLOOR_Y - 3, W, 2);

  // 4. Hardwood Floor
  g.fillStyle = P.FLOOR;
  g.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);

  // Floorboard planks
  g.fillStyle = P.FLOOR_DARK;
  g.fillRect(0, FLOOR_Y + 7, W, 1);
  for (let x = 20; x < W; x += 55) {
    g.fillRect(x, FLOOR_Y, 1, 7);
    g.fillRect(x + 28, FLOOR_Y + 7, 1, H - FLOOR_Y - 7);
  }

  // 5. Cozy Living Room Rug (x: 120, y: 114, rx: 55, ry: 10)
  g.save();
  g.fillStyle = P.INK;
  g.beginPath();
  g.ellipse(150, 124, 48, 8, 0, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = P.RUG;
  g.beginPath();
  g.ellipse(150, 124, 46, 7, 0, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = P.RUG_INNER;
  g.beginPath();
  g.ellipse(150, 124, 38, 5, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();

  // 6. Furniture: Shelf & Sofa pre-baked
  g.save();
  g.translate(SHELF.x, SHELF.y);
  drawShelf(g, SHELF.w, SHELF.h);
  g.restore();

  g.save();
  g.translate(SOFA.x, SOFA.y);
  drawSofa(g, SOFA.w, SOFA.h);
  g.restore();

  return c;
}

/** Pre-renders pet sprite in specified pose into a 64x64 canvas. */
export function petImage(pet: PetId, pose: number): Cv {
  const [c, g] = mk(64, 64);
  if (pet === 'dog') drawDog(g, pose);
  else if (pet === 'cat') drawCat(g, pose);
  else drawRabbit(g, pose);
  return c;
}

/** Pre-renders the pet's toy into a 24x24 canvas. */
export function toyImage(pet: PetId): Cv {
  const [c, g] = mk(24, 24);
  g.save();
  g.translate(12, 12);
  drawToy(g, pet, 6);
  g.restore();
  return c;
}

/** Pre-renders wobble boxes table. */
export function tableAndBoxesSprite(tumbled: boolean): Cv {
  const [c, g] = mk(BOX_TABLE.w + 12, BOX_TABLE.h + 24);
  g.save();
  g.translate(4, 18);
  drawTableAndBoxes(g, tumbled);
  g.restore();
  return c;
}

/** Pre-renders the secret star sprite. */
export function secretStarSprite(earned: boolean): Cv {
  const [c, g] = mk(28, 36);
  g.save();
  g.translate(14, 24);
  drawSecretStar(g, earned);
  g.restore();
  return c;
}

/** Pre-renders pet bowl sprite with count treats. */
export function bowlSprite(count: number, food: string): Cv {
  const [c, g] = mk(28, 20);
  g.save();
  g.translate(2, 2);
  drawBowl(g, count, food);
  g.restore();
  return c;
}

/** Pre-renders food item on round ceramic plate with accent rim. */
export function foodPlate(icon: Cv, size = 26, food = 'bone'): Cv {
  const [c, g] = mk(size, size);
  const r = size / 2;

  // Outer border & paper plate
  disc(g, r, r, r, P.INK);
  disc(g, r, r, r - 1.5, P.PAPER);

  // Food specific rim colour
  const rim = food === 'bone' ? '#E8654A' : food === 'milk' ? '#3FA9D9' : '#FFC93C';
  disc(g, r, r, r - 2, rim);
  disc(g, r, r, r - 3.5, P.PAPER);

  // Icon in center
  const iw = Math.min(size - 8, icon.width);
  const ih = Math.min(size - 8, icon.height);
  g.drawImage(icon, r - iw / 2, r - ih / 2, iw, ih);

  return c;
}

/** Pre-renders trajectory aim dot. */
export function aimDotImage(): Cv {
  const [c, g] = mk(8, 8);
  disc(g, 4, 4, 3.5, P.INK);
  disc(g, 4, 4, 2.2, '#FFE27A');
  return c;
}

/** Big 42px touch tile for shelf pet selection. */
export function petTile(petImg: Cv, size = 42, active = false): Cv {
  const [c, g] = mk(size, size);
  g.fillStyle = P.INK;
  g.beginPath();
  g.roundRect(0, 0, size, size, 8);
  g.fill();

  g.fillStyle = active ? '#FFE27A' : P.PAPER;
  g.beginPath();
  g.roundRect(1.5, 1.5, size - 3, size - 3, 7);
  g.fill();

  // Draw scaled pet sprite inside
  const s = size - 8;
  g.drawImage(petImg, 4, 4, s, s);
  return c;
}
