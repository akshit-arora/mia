// Morning Round: the pure parts (no DOM, no canvas), unit-tested in tests/farm.test.ts.
// Food <-> animal mapping, the three signposts at the fork, each animal's chores, and the round state machine.

export type Rng = () => number;
/** The three foods the farm animals eat (card data): grass (cow, buffalo, horse), leaves (goat), seeds (hen). */
export type FoodId = 'grass' | 'leaves' | 'seeds';
export const FOODS: readonly FoodId[] = ['grass', 'leaves', 'seeds'];

/** Which animals a food can bring. Grass brings whichever of cow / buffalo / horse the child has not met yet. */
export const ANIMALS_OF: Record<FoodId, readonly string[]> = {
  grass: ['cow', 'buffalo', 'horse'],
  leaves: ['goat'],
  seeds: ['hen'],
};
export const FARM_ANIMALS: readonly string[] = ['hen', 'cow', 'buffalo', 'goat', 'horse'];

export const isFoodUnowned = (f: FoodId, owned: ReadonlySet<string>): boolean => ANIMALS_OF[f].some((a) => !owned.has(a));

export interface ForkMemory { shown: Record<FoodId, number>; flip: number; last: string }
export const newForkMemory = (): ForkMemory => ({ shown: { grass: 0, leaves: 0, seeds: 0 }, flip: 0, last: '' });

/**
 * The three signposts of one fork: all three farm foods (there are only three, so they are always distinct),
 * in a shuffled order that is never the same as the round before. So at least one sign leads to an unowned animal
 * whenever any is left (every food is on offer), and every animal is reachable.
 */
export function pickFork(_owned: ReadonlySet<string>, mem: ForkMemory, rng: Rng): [FoodId, FoodId, FoodId] {
  const a: FoodId[] = [...FOODS];
  for (let i = 2; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  if (a.join() === mem.last) a.push(a.shift()!); // never the same order twice in a row
  mem.last = a.join();
  for (const f of a) mem.shown[f]++;
  return a as [FoodId, FoodId, FoodId];
}

/** The animal a chosen food brings. Grass: an unowned one if any (taking turns), else all three in turn. */
export function animalFor(food: FoodId, owned: ReadonlySet<string>, mem: ForkMemory): string {
  const list = ANIMALS_OF[food];
  if (list.length === 1) return list[0];
  const free = list.filter((a) => !owned.has(a));
  const cand = free.length ? free : list;
  const a = cand[mem.flip % cand.length];
  mem.flip++;
  return a;
}

// ---------------------------------------------------------------- chores
export type ChoreKind = 'feed' | 'water' | 'milk' | 'eggs' | 'mud' | 'rock' | 'hay' | 'brush' | 'door';
export interface Chore { kind: ChoreKind; need: number }

const c = (kind: ChoreKind, need = 3): Chore => ({ kind, need });
/** Four chores per animal: the first is always feeding the card's food, the last always opens the home's door. */
export const CHORES: Record<string, readonly Chore[]> = {
  hen: [c('feed'), c('eggs'), c('water'), c('door', 1)],
  cow: [c('feed'), c('milk'), c('water'), c('door', 1)],
  buffalo: [c('feed'), c('mud'), c('water'), c('door', 1)],
  goat: [c('feed'), c('rock'), c('hay'), c('door', 1)],
  horse: [c('feed'), c('brush'), c('hay'), c('door', 1)],
};
export const choresFor = (animal: string): readonly Chore[] => CHORES[animal] ?? CHORES.hen;
export const tapsFor = (animal: string): number => choresFor(animal).reduce((n, x) => n + x.need, 0);

// ---------------------------------------------------------------- round state machine
export const Ph = { Ride: 0, Fork: 1, Drive: 2, Chore: 3, Out: 4, Reveal: 5 } as const;
export type PhaseId = (typeof Ph)[keyof typeof Ph];
export interface RoundOpts { rideMs: number; outMs: number }
export const DEFAULT_ROUND: RoundOpts = { rideMs: 16000, outMs: 3400 };

export type TapResult = 'none' | 'tap' | 'chore' | 'done';

/** One round: warm-up ride -> fork -> drive to the chosen home -> chores (tap, tap, tap...) -> the animal walks out -> reveal. */
export class Round {
  phase: PhaseId = Ph.Ride;
  t = 0;
  food: FoodId | null = null;
  animal = '';
  chores: readonly Chore[] = [];
  idx = 0; // current chore
  taps = 0; // taps done in the current chore
  constructor(readonly opts: RoundOpts = DEFAULT_ROUND) {}

  get chore(): Chore | null { return this.phase === Ph.Chore ? this.chores[this.idx] ?? null : null; }
  /** taps done in all finished chores plus the current one */
  get totalTaps(): number { let n = this.taps; for (let i = 0; i < this.idx; i++) n += this.chores[i].need; return n; }

  /** true when the fork should start to slide in */
  tick(dt: number): boolean {
    this.t += dt;
    if (this.phase === Ph.Ride && this.t >= this.opts.rideMs) { this.go(Ph.Fork); return true; }
    if (this.phase === Ph.Out && this.t >= this.opts.outMs) this.go(Ph.Reveal);
    return false;
  }
  /** a signpost was tapped */
  choose(food: FoodId, animal: string): void {
    if (this.phase !== Ph.Fork) return;
    this.food = food; this.animal = animal; this.chores = choresFor(animal); this.idx = 0; this.taps = 0; this.go(Ph.Drive);
  }
  /** the cart reached the home */
  arrive(): void { if (this.phase === Ph.Drive) this.go(Ph.Chore); }
  /** one tap on the glowing thing. A missed tap never gets here: it only pulses. */
  tap(): TapResult {
    const ch = this.chore;
    if (!ch) return 'none';
    this.taps++;
    if (this.taps < ch.need) return 'tap';
    this.taps = 0; this.idx++;
    if (this.idx >= this.chores.length) { this.idx = this.chores.length; this.go(Ph.Out); return 'done'; }
    return 'chore';
  }
  /** the reveal finished: start over */
  next(): void { this.food = null; this.animal = ''; this.chores = []; this.idx = 0; this.taps = 0; this.go(Ph.Ride); }
  private go(p: PhaseId): void { this.phase = p; this.t = 0; }
}

// ---------------------------------------------------------------- layout (logical canvas pixels, short side 135)
export const LANE_Y = [52, 85, 118] as const; // the three roads of the fork
export const ROAD_Y = 85; // the ride road centre
export const YARD_Y = 114; // cart centre at the home yard
export const CART_X = 12; // left edge of the cart
export const hotX = (W: number): number => Math.round(W * 0.5) + 6;
export const doorX = (W: number): number => W - 46;
