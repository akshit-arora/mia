// Forage Trail 2.0: the pure parts (no DOM, no canvas), unit-tested in tests/forage.test.ts.
//
// The loop is friend-first. The child picks a waiting animal, then a route, then fills the basket
// with that animal's own food. Bumps spill food but never end the run; the run ends when the
// basket is full and the child feeds the friend. Three optional badges record how it went.
import type { BuddyEffect } from '../../cards/abilities';

export type Rng = () => number;
export type FoodId = 'fruit' | 'honey' | 'sugarcane' | 'seeds' | 'meal';

export const FOODS: readonly FoodId[] = ['fruit', 'honey', 'sugarcane', 'seeds', 'meal'];

/** The six Jungle animals (card ids). */
export const WILD_ANIMALS: readonly string[] = ['lion', 'tiger', 'elephant', 'monkey', 'bear', 'peacock'];

/** The animal decides the food. Meal brings lion OR tiger; the covered bowl is never a hunt. */
export const FOOD_OF: Record<string, FoodId> = {
  lion: 'meal', tiger: 'meal', monkey: 'fruit', bear: 'honey', elephant: 'sugarcane', peacock: 'seeds',
};
export const foodOf = (animal: string): FoodId => FOOD_OF[animal] ?? 'fruit';

/** Reverse map, kept because cards and tests describe foods as "what this food brings". */
export const ANIMALS_OF: Record<FoodId, readonly string[]> = {
  fruit: ['monkey'], honey: ['bear'], sugarcane: ['elephant'], seeds: ['peacock'], meal: ['lion', 'tiger'],
};
export const isJungleAnimal = (id: string): boolean => WILD_ANIMALS.includes(id);

// ---------------------------------------------------------------- food behaviour
/** How each food moves / feels on the trail. The child learns it by playing, not by reading. */
export type FoodBehaviour = 'bounce' | 'sticky' | 'heavy' | 'scatter' | 'quiet';
export const BEHAVIOUR_OF: Record<FoodId, FoodBehaviour> = {
  fruit: 'bounce', honey: 'sticky', sugarcane: 'heavy', seeds: 'scatter', meal: 'quiet',
};

// ---------------------------------------------------------------- routes
/** A fork is a route choice, not a food quiz. Each route changes speed, item mix and secret odds. */
export type RouteId = 'river' | 'thicket' | 'high';
export const ROUTES: readonly RouteId[] = ['river', 'thicket', 'high'];
export interface RouteDef {
  speed: number; // scroll multiplier
  hazards: number; // how many hazards the route tends to carry
  food: number; // share of spawns that are the wanted food
  gift: number; // share that are sparkles / flowers
  secret: number; // chance the hidden token appears
}
export const ROUTE: Record<RouteId, RouteDef> = {
  river: { speed: 1.25, hazards: 3, food: 0.78, gift: 0.04, secret: 0.1 }, // fast, food-rich, risky
  thicket: { speed: 0.82, hazards: 1, food: 0.55, gift: 0.3, secret: 0.3 }, // slow, gift-rich, safe
  high: { speed: 1.0, hazards: 2, food: 0.6, gift: 0.15, secret: 0.5 }, // balanced, best secret odds
};

/** Secret odds after the buddy's ability is applied. */
export function secretChance(route: RouteId, effect: BuddyEffect): number {
  if (effect === 'climb' && route === 'high') return 1;
  if (effect === 'fan' && route === 'thicket') return 1;
  if (effect === 'sniff') return 1;
  return ROUTE[route].secret;
}

/** Hazards actually spawned on a route after the buddy's ability. */
export function hazardCount(route: RouteId, effect: BuddyEffect): number {
  return effect === 'roar' ? 0 : ROUTE[route].hazards;
}

/** Extra food the bear's nose reveals (on top of normal spawns). */
export const SNIFF_BONUS_FOOD = 2;

/** One spawn roll: the wanted food, a gift, or a hazard. */
export type SpawnKind = 'food' | 'gift' | 'hazard';
export function rollSpawn(route: RouteId, effect: BuddyEffect, rng: Rng): SpawnKind {
  const r = ROUTE[route];
  const hazardP = hazardCount(route, effect) === 0 ? 0 : effect === 'pounce' ? r.hazards * 0.06 : r.hazards * 0.09;
  const x = rng();
  if (x < r.food) return 'food';
  if (x < r.food + r.gift) return 'gift';
  if (x < r.food + r.gift + hazardP) return 'hazard';
  return rng() < 0.5 ? 'food' : 'gift';
}

// ---------------------------------------------------------------- who is waiting / buddy
/** Fair rotation memory: how often each animal has been offered. */
export interface WaitingMemory { shown: Record<string, number>; lastFriend: string; lastBuddy: string }
export const newWaitingMemory = (): WaitingMemory => ({ shown: {}, lastFriend: '', lastBuddy: '' });

/**
 * Three animals to offer, distinct. Unowned animals are preferred so the collection can grow;
 * least-offered animals come first so every friend appears within a couple of rounds.
 */
export function pickWaiting(owned: ReadonlySet<string>, mem: WaitingMemory, rng: Rng): [string, string, string] {
  const score = (a: string): number => (mem.shown[a] ?? 0) * 10 + (owned.has(a) ? 4 : 0) + rng();
  const unowned = WILD_ANIMALS.filter((a) => !owned.has(a)).sort((a, b) => score(a) - score(b));
  const rest = WILD_ANIMALS.filter((a) => !unowned.includes(a)).sort((a, b) => score(a) - score(b));
  const chosen = unowned.slice(0, 3);
  while (chosen.length < 3 && rest.length) chosen.push(rest.shift()!);
  for (const a of chosen) mem.shown[a] = (mem.shown[a] ?? 0) + 1;
  for (let i = 2; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = chosen[i]; chosen[i] = chosen[j]; chosen[j] = t; }
  return chosen as [string, string, string];
}

/**
 * Up to three owned friends to bring as buddies, excluding the friend being helped.
 * `null` is always available (go solo) and is appended by the UI, never returned here.
 */
export function pickBuddies(owned: ReadonlySet<string>, friend: string, mem: WaitingMemory, rng: Rng): string[] {
  const pool = WILD_ANIMALS.filter((a) => owned.has(a) && a !== friend);
  const score = (a: string): number => (a === mem.lastBuddy ? -40 : 0) + rng();
  return pool.sort((a, b) => score(a) - score(b)).slice(0, 3);
}

// ---------------------------------------------------------------- round state machine
export const Ph = { Ask: 0, Trail: 1, Meet: 2, Reveal: 3 } as const;
export type PhaseId = (typeof Ph)[keyof typeof Ph];

export interface RoundOpts {
  need: number; // food needed to fill the basket
  capacity: number; // shown on the HUD (same as need; kept separate for future buddies)
  forkAt: number; // ms into the trail when the route signs arrive
  meetMs: number; // length of the feeding beat after the child taps
}
export const DEFAULT_ROUND: RoundOpts = { need: 5, capacity: 5, forkAt: 6500, meetMs: 1200 };

export type BadgeId = 'clean' | 'full' | 'secret';
export const BADGES: readonly BadgeId[] = ['clean', 'full', 'secret'];

export interface RunResult {
  friend: string;
  food: FoodId;
  route: RouteId;
  carried: number;
  capacity: number;
  bumps: number;
  spills: number;
  secretFound: boolean;
  badges: BadgeId[];
}

/**
 * One round: Ask (pick friend + buddy) -> Trail (fork, food, bumps) -> Meet (feed) -> Reveal.
 * There is no fail state: a bump only spills one item and slows the basket for a moment.
 */
export class Round {
  phase: PhaseId = Ph.Ask;
  t = 0;
  friend = '';
  buddy: string | null = null;
  effect: BuddyEffect = 'none';
  food: FoodId = 'fruit';
  route: RouteId = 'high';
  routeChosen = false;
  carried = 0;
  bumps = 0;
  spills = 0;
  secretFound = false;
  fed = false;
  constructor(readonly opts: RoundOpts = DEFAULT_ROUND) {}

  /** Start the trail for a friend, with an optional buddy and its effect. */
  begin(friend: string, buddy: string | null, effect: BuddyEffect): void {
    this.friend = friend; this.buddy = buddy; this.effect = effect;
    this.food = foodOf(friend);
    this.route = 'high'; this.routeChosen = false;
    this.carried = 0; this.bumps = 0; this.spills = 0; this.secretFound = false; this.fed = false;
    this.go(Ph.Trail);
  }

  /** Pick the route at the fork. Ignored after the first pick (the first lane wins). */
  chooseRoute(route: RouteId): boolean {
    if (this.phase !== Ph.Trail || this.routeChosen) return false;
    this.route = route; this.routeChosen = true;
    return true;
  }

  /** A wanted food is in the basket. Reaching `need` moves to the Meet beat. */
  pickup(n = 1): void {
    if (this.phase !== Ph.Trail) return;
    this.carried = Math.min(this.opts.need, this.carried + n);
    if (this.carried >= this.opts.need) this.go(Ph.Meet);
  }

  /** A bump. Spills one item when the basket is not empty and the buddy cannot save it. */
  bump(): boolean {
    if (this.phase !== Ph.Trail) return false;
    this.bumps++;
    const saved = this.effect === 'trunk' || (this.effect === 'pounce' && this.bumps === 1);
    if (saved || this.carried === 0) return false;
    this.carried = Math.max(0, this.carried - 1);
    this.spills++;
    return true;
  }

  /** The hidden token was found. */
  findSecret(): void {
    if (this.phase !== Ph.Trail) return;
    this.secretFound = true;
  }

  /** The child feeds the friend: one tap starts the meet beat. */
  feed(): boolean {
    if (this.phase !== Ph.Meet || this.fed) return false;
    this.fed = true; this.t = 0;
    return true;
  }

  tick(dt: number): boolean {
    this.t += dt;
    if (this.phase === Ph.Meet && this.fed && this.t >= this.opts.meetMs) { this.go(Ph.Reveal); return true; }
    return false;
  }

  /** The reveal finished: back to the Ask board. */
  next(): void { this.friend = ''; this.buddy = null; this.effect = 'none'; this.fed = false; this.go(Ph.Ask); }

  result(): RunResult {
    const badges: BadgeId[] = [];
    if (this.bumps === 0) badges.push('clean');
    if (this.spills === 0) badges.push('full');
    if (this.secretFound) badges.push('secret');
    return {
      friend: this.friend, food: this.food, route: this.route, carried: this.carried,
      capacity: this.opts.capacity, bumps: this.bumps, spills: this.spills,
      secretFound: this.secretFound, badges,
    };
  }

  private go(p: PhaseId): void { this.phase = p; this.t = 0; }
}

// ---------------------------------------------------------------- layout (logical canvas pixels, short side 135)
export const LANE_Y = [52, 85, 118] as const; // lane centres
export const BASKET_X = 44;
/** Top edge for a sprite of height h whose picture-centre sits on lane y. */
export const topFor = (cy: number, h: number): number => Math.round(cy - 3 - h / 2);
export const centreOf = (top: number, h: number): number => top + h / 2;
export const laneAt = (y: number): number => (y < (LANE_Y[0] + LANE_Y[1]) / 2 ? 0 : y < (LANE_Y[1] + LANE_Y[2]) / 2 ? 1 : 2);

/** Spawn lane: mostly away from the basket so the child steers (35% / 65% split). */
export const SAME_LANE_P = 0.35;
export function pickLane(current: number, rng: Rng): number {
  if (rng() < SAME_LANE_P) return current;
  const other = rng() < 0.5 ? 1 : 2;
  return (current + other) % 3;
}
