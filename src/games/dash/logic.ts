// Farm Dash: the pure parts (no DOM, no canvas), unit-tested in tests/dash.test.ts.
//
// A single-lane runner for six-year-olds. The world scrolls, the runner animal stays at a fixed x. Two inputs: HOP and DUCK.
// LOW obstacles are hopped over, HIGH ones are ducked under. There is no game-over, timer, lives or fail state: a hit is a funny
// stumble that drops at most one carried item and the run goes on. Only the runner animal's OWN food counts; other foods pass harmlessly.
// The basket holds 5; when it is full the run waits in Meet until the child feeds (tap the friend or the basket).
//
// Fairness is data, not luck: every animal has its own body (jump height / duration / gravity feel / run cycle), and the obstacle sizes and
// the spacing between obstacles are derived from those bodies so that every pattern is winnable by every animal at every speed in range.
import { cardOf, shelfCards } from '../../cards/data';
import { Ph, captionGate, type BadgeId, type Rng } from '../forage/logic';

export { Ph, captionGate };
export type { BadgeId, Rng };

// ---------------------------------------------------------------- layout (logical px, canvas 240 x 135)
export const GROUND_Y = 104; // the line the runner stands on
export const RUNNER_X = 52; // fixed x of the runner's centre
export const SPAWN_X = 262; // new things appear just off the right edge
export const HIGH_CLEARANCE = 18; // how far above the ground a HIGH obstacle hangs: a standing animal is taller, a ducking one fits under
export const HOP_Y = 42; // centre of food floating at hop height
export const DUCK_Y = 9; // centre of food floating at duck height (near the ground, under a hanging obstacle)
export const STAR_Y = 56; // the secret star: a rare height only a well-timed hop reaches
export const FOOD_R = 6; // food collect radius
export const FOOD_PX = 18; // food icon size on screen

// ---------------------------------------------------------------- animals and their bodies
export type AnimalId = 'hen' | 'cow' | 'goat';
/** The three farm animals on the Ask board. Every one is a Farm shelf card (tested). */
export const DASH_ANIMALS: readonly AnimalId[] = ['hen', 'cow', 'goat'];

/**
 * How a hop feels. `rise` is the share of the air time spent going up: a LOW rise value is a springy launch with a floaty fall (goat),
 * a HIGH value is a slow heavy lift followed by a thump down (cow). The curve is ease-out going up and ease-in coming down.
 */
export interface JumpData { height: number; durMs: number; rise: number }
export interface RunCycle { frames: number; frameMs: number } // 2-4 frames, how long each shows
export interface Body {
  id: AnimalId;
  jump: JumpData;
  stand: number; // hit-box height standing (a little smaller than the drawing: kind to small fingers)
  duck: number; // hit-box height ducking; always <= HIGH_CLEARANCE - 2
  width: number; // hit-box width
  run: RunCycle;
  stumbleMs: number; // how long the funny stumble lasts
}

export const BODIES: Record<AnimalId, Body> = {
  // hen: quick small hops, short jump, quick little legs
  hen: { id: 'hen', jump: { height: 34, durMs: 560, rise: 0.5 }, stand: 22, duck: 12, width: 8, run: { frames: 3, frameMs: 70 }, stumbleMs: 650 },
  // cow: heavy gallop, big slow jump (slow lift, thump down)
  cow: { id: 'cow', jump: { height: 38, durMs: 760, rise: 0.6 }, stand: 30, duck: 16, width: 16, run: { frames: 3, frameMs: 130 }, stumbleMs: 800 },
  // goat: springy, the highest jump (fast launch, floaty fall)
  goat: { id: 'goat', jump: { height: 46, durMs: 600, rise: 0.35 }, stand: 27, duck: 15, width: 12, run: { frames: 3, frameMs: 85 }, stumbleMs: 650 },
};
export const bodyOf = (id: string): Body => BODIES[id as AnimalId];

/** Height above the ground, in px, `t` ms after take-off. */
export function jumpOffset(j: JumpData, t: number): number {
  if (t <= 0 || t >= j.durMs) return 0;
  const u = t / j.durMs;
  if (u < j.rise) { const x = u / j.rise; return j.height * (1 - (1 - x) * (1 - x)); }
  const y = (u - j.rise) / (1 - j.rise);
  return j.height * (1 - y * y);
}

/** Highest point the body reaches: where its top can get to. */
export const apexTop = (b: Body): number => b.jump.height + b.stand;

/** Poses in the sprite sheet: 0..2 run frames, then jump, duck, stumble, happy. */
export const POSE = { Jump: 3, Duck: 4, Stumble: 5, Happy: 6 } as const;
export const POSE_COUNT = 7;

/** The runner's own state: jumping, ducking, stumbling, and the run-cycle clock. */
export class Runner {
  air = -1; // ms since take-off, -1 on the ground
  duckHeld = false; // the child is holding duck; it takes effect on the ground
  stumble = 0; // ms of funny stumble left
  runT = 0;
  constructor(readonly body: Body) {}

  get grounded(): boolean { return this.air < 0; }
  get stumbling(): boolean { return this.stumble > 0; }
  get ducking(): boolean { return this.duckHeld && this.grounded && !this.stumbling; }
  /** Height of the feet above the ground. */
  get offset(): number { return this.air < 0 ? 0 : jumpOffset(this.body.jump, this.air); }
  /** Current hit-box height. */
  get height(): number { return this.ducking ? this.body.duck : this.body.stand; }
  /** Sprite pose: 0..2 run frames, 3 jump, 4 duck, 5 stumble. */
  get pose(): number {
    if (this.stumbling) return POSE.Stumble;
    if (!this.grounded) return POSE.Jump;
    if (this.ducking) return POSE.Duck;
    return Math.floor(this.runT / this.body.run.frameMs) % this.body.run.frames;
  }

  /** HOP. Only from the ground and not while stumbling. */
  hop(): boolean {
    if (!this.grounded || this.stumbling) return false;
    this.air = 0;
    return true;
  }
  setDuck(on: boolean): void { this.duckHeld = on; }
  /** A funny stumble: the run goes on. */
  hurt(): void { this.stumble = this.body.stumbleMs; this.air = -1; }

  tick(dt: number): void {
    this.runT = (this.runT + dt) % (this.body.run.frames * this.body.run.frameMs);
    if (this.stumble > 0) this.stumble = Math.max(0, this.stumble - dt);
    if (this.air >= 0) { this.air += dt; if (this.air >= this.body.jump.durMs) this.air = -1; }
  }
}

// ---------------------------------------------------------------- food: only the runner animal's own food counts
/** The foods of the three animals (from the card data): seeds (hen), grass (cow), leaves (goat). */
export const foodOf = (animal: string): string => cardOf(animal).food;
export const DASH_FOODS: readonly string[] = [...new Set(DASH_ANIMALS.map(foodOf))];
/** Two decoy foods for an animal: the other animals' foods. They pass harmlessly and look different. */
export const decoysOf = (animal: string): string[] => DASH_FOODS.filter((f) => f !== foodOf(animal));

// ---------------------------------------------------------------- obstacles
export type ObstacleKind = 'low' | 'high';
export interface ObstacleDef { id: string; kind: ObstacleKind; w: number; hitW: number; h: number }
/** `h` is the height of a LOW obstacle; a HIGH obstacle hangs with its bottom at HIGH_CLEARANCE. `w` is the picture, `hitW` the hit-box (narrower: forgiving). */
export const OBSTACLES: Record<ObstacleKind, readonly ObstacleDef[]> = {
  low: [
    { id: 'puddle', kind: 'low', w: 24, hitW: 14, h: 4 },
    { id: 'hay', kind: 'low', w: 20, hitW: 10, h: 10 },
    { id: 'fence', kind: 'low', w: 24, hitW: 10, h: 13 },
  ],
  high: [
    { id: 'branch', kind: 'high', w: 30, hitW: 12, h: 0 },
    { id: 'crate', kind: 'high', w: 20, hitW: 10, h: 0 },
  ],
};

/** Speed range the game can run at (px per second of game time). Reduced motion slows game TIME, not these numbers. */
export const SPEED_MIN = 56, SPEED_MAX = 92;
const SPEED_START = 60, SPEED_RAMP = 0.6; // px/s gained per second: a gentle ramp, never a wall
export const speedAt = (tMs: number): number => Math.min(SPEED_MAX, SPEED_START + (SPEED_RAMP * tMs) / 1000);

/** Does a runner (feet offset, box height, half-width) at x = RUNNER_X hit an obstacle at ox? */
export function hits(o: ObstacleDef, ox: number, offset: number, height: number, bodyW: number): boolean {
  if (Math.abs(ox - RUNNER_X) >= (o.hitW + bodyW) / 2) return false;
  if (o.kind === 'low') return offset < o.h;
  return offset + height > HIGH_CLEARANCE;
}

/** How long (ms) the runner's body overlaps an obstacle's hit-box horizontally at `speed`. */
export const overlapMs = (o: ObstacleDef, b: Body, speed: number): number => ((o.hitW + b.width) / speed) * 1000;

/**
 * The widths of the take-off moments (ms) that clear a LOW obstacle: a hop that starts `s` ms before the obstacle centre lines up
 * with the runner. Returns [first, last] clearing s, or null when no hop clears it. The window (last - first) is how forgiving it is.
 */
export function hopWindow(b: Body, o: ObstacleDef, speed: number): [number, number] | null {
  const half = overlapMs(o, b, speed) / 2;
  let first = -1, last = -1;
  for (let s = 0; s <= b.jump.durMs; s += 2) {
    let ok = true;
    for (let tau = -half; tau <= half && ok; tau += 4) if (jumpOffset(b.jump, s + tau) < o.h + 0.5) ok = false;
    if (ok) { if (first < 0) first = s; last = s; }
  }
  return first < 0 ? null : [first, last];
}

/** Reaction time we always leave between landing and the next thing to do. */
export const REACT_MS = 400;
/** The least time between two obstacle centres' edges so any animal can land from one and act on the next. */
export const minGapMs = (b: Body): number => b.jump.durMs + REACT_MS;

// ---------------------------------------------------------------- the course: a deterministic pattern from a seeded rng
export interface FoodSpec { dx: number; slot: 'hop' | 'duck'; own: boolean; decoy: number }
export interface Segment {
  kind: ObstacleKind | 'meadow'; // meadow: no obstacle, just the secret star
  variant: number;
  gapPx: number; // centre-to-centre distance from the previous segment
  foods: FoodSpec[];
}

/** Chance each floating food is the animal's own. A drought of own food is broken after `DROUGHT` segments. */
export const OWN_P = 0.28, DROUGHT = 3, STAR_P = 0.45;

export class Course {
  n = 0; // segments produced
  private sinceOwn = 0;
  private prevHalf = 0;
  private starAfter: number;
  private starDone = false;
  private runKind: ObstacleKind = 'low';
  private runLen = 0;
  constructor(private rng: Rng, readonly body: Body) {
    this.starAfter = this.rng() < STAR_P ? 3 + Math.floor(this.rng() * 4) : -1; // rare: not every run has a star
  }

  /** The next segment at the current `speed`. Gaps scale with speed and with THIS animal's jump, so the pattern is winnable. */
  next(speed: number): Segment {
    const r = this.rng;
    let kind: ObstacleKind | 'meadow';
    let variant = 0;
    if (!this.starDone && this.starAfter >= 0 && this.n >= this.starAfter) { kind = 'meadow'; this.starDone = true; }
    else {
      kind = r() < 0.5 ? 'low' : 'high';
      if (this.runLen >= 2 && kind === this.runKind) kind = kind === 'low' ? 'high' : 'low'; // rhythm: never three of a kind in a row
      variant = Math.floor(r() * OBSTACLES[kind].length);
    }
    if (kind !== 'meadow') { if (kind === this.runKind) this.runLen++; else { this.runKind = kind; this.runLen = 1; } }
    const half = kind === 'meadow' ? 8 : OBSTACLES[kind][variant].w / 2;
    const gapMs = minGapMs(this.body) + 250 + r() * 550;
    const gapPx = this.n === 0 ? 120 : Math.round((speed * gapMs) / 1000 + this.prevHalf + half);
    this.prevHalf = half;

    const foods: FoodSpec[] = [];
    const mkFood = (dx: number, slot: 'hop' | 'duck'): void => {
      const own = r() < OWN_P || this.sinceOwn >= DROUGHT * 2;
      foods.push({ dx, slot, own, decoy: r() < 0.5 ? 0 : 1 });
      if (own) this.sinceOwn = 0;
    };
    if (kind === 'low') { mkFood(-10, 'hop'); mkFood(10, 'hop'); } // an arc over the obstacle: reached by hopping it
    else if (kind === 'high') { mkFood(-8, 'duck'); mkFood(8, 'duck'); } // low under the hanging obstacle: reached by ducking it
    if (kind !== 'meadow' && r() < 0.35) mkFood(-Math.round(gapPx / 2), r() < 0.5 ? 'hop' : 'duck'); // one free-floating food in the gap
    this.sinceOwn++;
    this.n++;
    return { kind, variant, gapPx, foods };
  }
}

// ---------------------------------------------------------------- the world: scrolling, spawning, collisions (no rendering)
export const K = { Low: 0, High: 1, Food: 2, Star: 3 } as const;
/** Events a tick can produce (numbers, so the frame loop allocates nothing). */
export const EV = { Own: 1, Hit: 2, Star: 3, Left: 4 } as const;

export interface Item {
  on: boolean; x: number; kind: number; variant: number; slot: number; // slot: 0 hop height, 1 duck height
  own: boolean; decoy: number; done: boolean; ph: number;
}
const newItem = (): Item => ({ on: false, x: 0, kind: 0, variant: 0, slot: 0, own: false, decoy: 0, done: false, ph: 0 });

export class DashWorld {
  readonly runner: Runner;
  readonly course: Course;
  readonly items: Item[] = [];
  readonly events: number[] = [];
  t = 0; // ms of run time
  speed = SPEED_START;
  distance = 0;
  settled = false; // basket full: the world eases, obstacles no longer hurt
  private settleT = 0;
  private cursorX = 70; // x of the last placed segment
  private pending: Segment | null = null;
  private ph = 0;
  constructor(readonly body: Body, rng: Rng, pool = 18) {
    this.runner = new Runner(body);
    this.course = new Course(rng, body);
    for (let i = 0; i < pool; i++) this.items.push(newItem());
  }

  /** The basket is full: slow the world, stop the obstacles. */
  settle(): void { if (!this.settled) { this.settled = true; this.settleT = 0; for (const it of this.items) if (it.on && it.kind !== K.Food) it.done = true; } }

  private put(kind: number, x: number, variant: number, slot: number, own: boolean, decoy: number): Item | null {
    for (const it of this.items) {
      if (it.on) continue;
      it.on = true; it.x = x; it.kind = kind; it.variant = variant; it.slot = slot; it.own = own; it.decoy = decoy; it.done = false; it.ph = (this.ph += 1.7);
      return it;
    }
    return null;
  }
  /** Lay a food that will be left on the trail once the basket is full (the 6th: a choice, never a penalty). */
  putLeftover(dx = 0): void { this.put(K.Food, SPAWN_X + dx, 0, 0, true, 0); }
  ownAhead(): number { let n = 0; for (const it of this.items) if (it.on && it.kind === K.Food && it.own && !it.done && it.x > RUNNER_X) n++; return n; }

  private place(seg: Segment, x: number): void {
    if (seg.kind === 'low') this.put(K.Low, x, seg.variant, 0, false, 0);
    else if (seg.kind === 'high') this.put(K.High, x, seg.variant, 0, false, 0);
    else this.put(K.Star, x, 0, 0, false, 0);
    for (const f of seg.foods) this.put(K.Food, x + f.dx, 0, f.slot === 'hop' ? 0 : 1, f.own, f.decoy);
  }

  tick(dt: number): void {
    const ev = this.events; ev.length = 0;
    this.runner.tick(dt);
    this.t += dt;
    let k = this.runner.stumbling ? 0.45 : 1; // a stumble slows the world: time to laugh and recover
    if (this.settled) { this.settleT += dt; k *= Math.max(0.3, 1 - this.settleT / 700); }
    this.speed = speedAt(this.t) * k;
    const mv = (this.speed * dt) / 1000;
    this.distance += mv; this.cursorX -= mv;

    if (!this.settled) {
      if (!this.pending) this.pending = this.course.next(speedAt(this.t));
      while (this.pending && SPAWN_X - this.cursorX >= this.pending.gapPx - 0.001) {
        this.cursorX += this.pending.gapPx;
        this.place(this.pending, this.cursorX);
        this.pending = this.course.next(speedAt(this.t));
      }
    }

    const r = this.runner, b = this.body;
    for (const it of this.items) {
      if (!it.on) continue;
      it.x -= mv;
      if (it.x < -30) { it.on = false; continue; }
      if (it.done) continue;
      if (it.kind === K.Low || it.kind === K.High) {
        const o = it.kind === K.Low ? OBSTACLES.low[it.variant] : OBSTACLES.high[it.variant];
        if (!this.settled && !r.stumbling && hits(o, it.x, r.offset, r.height, b.width)) { it.done = true; r.hurt(); ev.push(EV.Hit); }
      } else if (it.kind === K.Food) {
        if (this.settled) {
          if (it.own && it.x < RUNNER_X - 14) { it.done = true; ev.push(EV.Left); } // passed a full basket: counted, never punished
        } else if (it.own && Math.abs(it.x - RUNNER_X) <= FOOD_R + b.width / 2 + 2) {
          const y = it.slot === 0 ? HOP_Y : DUCK_Y, lo = r.offset, hi = r.offset + r.height;
          if (hi >= y - FOOD_R && lo <= y + FOOD_R) { it.done = true; it.on = false; ev.push(EV.Own); }
        }
        // a decoy is never collected: it passes harmlessly
      } else if (it.kind === K.Star) {
        if (!this.settled && Math.abs(it.x - RUNNER_X) <= FOOD_R + b.width / 2 + 2 && r.offset + r.height >= STAR_Y - FOOD_R && r.offset <= STAR_Y + FOOD_R) {
          it.done = true; it.on = false; ev.push(EV.Star);
        }
      }
    }
  }
}

// ---------------------------------------------------------------- an autopilot: proves every pattern is winnable (tests, ?debug)
/** Plays like a calm child with perfect eyes: hops at the middle of the clearing window, ducks while under a HIGH obstacle. */
export function autopilot(w: DashWorld, jitterMs = 0): void {
  const r = w.runner, b = w.body, sp = Math.max(1, w.speed);
  let near: Item | null = null;
  for (const it of w.items) if (it.on && !it.done && (it.kind === K.Low || it.kind === K.High || it.kind === K.Star) && it.x > RUNNER_X - 30 && (!near || it.x < near.x)) near = it;
  if (!near) { r.setDuck(false); return; }
  const toMs = ((near.x - RUNNER_X) / sp) * 1000;
  if (near.kind === K.High) {
    const o = OBSTACLES.high[near.variant], half = overlapMs(o, b, sp) / 2;
    r.setDuck(toMs < half + 120 && toMs > -half - 60);
    return;
  }
  r.setDuck(false);
  if (near.kind === K.Star) { if (toMs <= b.jump.durMs * 0.5) r.hop(); return; }
  const o = OBSTACLES.low[near.variant], win = hopWindow(b, o, sp);
  if (win && toMs <= (win[0] + win[1]) / 2 + jitterMs) r.hop();
}

// ---------------------------------------------------------------- round state machine
export type DashPhase = (typeof Ph)[keyof typeof Ph];

export interface DashOpts { need: number; offer: number; meetMs: number }
/** The basket holds 5; the trail offers 6 own foods, so leaving one is a choice, never a penalty. */
export const DASH_ROUND: DashOpts = { need: 5, offer: 6, meetMs: 1200 };

export interface DashResult {
  friend: string; food: string; carried: number; capacity: number; stumbles: number; spills: number; left: number; secretFound: boolean; badges: BadgeId[];
}

/**
 * Ask (pick the runner) -> Run -> Meet (basket full, child feeds) -> Reveal. No fail state: Ph has four phases and none of them is "lost".
 * A stumble only drops at most one carried item.
 */
export class DashRound {
  phase: DashPhase = Ph.Ask;
  t = 0;
  friend = '';
  food = '';
  carried = 0;
  stumbles = 0;
  spills = 0;
  left = 0;
  secretFound = false;
  fed = false;
  constructor(readonly opts: DashOpts = DASH_ROUND) {}

  begin(friend: string): void {
    this.friend = friend; this.food = foodOf(friend);
    this.carried = 0; this.stumbles = 0; this.spills = 0; this.left = 0; this.secretFound = false; this.fed = false;
    this.go(Ph.Trail);
  }
  /** An own food reached the runner. At 5 the basket is full and the run waits for the feed. */
  pickup(): boolean {
    if (this.phase !== Ph.Trail || this.carried >= this.opts.need) return false;
    this.carried++;
    if (this.carried >= this.opts.need) this.go(Ph.Meet);
    return true;
  }
  /** A funny stumble. Drops at most one item. Returns true when one was dropped. */
  stumble(): boolean {
    if (this.phase !== Ph.Trail) return false;
    this.stumbles++;
    if (this.carried === 0) return false;
    this.carried--; this.spills++;
    return true;
  }
  findSecret(): void { if (this.phase === Ph.Trail) this.secretFound = true; }
  leave(): void { if (this.phase === Ph.Meet && !this.fed) this.left++; }
  feed(): boolean {
    if (this.phase !== Ph.Meet || this.fed || this.carried < this.opts.need) return false;
    this.fed = true; this.t = 0;
    return true;
  }
  /** Returns true when the feeding beat is over and the reveal should start. */
  tick(dt: number): boolean {
    this.t += dt;
    if (this.phase === Ph.Meet && this.fed && this.t >= this.opts.meetMs) { this.go(Ph.Reveal); return true; }
    return false;
  }
  next(): void { this.friend = ''; this.fed = false; this.go(Ph.Ask); }

  result(): DashResult {
    const badges: BadgeId[] = [];
    if (this.stumbles === 0) badges.push('clean'); // clean: no stumbles
    if (this.spills === 0) badges.push('full'); // full: nothing spilled
    if (this.secretFound) badges.push('secret');
    return { friend: this.friend, food: this.food, carried: this.carried, capacity: this.opts.need, stumbles: this.stumbles, spills: this.spills, left: this.left, secretFound: this.secretFound, badges };
  }
  private go(p: DashPhase): void { this.phase = p; this.t = 0; }
}

/** The Farm shelf animals the game can earn. */
export const farmIds = (): string[] => shelfCards('farm').map((c) => c.id);
