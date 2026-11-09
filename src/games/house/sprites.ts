// Flat-vector sprites for Cushion Trick-Shot (ART_BIBLE compliant).
// Dog (Tuffy), Cat (Brownie), Rabbit (Bunny), living room furniture and toys.
// Rules: <= 6 palette tokens per sprite, INK contours, hard shadows, NO gradients, NO alpha, NO blur.
import { TOK, blob, eye, flat, limb } from '../forage/sprites';
import type { PetId } from './logic';

type G = CanvasRenderingContext2D;
const { INK, PAPER, SUN, BARK, BARK_D, SAND, CORAL, LEAF, WATER } = TOK;

// Specific palette additions strictly matching flat-vector rules:
const DOG_GOLD = '#D98A3B';
const CAT_BROWN = '#7A3E26';
const RABBIT_CREAM = '#FFFDF5';
const RABBIT_PINK = '#F8B4B4';
const SOFA_TEAL = '#2B6E70';
const SOFA_TEAL_D = '#1D4D4E';
const CUSHION_GOLD = '#E5A93C';

export function drawContactShadow(g: G, x: number, y: number, rx: number, ry: number): void {
  flat(g, '#D6C8AE', x, y, rx, ry);
}

/** Draws Tuffy the Dog (64x64 canvas, base y=56). */
export function drawDog(g: G, pose: number): void {
  // 0: idle, 1: watch aim, 2: leap catch, 3: happy munch, 4: sleep curl
  g.save();

  if (pose === 4) {
    // Sleeping curled up
    blob(g, DOG_GOLD, 32, 44, 20, 12);
    blob(g, BARK_D, 44, 40, 10, 10); // Head curled in
    blob(g, BARK, 48, 44, 4, 7, 0.4); // Floppy ear
    // Closed happy eye
    g.beginPath();
    g.arc(46, 39, 2.5, 0.2, Math.PI - 0.2);
    g.lineWidth = 1.8;
    g.strokeStyle = INK;
    g.stroke();
    g.restore();
    return;
  }

  const isLeap = pose === 2;
  const isWatch = pose === 1;
  const isHappy = pose === 3;

  const dy = isLeap ? -8 : 0;
  const headRot = isWatch ? -0.3 : isHappy ? 0.2 : 0;

  // Tail
  limb(g, DOG_GOLD, 4, () => {
    g.beginPath();
    g.moveTo(18, 42 + dy);
    g.quadraticCurveTo(12, isHappy || isWatch ? 28 + dy : 34 + dy, isHappy ? 8 : 14, 24 + dy);
  });

  // Back legs
  if (isLeap) {
    limb(g, BARK_D, 6, () => {
      g.beginPath();
      g.moveTo(22, 44 + dy);
      g.lineTo(10, 48 + dy);
    });
  } else {
    blob(g, DOG_GOLD, 22, 48, 6, 8);
  }

  // Body
  blob(g, DOG_GOLD, 32, 40 + dy, 14, 10, isWatch ? -0.15 : 0);
  flat(g, SAND, 36, 42 + dy, 8, 6); // Belly patch

  // Front legs
  if (isLeap) {
    limb(g, DOG_GOLD, 6, () => {
      g.beginPath();
      g.moveTo(40, 42 + dy);
      g.lineTo(54, 38 + dy);
    });
  } else {
    blob(g, DOG_GOLD, 38, 50, 4, 6);
  }

  // Head
  g.save();
  g.translate(42, 30 + dy);
  g.rotate(headRot);

  // Floppy ear (behind)
  blob(g, BARK, -2, -2, 5, 10, -0.2);

  // Head circle
  blob(g, DOG_GOLD, 4, -4, 10, 9);
  // Snout
  blob(g, SAND, 12, -2, 6, 5);
  flat(g, INK, 16, -4, 2.5, 2); // Nose

  // Eye
  eye(g, 7, -6, isHappy);

  // Red collar
  limb(g, CORAL, 3, () => {
    g.beginPath();
    g.moveTo(0, 4);
    g.lineTo(8, 4);
  });

  g.restore();
  g.restore();
}

/** Draws Brownie the Cat (64x64 canvas, base y=56). */
export function drawCat(g: G, pose: number): void {
  g.save();

  if (pose === 4) {
    // Sleeping curled up
    blob(g, CAT_BROWN, 32, 44, 18, 11);
    blob(g, CAT_BROWN, 44, 40, 9, 9);
    // Pointed ears
    blob(g, BARK_D, 44, 32, 3, 5, 0.2);
    // Closed eye
    g.beginPath();
    g.arc(46, 40, 2.2, 0.2, Math.PI - 0.2);
    g.lineWidth = 1.8;
    g.strokeStyle = INK;
    g.stroke();
    g.restore();
    return;
  }

  const isLeap = pose === 2;
  const isWatch = pose === 1;
  const isHappy = pose === 3;
  const dy = isLeap ? -7 : 0;
  const headRot = isWatch ? -0.28 : isHappy ? 0.15 : 0;

  // Tail (curved graceful)
  limb(g, CAT_BROWN, 3.5, () => {
    g.beginPath();
    g.moveTo(18, 42 + dy);
    g.quadraticCurveTo(10, 32 + dy, 12, 20 + dy);
  });

  // Body
  blob(g, CAT_BROWN, 30, 41 + dy, 12, 9, isWatch ? -0.1 : 0);
  flat(g, PAPER, 34, 43 + dy, 6, 6); // White chest bib

  // Legs
  if (isLeap) {
    limb(g, CAT_BROWN, 5, () => {
      g.beginPath();
      g.moveTo(22, 44 + dy);
      g.lineTo(12, 46 + dy);
    });
    limb(g, CAT_BROWN, 5, () => {
      g.beginPath();
      g.moveTo(38, 42 + dy);
      g.lineTo(50, 36 + dy);
    });
  } else {
    blob(g, CAT_BROWN, 22, 49, 4, 7);
    blob(g, CAT_BROWN, 36, 49, 4, 7);
  }

  // Head
  g.save();
  g.translate(38, 29 + dy);
  g.rotate(headRot);

  // Pointed triangular ears
  blob(g, BARK_D, -2, -10, 3, 6, -0.3);
  blob(g, BARK_D, 6, -10, 3, 6, 0.3);

  // Head base
  blob(g, CAT_BROWN, 2, -2, 9, 8);
  // Pink nose & muzzle
  flat(g, PAPER, 8, 0, 4, 3);
  flat(g, CORAL, 10, -1, 1.8, 1.4);

  // Eye
  eye(g, 4, -4, isHappy);

  g.restore();
  g.restore();
}

/** Draws Bunny the Rabbit (64x64 canvas, base y=56). */
export function drawRabbit(g: G, pose: number): void {
  g.save();

  if (pose === 4) {
    // Sleeping curled up
    blob(g, RABBIT_CREAM, 32, 44, 17, 11);
    blob(g, RABBIT_CREAM, 42, 40, 8, 8);
    // Ears resting flat
    blob(g, RABBIT_CREAM, 32, 33, 10, 3, -0.2);
    // Closed eye
    g.beginPath();
    g.arc(44, 39, 2.2, 0.2, Math.PI - 0.2);
    g.lineWidth = 1.8;
    g.strokeStyle = INK;
    g.stroke();
    g.restore();
    return;
  }

  const isLeap = pose === 2;
  const isWatch = pose === 1;
  const isHappy = pose === 3;
  const dy = isLeap ? -9 : 0;
  const headRot = isWatch ? -0.25 : isHappy ? 0.12 : 0;

  // Fluffy round tail
  blob(g, PAPER, 16, 42 + dy, 4.5, 4.5);

  // Big hind legs
  if (isLeap) {
    limb(g, RABBIT_CREAM, 6, () => {
      g.beginPath();
      g.moveTo(24, 44 + dy);
      g.lineTo(14, 52 + dy);
    });
  } else {
    blob(g, RABBIT_CREAM, 22, 46, 7, 9);
    blob(g, PAPER, 24, 53, 5, 3);
  }

  // Body
  blob(g, RABBIT_CREAM, 30, 41 + dy, 11, 9);

  // Front paws
  if (isLeap) {
    limb(g, RABBIT_CREAM, 5, () => {
      g.beginPath();
      g.moveTo(36, 42 + dy);
      g.lineTo(46, 42 + dy);
    });
  } else {
    blob(g, RABBIT_CREAM, 34, 49, 3.5, 6);
  }

  // Head
  g.save();
  g.translate(36, 28 + dy);
  g.rotate(headRot);

  // Long upright ears with pink inner
  blob(g, RABBIT_CREAM, -2, -14, 3.5, 11, -0.15);
  flat(g, RABBIT_PINK, -2, -14, 1.8, 8, -0.15);

  blob(g, RABBIT_CREAM, 6, -14, 3.5, 11, 0.15);
  flat(g, RABBIT_PINK, 6, -14, 1.8, 8, 0.15);

  // Head base
  blob(g, RABBIT_CREAM, 2, -2, 8, 8);
  // Pink twitchy nose
  flat(g, RABBIT_PINK, 9, 0, 2, 1.6);

  // Eye
  eye(g, 4, -4, isHappy);

  g.restore();
  g.restore();
}

/** Draws Sofa with bouncy cushions (width 76, height 44). */
export function drawSofa(g: G, w = 76, h = 44): void {
  g.save();
  // Wooden legs
  flat(g, BARK_D, 8, h - 4, 3, 4);
  flat(g, BARK_D, w - 8, h - 4, 3, 4);

  // Base frame
  g.fillStyle = SOFA_TEAL_D;
  g.strokeStyle = INK;
  g.lineWidth = 3;
  g.beginPath();
  g.roundRect(4, h - 16, w - 8, 12, 3);
  g.fill();
  g.stroke();

  // Backrest (high right side)
  g.fillStyle = SOFA_TEAL;
  g.beginPath();
  g.roundRect(w - 18, 4, 16, h - 18, 4);
  g.fill();
  g.stroke();

  // Left armrest
  g.fillStyle = SOFA_TEAL;
  g.beginPath();
  g.roundRect(2, 16, 14, h - 28, 4);
  g.fill();
  g.stroke();

  // Bouncy seat cushions (accent gold)
  g.fillStyle = CUSHION_GOLD;
  g.strokeStyle = INK;
  g.lineWidth = 2.5;

  // Cushion 1
  g.beginPath();
  g.roundRect(14, 20, 24, 14, 4);
  g.fill();
  g.stroke();

  // Cushion 2
  g.beginPath();
  g.roundRect(38, 20, 24, 14, 4);
  g.fill();
  g.stroke();

  g.restore();
}

/** Draws small wooden table and wobbly boxes. */
export function drawTableAndBoxes(g: G, tumbled: boolean): void {
  g.save();
  // Table legs
  flat(g, BARK_D, 4, 24, 2, 8);
  flat(g, BARK_D, 26, 24, 2, 8);

  // Table top
  g.fillStyle = BARK;
  g.strokeStyle = INK;
  g.lineWidth = 2;
  g.beginPath();
  g.roundRect(0, 18, 30, 6, 2);
  g.fill();
  g.stroke();

  // Wobble boxes
  if (!tumbled) {
    // Bottom orange box
    g.fillStyle = CORAL;
    g.beginPath();
    g.roundRect(4, 6, 14, 12, 2);
    g.fill();
    g.stroke();

    // Top yellow box
    g.fillStyle = SUN;
    g.beginPath();
    g.roundRect(8, -4, 12, 10, 2);
    g.fill();
    g.stroke();
  } else {
    // Tumbled / knocked aside
    g.save();
    g.translate(6, 14);
    g.rotate(0.35);
    g.fillStyle = CORAL;
    g.beginPath();
    g.roundRect(0, 0, 14, 12, 2);
    g.fill();
    g.stroke();
    g.restore();

    g.save();
    g.translate(18, 16);
    g.rotate(-0.4);
    g.fillStyle = SUN;
    g.beginPath();
    g.roundRect(0, 0, 12, 10, 2);
    g.fill();
    g.stroke();
    g.restore();
  }
  g.restore();
}

/** Draws high wooden bookshelf. */
export function drawShelf(g: G, w = 52, h = 8): void {
  g.save();
  // Metal / wood brackets
  g.strokeStyle = BARK_D;
  g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(6, h);
  g.lineTo(6, h + 8);
  g.lineTo(14, h);
  g.moveTo(w - 6, h);
  g.lineTo(w - 6, h + 8);
  g.lineTo(w - 14, h);
  g.stroke();

  // Shelf plank
  g.fillStyle = SAND;
  g.strokeStyle = INK;
  g.lineWidth = 2;
  g.beginPath();
  g.roundRect(0, 0, w, h, 2);
  g.fill();
  g.stroke();
  g.restore();
}

/** Draws pet bowl with count of food treats (0..5). */
export function drawBowl(g: G, count: number, food: string): void {
  g.save();
  // Bowl rim and base
  g.fillStyle = WATER;
  g.strokeStyle = INK;
  g.lineWidth = 2;
  g.beginPath();
  g.roundRect(0, 4, 24, 10, [2, 2, 6, 6]);
  g.fill();
  g.stroke();

  // Top lip
  g.fillStyle = PAPER;
  g.beginPath();
  g.ellipse(12, 4, 10, 3, 0, 0, Math.PI * 2);
  g.fill();
  g.stroke();

  // Food inside if count > 0
  if (count > 0) {
    const col = food === 'bone' ? PAPER : food === 'milk' ? '#F4F1DE' : CORAL;
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(12, 4, 8, 2.2, 0, 0, Math.PI * 2);
    g.fill();

    // Small treat dots showing fill level
    for (let i = 0; i < Math.min(count, 5); i++) {
      flat(g, SUN, 6 + i * 3, 2, 1.2, 1.2);
    }
  }
  g.restore();
}

/** Draws pet's toy (ball, yarn, or wooden carrot). */
export function drawToy(g: G, pet: PetId, r = 5): void {
  g.save();
  if (pet === 'dog') {
    // Tennis ball (neon yellow-green)
    g.fillStyle = '#C8D946';
    g.strokeStyle = INK;
    g.lineWidth = 1.8;
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    // Curved white seam
    g.strokeStyle = PAPER;
    g.lineWidth = 1.2;
    g.beginPath();
    g.arc(0, 0, r * 0.7, -0.6, 1.2);
    g.stroke();
  } else if (pet === 'cat') {
    // Yarn ball (magenta/purple wool with little tail)
    g.fillStyle = '#D94686';
    g.strokeStyle = INK;
    g.lineWidth = 1.8;
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    // Wool texture lines
    g.strokeStyle = '#9E2458';
    g.lineWidth = 1;
    g.beginPath();
    g.arc(-1, -1, r * 0.6, 0.4, 2.2);
    g.stroke();
  } else {
    // Wooden carrot (rabbit)
    g.fillStyle = CORAL;
    g.strokeStyle = INK;
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(r, 0);
    g.lineTo(-r, -r * 0.6);
    g.lineTo(-r, r * 0.6);
    g.closePath();
    g.fill();
    g.stroke();
    // Green leafy tip
    flat(g, LEAF, -r - 1, 0, 2, 2.5);
  }
  g.restore();
}

/** Golden secret star (high ceiling decoration). */
export function drawSecretStar(g: G, earned: boolean): void {
  g.save();
  // Hanging string from ceiling
  g.strokeStyle = INK;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(0, -20);
  g.lineTo(0, -6);
  g.stroke();

  // Star points
  g.fillStyle = earned ? '#FFE27A' : SUN;
  g.strokeStyle = INK;
  g.lineWidth = 1.8;
  g.beginPath();
  const R = 7;
  const r = 3.5;
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const rad = i % 2 === 0 ? R : r;
    const x = Math.cos(angle) * rad;
    const y = Math.sin(angle) * rad;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fill();
  g.stroke();
  g.restore();
}
