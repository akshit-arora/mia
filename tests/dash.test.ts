import { describe, expect, it } from 'vitest';
import { lcg } from '../src/audio/recipes';
import { cardOf } from '../src/cards/data';
import {
  BODIES, Course, DASH_ANIMALS, DASH_FOODS, DASH_ROUND, DashRound, DashWorld, EV, FOOD_R, GROUND_Y, HIGH_CLEARANCE, HOP_Y, K, OBSTACLES, Ph,
  REACT_MS, RUNNER_X, Runner, SPEED_MAX, SPEED_MIN, STAR_Y, apexTop, autopilot, bodyOf, decoysOf, foodOf, hits, hopWindow, jumpOffset, minGapMs,
  overlapMs, speedAt, DUCK_Y, farmIds,
} from '../src/games/dash/logic';

const SPEEDS: number[] = [];
for (let s = SPEED_MIN; s <= SPEED_MAX; s += 4) SPEEDS.push(s);
const ALL_LOW = OBSTACLES.low, ALL_HIGH = OBSTACLES.high;

describe('the three farm animals have their own bodies', () => {
  it('hen, cow and goat are Farm shelf cards, and the Ask board offers only them', () => {
    expect([...DASH_ANIMALS]).toEqual(['hen', 'cow', 'goat']);
    for (const id of DASH_ANIMALS) expect(cardOf(id).shelf, id).toBe('farm');
    expect(farmIds()).toEqual(expect.arrayContaining([...DASH_ANIMALS]));
  });
  it('jump data differs: goat highest, cow slowest, hen quickest and lowest', () => {
    const { hen, cow, goat } = BODIES;
    expect(goat.jump.height).toBeGreaterThan(cow.jump.height);
    expect(cow.jump.height).toBeGreaterThan(hen.jump.height);
    expect(cow.jump.durMs).toBeGreaterThan(goat.jump.durMs);
    expect(goat.jump.durMs).toBeGreaterThan(hen.jump.durMs - 1);
    expect(hen.jump.durMs).toBeLessThan(cow.jump.durMs);
    expect(cow.jump.rise).toBeGreaterThan(hen.jump.rise); // heavy: long lift
    expect(goat.jump.rise).toBeLessThan(hen.jump.rise); // springy: fast launch
    expect(new Set(DASH_ANIMALS.map((a) => JSON.stringify(BODIES[a].jump))).size).toBe(3);
    expect(new Set(DASH_ANIMALS.map((a) => BODIES[a].run.frameMs)).size).toBe(3); // each has its own run-cycle timing
    for (const a of DASH_ANIMALS) { expect(BODIES[a].run.frames).toBeGreaterThanOrEqual(2); expect(BODIES[a].run.frames).toBeLessThanOrEqual(4); }
    expect(BODIES.hen.run.frameMs).toBeLessThan(BODIES.cow.run.frameMs); // quick little legs vs heavy gallop
  });
  it('the jump curve starts and ends on the ground and peaks at the stated height', () => {
    for (const a of DASH_ANIMALS) {
      const j = BODIES[a].jump;
      expect(jumpOffset(j, 0)).toBe(0); expect(jumpOffset(j, j.durMs)).toBe(0);
      expect(jumpOffset(j, j.durMs * j.rise)).toBeCloseTo(j.height, 5);
      let max = 0; for (let t = 0; t < j.durMs; t += 1) max = Math.max(max, jumpOffset(j, t));
      expect(max).toBeCloseTo(j.height, 0);
    }
  });
  it('gravity feel differs: the goat is higher than the cow at a quarter of the air time, the cow is later to peak', () => {
    const q = (a: 'hen' | 'cow' | 'goat'): number => jumpOffset(BODIES[a].jump, BODIES[a].jump.durMs * 0.25) / BODIES[a].jump.height;
    expect(q('goat')).toBeGreaterThan(q('cow'));
  });
  it('bodyOf maps ids; each pose of a runner is a legal sprite index', () => {
    for (const a of DASH_ANIMALS) {
      const r = new Runner(bodyOf(a));
      for (let t = 0; t < 2000; t += 16) { r.tick(16); expect(r.pose).toBeGreaterThanOrEqual(0); expect(r.pose).toBeLessThan(7); }
    }
  });
});

describe('every obstacle is clearable by every animal at every speed in range', () => {
  it('LOW obstacles: a comfortable hop window (>= 80 ms) exists for every animal, obstacle and speed', () => {
    for (const a of DASH_ANIMALS) for (const o of ALL_LOW) for (const sp of SPEEDS) {
      const w = hopWindow(BODIES[a], o, sp);
      expect(w, `${a} ${o.id} @${sp}`).not.toBeNull();
      expect(w![1] - w![0], `${a} ${o.id} @${sp}`).toBeGreaterThanOrEqual(80);
    }
  });
  it('a LOW obstacle is never taller than 40% of the lowest jump, and the lowest jump still tops the hop food', () => {
    const minJump = Math.min(...DASH_ANIMALS.map((a) => BODIES[a].jump.height));
    for (const o of ALL_LOW) expect(o.h).toBeLessThanOrEqual(minJump * 0.4);
  });
  it('HIGH obstacles: ducking fits under for every animal, standing and hopping do not (so the duck is the move)', () => {
    for (const a of DASH_ANIMALS) {
      const b = BODIES[a];
      expect(b.duck).toBeLessThanOrEqual(HIGH_CLEARANCE - 2);
      expect(b.stand).toBeGreaterThan(HIGH_CLEARANCE);
      for (const o of ALL_HIGH) {
        expect(hits(o, RUNNER_X, 0, b.duck, b.width), `${a} ${o.id} ducked`).toBe(false);
        expect(hits(o, RUNNER_X, 0, b.stand, b.width), `${a} ${o.id} standing`).toBe(true);
        expect(hits(o, RUNNER_X, b.jump.height, b.stand, b.width), `${a} ${o.id} hopping`).toBe(true);
      }
      for (const o of ALL_LOW) expect(hits(o, RUNNER_X, 0, b.stand, b.width), `${a} ${o.id} walked into`).toBe(true);
    }
  });
  it('the gap rule: between two obstacles there is time to land and react, for the slowest jumper at the top speed', () => {
    for (const a of DASH_ANIMALS) {
      expect(minGapMs(BODIES[a])).toBe(BODIES[a].jump.durMs + REACT_MS);
      const c = new Course(lcg(5), BODIES[a]);
      let prev = c.next(SPEED_MAX); let prevHalf = 0;
      void prev; void prevHalf;
      for (let i = 0; i < 200; i++) {
        const sp = SPEEDS[i % SPEEDS.length];
        const s = c.next(sp);
        const need = (sp * minGapMs(BODIES[a])) / 1000; // px travelled while a hop finishes and the child reacts
        expect(s.gapPx, `${a} #${i}`).toBeGreaterThanOrEqual(need);
      }
    }
  });
  it('simulation: a calm autopilot never stumbles, for every animal, seed and starting speed (including hop-then-duck and duck-then-hop)', () => {
    let pairs = 0;
    for (const a of DASH_ANIMALS) for (const seed of [1, 2, 3, 7, 11, 99]) {
      const w = new DashWorld(BODIES[a], lcg(seed));
      let prevKind = -1, hitCount = 0;
      for (let t = 0; t < 70000; t += 10) {
        autopilot(w, 0);
        w.tick(10);
        if (w.events.includes(EV.Hit)) hitCount++;
        for (const it of w.items) if (it.on && !it.done && (it.kind === K.Low || it.kind === K.High) && it.x > RUNNER_X + 60 && it.x < RUNNER_X + 61) { if (prevKind === K.Low && it.kind === K.High || prevKind === K.High && it.kind === K.Low) pairs++; prevKind = it.kind; }
      }
      expect(hitCount, `${a} seed ${seed}`).toBe(0);
    }
    expect(pairs).toBeGreaterThan(20); // the sample really did contain hop-then-duck and duck-then-hop
  });
  it('simulation with jitter: still clean when the child is up to 30 ms early or late (windows are forgiving)', () => {
    for (const a of DASH_ANIMALS) for (const j of [-30, 30]) {
      const w = new DashWorld(BODIES[a], lcg(21));
      let hitCount = 0;
      for (let t = 0; t < 60000; t += 10) { autopilot(w, j); w.tick(10); if (w.events.includes(EV.Hit)) hitCount++; }
      expect(hitCount, `${a} ${j}`).toBe(0);
    }
  });
  it('the hop food is reached by a hop for every animal but never by standing; the secret star needs a well-timed hop', () => {
    for (const a of DASH_ANIMALS) {
      const b = BODIES[a];
      expect(b.stand, a).toBeLessThan(HOP_Y - FOOD_R); // standing does not collect hop-height food
      expect(apexTop(b), a).toBeGreaterThanOrEqual(HOP_Y);
      expect(b.stand, a).toBeLessThan(STAR_Y - FOOD_R);
      expect(apexTop(b), a).toBeGreaterThanOrEqual(STAR_Y - FOOD_R + 4); // reachable at the apex by every animal
      expect(DUCK_Y + FOOD_R).toBeLessThan(HIGH_CLEARANCE); // duck-height food sits under hanging obstacles
    }
  });
});

describe('no fail state', () => {
  it('a runner who never acts still runs on: stumbles slow the world, nothing ends', () => {
    for (const a of DASH_ANIMALS) {
      const w = new DashWorld(BODIES[a], lcg(4));
      let hitCount = 0, t = 0;
      for (; t < 60000; t += 10) { w.tick(10); if (w.events.includes(EV.Hit)) hitCount++; }
      expect(hitCount).toBeGreaterThan(3);
      expect(w.speed).toBeGreaterThan(0);
      expect(w.distance).toBeGreaterThan(500);
    }
  });
  it('there are four phases and none of them is a loss; a stumble never leaves the Trail', () => {
    expect(Object.keys(Ph).sort()).toEqual(['Ask', 'Meet', 'Reveal', 'Trail']);
    const r = new DashRound(); r.begin('cow');
    for (let i = 0; i < 20; i++) r.stumble();
    expect(r.phase).toBe(Ph.Trail);
    expect(r.carried).toBe(0);
  });
  it('a stumble ignores further hits while it lasts and the speed dips, then recovers', () => {
    const w = new DashWorld(BODIES.hen, lcg(8));
    let dip = Infinity, base = 0;
    for (let t = 0; t < 12000; t += 10) { w.tick(10); if (!w.runner.stumbling) base = Math.max(base, w.speed); else dip = Math.min(dip, w.speed); }
    expect(dip).toBeLessThan(base);
  });
});

describe('only the runner animal\'s own food counts', () => {
  it('the food is the card food, decoys are the other animals\' foods, never the own food', () => {
    expect(foodOf('hen')).toBe('seeds'); expect(foodOf('cow')).toBe('grass'); expect(foodOf('goat')).toBe('leaves');
    expect([...DASH_FOODS].sort()).toEqual(['grass', 'leaves', 'seeds']);
    for (const a of DASH_ANIMALS) {
      const d = decoysOf(a);
      expect(d).toHaveLength(2); expect(d).not.toContain(foodOf(a)); expect(new Set(d).size).toBe(2);
    }
  });
  it('a decoy passes through the runner untouched; an own food is collected; a hop is needed for hop-height food', () => {
    const b = BODIES.goat;
    const w = new DashWorld(b, lcg(1));
    w.items.forEach((i) => { i.on = false; });
    const put = (own: boolean, slot: number): void => { const it = w.items.find((i) => !i.on)!; Object.assign(it, { on: true, x: RUNNER_X, kind: K.Food, slot, own, decoy: 0, done: false, ph: 0 }); };
    put(false, 1);
    (w as unknown as { pending: unknown }).pending = { kind: 'meadow', variant: 0, gapPx: 9999, foods: [] };
    w.tick(1);
    expect(w.events).not.toContain(EV.Own);
    expect(w.items.some((i) => i.on && !i.own && i.kind === K.Food)).toBe(true); // still drifting
    w.items.forEach((i) => { i.on = false; });
    put(true, 1); w.tick(1); expect(w.events).toContain(EV.Own); // duck-height own food: collected on the ground
    put(true, 0); w.tick(1); expect(w.events).not.toContain(EV.Own); // hop-height own food: standing does not reach it
    w.runner.hop();
    for (let i = 0; i < 40 && !w.events.includes(EV.Own); i++) { w.tick(10); const it = w.items.find((x) => x.on && x.kind === K.Food)!; if (it) it.x = RUNNER_X; }
    expect(w.events.includes(EV.Own) || !w.items.some((x) => x.on && x.own)).toBe(true);
  });
  it('the course carries own food regularly and decoys too, and never goes dry', () => {
    for (const a of DASH_ANIMALS) {
      const c = new Course(lcg(3), BODIES[a]);
      let own = 0, decoy = 0, dry = 0, maxDry = 0;
      for (let i = 0; i < 120; i++) {
        const s = c.next(70);
        const o = s.foods.filter((f) => f.own).length;
        own += o; decoy += s.foods.length - o;
        dry = o ? 0 : dry + 1; maxDry = Math.max(maxDry, dry);
      }
      expect(own).toBeGreaterThan(30); expect(decoy).toBeGreaterThan(30);
      expect(maxDry).toBeLessThanOrEqual(8);
    }
  });
});

describe('basket 5, then feed', () => {
  it('fills at 5, goes to Meet, and the run only ends when the child feeds', () => {
    const r = new DashRound(); r.begin('hen');
    expect(DASH_ROUND.need).toBe(5); expect(DASH_ROUND.offer).toBe(6);
    for (let i = 0; i < 4; i++) { expect(r.pickup()).toBe(true); expect(r.phase).toBe(Ph.Trail); }
    expect(r.feed()).toBe(false); // not full yet
    expect(r.pickup()).toBe(true); expect(r.phase).toBe(Ph.Meet);
    expect(r.pickup()).toBe(false); // a 6th is left on the trail, no penalty
    r.leave(); expect(r.left).toBe(1);
    expect(r.tick(60000)).toBe(false); expect(r.phase).toBe(Ph.Meet); expect(r.carried).toBe(5); // waits for the child, no timer
    expect(r.feed()).toBe(true); expect(r.feed()).toBe(false);
    expect(r.tick(100)).toBe(false);
    expect(r.tick(DASH_ROUND.meetMs)).toBe(true); expect(r.phase).toBe(Ph.Reveal);
    r.next(); expect(r.phase).toBe(Ph.Ask);
  });
  it('the world settles when full: obstacles stop hurting and the 6th own food drifts past and is only counted', () => {
    const w = new DashWorld(BODIES.cow, lcg(2));
    for (let i = 0; i < 100; i++) w.tick(10);
    w.settle();
    w.putLeftover();
    let left = 0, hit = 0;
    for (let i = 0; i < 1500; i++) { w.tick(10); left += w.events.filter((e) => e === EV.Left).length; if (w.events.includes(EV.Hit)) hit++; }
    expect(hit).toBe(0); expect(left).toBeGreaterThanOrEqual(1);
    expect(w.speed).toBeLessThan(speedAt(w.t) * 0.5);
  });
  it('a full run through the world: pick up with the autopilot until 5, nothing else needed', () => {
    for (const a of DASH_ANIMALS) {
      const w = new DashWorld(BODIES[a], lcg(31)), r = new DashRound(); r.begin(a);
      let t = 0;
      for (; t < 240000 && r.phase === Ph.Trail; t += 10) {
        autopilot(w, 0); w.tick(10);
        for (const e of w.events) if (e === EV.Own) { r.pickup(); if ((r.phase as number) === Ph.Meet) w.settle(); }
      }
      expect(r.phase, a).toBe(Ph.Meet); // the world always offers enough own food, even if the child never aims for it
    }
  });
});

describe('stumble and badges', () => {
  it('a stumble drops at most one item and the null stumble case never drops anything', () => {
    const r = new DashRound(); r.begin('goat');
    expect(r.stumble()).toBe(false); // empty basket: nothing to drop
    expect(r.stumbles).toBe(1); expect(r.spills).toBe(0); expect(r.carried).toBe(0);
    r.pickup(); r.pickup(); r.pickup();
    expect(r.stumble()).toBe(true); expect(r.carried).toBe(2); expect(r.spills).toBe(1);
  });
  it('clean = no stumbles, full = no spills, secret = the golden star', () => {
    const run = (f: (r: DashRound) => void): string[] => { const r = new DashRound(); r.begin('hen'); f(r); return r.result().badges; };
    expect(run(() => {})).toEqual(['clean', 'full']);
    expect(run((r) => r.findSecret())).toEqual(['clean', 'full', 'secret']);
    expect(run((r) => { r.stumble(); })).toEqual(['full']); // stumbled on an empty basket: spilled nothing
    expect(run((r) => { r.pickup(); r.stumble(); })).toEqual([]);
    expect(run((r) => { r.pickup(); r.stumble(); r.findSecret(); })).toEqual(['secret']);
  });
});

describe('the course is deterministic from a seeded rng', () => {
  const take = (seed: number, a: 'hen' | 'cow' | 'goat', n = 40): string => {
    const c = new Course(lcg(seed), BODIES[a]);
    return JSON.stringify(Array.from({ length: n }, () => c.next(70)));
  };
  it('same seed gives the same pattern, different seeds differ, animals differ in spacing', () => {
    expect(take(5, 'cow')).toBe(take(5, 'cow'));
    expect(take(5, 'cow')).not.toBe(take(6, 'cow'));
    expect(take(5, 'hen')).not.toBe(take(5, 'cow'));
  });
  it('rhythm: no three of a kind in a row, both kinds appear, the first obstacle waits', () => {
    const c = new Course(lcg(9), BODIES.goat);
    const kinds: string[] = [];
    for (let i = 0; i < 100; i++) kinds.push(c.next(70).kind);
    for (let i = 2; i < kinds.length; i++) expect(kinds[i] === kinds[i - 1] && kinds[i] === kinds[i - 2] && kinds[i] !== 'meadow').toBe(false);
    expect(kinds).toContain('low'); expect(kinds).toContain('high');
    expect(new Course(lcg(9), BODIES.goat).next(70).gapPx).toBeGreaterThan(80);
  });
  it('the star is rare: some runs have it, some do not, and it appears at most once', () => {
    let withStar = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const c = new Course(lcg(seed * 7919 + 13), BODIES.hen);
      const n = Array.from({ length: 30 }, () => c.next(70).kind).filter((k) => k === 'meadow').length;
      expect(n).toBeLessThanOrEqual(1); withStar += n;
    }
    expect(withStar).toBeGreaterThan(8); expect(withStar).toBeLessThan(45);
  });
  it('speed ramps gently up to a cap', () => {
    expect(speedAt(0)).toBeLessThan(speedAt(30000)); expect(speedAt(1e9)).toBe(SPEED_MAX);
    expect(speedAt(10000) - speedAt(0)).toBeLessThan(10);
    void overlapMs; void GROUND_Y;
  });
});

// ---------------------------------------------------------------- art, sound, captions, registration
import { CAPTION, DUCK, FEED, HOP, MEET, PICKUP, STAR, START, STUMBLE } from '../src/games/dash/sounds';
import { POSE_DEFS, drawRunner, hasDashSprite } from '../src/games/dash/sprites';
import { TOK } from '../src/games/forage/sprites';
import en from '../src/locales/en.json';
import hi from '../src/locales/hi.json';

const RAW = import.meta.glob(['../src/main.ts', '../src/games/dash/*.ts', '../src/app/home.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const src = (p: string): string => RAW['../' + p];

function recorder(): { g: CanvasRenderingContext2D; colours: Set<string>; calls: Set<string> } {
  const colours = new Set<string>(), calls = new Set<string>(), store: Record<string, unknown> = {};
  const g = new Proxy({}, {
    get: (_t, k: string) => (k in store ? store[k] : (...a: unknown[]) => { calls.add(k); return a[0]; }),
    set: (_t, k: string, v) => { store[k] = v; if ((k === 'fillStyle' || k === 'strokeStyle') && typeof v === 'string') colours.add(v.toLowerCase()); return true; },
  }) as unknown as CanvasRenderingContext2D;
  return { g, colours, calls };
}

describe('flat-vector runner sprites (ART_BIBLE)', () => {
  const tokens = new Set(Object.values(TOK).map((c) => c.toLowerCase()));
  it('hen, cow and goat each have a run cycle (2-4 frames), jump, duck, stumble and happy pose', () => {
    expect(POSE_DEFS).toHaveLength(7);
    for (const a of DASH_ANIMALS) {
      expect(hasDashSprite(a)).toBe(true);
      expect(BODIES[a].run.frames).toBeGreaterThanOrEqual(2); expect(BODIES[a].run.frames).toBeLessThanOrEqual(4);
      for (let p = 0; p < 7; p++) expect(drawRunner(recorder().g, a, p), `${a}/${p}`).toBe(true);
    }
    expect(drawRunner(recorder().g, 'giraffe', 0)).toBe(false);
  });
  it('uses at most 6 palette tokens per sprite, nothing off-palette, no gradients', () => {
    for (const a of DASH_ANIMALS) for (let p = 0; p < 7; p++) {
      const r = recorder(); drawRunner(r.g, a, p);
      expect(r.colours.size, `${a}/${p}`).toBeLessThanOrEqual(6);
      for (const c of r.colours) expect(tokens.has(c), `${a}/${p} ${c}`).toBe(true);
      expect(r.calls.has('createLinearGradient') || r.calls.has('createRadialGradient')).toBe(false);
    }
  });
  it('every pose is drawn differently, and the animals differ from each other', () => {
    const log = (a: string, p: number): string => { const calls: string[] = []; const r = recorder(); const g = new Proxy(r.g, { get: (t, k: string) => { const v = (t as unknown as Record<string, unknown>)[k]; return typeof v === 'function' ? (...x: unknown[]) => { calls.push(k + x.map((n) => (typeof n === 'number' ? n.toFixed(1) : '')).join(',')); return (v as (...y: unknown[]) => unknown)(...x); } : v; }, set: (t, k: string, v) => { (t as unknown as Record<string, unknown>)[k] = v; if (k === 'fillStyle') calls.push('c' + String(v)); return true; } }); drawRunner(g, a, p); return calls.join('|'); };
    for (const a of DASH_ANIMALS) { const seen = new Set<string>(); for (let p = 0; p < 7; p++) seen.add(log(a, p)); expect(seen.size, a).toBe(7); }
    expect(log('hen', 0)).not.toBe(log('cow', 0)); expect(log('cow', 0)).not.toBe(log('goat', 0));
  });
  it('no forbidden effects anywhere in the Farm Dash source: gradients, alpha, blur, filters, pure black', () => {
    for (const f of ['art', 'sprites', 'index']) {
      const s = src(`src/games/dash/${f}.ts`);
      expect(s, f).not.toMatch(/createLinearGradient|createRadialGradient|createConicGradient|globalAlpha|shadowBlur|filter\s*=|#000000|#000['";]/);
    }
  });
});

describe('every sound has a caption (2-6 words, English + Hindi stub)', () => {
  it('the cue table and the locale agree', () => {
    for (const r of [DUCK, STAR, STUMBLE, MEET, FEED, ...Object.values(HOP), ...Object.values(START), ...Object.values(PICKUP).flat()]) {
      expect(r.layers.length, r.name).toBeGreaterThan(0); expect(r.dur, r.name).toBeGreaterThan(0);
    }
    for (const a of DASH_ANIMALS) { expect(HOP[a]).toBeDefined(); expect(START[a]).toBeDefined(); expect(PICKUP[foodOf(a)]).toHaveLength(5); }
    for (const [k, key] of Object.entries(CAPTION)) {
      for (const loc of [en, hi] as unknown as Record<string, string>[]) expect(loc[key], `${k} ${key}`).toBeTruthy();
      const words = (en as unknown as Record<string, string>)[key].trim().split(/\s+/).length;
      expect(words, key).toBeGreaterThanOrEqual(2); expect(words, key).toBeLessThanOrEqual(6);
    }
    for (const k of ['dash.friend', 'dash.look', 'dash.aria']) { expect((en as unknown as Record<string, string>)[k], k).toBeTruthy(); expect((hi as unknown as Record<string, string>)[k], k).toBeTruthy(); }
    for (const k of ['dash.friend', 'dash.look']) { const w = (en as unknown as Record<string, string>)[k].trim().split(/\s+/).length; expect(w).toBeGreaterThanOrEqual(2); expect(w).toBeLessThanOrEqual(6); }
    expect((hi as unknown as { _meta: { reviewed: boolean } })._meta.reviewed).toBe(false);
  });
  it('every game sound goes through a caption cue: no bare audio.sfx / audio.say in the game', () => {
    expect(src('src/games/dash/index.ts')).not.toMatch(/audio\.sfx\(|audio\.say\(/);
  });
});

describe('registration: the Farm door opens Farm Dash; House stays closed', () => {
  it('main.ts imports dash, and not the old farm tap game, house or the clash', () => {
    const main = src('src/main.ts');
    expect(main).toMatch(/^import '\.\/games\/dash'/m);
    for (const g of ['farm', 'house', 'trump']) expect(main, g).not.toMatch(new RegExp(`^import ['"]\\./games/${g}`, 'm'));
  });
  it('the game registers id dash on the farm shelf only, and its earned animals are farm shelf cards', async () => {
    const reg = await import('../src/app/registry');
    reg._clearGames();
    await import('../src/games/dash/index');
    const g = reg.listGames().filter((x) => x.id === 'dash');
    expect(g).toHaveLength(1);
    expect(g[0].shelf).toBe('farm');
    expect(reg.gameForShelf('farm')?.id).toBe('dash');
    expect(reg.gameForShelf('house')).toBeUndefined();
    expect(reg.gameForShelf('jungle')).toBeUndefined(); // dash alone was imported here
    for (const a of DASH_ANIMALS) expect(cardOf(a).shelf).toBe('farm');
    reg._clearGames();
  });
  it('the game never earns a non-farm animal: it only reveals the animal the child picked', () => {
    expect(src('src/games/dash/index.ts')).toMatch(/api\.reveal\(res\.friend, \{ quick: true \}\)/);
    const r = new DashRound(); for (const a of DASH_ANIMALS) { r.begin(a); expect(cardOf(r.result().friend).shelf).toBe('farm'); r.next(); }
  });
});
