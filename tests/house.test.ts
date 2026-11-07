import { describe, expect, it } from 'vitest';
import {
  EV, FOOD_OF, NEED_MAX, NEED_MIN, OUTCOMES, PETS, PET_OF_FOOD, Ph, Round, Seg, T, V, bowlOf, clampX, clampY, eatSpot, homeX,
  newPetMemory, newPose, pantryOrder, poseAt, restOf, TOY_OF, DECO_COUNT, type PetId,
} from '../src/games/house/logic';
import { HOUSE_KEY, createHouseStore, defaultHouse, parseHouse } from '../src/games/house/store';
import { lcg } from '../src/audio/recipes';
import { cardOf, shelfCards } from '../src/cards/data';
import en from '../src/locales/en.json';

const set = (...a: string[]): Set<string> => new Set(a);

describe('pets, foods, toys', () => {
  it('the three pets are exactly the House shelf and each food is the card food', () => {
    expect([...PETS].sort()).toEqual(shelfCards('house').map((c) => c.id).sort());
    for (const p of PETS) {
      expect(cardOf(p).food).toBe(FOOD_OF[p]);
      expect(cardOf(p).type).toBe('pet');
      expect(PET_OF_FOOD[FOOD_OF[p]]).toBe(p);
      expect(OUTCOMES[p].length).toBe(3);
      expect(TOY_OF[p]).toBeTruthy();
    }
    expect(new Set(PETS.map((p) => FOOD_OF[p])).size).toBe(3);
  });
});

describe('pantry order', () => {
  it('is always a permutation of the three pets, and the hinted slot holds an unowned pet while any remain', () => {
    const rng = lcg(3);
    for (let n = 0; n < 600; n++) {
      const owned = new Set(PETS.filter(() => rng() < 0.5));
      const mem = newPetMemory();
      mem.rounds = Math.floor(rng() * 9);
      mem.played.dog = Math.floor(rng() * 4); mem.played.cat = Math.floor(rng() * 4); mem.played.rabbit = Math.floor(rng() * 4);
      mem.last = rng() < 0.3 ? null : PETS[Math.floor(rng() * 3)];
      const { order, hint } = pantryOrder(owned, mem, rng);
      expect([...order].sort()).toEqual([...PETS].sort());
      expect([0, 1, 2]).toContain(hint);
      if (owned.size < 3) expect(owned.has(order[hint])).toBe(false);
    }
  });
  it('a child who follows the hand meets every pet in three rounds', () => {
    const rng = lcg(11);
    const owned = new Set<string>(); const mem = newPetMemory();
    for (let r = 0; r < 3; r++) {
      const { order, hint } = pantryOrder(owned, mem, rng);
      const p = order[hint]; owned.add(p); mem.played[p]++; mem.last = p;
    }
    expect(owned.size).toBe(3);
  });
  it('a child who always taps the centre, the left or the right slot still meets every pet', () => {
    for (const side of [0, 1, 2]) for (let seed = 1; seed <= 20; seed++) {
      const rng = lcg(seed * 13 + side);
      const owned = new Set<string>(); const mem = newPetMemory();
      let r = 0;
      for (; r < 40 && owned.size < 3; r++) { const p = pantryOrder(owned, mem, rng).order[side]; owned.add(p); mem.played[p]++; mem.last = p; }
      expect(owned.size, `side ${side} seed ${seed}`).toBe(3);
    }
  });
  it('the suggested pet is never the one just played while another pet is unowned', () => {
    const rng = lcg(8);
    for (let n = 0; n < 200; n++) {
      const mem = newPetMemory(); mem.last = 'dog'; mem.played.dog = 1;
      const owned = new Set<string>(['dog']);
      const { order, hint } = pantryOrder(owned, mem, rng);
      expect(order[hint]).not.toBe('dog');
    }
  });
  it('with everything owned it rotates the pets', () => {
    const rng = lcg(5); const mem = newPetMemory(); const all = new Set<string>(PETS);
    const seen = new Set<PetId>();
    for (let r = 0; r < 6; r++) { const { order, hint } = pantryOrder(all, mem, rng); const p = order[hint]; seen.add(p); mem.played[p]++; mem.last = p; }
    expect(seen.size).toBe(3);
  });
});

function runRound(pet: PetId, seed: number, W = 270): { r: Round; ms: number; throwsTried: number } {
  const rng = lcg(seed);
  const r = new Round(rng, { W, reduced: false });
  expect(r.begin(pet)).toBe(true);
  let ms = 0, tries = 0, lastPhase: number = r.phase;
  const phases = new Set<number>([Ph.Pantry, r.phase]);
  const pose = newPose();
  let painted = false;
  while (r.phase !== Ph.Reveal && ms < 300000) {
    const dt = 16 + Math.floor(rng() * 40);
    if (r.phase === Ph.Play && rng() < 0.2) { r.throwAt(rng() * 400 - 50, rng() * 300 - 80); tries++; } // wild taps, many ignored while busy
    if (r.phase === Ph.Paint && !painted && ms % 7 === 0) { r.paint(Math.floor(rng() * DECO_COUNT)); painted = true; }
    r.tick(dt); ms += dt;
    poseAt(pose, r);
    for (const k of ['x', 'y', 'lift', 'toyX', 'toyY'] as const) expect(Number.isFinite(pose[k])).toBe(true);
    expect(pose.x).toBeGreaterThanOrEqual(0); expect(pose.x).toBeLessThanOrEqual(W);
    expect(pose.y).toBeGreaterThan(40); expect(pose.y).toBeLessThanOrEqual(135);
    if (r.phase !== lastPhase) { phases.add(r.phase); lastPhase = r.phase; }
  }
  for (const p of [Ph.Pantry, Ph.Arrive, Ph.Play, Ph.Eat, Ph.Home, Ph.Paint, Ph.Reveal]) expect(phases.has(p), `phase ${p}`).toBe(true);
  return { r, ms, throwsTried: tries };
}

describe('round: never fails, always reaches the reveal', () => {
  for (const pet of PETS) {
    it(`${pet}: 60 seeded runs with wild tapping all finish, fill every heart, in a sane time`, () => {
      for (let seed = 1; seed <= 60; seed++) {
        const { r, ms } = runRound(pet, seed * 7 + 1);
        expect(r.phase).toBe(Ph.Reveal);
        expect(r.hearts).toBe(r.need);
        expect(r.need).toBeGreaterThanOrEqual(NEED_MIN); expect(r.need).toBeLessThanOrEqual(NEED_MAX);
        expect(r.throws).toBe(r.need); // exactly one heart per accepted throw
        expect(r.eatStep).toBe(3);
        expect(ms).toBeLessThan(180000);
      }
    });
  }
  it('a child who never taps the paint swatches still gets to the reveal (idle limit), and never taps anywhere in play is simply waited for', () => {
    const r = new Round(lcg(1), { W: 240, reduced: false });
    r.begin('cat');
    let ms = 0;
    for (; ms < 20000; ms += 33) r.tick(33);
    expect(r.phase).toBe(Ph.Play); // waits patiently, no timer, no fail
    expect(r.hearts).toBe(0);
    for (let i = 0; i < 6 && r.phase === Ph.Play; i++) {
      expect(r.throwAt(100 + i * 10, 100)).toBe(true);
      for (let k = 0; k < 400 && r.seg !== Seg.Idle && r.phase === Ph.Play; k++) r.tick(33);
    }
    expect(r.phase).not.toBe(Ph.Play);
    let guard = 0;
    while (r.phase !== Ph.Reveal && guard++ < 2000) r.tick(33);
    expect(r.phase).toBe(Ph.Reveal);
    expect(r.deco).toBe(-1);
  });
  it('taps while the pet is busy, in the wrong phase, or after the end are ignored', () => {
    const r = new Round(lcg(2), { W: 240, reduced: false });
    expect(r.throwAt(100, 100)).toBe(false); // pantry
    expect(r.paint(0)).toBe(false);
    r.begin('dog');
    expect(r.begin('cat')).toBe(false);
    expect(r.throwAt(100, 100)).toBe(false); // arriving
    for (let i = 0; i < 80; i++) r.tick(30);
    expect(r.phase).toBe(Ph.Play);
    expect(r.throwAt(100, 100)).toBe(true);
    expect(r.throwAt(120, 100)).toBe(false); // busy
    expect(r.throws).toBe(1);
  });
  it('outcomes never repeat twice in a row, and all three turn up', () => {
    for (const pet of PETS) {
      const r = new Round(lcg(9), { W: 270, reduced: false });
      const seen = new Set<string>();
      for (let n = 0; n < 12; n++) {
        let prev = '';
        r.phase = Ph.Pantry; r.begin(pet); r.need = 99;
        for (let i = 0; i < 80; i++) r.tick(30);
        for (let k = 0; k < 6; k++) {
          expect(r.throwAt(150, 100)).toBe(true);
          expect(r.outcome).not.toBe(prev); prev = r.outcome; seen.add(r.outcome);
          while (r.seg !== Seg.Idle) r.tick(33);
        }
      }
      expect([...seen].sort()).toEqual([...OUTCOMES[pet]].sort());
    }
  });
  it('the heart is filled at the catch event for every outcome and the round order of events is sane', () => {
    for (const pet of PETS) for (const o of OUTCOMES[pet]) {
      const r = new Round(() => 0.5, { W: 270, reduced: false });
      r.begin(pet); for (let i = 0; i < 80; i++) r.tick(30);
      r.need = 9;
      r.throwAt(200, 100); r.outcome = o; // outcome forced after the fact only for the pose maths
      let sawLand = false, sawCatch = false, sawDone = false;
      for (let i = 0; i < 400 && !sawDone; i++) { r.tick(20); if (r.ev & EV.Land) sawLand = true; if (r.ev & EV.Catch) { expect(sawLand).toBe(true); sawCatch = true; } if (r.ev & EV.Done) { expect(sawCatch).toBe(true); sawDone = true; } }
      expect(sawDone).toBe(true); expect(r.hearts).toBe(1);
    }
  });
  it('reduced motion shortens the throw but still completes', () => {
    const a = new Round(lcg(4), { W: 270, reduced: false }), b = new Round(lcg(4), { W: 270, reduced: true });
    for (const r of [a, b]) { r.begin('dog'); for (let i = 0; i < 80; i++) r.tick(30); r.throwAt(220, 100); }
    expect(b.segMs).toBeLessThan(a.segMs);
  });
});

describe('layout and pose', () => {
  it('homes, bowl and rest are inside the canvas for W 240 to 300 and the homes do not overlap', () => {
    for (const W of [240, 270, 300]) {
      const xs = PETS.map((p) => homeX(p, W)).sort((a, b) => a - b);
      for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(40);
      for (const x of [restOf(W).x, bowlOf(W).x, eatSpot(W).x]) { expect(x).toBeGreaterThan(10); expect(x).toBeLessThan(W - 10); }
      expect(clampX(-50, W)).toBeGreaterThan(0); expect(clampX(999, W)).toBeLessThan(W);
      expect(clampY(0)).toBeGreaterThan(60); expect(clampY(999)).toBeLessThan(135);
    }
  });
  it('the pet curls up at its home in the paint phase', () => {
    const r = new Round(lcg(1), { W: 270, reduced: false });
    r.begin('rabbit'); r.phase = Ph.Paint;
    const p = poseAt(newPose(), r);
    expect(p.v).toBe(V.Curled); expect(p.x).toBe(homeX('rabbit', 270));
  });
});

describe('house storage (mia.house.v1)', () => {
  const mem = (init?: string): { s: { getItem(k: string): string | null; setItem(k: string, v: string): void }; data: Map<string, string> } => {
    const data = new Map<string, string>(); if (init !== undefined) data.set(HOUSE_KEY, init);
    return { data, s: { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v); } } };
  };
  it('saves and reloads the decoration choice', () => {
    const m = mem();
    const a = createHouseStore(m.s);
    expect(a.decoOf('dog')).toBe(defaultHouse().deco.dog);
    a.setDeco('dog', 2); a.setDeco('cat', 0); a.addPlay('cat');
    const b = createHouseStore(m.s);
    expect(b.decoOf('dog')).toBe(2); expect(b.decoOf('cat')).toBe(0); expect(b.playsOf('cat')).toBe(1);
    expect(b.memoryOnly).toBe(false);
  });
  it('falls back to memory when storage is missing, throws on read, or throws on write', () => {
    const none = createHouseStore(null);
    none.setDeco('rabbit', 1); expect(none.decoOf('rabbit')).toBe(1); expect(none.memoryOnly).toBe(true);
    const badRead = createHouseStore({ getItem() { throw new Error('blocked'); }, setItem() { /* */ } });
    badRead.setDeco('dog', 1); expect(badRead.decoOf('dog')).toBe(1);
    const badWrite = createHouseStore({ getItem: () => null, setItem() { throw new Error('quota'); } });
    expect(() => badWrite.setDeco('cat', 2)).not.toThrow();
    expect(badWrite.decoOf('cat')).toBe(2); expect(badWrite.memoryOnly).toBe(true);
  });
  it('corrupt, partial or out-of-range data falls back per field', () => {
    for (const bad of ['', 'not json', '[]', 'null', '{"v":1,"deco":{"dog":9,"cat":"x","rabbit":1.5},"plays":{"dog":-3}}']) {
      const { data } = parseHouse(bad);
      for (const p of PETS) { expect(data.deco[p]).toBe(defaultHouse().deco[p]); expect(data.plays[p]).toBe(0); }
    }
    expect(parseHouse('{"v":1,"deco":{"dog":2}}').data.deco.dog).toBe(2);
  });
  it('data from a newer version is never overwritten', () => {
    const raw = JSON.stringify({ v: 2, deco: { dog: 2 }, extra: true });
    const m = mem(raw);
    const s = createHouseStore(m.s);
    expect(s.decoOf('dog')).toBe(2);
    s.setDeco('dog', 1);
    expect(m.data.get(HOUSE_KEY)).toBe(raw);
    expect(s.decoOf('dog')).toBe(1);
  });
});

describe('locale keys', () => {
  it('every house.* text exists and spoken lines are 2 to 6 words', () => {
    const keys = Object.keys(en).filter((k) => k.startsWith('house.'));
    expect(keys.length).toBeGreaterThan(4);
    for (const k of ['house.pick', 'house.throw', 'house.paint', 'house.nap']) {
      const n = (en as unknown as Record<string, string>)[k].trim().split(/\s+/).length;
      expect(n, k).toBeGreaterThanOrEqual(2); expect(n, k).toBeLessThanOrEqual(6);
    }
    for (let i = 0; i < DECO_COUNT; i++) expect((en as unknown as Record<string, string>)[`house.deco.${i}`]).toBeTruthy();
    expect((en as unknown as Record<string, string>)['house.aria']).toBeTruthy();
  });
  it('timings stay in the planned 60 to 90 s round (about 5 throws)', () => {
    const t = T.arrive + 5 * 6500 + T.eatWalk + T.eatMunch + T.homeWalk + T.homeCurl + 4000;
    expect(t).toBeGreaterThan(30000); expect(t).toBeLessThan(90000);
  });
});

describe('pose continuity: the pet never teleports during a throw', () => {
  for (const pet of PETS) {
    it(`${pet}: moves less than 12 px per 33 ms frame, for every outcome, near and far, left and right`, () => {
      for (let seed = 1; seed <= 40; seed++) for (const [tx, ty] of [[40, 90], [230, 118], [150, 82], [110, 112], [265, 100]]) {
        const r = new Round(lcg(seed), { W: 270, reduced: seed % 5 === 0 });
        r.begin(pet); for (let i = 0; i < 90; i++) r.tick(30);
        r.throwAt(tx, ty);
        const pose = newPose(); poseAt(pose, r);
        let px = pose.x, py = pose.y, worst = 0, what = '';
        for (let i = 0; i < 700 && (r.seg !== Seg.Idle || i === 0); i++) {
          r.tick(33); poseAt(pose, r);
          const d = Math.hypot(pose.x - px, pose.y - py);
          if (d > worst) { worst = d; what = `${r.outcome} seg ${r.seg} t ${Math.round(r.segT)}`; }
          px = pose.x; py = pose.y;
        }
        expect(worst, `${pet} ${what} to ${tx},${ty}`).toBeLessThan(12);
      }
    });
  }
});
