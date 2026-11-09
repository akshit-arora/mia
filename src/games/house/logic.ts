// Cushion Trick-Shot: physics bank & fetch logic (no DOM, no canvas).
// Pure 2D deterministic physics: gravity, cushion ricochet, trajectory prediction,
// 5 target food pickups, bank-shot detection (clean badge) and golden star (secret badge).
// Impossible to fail: pet always fetches and returns toy, no timers or game-overs.

export type Rng = () => number;
export type PetId = 'dog' | 'cat' | 'rabbit';
export const PETS: readonly PetId[] = ['dog', 'cat', 'rabbit'];

/** Pet favorite food matching cards.json. */
export const FOOD_OF: Record<PetId, string> = { dog: 'bone', cat: 'milk', rabbit: 'carrot' };
export const PET_OF_FOOD: Record<string, PetId> = { bone: 'dog', milk: 'cat', carrot: 'rabbit' };

/** Pet toy: dog tennis ball, cat yarn ball, rabbit wooden carrot. */
export const TOY_OF: Record<PetId, string> = { dog: 'ball', cat: 'yarn', rabbit: 'carrot' };

export const DECO_COUNT = 3; // For storage backward compatibility

export const FOOD_GOAL = 5;

// Physics constants (logical coordinates: 240 x 135)
export const ROOM_W = 240;
export const ROOM_H = 135;
export const FLOOR_Y = 120;
export const GRAVITY = 360; // px/s^2

export const LAUNCH_X = 36;
export const LAUNCH_Y = 96;
export const BOWL_X = 188;
export const BOWL_Y = 114;

// Furniture hitboxes
export const SOFA = { x: 140, y: 76, w: 76, h: 44, cushionY: 76, backrestX: 212 };
export const SHELF = { x: 74, y: 44, w: 52, h: 8 };
export const BOX_TABLE = { x: 92, y: 94, w: 30, h: 26 };
export const STAR_POS = { x: 100, y: 22, radius: 8 };

export interface RectCollider {
  x: number;
  y: number;
  w: number;
  h: number;
  bouncy?: boolean;
  restitution: number;
}

export interface FoodSpot {
  x: number;
  y: number;
  active: boolean;
  collected: boolean;
}

// 5 food target spots around the cozy living room
export function createFoodSpots(): FoodSpot[] {
  return [
    { x: 176, y: 60, active: true, collected: false },  // Bouncing above sofa cushion
    { x: 100, y: 34, active: true, collected: false },  // Resting on the bookshelf
    { x: 106, y: 82, active: false, collected: false }, // Balanced on the box table
    { x: 210, y: 38, active: false, collected: false }, // High bank shot off backrest/wall
    { x: 68, y: 64, active: false, collected: false },  // Mid-air arc near pet
  ];
}

// Events bitmask
export const EV = {
  None: 0,
  Toss: 1 << 0,
  Boing: 1 << 1,   // Cushion bounce
  Clack: 1 << 2,   // Wall / floor / shelf bounce
  Tumble: 1 << 3,  // Wobble box hit
  Pickup: 1 << 4,  // Food collected
  Catch: 1 << 5,   // Pet catches / fetches toy
  Star: 1 << 6,    // Secret star hit
  Meet: 1 << 7,    // Goal reached (5 foods)
  Done: 1 << 8,
} as const;

export enum Ph {
  Ask = 0,    // Choosing pet from House shelf
  Aim = 1,    // Dragging aim arc or ready to toss
  Flight = 2, // Toy in air / bouncing
  Fetch = 3,  // Pet dashing to fetch / return toy
  Meet = 4,   // Bowl full! Pet eating, tap to finish
  Reveal = 5, // Card reveal
}

export interface ToyState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  inAir: boolean;
  bounces: number;
  cushionBounces: number;
}

export interface PetPose {
  x: number;
  y: number;
  pose: number; // 0: idle, 1: watch/aim, 2: leap/catch, 3: eat, 4: sleep
  flip: boolean;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
}

/** Pre-calculates trajectory dots for aim arc. Pure, zero allocation when points reused. */
export function predictTrajectory(
  startX: number,
  startY: number,
  vx: number,
  vy: number,
  out: TrajectoryPoint[],
  maxSteps = 16,
  dt = 0.04
): number {
  let cx = startX;
  let cy = startY;
  let cvx = vx;
  let cvy = vy;
  let count = 0;

  for (let i = 0; i < maxSteps; i++) {
    cvy += GRAVITY * dt;
    cx += cvx * dt;
    cy += cvy * dt;

    // Bounce off walls
    if (cx < 6) { cx = 6; cvx = -cvx * 0.8; }
    else if (cx > ROOM_W - 6) { cx = ROOM_W - 6; cvx = -cvx * 0.8; }

    // Bounce off ceiling
    if (cy < 6) { cy = 6; cvy = -cvy * 0.8; }

    // Bounce off sofa cushion top
    if (cx >= SOFA.x && cx <= SOFA.x + SOFA.w && cy >= SOFA.cushionY - 4 && cy <= SOFA.cushionY + 8 && cvy > 0) {
      cy = SOFA.cushionY - 4;
      cvy = -cvy * 0.9;
    }

    // Floor
    if (cy >= FLOOR_Y - 4) {
      cy = FLOOR_Y - 4;
      cvy = -cvy * 0.6;
    }

    if (count < out.length) {
      out[count].x = cx;
      out[count].y = cy;
      count++;
    } else {
      out.push({ x: cx, y: cy });
      count++;
    }

    if (cy >= FLOOR_Y - 4 && Math.abs(cvy) < 15) break;
  }
  return count;
}

/** Complete pure simulation round for Cushion Trick-Shot. */
export class TrickShotRound {
  pet: PetId = 'dog';
  phase: Ph = Ph.Ask;
  ev: number = EV.None;

  toy: ToyState = {
    x: LAUNCH_X,
    y: LAUNCH_Y,
    vx: 0,
    vy: 0,
    radius: 5,
    inAir: false,
    bounces: 0,
    cushionBounces: 0,
  };

  petPose: PetPose = {
    x: 20,
    y: FLOOR_Y,
    pose: 0,
    flip: false,
  };

  foods: FoodSpot[] = createFoodSpots();
  foodsCollected: number = 0;
  totalTosses: number = 0;
  bankShotsCount: number = 0;
  secretEarned: boolean = false;
  boxTumbled: boolean = false;
  consecutiveMisses: number = 0;
  flightTimer: number = 0;

  // Aiming state
  aimAngle: number = -0.7; // Radians (~40 degrees up-right)
  aimPower: number = 260;  // Initial launch speed
  isAiming: boolean = false;

  // Fetch animation timer
  fetchTimer: number = 0;
  fetchStartX: number = 0;
  fetchTargetX: number = 0;

  reduced: boolean = false;

  constructor(public rng: Rng = Math.random, opts: { reduced?: boolean } = {}) {
    this.reduced = !!opts.reduced;
  }

  start(pet: PetId): void {
    this.pet = pet;
    this.phase = Ph.Aim;
    this.foods = createFoodSpots();
    this.foodsCollected = 0;
    this.totalTosses = 0;
    this.bankShotsCount = 0;
    this.secretEarned = false;
    this.boxTumbled = false;
    this.consecutiveMisses = 0;
    this.flightTimer = 0;
    this.resetToy();
  }

  resetToy(): void {
    this.toy.x = LAUNCH_X;
    this.toy.y = LAUNCH_Y;
    this.toy.vx = 0;
    this.toy.vy = 0;
    this.toy.inAir = false;
    this.toy.bounces = 0;
    this.toy.cushionBounces = 0;
    this.flightTimer = 0;
    this.petPose.x = 22;
    this.petPose.y = FLOOR_Y;
    this.petPose.pose = 0;
    this.petPose.flip = false;
  }

  toss(angle = this.aimAngle, power = this.aimPower): boolean {
    if (this.phase !== Ph.Aim) return false;
    this.totalTosses++;
    this.consecutiveMisses++;
    this.phase = Ph.Flight;
    this.ev |= EV.Toss;

    this.toy.vx = Math.cos(angle) * power;
    this.toy.vy = Math.sin(angle) * power;
    this.toy.inAir = true;
    this.toy.bounces = 0;
    this.toy.cushionBounces = 0;
    this.flightTimer = 0;
    this.petPose.pose = 1; // Watching ball
    return true;
  }

  tick(dtMs: number): number {
    this.ev = EV.None;
    const dt = Math.min(dtMs / 1000, 0.05);

    if (this.phase === Ph.Flight) {
      this.updateFlight(dt);
    } else if (this.phase === Ph.Fetch) {
      this.updateFetch(dt);
    } else if (this.phase === Ph.Meet) {
      this.petPose.pose = 3; // Eating at bowl
      this.petPose.x = BOWL_X - 18;
    }

    return this.ev;
  }

  private updateFlight(dt: number): void {
    const t = this.toy;
    const r = t.radius;

    this.flightTimer += dt;
    t.vy += GRAVITY * dt;
    t.x += t.vx * dt;
    t.y += t.vy * dt;

    // Pet leaps up if ball is airborne overhead
    if (t.inAir && t.y < FLOOR_Y - 20 && Math.abs(t.x - this.petPose.x) < 30) {
      this.petPose.pose = 2; // Leap!
    }

    // 1. Left / Right Walls
    if (t.x - r < 4) {
      t.x = 4 + r;
      t.vx = -t.vx * 0.8;
      t.bounces++;
      this.ev |= EV.Clack;
    } else if (t.x + r > ROOM_W - 4) {
      t.x = ROOM_W - 4 - r;
      t.vx = -t.vx * 0.8;
      t.bounces++;
      this.ev |= EV.Clack;
    }

    // 2. Ceiling
    if (t.y - r < 4) {
      t.y = 4 + r;
      t.vy = -t.vy * 0.8;
      t.bounces++;
      this.ev |= EV.Clack;
    }

    // 3. Sofa Cushion Super-Bounce
    if (
      t.x >= SOFA.x &&
      t.x <= SOFA.x + SOFA.w &&
      t.y + r >= SOFA.cushionY &&
      t.y - r <= SOFA.cushionY + 12 &&
      t.vy > 0
    ) {
      t.y = SOFA.cushionY - r;
      t.vy = -Math.abs(t.vy) * 0.92; // High elastic boing!
      t.vx *= 0.96;
      t.bounces++;
      t.cushionBounces++;
      this.ev |= EV.Boing;
    } else if (
      t.x + r >= SOFA.backrestX &&
      t.x - r <= SOFA.backrestX + 12 &&
      t.y >= SOFA.y &&
      t.y <= SOFA.y + SOFA.h
    ) {
      t.x = SOFA.backrestX - r;
      t.vx = -Math.abs(t.vx) * 0.85;
      t.bounces++;
      t.cushionBounces++;
      this.ev |= EV.Boing;
    }

    // 4. Bookshelf
    if (
      t.x >= SHELF.x &&
      t.x <= SHELF.x + SHELF.w &&
      t.y + r >= SHELF.y &&
      t.y - r <= SHELF.y + SHELF.h
    ) {
      if (t.vy > 0) {
        t.y = SHELF.y - r;
        t.vy = -t.vy * 0.7;
      } else {
        t.y = SHELF.y + SHELF.h + r;
        t.vy = -t.vy * 0.7;
      }
      t.bounces++;
      this.ev |= EV.Clack;
    }

    // 5. Box Table & Wobble Boxes
    if (
      !this.boxTumbled &&
      t.x >= BOX_TABLE.x &&
      t.x <= BOX_TABLE.x + BOX_TABLE.w &&
      t.y >= BOX_TABLE.y - 18 &&
      t.y <= BOX_TABLE.y
    ) {
      this.boxTumbled = true;
      this.ev |= EV.Tumble;
      t.vx *= 0.5;
    }

    // 6. Secret Star Collision
    if (!this.secretEarned) {
      const dx = t.x - STAR_POS.x;
      const dy = t.y - STAR_POS.y;
      if (Math.hypot(dx, dy) <= r + STAR_POS.radius) {
        this.secretEarned = true;
        this.ev |= EV.Star;
      }
    }

    // 7. Food Target Collisions
    for (let i = 0; i < this.foods.length; i++) {
      const f = this.foods[i];
      if (f.active && !f.collected) {
        const dx = t.x - f.x;
        const dy = t.y - f.y;
        if (Math.hypot(dx, dy) <= r + 14) {
          f.collected = true;
          f.active = false;
          this.foodsCollected++;
          this.consecutiveMisses = 0;
          if (t.cushionBounces > 0) {
            this.bankShotsCount++;
          }
          this.ev |= EV.Pickup;

          // Activate next food if available
          this.activateNextFoods();

          if (this.foodsCollected >= FOOD_GOAL) {
            this.ev |= EV.Meet;
            this.phase = Ph.Meet;
            return;
          }
          break;
        }
      }
    }

    // 8. Floor Collision & Rest
    if (t.y + r >= FLOOR_Y) {
      t.y = FLOOR_Y - r;
      t.vy = -t.vy * 0.45;
      t.vx *= 0.75;
      t.bounces++;

      // If ball came to rest or slowed down or spent > 2.2s in flight or bounced >= 5 times
      if (
        (Math.abs(t.vy) < 22 && Math.abs(t.vx) < 22) ||
        this.flightTimer > 2.2 ||
        t.bounces >= 5
      ) {
        t.inAir = false;
        t.vx = 0;
        t.vy = 0;
        this.startFetch();
      }
    }
  }

  private activateNextFoods(): void {
    let uncollected = 0;
    for (const f of this.foods) {
      if (!f.collected) {
        if (!f.active && uncollected < 2) {
          f.active = true;
        }
        uncollected++;
      }
    }
  }

  private startFetch(): void {
    this.phase = Ph.Fetch;
    this.fetchTimer = 0;
    this.fetchStartX = this.petPose.x;
    this.fetchTargetX = this.toy.x;
    this.petPose.pose = 2; // Running / leaping to fetch
    this.petPose.flip = this.fetchTargetX < this.fetchStartX;

    // Pet assist: if child has missed 3 consecutive tosses, pet nudges an active food
    if (this.consecutiveMisses >= 3) {
      const activeFood = this.foods.find((f) => f.active && !f.collected);
      if (activeFood) {
        activeFood.collected = true;
        activeFood.active = false;
        this.foodsCollected++;
        this.consecutiveMisses = 0;
        this.ev |= EV.Pickup;
        this.activateNextFoods();
        if (this.foodsCollected >= FOOD_GOAL) {
          this.ev |= EV.Meet;
          this.phase = Ph.Meet;
        }
      }
    }
  }

  private updateFetch(dt: number): void {
    this.fetchTimer += dt;
    const fetchDuration = this.reduced ? 0.35 : 0.65;
    const p = Math.min(this.fetchTimer / fetchDuration, 1.0);

    if (p < 0.5) {
      // Run to ball
      const t = p * 2;
      this.petPose.x = this.fetchStartX + (this.fetchTargetX - this.fetchStartX) * t;
      this.petPose.pose = 2;
    } else {
      // Picked up ball, run back to launch spot
      if ((this.ev & EV.Catch) === 0 && p >= 0.5) {
        this.ev |= EV.Catch;
      }
      const t = (p - 0.5) * 2;
      this.petPose.x = this.fetchTargetX + (LAUNCH_X - this.fetchTargetX) * t;
      this.petPose.flip = LAUNCH_X < this.fetchTargetX;
      this.toy.x = this.petPose.x + (this.petPose.flip ? -8 : 8);
      this.toy.y = FLOOR_Y - 10;
      this.petPose.pose = 0; // Happy with ball in mouth/paws
    }

    if (p >= 1.0) {
      this.resetToy();
      this.phase = Ph.Aim;
      this.ev |= EV.Done;
    }
  }

  /** Clean badge: earned if completed with at least 2 bank shots or <= 8 total tosses. */
  isClean(): boolean {
    return this.foodsCollected >= FOOD_GOAL && (this.bankShotsCount >= 2 || this.totalTosses <= 8);
  }

  /** Secret badge: earned if secret star was hit. */
  isSecret(): boolean {
    return this.secretEarned;
  }
}

/** Autopilot solver for unit testing and zero-fail simulation. */
export function solveShotForFood(round: TrickShotRound, food: FoodSpot): { angle: number; power: number } {
  // Target spots:
  // Spot 0: x: 176, y: 60 (above sofa)
  // Spot 1: x: 100, y: 34 (on shelf)
  // Spot 2: x: 106, y: 82 (on box table)
  // Spot 3: x: 210, y: 38 (high bank)
  // Spot 4: x: 68, y: 64 (mid-air arc)

  if (food.y < 45 && food.x <= 120) {
    // High shelf: lob over shelf edge
    return { angle: -1.22, power: 270 };
  }
  if (food.x > 190) {
    // High right corner / bank
    return { angle: -0.72, power: 300 };
  }
  if (food.x > SOFA.x) {
    // Above sofa cushion
    return { angle: -0.65, power: 275 };
  }
  if (food.y > 75) {
    // Low table
    return { angle: -0.58, power: 220 };
  }
  // Mid-air near
  return { angle: -1.02, power: 210 };
}
