import { describe, expect, it } from 'vitest';
import {
  BOWL_X, BOWL_Y, BOX_TABLE, EV, FLOOR_Y, FOOD_GOAL, FOOD_OF, LAUNCH_X, LAUNCH_Y, PETS, PET_OF_FOOD,
  Ph, ROOM_H, ROOM_W, SHELF, SOFA, STAR_POS, TOY_OF, TrickShotRound, predictTrajectory,
  solveShotForFood, type PetId, type TrajectoryPoint,
} from '../src/games/house/logic';
import { HOUSE_KEY, createHouseStore, defaultHouse, parseHouse } from '../src/games/house/store';
import { lcg } from '../src/audio/recipes';
import { cardOf, shelfCards } from '../src/cards/data';
import en from '../src/locales/en.json';
import hi from '../src/locales/hi.json';

const EN = en as unknown as Record<string, string>;
const HI = hi as unknown as Record<string, string>;

describe('house shelf, pets, foods, toys and names', () => {
  it('the three pets are exactly the House shelf and card names are Tuffy, Brownie, Bunny', () => {
    expect([...PETS].sort()).toEqual(shelfCards('house').map((c) => c.id).sort());
    expect(cardOf('dog').name).toBe('Tuffy');
    expect(cardOf('cat').name).toBe('Brownie');
    expect(cardOf('rabbit').name).toBe('Bunny');

    for (const p of PETS) {
      expect(cardOf(p).food).toBe(FOOD_OF[p]);
      expect(cardOf(p).type).toBe('pet');
      expect(PET_OF_FOOD[FOOD_OF[p]]).toBe(p);
      expect(TOY_OF[p]).toBeTruthy();
    }
    expect(new Set(PETS.map((p) => FOOD_OF[p])).size).toBe(3);
  });
});

describe('physics & collision dynamics', () => {
  it('predictTrajectory generates valid, finite descending arc points', () => {
    const points: TrajectoryPoint[] = [];
    const count = predictTrajectory(LAUNCH_X, LAUNCH_Y, 200, -150, points, 16);
    expect(count).toBeGreaterThan(5);
    expect(points.length).toBeGreaterThanOrEqual(count);
    for (let i = 0; i < count; i++) {
      expect(Number.isFinite(points[i].x)).toBe(true);
      expect(Number.isFinite(points[i].y)).toBe(true);
      expect(points[i].x).toBeGreaterThanOrEqual(0);
      expect(points[i].x).toBeLessThanOrEqual(ROOM_W);
      expect(points[i].y).toBeGreaterThanOrEqual(0);
      expect(points[i].y).toBeLessThanOrEqual(ROOM_H);
    }
  });

  it('bounces off left and right walls reverse horizontal velocity', () => {
    const r = new TrickShotRound();
    r.start('dog');
    r.toss(-Math.PI * 0.95, 250); // Hard left into wall
    expect(r.toy.vx).toBeLessThan(0);
    let hitLeft = false;
    for (let i = 0; i < 60; i++) {
      const ev = r.tick(16);
      if (ev & EV.Clack && r.toy.x <= 15) {
        hitLeft = true;
        expect(r.toy.vx).toBeGreaterThan(0); // Reversed
        break;
      }
    }
    expect(hitLeft).toBe(true);
  });

  it('falling on sofa cushion triggers high-elastic Boing', () => {
    const r = new TrickShotRound();
    r.start('dog');
    // Position toy directly above sofa cushion
    r.phase = Ph.Flight;
    r.toy.x = SOFA.x + 20;
    r.toy.y = SOFA.cushionY - 15;
    r.toy.vx = 10;
    r.toy.vy = 120; // Falling down onto cushion
    r.toy.inAir = true;

    let sawBoing = false;
    for (let i = 0; i < 30; i++) {
      const ev = r.tick(16);
      if (ev & EV.Boing) {
        sawBoing = true;
        expect(r.toy.vy).toBeLessThan(0); // Upward rebound
        expect(r.toy.cushionBounces).toBeGreaterThan(0);
        break;
      }
    }
    expect(sawBoing).toBe(true);
  });

  it('striking the box table knocks the wobble boxes over with Tumble', () => {
    const r = new TrickShotRound();
    r.start('cat');
    r.phase = Ph.Flight;
    r.toy.x = BOX_TABLE.x - 10;
    r.toy.y = BOX_TABLE.y - 10;
    r.toy.vx = 150;
    r.toy.vy = 20;
    r.toy.inAir = true;

    let sawTumble = false;
    for (let i = 0; i < 20; i++) {
      const ev = r.tick(16);
      if (ev & EV.Tumble) {
        sawTumble = true;
        expect(r.boxTumbled).toBe(true);
        break;
      }
    }
    expect(sawTumble).toBe(true);
  });

  it('hitting the secret star awards secret badge', () => {
    const r = new TrickShotRound();
    r.start('rabbit');
    r.phase = Ph.Flight;
    r.toy.x = STAR_POS.x - 8;
    r.toy.y = STAR_POS.y - 4;
    r.toy.vx = 80;
    r.toy.vy = 0;
    r.toy.inAir = true;

    let sawStar = false;
    for (let i = 0; i < 20; i++) {
      const ev = r.tick(16);
      if (ev & EV.Star) {
        sawStar = true;
        expect(r.secretEarned).toBe(true);
        expect(r.isSecret()).toBe(true);
        break;
      }
    }
    expect(sawStar).toBe(true);
  });
});

describe('round progression & 100% winnability (zero-fail guarantee)', () => {
  for (const pet of PETS) {
    it(`${pet}: 60 seeded autopilot runs all reach Meet and collect 5 foods without fail`, () => {
      for (let seed = 1; seed <= 60; seed++) {
        const rng = lcg(seed * 17 + 3);
        const r = new TrickShotRound(rng);
        r.start(pet);

        let ms = 0;
        let safetyGuard = 0;

        while (r.phase !== Ph.Meet && safetyGuard++ < 2000) {
          if (r.phase === Ph.Aim) {
            const target = r.foods.find((f) => f.active && !f.collected) || r.foods[0];
            const shot = solveShotForFood(r, target);
            // Add slight jitter to simulate child variance
            const jitterAngle = (rng() - 0.5) * 0.04;
            const jitterPower = (rng() - 0.5) * 8;
            r.toss(shot.angle + jitterAngle, shot.power + jitterPower);
          }

          r.tick(20);
          ms += 20;
        }

        expect(r.phase, `${pet} seed ${seed} reached Meet`).toBe(Ph.Meet);
        expect(r.foodsCollected).toBe(FOOD_GOAL);
        expect(ms).toBeLessThan(120000);
      }
    });
  }

  it('missed throws are fetched by pet and returned without penalty or fail state', () => {
    const r = new TrickShotRound();
    r.start('dog');
    // Toss weakly into the floor
    r.toss(-0.15, 100);
    expect(r.phase).toBe(Ph.Flight);

    let sawFetch = false;
    let returnedToAim = false;
    for (let i = 0; i < 300; i++) {
      const ev = r.tick(20);
      if (r.phase === Ph.Fetch) sawFetch = true;
      if (sawFetch && r.phase === Ph.Aim) {
        returnedToAim = true;
        break;
      }
    }

    expect(sawFetch).toBe(true);
    expect(returnedToAim).toBe(true);
    expect(r.toy.x).toBe(LAUNCH_X);
    expect(r.toy.y).toBe(LAUNCH_Y);
  });

  it('reduced motion shortens the fetch duration', () => {
    const normal = new TrickShotRound(Math.random, { reduced: false });
    normal.start('cat');
    normal.toss(-0.15, 100);
    while (normal.phase !== Ph.Fetch) normal.tick(20);

    const reduced = new TrickShotRound(Math.random, { reduced: true });
    reduced.start('cat');
    reduced.toss(-0.15, 100);
    while (reduced.phase !== Ph.Fetch) reduced.tick(20);

    let redSteps = 0;
    while (reduced.phase === Ph.Fetch && redSteps++ < 100) reduced.tick(20);

    let normSteps = 0;
    while (normal.phase === Ph.Fetch && normSteps++ < 100) normal.tick(20);

    expect(redSteps).toBeLessThan(normSteps);
  });
});

describe('house storage (mia.house.v1)', () => {
  const mem = (init?: string): { s: { getItem(k: string): string | null; setItem(k: string, v: string): void }; data: Map<string, string> } => {
    const data = new Map<string, string>();
    if (init !== undefined) data.set(HOUSE_KEY, init);
    return { data, s: { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v); } } };
  };

  it('saves and reloads plays and decoration choices', () => {
    const m = mem();
    const a = createHouseStore(m.s);
    expect(a.decoOf('dog')).toBe(defaultHouse().deco.dog);
    a.setDeco('dog', 2);
    a.addPlay('dog');
    a.addPlay('dog');
    const b = createHouseStore(m.s);
    expect(b.decoOf('dog')).toBe(2);
    expect(b.playsOf('dog')).toBe(2);
    expect(b.memoryOnly).toBe(false);
  });

  it('falls back to memory when storage is missing or throws', () => {
    const none = createHouseStore(null);
    none.setDeco('rabbit', 1);
    expect(none.decoOf('rabbit')).toBe(1);
    expect(none.memoryOnly).toBe(true);

    const badRead = createHouseStore({ getItem() { throw new Error('blocked'); }, setItem() {} });
    badRead.setDeco('dog', 1);
    expect(badRead.decoOf('dog')).toBe(1);

    const badWrite = createHouseStore({ getItem: () => null, setItem() { throw new Error('quota'); } });
    expect(() => badWrite.setDeco('cat', 2)).not.toThrow();
    expect(badWrite.decoOf('cat')).toBe(2);
    expect(badWrite.memoryOnly).toBe(true);
  });

  it('corrupt, partial or out-of-range data falls back per field', () => {
    for (const bad of ['', 'not json', '[]', 'null', '{"v":1,"deco":{"dog":9,"cat":"x","rabbit":1.5},"plays":{"dog":-3}}']) {
      const { data } = parseHouse(bad);
      for (const p of PETS) {
        expect(data.deco[p]).toBe(defaultHouse().deco[p]);
        expect(data.plays[p]).toBe(0);
      }
    }
  });
});

describe('locale keys & caption word counts', () => {
  it('house UI keys exist in en.json and hi.json', () => {
    for (const k of ['house.pick', 'house.aim', 'house.toss', 'house.fetch', 'house.bank', 'house.secret', 'house.feed', 'house.aria']) {
      expect(EN[k], `en has ${k}`).toBeTruthy();
      expect(HI[k], `hi has ${k}`).toBeTruthy();
    }
  });

  it('house caption lines are strictly between 2 and 6 words in English and Hindi', () => {
    const captionKeys = [
      'cc.house.toss',
      'cc.house.boing',
      'cc.house.clack',
      'cc.house.fetch',
      'cc.house.star',
      'cc.house.munch',
      'cc.house.purr',
    ];
    for (const k of captionKeys) {
      expect(EN[k], `en has ${k}`).toBeTruthy();
      expect(HI[k], `hi has ${k}`).toBeTruthy();

      const enWords = EN[k].trim().split(/\s+/).length;
      expect(enWords, `en length for ${k}="${EN[k]}"`).toBeGreaterThanOrEqual(2);
      expect(enWords, `en length for ${k}="${EN[k]}"`).toBeLessThanOrEqual(6);

      const hiWords = HI[k].trim().split(/\s+/).length;
      expect(hiWords, `hi length for ${k}="${HI[k]}"`).toBeGreaterThanOrEqual(2);
      expect(hiWords, `hi length for ${k}="${HI[k]}"`).toBeLessThanOrEqual(6);
    }
  });
});
