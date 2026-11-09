import { describe, expect, it } from 'vitest';
import { LOGICAL_H, LOGICAL_W, fitScale } from '../src/engine/stage';
import { DEFAULT_ROUND, Ph, ROUTES, Round, V1_ANIMALS, captionGate } from '../src/games/forage/logic';
import { CAPTION, BUMP, BUDDY, FEED, MEET, SECRET } from '../src/games/forage/sounds';
import { POSES, TOK, VECTOR_ANIMALS, drawAnimal } from '../src/games/forage/sprites';
import { effectOf } from '../src/cards/abilities';
import { abilityOf } from '../src/cards/data';
import { gameForShelf, listGames } from '../src/app/registry';
import en from '../src/locales/en.json';
import hi from '../src/locales/hi.json';

const RAW = import.meta.glob(['../src/main.ts', '../src/app/home.ts', '../src/cards/scenes.ts', '../src/games/forage/{art,index}.ts', '../src/games/trump/index.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const src = (p: string): string => RAW['../' + p];

/** A fake 2D context that records every colour a sprite uses and does nothing else. */
function recorder(): { g: CanvasRenderingContext2D; colours: Set<string>; calls: Set<string>; log: string[] } {
  const colours = new Set<string>(), calls = new Set<string>(), log: string[] = [], store: Record<string, unknown> = {};
  const g = new Proxy({}, {
    get: (_t, k: string) => (k in store ? store[k] : (...a: unknown[]) => { calls.add(k); log.push(k + a.join(',')); return a[0]; }),
    set: (_t, k: string, v) => { store[k] = v; if ((k === 'fillStyle' || k === 'strokeStyle') && typeof v === 'string') colours.add(v.toLowerCase()); return true; },
  }) as unknown as CanvasRenderingContext2D;
  return { g, colours, calls, log };
}

describe('flat-vector animal sprites (ART_BIBLE)', () => {
  const tokens = new Set(Object.values(TOK).map((c) => c.toLowerCase()));
  it('covers bear, monkey, elephant, peacock with two poses each', () => {
    expect([...VECTOR_ANIMALS].sort()).toEqual(['bear', 'elephant', 'monkey', 'peacock']);
    for (const id of VECTOR_ANIMALS) for (const pose of POSES) expect(drawAnimal(recorder().g, id, pose), id).toBe(true);
    expect(drawAnimal(recorder().g, 'giraffe', 0)).toBe(false);
  });
  it('uses at most 6 palette tokens per sprite, nothing off-palette, no gradients or blur', () => {
    for (const id of VECTOR_ANIMALS) for (const pose of POSES) {
      const r = recorder(); drawAnimal(r.g, id, pose);
      expect(r.colours.size, `${id}/${pose}`).toBeLessThanOrEqual(6);
      for (const c of r.colours) expect(tokens.has(c), `${id}/${pose} ${c}`).toBe(true);
      expect(r.calls.has('createLinearGradient') || r.calls.has('createRadialGradient')).toBe(false);
    }
  });
  it('the happy pose draws something different from idle', () => {
    for (const id of VECTOR_ANIMALS) {
      const a = recorder(), b = recorder(); drawAnimal(a.g, id, 0); drawAnimal(b.g, id, 1);
      expect(a.log.join('|'), id).not.toBe(b.log.join('|'));
    }
  });
});

describe('fixed 240x135 composition', () => {
  it('is 240 x 135', () => { expect([LOGICAL_W, LOGICAL_H]).toEqual([240, 135]); });
  it('fills the screen: the scale grows to the limiting side, never exceeds the viewport', () => {
    expect(fitScale(480, 270)).toBe(2);
    expect(fitScale(960, 540)).toBe(4);
    expect(fitScale(844, 390)).toBeCloseTo(2.88, 2); // phone landscape: fills the height (was 2, big blue bars)
    expect(fitScale(200, 100)).toBeLessThan(1);
    for (const [w, h] of [[320, 180], [667, 375], [844, 390], [1024, 768], [1920, 1080], [200, 100]]) {
      const s = fitScale(w, h);
      expect(LOGICAL_W * s).toBeLessThanOrEqual(w);
      expect(LOGICAL_H * s).toBeLessThanOrEqual(h);
    }
  });
  it('scenery is flat bands: no gradients in cards/scenes.ts or the forage art', () => {
    for (const f of ['src/cards/scenes.ts', 'src/games/forage/art.ts', 'src/games/forage/index.ts']) expect(src(f), f).not.toMatch(/create(Linear|Radial)Gradient/);
  });
});

describe('captions for the new beats', () => {
  it('every cue has a 2-6 word English caption', () => {
    for (const [name, key] of Object.entries(CAPTION)) {
      const text = (en as unknown as Record<string, string>)[key];
      expect(text, name).toBeTruthy();
      expect((hi as unknown as Record<string, string>)[key], 'hi ' + name).toBeTruthy();
      const words = text.trim().split(/\s+/).length;
      expect(words, key).toBeGreaterThanOrEqual(2);
      expect(words, key).toBeLessThanOrEqual(6);
    }
  });
  it('the new beats have recipes with sound in them', () => {
    for (const r of [BUMP, SECRET, BUDDY, FEED, MEET]) { expect(r.layers.length).toBeGreaterThan(0); expect(r.dur).toBeGreaterThan(0); expect(r.dur).toBeLessThan(1.2); }
  });
  it('captionGate lets a repeating cue caption once per gap', () => {
    const last = new Map<string, number>();
    expect(captionGate(last, 'a', 0)).toBe(true);
    expect(captionGate(last, 'a', 500)).toBe(false);
    expect(captionGate(last, 'b', 500)).toBe(true);
    expect(captionGate(last, 'a', 1800)).toBe(true);
  });
});

describe('Hindi stub has every forage caption and line', () => {
  it('every forage.* and cc.forage.* key in en.json exists in hi.json', () => {
    const keys = Object.keys(en).filter((k) => /^(cc\.)?forage\./.test(k));
    expect(keys.length).toBeGreaterThan(10);
    for (const k of keys) expect((hi as unknown as Record<string, string>)[k], k).toBeTruthy();
  });
});

/** Play a whole round the way the game loop does: trail, full basket with a 6th left, feed, reveal. */
function play(friend: string, buddy: string | null, route: (typeof ROUTES)[number], useShortcut: boolean): Round {
  const r = new Round({ ...DEFAULT_ROUND });
  r.begin(friend, buddy, effectOf(buddy, abilityOf));
  r.chooseRoute(route);
  for (let i = 0; i < 40 && r.phase === Ph.Trail; i++) {
    if (i % 3 === 0) r.bump();
    if (useShortcut && i === 2) r.takeShortcut();
    r.offer(); r.pickup();
  }
  return r;
}

describe('no-buddy completion (a buddy gate must never be required)', () => {
  it('every v1 friend, every route, with bumps and no secret, reaches Reveal with no buddy', () => {
    for (const friend of V1_ANIMALS) for (const route of ROUTES) {
      const r = play(friend, null, route, false);
      expect(r.phase, `${friend}/${route}`).toBe(Ph.Meet);
      expect(r.takeShortcut()).toBe(false);
      expect(r.feed()).toBe(true);
      expect(r.tick(DEFAULT_ROUND.meetMs)).toBe(true);
      expect(r.phase).toBe(Ph.Reveal);
      expect(r.result().friend).toBe(friend);
      expect(r.result().shortcut).toBe(false);
    }
  });
  it('with a buddy that ignores its shortcut the trail completes just the same; taking it also completes', () => {
    for (const friend of V1_ANIMALS) for (const buddy of ['elephant', 'monkey'].filter((b) => b !== friend)) for (const route of ROUTES) for (const take of [false, true]) {
      const r = play(friend, buddy, route, take);
      expect(r.phase, `${friend}+${buddy}/${route}/${take}`).toBe(Ph.Meet);
      expect(r.feed()).toBe(true); r.tick(DEFAULT_ROUND.meetMs);
      expect(r.phase).toBe(Ph.Reveal);
      expect(r.result().shortcut).toBe(take);
    }
  });
  it('the Meet beat holds until the child feeds, with a 6th food left on the trail', () => {
    const r = play('elephant', 'monkey', 'high', false);
    expect(r.phase).toBe(Ph.Meet);
    r.offer(); // the guaranteed 6th lies on the trail
    expect(r.pickup()).toBe(false); r.leave();
    expect(r.tick(120000)).toBe(false);
    expect(r.phase).toBe(Ph.Meet); expect(r.carried).toBe(5); expect(r.left).toBe(1);
  });
});

describe('Card clash and old farm game are out of v1 (files kept, not reachable)', () => {
  it('main.ts does not import the clash or the old farm tap game; home.ts has no clash button', () => {
    const main = src('src/main.ts'), home = src('src/app/home.ts');
    for (const g of ['trump', 'farm']) expect(main, g).not.toMatch(new RegExp(`^import ['"]\\./games/${g}`, 'm'));
    expect(home).not.toMatch(/games\/trump|clashBtn|ui\.clash/);
  });
  it('the clash files still exist for later', () => {
    expect(src('src/games/trump/index.ts')).toContain("registerGame");
  });
});

describe('House is coming soon in v1 (the Farm door opens Farm Dash: tests/dash.test.ts)', () => {
  it('no game is registered behind the House door, and importing only the logic registers nothing', () => {
    expect(gameForShelf('house')).toBeUndefined();
    expect(listGames().some((g) => g.shelf === 'house')).toBe(false);
    expect(gameForShelf('farm')).toBeUndefined(); // the logic tests do not import the Dash game itself
  });
});
