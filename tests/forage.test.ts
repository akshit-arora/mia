import { describe, expect, it } from 'vitest';
import {
  ANIMALS_OF, DEFAULT_ROUND, FOODS, LANE_Y, Ph, Round, SAME_LANE_P, WILD_ANIMALS, animalFor, centreOf, isFoodUnowned, laneAt, newForkMemory,
  pickFork, pickLane, topFor, type FoodId,
} from '../src/games/forage/logic';
import { lcg } from '../src/audio/recipes';
import { cardOf } from '../src/cards/data';
import en from '../src/locales/en.json';

const set = (...a: string[]): Set<string> => new Set(a);

describe('food <-> animal mapping', () => {
  it('covers exactly the six wild animals', () => {
    expect([...new Set(FOODS.flatMap((f) => ANIMALS_OF[f]))].sort()).toEqual([...WILD_ANIMALS].sort());
  });
  it('every food is the animal card food (lion and tiger: the plain meal bowl)', () => {
    for (const f of FOODS) for (const a of ANIMALS_OF[f]) {
      const card = cardOf(a);
      expect(card.shelf).toBe('jungle');
      expect(card.food, a).toBe(f);
    }
    expect(cardOf('lion').food).toBe('meal');
    expect(cardOf('tiger').food).toBe('meal');
  });
});

describe('fork selection', () => {
  it('always three distinct foods, and at least one leads to an unowned animal (when any is unowned)', () => {
    const rng = lcg(42);
    for (let trial = 0; trial < 300; trial++) {
      const owned = new Set(WILD_ANIMALS.filter(() => rng() < 0.6));
      const mem = newForkMemory();
      for (let r = 0; r < 6; r++) {
        const f = pickFork(owned, mem, rng);
        expect(new Set(f).size).toBe(3);
        for (const x of f) expect(FOODS).toContain(x);
        if (WILD_ANIMALS.some((a) => !owned.has(a))) expect(f.some((x) => isFoodUnowned(x, owned))).toBe(true);
      }
    }
  });
  it('with everything owned it still shows three distinct foods', () => {
    const f = pickFork(new Set(WILD_ANIMALS), newForkMemory(), lcg(1));
    expect(new Set(f).size).toBe(3);
  });
  it('every food (so every wild animal) is shown within two rounds', () => {
    const rng = lcg(7);
    for (let trial = 0; trial < 200; trial++) {
      const owned = new Set(WILD_ANIMALS.filter(() => rng() < 0.5));
      const mem = newForkMemory();
      const seen = new Set<FoodId>();
      for (let r = 0; r < 2; r++) pickFork(owned, mem, rng).forEach((x) => seen.add(x));
      expect(seen.size).toBe(5);
    }
  });
  it('a child can collect all six: a simulated player who always picks the first unowned sign finishes in a few rounds', () => {
    const rng = lcg(99);
    const owned = new Set<string>();
    const mem = newForkMemory();
    let rounds = 0;
    while (owned.size < 6 && rounds < 30) {
      const f = pickFork(owned, mem, rng);
      const pick = f.find((x) => isFoodUnowned(x, owned))!;
      owned.add(animalFor(pick, owned, mem));
      rounds++;
    }
    expect(owned.size).toBe(6);
    expect(rounds).toBe(6); // one new animal per round, none wasted
  });
  it('a child who always picks the first sign still meets every animal eventually', () => {
    const rng = lcg(5);
    const owned = new Set<string>();
    const mem = newForkMemory();
    for (let r = 0; r < 60; r++) owned.add(animalFor(pickFork(owned, mem, rng)[0], owned, mem));
    expect(owned.size).toBe(6);
  });
});

describe('lion / tiger share the meal sign', () => {
  it('prefers the one not owned, alternates when both are owned or both are not', () => {
    const mem = newForkMemory();
    expect(animalFor('meal', set('lion'), mem)).toBe('tiger');
    expect(animalFor('meal', set('tiger'), mem)).toBe('lion');
    const a = animalFor('meal', set(), mem), b = animalFor('meal', set(), mem);
    expect(new Set([a, b]).size).toBe(2);
    const c = animalFor('meal', set('lion', 'tiger'), mem), d = animalFor('meal', set('lion', 'tiger'), mem);
    expect(c).not.toBe(d);
  });
  it('single-animal foods always bring that animal', () => {
    const mem = newForkMemory();
    expect(animalFor('fruit', set('monkey'), mem)).toBe('monkey');
    expect(animalFor('seeds', set(), mem)).toBe('peacock');
  });
});

describe('spawn lanes', () => {
  it('about 25 percent of items spawn in the basket lane, the rest split evenly over the other two (seeded)', () => {
    const rng = lcg(2024);
    for (const current of [0, 1, 2]) {
      const counts = [0, 0, 0];
      const N = 20000;
      for (let i = 0; i < N; i++) counts[pickLane(current, rng)]++;
      expect(counts[current] / N).toBeGreaterThan(SAME_LANE_P - 0.02);
      expect(counts[current] / N).toBeLessThan(SAME_LANE_P + 0.02);
      for (let l = 0; l < 3; l++) if (l !== current) expect(counts[l] / N).toBeGreaterThan(0.355);
    }
    expect(SAME_LANE_P).toBe(0.25);
  });
});

describe('layout', () => {
  it('basket, signposts and items are centred on the same lane line (within 1 px)', () => {
    for (const y of LANE_Y) {
      const basket = centreOf(topFor(y, 34), 34);
      for (const h of [30, 33, 32, 24, 16]) expect(Math.abs(centreOf(topFor(y, h), h) - basket)).toBeLessThanOrEqual(1);
    }
  });
  it('touching a lane (its centre, or anywhere nearer to it than to another lane) picks that lane', () => {
    expect(LANE_Y.map((y) => laneAt(y))).toEqual([0, 1, 2]);
    expect([laneAt(0), laneAt(30), laneAt(66), laneAt(70), laneAt(100), laneAt(103), laneAt(134)]).toEqual([0, 0, 0, 1, 1, 2, 2]);
  });
});

describe('round state machine', () => {
  it('warm-up -> fork -> collect -> arrive -> reveal -> next round, with no fail state', () => {
    const r = new Round({ ...DEFAULT_ROUND });
    expect(r.phase).toBe(Ph.Warm);
    expect(r.tick(1000)).toBe(false);
    expect(r.tick(DEFAULT_ROUND.warmMs)).toBe(true); // the signs come in
    expect(r.phase).toBe(Ph.Fork);
    r.pickup(); // ignored before a choice
    expect(r.collected).toBe(0);
    r.choose('honey', 'bear');
    expect(r.phase).toBe(Ph.Collect);
    for (let i = 0; i < DEFAULT_ROUND.need - 1; i++) r.pickup();
    expect(r.phase).toBe(Ph.Collect);
    r.pickup();
    expect(r.phase).toBe(Ph.Arrive);
    r.pickup(); // extra pickups never go past the goal
    expect(r.collected).toBe(DEFAULT_ROUND.need);
    r.tick(DEFAULT_ROUND.arriveMs - 1);
    expect(r.phase).toBe(Ph.Arrive);
    r.tick(5);
    expect(r.phase).toBe(Ph.Reveal);
    expect(r.animal).toBe('bear');
    r.next();
    expect(r.phase).toBe(Ph.Warm);
    expect(r.collected).toBe(0);
  });
  it('waiting for ever in collect never fails or moves backward', () => {
    const r = new Round();
    r.tick(DEFAULT_ROUND.warmMs); r.choose('meal', 'lion');
    for (let i = 0; i < 1000; i++) r.tick(1000);
    expect(r.phase).toBe(Ph.Collect);
    expect(r.collected).toBe(0);
  });
  it('rounds are long enough: the warm-up alone is 15 s or more', () => { expect(DEFAULT_ROUND.warmMs).toBeGreaterThanOrEqual(15000); });
});

describe('voice lines and captions', () => {
  it('every new game line is 2 to 6 words and exists in the English locale', () => {
    for (const k of ['forage.pick', 'forage.look', 'forage.rock']) {
      const words = (en as unknown as Record<string, string>)[k].trim().split(/\s+/).length;
      expect(words, k).toBeGreaterThanOrEqual(2);
      expect(words, k).toBeLessThanOrEqual(6);
    }
  });
});
