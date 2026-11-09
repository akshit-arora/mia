import { describe, expect, it } from 'vitest';
import {
  ANIMALS_OF, BEHAVIOUR_OF, DEFAULT_ROUND, FOODS, LANE_Y, Ph, ROUTES, Round, SAME_LANE_P, SHORTCUT, V1_ANIMALS, V1_BUDDIES, WILD_ANIMALS, centreOf, foodOf,
  laneAt, newWaitingMemory, pickBuddies, pickLane, pickWaiting, rollSpawn, shortcutOf, topFor,
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

describe('v1 scope: four friends, two buddies', () => {
  it('only bear, monkey, elephant and peacock are ever offered; lion, tiger and giraffe never', () => {
    expect([...V1_ANIMALS].sort()).toEqual(['bear', 'elephant', 'monkey', 'peacock']);
    const rng = lcg(42);
    for (let trial = 0; trial < 300; trial++) {
      const owned = new Set(WILD_ANIMALS.filter(() => rng() < 0.5));
      const mem = newWaitingMemory();
      for (let r = 0; r < 6; r++) {
        const w = pickWaiting(owned, mem, rng);
        expect(new Set(w).size).toBe(3);
        for (const a of w) expect(V1_ANIMALS).toContain(a);
        const unowned = V1_ANIMALS.filter((a) => !owned.has(a));
        if (unowned.length) expect(w.some((a) => !owned.has(a))).toBe(true);
      }
    }
  });
  it('every friend is offered within two rounds', () => {
    const mem = newWaitingMemory(); const rng = lcg(7); const seen = new Set<string>();
    for (let r = 0; r < 2; r++) pickWaiting(new Set(), mem, rng).forEach((a) => seen.add(a));
    expect(seen.size).toBe(4);
  });
  it('lion and tiger keep their card data but have no active buddy effect', () => {
    expect(cardOf('lion').food).toBe('meal'); expect(cardOf('tiger').food).toBe('meal');
    expect(effectOf('lion', abilityOf)).toBe('none'); expect(effectOf('tiger', abilityOf)).toBe('none');
    expect(effectOf('bear', abilityOf)).toBe('none'); expect(effectOf('peacock', abilityOf)).toBe('none');
  });
  it('only Gajju (trunk) and Bunty (climb) have an effect', () => {
    expect(effectOf('elephant', abilityOf)).toBe('trunk');
    expect(effectOf('monkey', abilityOf)).toBe('climb');
    expect(effectOf(null, abilityOf)).toBe('none');
  });
  it('buddies are offered from the very first run: guests, owned or not, never the friend being helped', () => {
    expect([...V1_BUDDIES].sort()).toEqual(['elephant', 'monkey']);
    // nothing owned at all (run 1): still a buddy tile
    expect(pickBuddies('bear', newWaitingMemory(), lcg(3)).sort()).toEqual(['elephant', 'monkey']);
    expect(pickBuddies('peacock', newWaitingMemory(), lcg(3)).length).toBe(2);
    expect(pickBuddies('elephant', newWaitingMemory(), lcg(3))).toEqual(['monkey']);
    expect(pickBuddies('monkey', newWaitingMemory(), lcg(3))).toEqual(['elephant']);
    for (const f of V1_ANIMALS) expect(pickBuddies(f, newWaitingMemory(), lcg(1)).length).toBeGreaterThan(0);
  });
  it('every v1 friend has a food', () => { for (const a of V1_ANIMALS) expect(FOODS).toContain(foodOf(a)); });
  it('the food <-> animal map still covers the six jungle cards', () => {
    expect([...new Set(FOODS.flatMap((f) => ANIMALS_OF[f]))].sort()).toEqual([...WILD_ANIMALS].sort());
  });
});

describe('food behaviours and routes', () => {
  it('every food has its own behaviour', () => { for (const f of FOODS) expect(BEHAVIOUR_OF[f]).toBeTruthy(); });
  it('a buddy does not change what a route spawns, only whether a shortcut gate appears', () => {
    for (const r of ROUTES) { const a = lcg(5), b = lcg(5); for (let i = 0; i < 500; i++) expect(rollSpawn(r, 'trunk', a)).toBe(rollSpawn(r, 'none', b)); }
    expect(shortcutOf('none')).toBeNull();
    expect(shortcutOf('trunk')).toBe(SHORTCUT.trunk);
    expect(shortcutOf('climb')).toBe(SHORTCUT.climb);
  });
  it('the two shortcuts differ: a straight row on the top lane vs a climb through all three lanes', () => {
    expect(SHORTCUT.trunk.pattern.map((p) => p.lane)).toEqual([0, 0, 0]);
    expect(SHORTCUT.climb.pattern.map((p) => p.lane)).toEqual([2, 1, 0]);
    expect(SHORTCUT.trunk.gateLane).not.toBe(SHORTCUT.climb.gateLane);
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
    expect(r.tick(99999)).toBe(false); // waiting for ever is fine: nobody is fed until the child chooses to
    expect(r.phase).toBe(Ph.Meet);
    expect(r.feed()).toBe(true);
    r.tick(DEFAULT_ROUND.meetMs - 1); expect(r.phase).toBe(Ph.Meet);
    expect(r.tick(5)).toBe(true);
    expect(r.phase).toBe(Ph.Reveal);
    r.next();
    expect(r.phase).toBe(Ph.Ask);
  });
  it('the basket holds 5 while the trail offers 6', () => {
    expect([DEFAULT_ROUND.need, DEFAULT_ROUND.offer, DEFAULT_ROUND.capacity]).toEqual([5, 6, 5]);
    const r = start(); expect(r.owesFood()).toBe(6);
    r.offer(5); expect(r.owesFood()).toBe(1);
    r.offer(); expect(r.owesFood()).toBe(0); r.offer(); expect(r.owesFood()).toBe(0);
  });
  it('a full basket leaves the 6th food: no penalty, no phase change, no spill, the run waits for the feed', () => {
    const r = start(); r.offer(6);
    for (let i = 0; i < 5; i++) expect(r.pickup()).toBe(true);
    expect(r.phase).toBe(Ph.Meet);
    expect(r.pickup()).toBe(false); // the 6th does not fit
    expect(r.carried).toBe(5);
    r.leave(); expect(r.left).toBe(1);
    expect(r.bump()).toBe(false); expect(r.spills).toBe(0); // nothing can spill the full basket in the meet beat
    expect(r.tick(60000)).toBe(false); expect(r.phase).toBe(Ph.Meet); // never auto-ends
    expect(r.feed()).toBe(true);
    r.tick(DEFAULT_ROUND.meetMs);
    expect(r.phase).toBe(Ph.Reveal);
    const res = r.result();
    expect(res.carried).toBe(5); expect(res.left).toBe(1); expect(res.badges).toContain('clean'); expect(res.badges).toContain('full');
  });
  it('feed does nothing before the basket is full', () => {
    const r = start(); r.pickup(2);
    expect(r.feed()).toBe(false); expect(r.phase).toBe(Ph.Trail);
  });
  it('a bump spills at most one item and never ends the run', () => {
    const r = start(); r.pickup(2);
    expect(r.bump()).toBe(true); expect(r.carried).toBe(1);
    r.bump(); r.bump(); r.bump();
    expect(r.carried).toBe(0);
    expect(r.phase).toBe(Ph.Trail);
  });
  it('the buddy shortcut needs the matching buddy and works once; it never changes what fills the basket', () => {
    const none = start(); expect(none.takeShortcut()).toBe(false);
    const t = start('trunk', 'elephant'); expect(t.takeShortcut()).toBe(true); expect(t.takeShortcut()).toBe(false); expect(t.result().shortcut).toBe(true);
    const c = start('climb', 'monkey'); expect(c.takeShortcut()).toBe(true);
    t.bump(); expect(t.bumps).toBe(1); // the trunk no longer cancels spills: it opens a route instead
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
