import { describe, expect, it } from 'vitest';
import {
  ANIMALS_OF, BEHAVIOUR_OF, DEFAULT_ROUND, FOODS, LANE_Y, Ph, ROUTES, Round, SAME_LANE_P, WILD_ANIMALS, centreOf, foodOf, hazardCount,
  laneAt, newWaitingMemory, pickBuddies, pickLane, pickWaiting, rollSpawn, secretChance, topFor,
} from '../src/games/forage/logic';
import { effectOf } from '../src/cards/abilities';
import { lcg } from '../src/audio/recipes';
import { abilityOf, cardOf } from '../src/cards/data';
import en from '../src/locales/en.json';

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

describe('friend choice and buddies', () => {
  it('always three distinct jungle animals, and unowned ones come first', () => {
    const rng = lcg(42);
    for (let trial = 0; trial < 300; trial++) {
      const owned = new Set(WILD_ANIMALS.filter(() => rng() < 0.5));
      const mem = newWaitingMemory();
      for (let r = 0; r < 6; r++) {
        const w = pickWaiting(owned, mem, rng);
        expect(new Set(w).size).toBe(3);
        for (const a of w) expect(WILD_ANIMALS).toContain(a);
        const unowned = WILD_ANIMALS.filter((a) => !owned.has(a));
        if (unowned.length) expect(w.some((a) => !owned.has(a))).toBe(true);
      }
    }
  });
  it('every animal is offered within a few rounds', () => {
    const mem = newWaitingMemory(); const rng = lcg(7); const seen = new Set<string>();
    for (let r = 0; r < 3; r++) pickWaiting(new Set(), mem, rng).forEach((a) => seen.add(a));
    expect(seen.size).toBe(6);
  });
  it('buddies are owned friends, never the friend being helped, at most three', () => {
    const owned = new Set(WILD_ANIMALS);
    const b = pickBuddies(owned, 'bear', newWaitingMemory(), lcg(3));
    expect(b.length).toBe(3);
    expect(b).not.toContain('bear');
    expect(pickBuddies(new Set(), 'bear', newWaitingMemory(), lcg(3))).toEqual([]);
  });
  it('every jungle animal has a food and a working buddy effect', () => {
    for (const a of WILD_ANIMALS) { expect(FOODS).toContain(foodOf(a)); expect(effectOf(a, abilityOf)).not.toBe('none'); }
  });
});

describe('food behaviours and routes', () => {
  it('every food has its own behaviour', () => { for (const f of FOODS) expect(BEHAVIOUR_OF[f]).toBeTruthy(); });
  it('the roar clears hazards; the climb and sniff guarantee the secret', () => {
    for (const r of ROUTES) expect(hazardCount(r, 'roar')).toBe(0);
    expect(secretChance('high', 'climb')).toBe(1);
    expect(secretChance('river', 'sniff')).toBe(1);
  });
  it('a roaring buddy never meets a hazard on the trail', () => {
    const rng = lcg(11);
    for (const r of ROUTES) for (let i = 0; i < 2000; i++) expect(rollSpawn(r, 'roar', rng)).not.toBe('hazard');
  });
});

describe('spawn lanes', () => {
  it('about 35 percent of items spawn in the basket lane, the rest split evenly over the other two (seeded)', () => {
    const rng = lcg(2024);
    for (const current of [0, 1, 2]) {
      const counts = [0, 0, 0];
      const N = 20000;
      for (let i = 0; i < N; i++) counts[pickLane(current, rng)]++;
      expect(counts[current] / N).toBeGreaterThan(SAME_LANE_P - 0.02);
      expect(counts[current] / N).toBeLessThan(SAME_LANE_P + 0.02);
      for (let l = 0; l < 3; l++) if (l !== current) expect(counts[l] / N).toBeGreaterThan(0.3);
    }
    expect(SAME_LANE_P).toBe(0.35);
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
  const start = (buddyEffect: Parameters<Round['begin']>[2] = 'none', buddy: string | null = null): Round => {
    const r = new Round({ ...DEFAULT_ROUND }); r.begin('bear', buddy, buddyEffect); return r;
  };
  it('ask -> trail -> meet -> reveal -> ask, with no fail state', () => {
    const r = new Round({ ...DEFAULT_ROUND });
    expect(r.phase).toBe(Ph.Ask);
    r.begin('bear', null, 'none');
    expect(r.phase).toBe(Ph.Trail);
    expect(r.food).toBe('honey');
    for (let i = 0; i < DEFAULT_ROUND.need - 1; i++) r.pickup();
    expect(r.phase).toBe(Ph.Trail);
    r.pickup();
    expect(r.phase).toBe(Ph.Meet);
    r.pickup(); expect(r.carried).toBe(DEFAULT_ROUND.need);
    expect(r.tick(99999)).toBe(false); // waiting for ever is fine: nobody is fed until the child taps
    expect(r.phase).toBe(Ph.Meet);
    expect(r.feed()).toBe(true);
    r.tick(DEFAULT_ROUND.meetMs - 1); expect(r.phase).toBe(Ph.Meet);
    expect(r.tick(5)).toBe(true);
    expect(r.phase).toBe(Ph.Reveal);
    r.next();
    expect(r.phase).toBe(Ph.Ask);
  });
  it('a bump spills at most one item and never ends the run', () => {
    const r = start(); r.pickup(2);
    expect(r.bump()).toBe(true); expect(r.carried).toBe(1);
    r.bump(); r.bump(); r.bump();
    expect(r.carried).toBe(0);
    expect(r.phase).toBe(Ph.Trail);
  });
  it('the elephant trunk never spills; the tiger saves the first bump', () => {
    const t = start('trunk', 'elephant'); t.pickup(3); t.bump(); t.bump(); expect(t.carried).toBe(3);
    const p = start('pounce', 'tiger'); p.pickup(3); expect(p.bump()).toBe(false); expect(p.bump()).toBe(true); expect(p.carried).toBe(2);
  });
  it('every trail completes with no buddy (a buddy ability is never required)', () => {
    const r = start('none', null);
    for (let i = 0; i < DEFAULT_ROUND.need; i++) r.pickup();
    expect(r.phase).toBe(Ph.Meet);
    r.feed(); r.tick(DEFAULT_ROUND.meetMs);
    expect(r.result().badges).toContain('clean');
  });
  it('route is chosen once, the first lane wins', () => {
    const r = start(); expect(r.chooseRoute('river')).toBe(true); expect(r.chooseRoute('thicket')).toBe(false); expect(r.route).toBe('river');
  });
  it('badges record how it went, and the secret is optional', () => {
    const r = start(); r.pickup(); r.bump(); r.findSecret();
    for (let i = 0; i < 5; i++) r.pickup();
    const b = r.result().badges;
    expect(b).toContain('secret'); expect(b).not.toContain('clean'); expect(b).not.toContain('full');
  });
});

describe('voice lines and captions', () => {
  it('every game line is 2 to 6 words and exists in the English locale', () => {
    for (const k of ['forage.pick', 'forage.look', 'forage.rock', 'forage.friend', 'forage.buddy', 'forage.secret']) {
      const words = (en as unknown as Record<string, string>)[k].trim().split(/\s+/).length;
      expect(words, k).toBeGreaterThanOrEqual(2);
      expect(words, k).toBeLessThanOrEqual(6);
    }
  });
});
