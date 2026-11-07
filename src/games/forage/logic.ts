// Forage Trail: the pure parts (no DOM, no canvas), unit-tested in tests/forage.test.ts.
// Food <-> animal mapping, which three signs appear at a fork, where items spawn, and the round state machine.

export type Rng = () => number;
export type FoodId = 'fruit' | 'honey' | 'sugarcane' | 'seeds' | 'meal';

/** Sign foods in rotation order. Icons are the shared card icons `food.<id>`. */
export const FOODS: readonly FoodId[] = ['fruit', 'honey', 'sugarcane', 'seeds', 'meal'];

/** Which animals a food can bring. meal brings lion OR tiger (never a hunt: the covered bowl only). */
export const ANIMALS_OF: Record<FoodId, readonly string[]> = {
  fruit: ['monkey'],
  honey: ['bear'],
  sugarcane: ['elephant'],
  seeds: ['peacock'],
  meal: ['lion', 'tiger'],
};
export const WILD_ANIMALS: readonly string[] = ['monkey', 'bear', 'elephant', 'peacock', 'lion', 'tiger'];

export const isFoodUnowned = (f: FoodId, owned: ReadonlySet<string>): boolean => ANIMALS_OF[f].some((a) => !owned.has(a));

/** Memory of the session so the rotation is fair: how often each food was shown, and the lion/tiger alternation. */
export interface ForkMemory { shown: Record<FoodId, number>; mealFlip: number }
export const newForkMemory = (): ForkMemory => ({ shown: { fruit: 0, honey: 0, sugarcane: 0, seeds: 0, meal: 0 }, mealFlip: 0 });

/**
 * Pick the three foods for one fork (distinct, shuffled across the three lanes).
 * Rule 1: at least one food leads to an animal the child does not own yet (if any is left).
 * Rule 2: the rest are the least-shown foods, so every food (so every animal) turns up within two rounds.
 */
export function pickFork(owned: ReadonlySet<string>, mem: ForkMemory, rng: Rng): [FoodId, FoodId, FoodId] {
  const score = (f: FoodId): number => mem.shown[f] + rng() * 0.9; // least shown first, random among equals
  const unowned = FOODS.filter((f) => isFoodUnowned(f, owned)).sort((a, b) => score(a) - score(b));
  const chosen: FoodId[] = [];
  if (unowned.length) chosen.push(unowned[0]);
  const rest = FOODS.filter((f) => !chosen.includes(f)).sort((a, b) => score(a) - score(b));
  while (chosen.length < 3) chosen.push(rest.shift()!);
  for (const f of chosen) mem.shown[f]++;
  for (let i = 2; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = chosen[i]; chosen[i] = chosen[j]; chosen[j] = t; }
  return chosen as [FoodId, FoodId, FoodId];
}

/** The animal a chosen food brings. For meal: the one not yet owned, else alternate lion / tiger. */
export function animalFor(food: FoodId, owned: ReadonlySet<string>, mem: ForkMemory): string {
  const list = ANIMALS_OF[food];
  if (list.length === 1) return list[0];
  const free = list.filter((a) => !owned.has(a));
  if (free.length === 1) return free[0];
  const a = list[mem.mealFlip % list.length];
  mem.mealFlip++;
  return a;
}

/** Share of items that spawn in the basket's current lane (the others spread over the two other lanes). */
export const SAME_LANE_P = 0.25;
export function pickLane(current: number, rng: Rng): number {
  if (rng() < SAME_LANE_P) return current;
  const other = rng() < 0.5 ? 1 : 2;
  return (current + other) % 3;
}

// ---------------------------------------------------------------- round state machine
export const Ph = { Warm: 0, Fork: 1, Collect: 2, Arrive: 3, Reveal: 4 } as const;
export type PhaseId = (typeof Ph)[keyof typeof Ph];
export interface RoundOpts { warmMs: number; need: number; arriveMs: number }
export const DEFAULT_ROUND: RoundOpts = { warmMs: 22000, need: 8, arriveMs: 2000 };

/** One round: warm-up run -> fork (signs) -> collect `need` -> arrive beat -> reveal -> (next round starts again at Warm). */
export class Round {
  phase: PhaseId = Ph.Warm;
  t = 0;
  collected = 0;
  food: FoodId | null = null;
  animal = '';
  constructor(readonly opts: RoundOpts = DEFAULT_ROUND) {}

  /** true when the fork signs should start to scroll in */
  tick(dt: number): boolean {
    this.t += dt;
    if (this.phase === Ph.Warm && this.t >= this.opts.warmMs) { this.go(Ph.Fork); return true; }
    if (this.phase === Ph.Arrive && this.t >= this.opts.arriveMs) this.go(Ph.Reveal);
    return false;
  }
  /** the basket met a sign */
  choose(food: FoodId, animal: string): void {
    if (this.phase !== Ph.Fork) return;
    this.food = food; this.animal = animal; this.collected = 0; this.go(Ph.Collect);
  }
  /** a wanted food was picked up (anything else is simply ignored: nothing is ever lost) */
  pickup(): void {
    if (this.phase !== Ph.Collect) return;
    this.collected++;
    if (this.collected >= this.opts.need) { this.collected = this.opts.need; this.go(Ph.Arrive); }
  }
  /** the reveal finished: start over */
  next(): void { this.food = null; this.animal = ''; this.collected = 0; this.go(Ph.Warm); }
  private go(p: PhaseId): void { this.phase = p; this.t = 0; }
}

// ---------------------------------------------------------------- layout (logical canvas pixels, short side 135)
export const LANE_Y = [52, 85, 118] as const; // lane centres
export const BASKET_X = 44;
/** Top edge for a sprite of height h whose picture-centre sits on lane y. The basket, the signs and the items all use this, so they line up on a lane. */
export const topFor = (cy: number, h: number): number => Math.round(cy - 3 - h / 2);
export const centreOf = (top: number, h: number): number => top + h / 2;
/** Lane (0..2) for a tap at logical y: the nearest lane line, so touching a lane picks that lane (halfway points between the lane centres) */
export const laneAt = (y: number): number => (y < (LANE_Y[0] + LANE_Y[1]) / 2 ? 0 : y < (LANE_Y[1] + LANE_Y[2]) / 2 ? 1 : 2);
