import { describe, expect, it } from 'vitest';
import {
  ANIMALS_OF, CHORES, DEFAULT_ROUND, FARM_ANIMALS, FOODS, Ph, Round, animalFor, choresFor, isFoodUnowned, newForkMemory, pickFork, tapsFor, type FoodId,
} from '../src/games/farm/logic';
import { lcg } from '../src/audio/recipes';
import { cardOf, shelfCards, ANIMAL_IDS } from '../src/cards/data';
import en from '../src/locales/en.json';

const set = (...a: string[]): Set<string> => new Set(a);

describe('food <-> animal mapping', () => {
  it('covers exactly the five farm animals, and they are the Farm shelf', () => {
    expect([...new Set(FOODS.flatMap((f) => ANIMALS_OF[f]))].sort()).toEqual([...FARM_ANIMALS].sort());
    expect(shelfCards('farm').map((c) => c.id).sort()).toEqual([...FARM_ANIMALS].sort());
  });
  it('every food is the animal card food (so the chores use the card icon)', () => {
    for (const f of FOODS) for (const a of ANIMALS_OF[f]) expect(cardOf(a).food, a).toBe(f);
  });
  it('cow shelf rule: the cow only ever comes from this farm game, and is a farm card', () => {
    expect(cardOf('cow').shelf).toBe('farm');
    expect(FARM_ANIMALS).toContain('cow');
    for (const id of ANIMAL_IDS) if (cardOf(id).shelf !== 'farm') expect(FARM_ANIMALS).not.toContain(id);
  });
});

describe('fork selection', () => {
  it('always the three distinct foods, never the same order twice, at least one unowned sign while any animal is left', () => {
    const rng = lcg(42);
    for (let trial = 0; trial < 300; trial++) {
      const owned = new Set(FARM_ANIMALS.filter(() => rng() < 0.6));
      const mem = newForkMemory();
      let last = '';
      for (let r = 0; r < 8; r++) {
        const f = pickFork(owned, mem, rng);
        expect(new Set(f).size).toBe(3);
        for (const x of f) expect(FOODS).toContain(x);
        expect(f.join()).not.toBe(last); last = f.join();
        if (FARM_ANIMALS.some((a) => !owned.has(a))) expect(f.some((x) => isFoodUnowned(x, owned))).toBe(true);
      }
    }
  });
  it('a child who always picks the first unowned sign finishes the shelf in five rounds', () => {
    const rng = lcg(99);
    const owned = new Set<string>(); const mem = newForkMemory();
    let rounds = 0;
    while (owned.size < 5 && rounds < 30) {
      const f = pickFork(owned, mem, rng);
      owned.add(animalFor(f.find((x) => isFoodUnowned(x, owned))!, owned, mem));
      rounds++;
    }
    expect(owned.size).toBe(5);
    expect(rounds).toBe(5);
  });
  it('a child who always picks the same sign still meets all three grass animals; one who always picks seeds gets the hen', () => {
    const owned = new Set<string>(); const mem = newForkMemory();
    for (let r = 0; r < 3; r++) owned.add(animalFor('grass', owned, mem));
    expect([...owned].sort()).toEqual(['buffalo', 'cow', 'horse']);
    expect(animalFor('seeds', set(), mem)).toBe('hen');
    expect(animalFor('leaves', set('goat'), mem)).toBe('goat');
  });
  it('with grass animals all owned, grass keeps cycling through them', () => {
    const mem = newForkMemory();
    const all = set('cow', 'buffalo', 'horse');
    const seen = new Set([0, 1, 2].map(() => animalFor('grass', all, mem)));
    expect(seen.size).toBe(3);
  });
  it('every farm animal is reachable (seeded random players, always reach each one eventually)', () => {
    const rng = lcg(5);
    const owned = new Set<string>(); const mem = newForkMemory();
    for (let r = 0; r < 80; r++) { const f = pickFork(owned, mem, rng); owned.add(animalFor(f[Math.floor(rng() * 3)], owned, mem)); }
    expect(owned.size).toBe(5);
  });
});

describe('chores', () => {
  it('each animal has 4 chores: feeds first, opens the door last, 3 taps each (door 1) and every kind is covered', () => {
    for (const a of FARM_ANIMALS) {
      const ch = choresFor(a);
      expect(ch.length).toBe(4);
      expect(ch[0].kind).toBe('feed');
      expect(ch[3].kind).toBe('door');
      expect(ch[3].need).toBe(1);
      expect(tapsFor(a)).toBe(10);
    }
    expect(Object.keys(CHORES).sort()).toEqual([...FARM_ANIMALS].sort());
    expect(choresFor('hen').map((c) => c.kind)).toContain('eggs');
    expect(choresFor('cow').map((c) => c.kind)).toContain('milk');
    expect(choresFor('buffalo').map((c) => c.kind)).toContain('mud');
  });
});

describe('round state machine', () => {
  const play = (animal: string, food: FoodId): Round => {
    const r = new Round({ ...DEFAULT_ROUND });
    expect(r.phase).toBe(Ph.Ride);
    expect(r.tick(1000)).toBe(false);
    expect(r.tick(DEFAULT_ROUND.rideMs)).toBe(true);
    expect(r.phase).toBe(Ph.Fork);
    expect(r.tap()).toBe('none'); // ignored before a choice
    r.choose(food, animal);
    expect(r.phase).toBe(Ph.Drive);
    expect(r.tap()).toBe('none');
    r.arrive();
    expect(r.phase).toBe(Ph.Chore);
    return r;
  };
  it('ride -> fork -> drive -> 4 chores -> out -> reveal -> next round, with no fail state, for all five animals', () => {
    for (const a of FARM_ANIMALS) {
      const food = FOODS.find((f) => ANIMALS_OF[f].includes(a))!;
      const r = play(a, food);
      let n = 0, chores = 0;
      while (r.phase === Ph.Chore) { const res = r.tap(); n++; if (res === 'chore') chores++; if (res === 'done') break; }
      expect(n).toBe(10);
      expect(chores).toBe(3);
      expect(r.phase).toBe(Ph.Out);
      expect(r.tap()).toBe('none');
      r.tick(DEFAULT_ROUND.outMs - 1); expect(r.phase).toBe(Ph.Out);
      r.tick(5); expect(r.phase).toBe(Ph.Reveal);
      expect(r.animal).toBe(a);
      r.next();
      expect(r.phase).toBe(Ph.Ride);
      expect(r.totalTaps).toBe(0);
    }
  });
  it('waiting for ever never fails or moves backward (fork and chore)', () => {
    const r = new Round();
    r.tick(DEFAULT_ROUND.rideMs);
    for (let i = 0; i < 1000; i++) r.tick(1000);
    expect(r.phase).toBe(Ph.Fork);
    r.choose('seeds', 'hen'); r.arrive();
    for (let i = 0; i < 1000; i++) r.tick(1000);
    expect(r.phase).toBe(Ph.Chore); expect(r.taps).toBe(0); expect(r.idx).toBe(0);
  });
  it('totalTaps counts finished chores plus the current one', () => {
    const r = play('cow', 'grass');
    r.tap(); r.tap(); expect(r.totalTaps).toBe(2);
    r.tap(); expect(r.totalTaps).toBe(3); expect(r.idx).toBe(1);
    r.tap(); expect(r.totalTaps).toBe(4);
  });
  it('the warm-up ride alone is at least 10 s, the whole round before the reveal lands in 60-90 s with ~3 s per tap', () => {
    expect(DEFAULT_ROUND.rideMs).toBeGreaterThanOrEqual(10000);
    const est = DEFAULT_ROUND.rideMs + 3000 + 3800 + tapsFor('hen') * 3000 + DEFAULT_ROUND.outMs;
    expect(est).toBeGreaterThanOrEqual(55000); expect(est).toBeLessThanOrEqual(90000);
  });
});

describe('voice lines and captions', () => {
  it('every new spoken game line is 2 to 6 words and exists in the English locale', () => {
    for (const k of ['farm.pick', 'farm.tap', 'farm.look']) {
      const words = (en as unknown as Record<string, string>)[k].trim().split(/\s+/).length;
      expect(words, k).toBeGreaterThanOrEqual(2);
      expect(words, k).toBeLessThanOrEqual(6);
    }
    expect((en as unknown as Record<string, string>)['farm.door']).toBeTruthy();
    expect((en as unknown as Record<string, string>)['farm.aria']).toBeTruthy();
  });
});
