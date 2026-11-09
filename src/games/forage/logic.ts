// Forage Trail 2.0: the pure parts (no DOM, no canvas), unit-tested in tests/forage.test.ts.
//
// The loop is friend-first. The child picks a waiting animal, then a route, then fills the basket
// with that animal's own food. Bumps spill food but never end the run. The basket holds 5 while the
// trail offers 6: once it is full the run ends ONLY when the child chooses to feed (a tap on the
// friend or the basket); a 6th food left on the trail costs nothing. Two optional badges (clean, secret) record how it went.
import type { BuddyEffect } from '../../cards/abilities';

export type Rng = () => number;
export type FoodId = 'fruit' | 'honey' | 'sugarcane' | 'seeds' | 'meal';

export const FOODS: readonly FoodId[] = ['fruit', 'honey', 'sugarcane', 'seeds', 'meal'];

/** The six Jungle cards in the data (lion and tiger keep their card data but are not offered in v1). */
export const WILD_ANIMALS: readonly string[] = ['lion', 'tiger', 'elephant', 'monkey', 'bear', 'peacock'];

/** V1 scope (docs/design/V1_BRIEF.md): the only friends the Ask board and the shelf strip show. */
export const V1_ANIMALS: readonly string[] = ['bear', 'monkey', 'elephant', 'peacock'];
/** V1 buddies: only these two have an active ability. They can come along even when not yet owned (a guest). */
export const V1_BUDDIES: readonly string[] = ['elephant', 'monkey'];

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
export const isV1Animal = (id: string): boolean => V1_ANIMALS.includes(id);

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

/** Secret odds. The buddy does not change them in v1: the trunk and the climb change the ROUTE (see shortcut below). */
export function secretChance(route: RouteId, _effect: BuddyEffect): number {
  return ROUTE[route].secret;
}

/** Hazards a route tends to carry (no v1 buddy removes them). */
export function hazardCount(route: RouteId, _effect: BuddyEffect): number {
  return ROUTE[route].hazards;
}

/** One spawn roll: the wanted food, a gift, or a hazard. */
export type SpawnKind = 'food' | 'gift' | 'hazard';
export function rollSpawn(route: RouteId, effect: BuddyEffect, rng: Rng): SpawnKind {
  const r = ROUTE[route];
  const hazardP = hazardCount(route, effect) * 0.09;
  const x = rng();
  if (x < r.food) return 'food';
  if (x < r.food + r.gift) return 'gift';
  if (x < r.food + r.gift + hazardP) return 'hazard';
  return rng() < 0.5 ? 'food' : 'gift';
}

// ---------------------------------------------------------------- buddy shortcut (optional, never required)
/**
 * A shortcut gate appears on the trail only when the buddy is the elephant (trunk: a HIGH branch)
 * or the monkey (climb: a VINE). Steering the basket into the gate lays down a short pattern of
 * the wanted food that the other trails never have: a straight row along the top lane for the
 * trunk, a diagonal climb through all three lanes for the vine. Ignoring the gate costs nothing:
 * the normal spawns still fill the basket (tests/forage-v1.test.ts: no-buddy completion).
 */
export interface ShortcutDef { gateLane: number; pattern: ReadonlyArray<{ lane: number; dx: number }> }
export const SHORTCUT: Record<'trunk' | 'climb', ShortcutDef> = {
  trunk: { gateLane: 0, pattern: [{ lane: 0, dx: 0 }, { lane: 0, dx: 24 }, { lane: 0, dx: 48 }] },
  climb: { gateLane: 2, pattern: [{ lane: 2, dx: 0 }, { lane: 1, dx: 24 }, { lane: 0, dx: 48 }] },
};
export const shortcutOf = (effect: BuddyEffect): ShortcutDef | null => (effect === 'trunk' || effect === 'climb' ? SHORTCUT[effect] : null);

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
  const unowned = V1_ANIMALS.filter((a) => !owned.has(a)).sort((a, b) => score(a) - score(b));
  const rest = V1_ANIMALS.filter((a) => !unowned.includes(a)).sort((a, b) => score(a) - score(b));
  const chosen = unowned.slice(0, 3);
  while (chosen.length < 3 && rest.length) chosen.push(rest.shift()!);
  for (const a of chosen) mem.shown[a] = (mem.shown[a] ?? 0) + 1;
  for (let i = 2; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = chosen[i]; chosen[i] = chosen[j]; chosen[j] = t; }
  return chosen as [string, string, string];
}

/**
 * Buddies on offer: the V1 buddies (Gajju the elephant, Bunty the monkey) other than the friend being helped.
 * They are offered from the very first run, owned or not: a guest buddy rides along without being granted
 * its card. `null` (go solo) is always available and is appended by the UI, never returned here.
 */
export function pickBuddies(friend: string, mem: WaitingMemory, rng: Rng): string[] {
  const score = (a: string): number => (a === mem.lastBuddy ? -40 : 0) + rng();
  return V1_BUDDIES.filter((a) => a !== friend).sort((a, b) => score(a) - score(b));
}

// ---------------------------------------------------------------- round state machine
export const Ph = { Ask: 0, Trail: 1, Meet: 2, Reveal: 3 } as const;
export type PhaseId = (typeof Ph)[keyof typeof Ph];

export interface RoundOpts {
  need: number; // food needed to fill the basket (the basket holds 5)
  offer: number; // food the trail offers in a run (6: leaving one is a choice, never a penalty)
  capacity: number; // shown on the HUD (same as need)
  forkAt: number; // ms into the trail when the route signs arrive
  meetMs: number; // length of the feeding beat after the child taps
}
export const DEFAULT_ROUND: RoundOpts = { need: 5, offer: 6, capacity: 5, forkAt: 6500, meetMs: 1200 };

export type BadgeId = 'clean' | 'secret';
export const BADGES: readonly BadgeId[] = ['clean', 'secret'];

export interface RunResult {
  friend: string;
  food: FoodId;
  route: RouteId;
  carried: number;
  capacity: number;
  bumps: number;
  spills: number;
  left: number; // food left on the trail after the basket was full (a choice, never a penalty)
  shortcut: boolean;
  secretFound: boolean;
  badges: BadgeId[];
}

/**
 * One round: Ask (pick friend + buddy) -> Trail (fork, food, bumps) -> Meet (feed) -> Reveal.
 * There is no fail state: a bump only spills one item and wobbles the basket for a moment.
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
  offered = 0; // wanted food laid on the trail so far
  left = 0;
  shortcut = false;
  secretFound = false;
  fed = false;
  constructor(readonly opts: RoundOpts = DEFAULT_ROUND) {}

  /** Start the trail for a friend, with an optional buddy and its effect. */
  begin(friend: string, buddy: string | null, effect: BuddyEffect): void {
    this.friend = friend; this.buddy = buddy; this.effect = effect;
    this.food = foodOf(friend);
    this.route = 'high'; this.routeChosen = false;
    this.carried = 0; this.bumps = 0; this.spills = 0; this.offered = 0; this.left = 0; this.shortcut = false; this.secretFound = false; this.fed = false;
    this.go(Ph.Trail);
  }

  /** Pick the route at the fork. Ignored after the first pick (the first lane wins). */
  chooseRoute(route: RouteId): boolean {
    if (this.phase !== Ph.Trail || this.routeChosen) return false;
    this.route = route; this.routeChosen = true;
    return true;
  }

  /** The trail lays down one wanted food (the 6th is guaranteed by the caller: see `owesFood`). */
  offer(n = 1): void { this.offered += n; }

  /** Wanted food still owed so the trail has offered `opts.offer` of them. */
  owesFood(): number { return Math.max(0, this.opts.offer - this.offered); }

  /**
   * A wanted food reaches the basket. Returns false when the basket is already full: the food is left
   * where it is, with no penalty and no slowdown. Reaching `need` moves to the Meet beat, but the run
   * only ends when the child feeds.
   */
  pickup(n = 1): boolean {
    if (this.phase !== Ph.Trail || this.carried >= this.opts.need) return false;
    this.carried = Math.min(this.opts.need, this.carried + n);
    if (this.carried >= this.opts.need) this.go(Ph.Meet);
    return true;
  }

  /** A wanted food drifts past a full basket: counted, never punished. */
  leave(): void { if (this.phase === Ph.Meet && !this.fed) this.left++; }

  /** Gajju's high branch or Bunty's vine was taken. Only with the matching buddy, once per run. */
  takeShortcut(): boolean {
    if (this.phase !== Ph.Trail || this.shortcut || !shortcutOf(this.effect)) return false;
    this.shortcut = true;
    return true;
  }

  /** A bump. Spills one item when the basket is not empty. */
  bump(): boolean {
    if (this.phase !== Ph.Trail) return false;
    this.bumps++;
    if (this.carried === 0) return false;
    this.carried = Math.max(0, this.carried - 1);
    this.spills++;
    return true;
  }

  /** The hidden token was found. */
  findSecret(): void {
    if (this.phase !== Ph.Trail) return;
    this.secretFound = true;
  }

  /** The child chooses to feed the friend (a tap on the friend or the basket once it is full): the meet beat starts. */
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
    if (this.secretFound) badges.push('secret');
    return {
      friend: this.friend, food: this.food, route: this.route, carried: this.carried,
      capacity: this.opts.capacity, bumps: this.bumps, spills: this.spills, left: this.left, shortcut: this.shortcut,
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

// ---------------------------------------------------------------- caption throttle
/** A cue that repeats (a pickup per food) should not flood the captions: caption a key only once per `gap` ms. */
export function captionGate(last: Map<string, number>, key: string, now: number, gap = 1800): boolean {
  const t = last.get(key);
  if (t !== undefined && now - t < gap) return false;
  last.set(key, now);
  return true;
}
