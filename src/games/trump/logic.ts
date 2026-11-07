// Card clash (Trump mode): the pure parts (no DOM, no canvas), unit-tested in tests/trump.test.ts.
// Rules: a hand of 5 per side, drawn only from the child's OWNED cards. Each round one side picks a stat, the higher
// number wins the round, a tie sparkles for both. Nothing is ever taken away: hands and the owned cards never change,
// there are no scores that punish and no timers. The phone side picks gently so the child wins about half the rounds.
import { cardOf, type StatKind } from '../../cards/data';

export type Rng = () => number;
export type Mode = 'phone' | 'friend';
export type Side = 0 | 1; // 0 = left (the child / player one), 1 = right (the phone / player two)
export type Winner = Side | 'tie';
/** The stats a card can offer: the two stored on the card plus the shared "cuddly" fun score every card has. */
export type ClashStat = StatKind | 'cuddly';

export const HAND_SIZE = 5;
export const ROUNDS = 5;
export const MIN_CARDS = 4; // fewer owned cards: the friendly locked state

/** Small seeded generator (mulberry32) so tests and phone-play are repeatable. */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Shared "cuddly" fun score per animal, 1..10 (draft for the owner; deliberately silly, not science). */
export const CUDDLY: Readonly<Record<string, number>> = {
  lion: 5, tiger: 5, elephant: 7, monkey: 6, bear: 8, peacock: 4,
  cow: 6, buffalo: 4, goat: 7, hen: 5, horse: 6,
  dog: 9, cat: 9, rabbit: 10,
};

export const canPlay = (ownedCount: number): boolean => ownedCount >= MIN_CARDS;

export interface StatRow { kind: ClashStat; value: number }
/** The three rows on a card face, in a fixed order: its two stored stats, then cuddly. */
export function rowsOf(id: string): StatRow[] {
  const c = cardOf(id);
  const rows: StatRow[] = (Object.entries(c.stats) as Array<[StatKind, number]>).map(([kind, value]) => ({ kind, value }));
  rows.push({ kind: 'cuddly', value: CUDDLY[id] ?? 5 });
  return rows;
}
/**
 * The number a card brings to a stat. A stat the card does not store is a friendly made-up number
 * (the rounded average of its own two stored stats), so any stat can be compared between any two cards.
 */
export function valueOf(id: string, kind: ClashStat): number {
  if (kind === 'cuddly') return CUDDLY[id] ?? 5;
  const c = cardOf(id);
  const own = c.stats[kind];
  if (own !== undefined) return own;
  const vals = Object.values(c.stats) as number[];
  return Math.max(1, Math.min(10, Math.round(vals.reduce((s, v) => s + v, 0) / Math.max(1, vals.length))));
}
/** The powers two cards can fight with: the stats both cards store, plus cuddly (every card has it). Two or three, in a fixed order. */
export function sharedStats(a: string, b: string): ClashStat[] {
  const ca = cardOf(a).stats, cb = cardOf(b).stats;
  const out: ClashStat[] = (['size', 'speed', 'strength'] as StatKind[]).filter((k) => ca[k] !== undefined && cb[k] !== undefined);
  out.push('cuddly');
  return out;
}
export function compare(a: string, b: string, kind: ClashStat): Winner {
  const x = valueOf(a, kind), y = valueOf(b, kind);
  return x === y ? 'tie' : x > y ? 0 : 1;
}

function shuffled<T>(xs: readonly T[], rng: Rng): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
/** One hand: distinct cards while the pool allows it, topped up with repeats when the child owns fewer than 5. */
export function drawHand(owned: readonly string[], rng: Rng): string[] {
  const pool = shuffled(owned, rng);
  const hand = pool.slice(0, HAND_SIZE);
  while (hand.length < HAND_SIZE) hand.push(owned[Math.floor(rng() * owned.length)]);
  return hand;
}
/** Both hands. The two hands are drawn separately, so the same animal can meet itself (a tie, a sparkle). */
export function drawHands(owned: readonly string[], rng: Rng): [string[], string[]] {
  const a = drawHand(owned, rng), b = drawHand(owned, rng);
  // two different animals meet in each round whenever the collection allows it (a swap inside the second hand)
  for (let i = 0; i < HAND_SIZE; i++) {
    if (a[i] !== b[i]) continue;
    for (let j = 0; j < HAND_SIZE; j++) {
      if (j !== i && b[j] !== a[i] && a[j] !== b[i]) { const t = b[i]; b[i] = b[j]; b[j] = t; break; }
    }
  }
  return [a, b];
}

export interface RoundResult { round: number; picker: Side; kind: ClashStat; a: string; b: string; va: number; vb: number; winner: Winner }

/**
 * One match of five rounds. `picker(round)` is who chooses the stat: in phone mode the child picks the even rounds and the
 * phone the odd ones; with a friend the two take turns. Cards are played in hand order, except the phone, which chooses
 * which of its unplayed cards to show (that is how the gentle bias works; it never explains itself).
 */
export class Match {
  readonly mode: Mode;
  readonly hands: [string[], string[]];
  readonly results: RoundResult[] = [];
  round = 0;
  private readonly rng: Rng;
  private phoneUsed: boolean[] = [];
  private phoneIdx = -1;
  private wantChildWin = true;

  constructor(mode: Mode, owned: readonly string[], rng: Rng) {
    if (!canPlay(owned.length)) throw new RangeError('not enough cards');
    this.mode = mode; this.rng = rng;
    this.hands = drawHands(owned, rng);
    this.phoneUsed = this.hands[1].map(() => false);
    this.startRound();
  }
  get over(): boolean { return this.round >= ROUNDS; }
  picker(round = this.round): Side { return (round % 2) as Side; }
  /** The two cards on the table this round: [left card, right card]. */
  cards(): [string, string] {
    const i = Math.min(this.round, ROUNDS - 1);
    return [this.hands[0][i], this.hands[1][this.mode === 'phone' && this.phoneIdx >= 0 ? this.phoneIdx : i]];
  }

  private startRound(): void {
    if (this.mode !== 'phone' || this.over) return;
    this.wantChildWin = this.rng() < 0.55;
    const child = this.hands[0][this.round];
    const free = this.hands[1].map((c, i) => [c, i] as const).filter(([, i]) => !this.phoneUsed[i]);
    const childPicks = this.picker() === 0;
    // how good is each unplayed phone card for the child? (1 = child wins every way, 0 = child never wins)
    const score = (phone: string): number => {
      const ks = sharedStats(child, phone).map((k) => { const w = compare(child, phone, k); return w === 0 ? 1 : w === 'tie' ? 0.5 : 0; });
      if (!childPicks) return ks.reduce<number>((s, v) => s + v, 0) / ks.length; // the phone will choose the stat itself
      const best = Math.max(...ks), avg = ks.reduce<number>((s, v) => s + v, 0) / ks.length;
      return 0.5 * best + 0.5 * avg;
    };
    const target = this.wantChildWin ? 1 : 0;
    let pick = free[0], bestD = 9;
    for (const f of shuffled(free, this.rng)) { const d = Math.abs(score(f[0]) - target); if (d < bestD) { bestD = d; pick = f; } }
    this.phoneIdx = pick[1];
  }

  /** The stat the phone picks on its turn (only meaningful when picker() is 1 in phone mode). Gentle: it aims at the round's wish. */
  phonePick(): ClashStat {
    const [a, b] = this.cards();
    const opts = this.options();
    const diff = (k: ClashStat): number => valueOf(a, k) - valueOf(b, k); // positive = the child wins
    const target = this.wantChildWin ? 1 : -1;
    let bestK = opts[0], bestD = 99;
    for (const k of shuffled(opts, this.rng)) { const d = Math.abs(Math.sign(diff(k)) - target) + (target > 0 ? -diff(k) : diff(k)) * 0.01; if (d < bestD) { bestD = d; bestK = k; } }
    return bestK;
  }

  /** The powers offered to whoever picks: the stats both cards have, so every number can be seen on both cards. */
  options(): ClashStat[] { const [a, b] = this.cards(); return sharedStats(a, b); }

  /** Play the round with the chosen stat. Nothing is taken from either hand. */
  play(kind: ClashStat): RoundResult {
    if (this.over) throw new RangeError('match is over');
    const [a, b] = this.cards();
    const va = valueOf(a, kind), vb = valueOf(b, kind);
    const r: RoundResult = { round: this.round, picker: this.picker(), kind, a, b, va, vb, winner: va === vb ? 'tie' : va > vb ? 0 : 1 };
    this.results.push(r);
    if (this.mode === 'phone') this.phoneUsed[this.phoneIdx] = true;
    this.round++;
    this.phoneIdx = -1;
    this.startRound();
    return r;
  }
}
export const ALL_STATS: readonly ClashStat[] = ['size', 'speed', 'strength', 'cuddly'];
