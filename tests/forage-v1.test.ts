import { describe, expect, it } from 'vitest';
import { LOGICAL_H, LOGICAL_W, fitScale } from '../src/engine/stage';
import { DEFAULT_ROUND, Ph, ROUTES, Round, WILD_ANIMALS, captionGate } from '../src/games/forage/logic';
import { CAPTION, BUMP, BUDDY, FEED, MEET, SECRET } from '../src/games/forage/sounds';
import { POSES, TOK, VECTOR_ANIMALS, drawAnimal } from '../src/games/forage/sprites';
import { effectOf } from '../src/cards/abilities';
import { abilityOf } from '../src/cards/data';
import { gameForShelf, listGames } from '../src/app/registry';
import en from '../src/locales/en.json';

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
  it('uses an integer scale when it wastes little, and never exceeds the viewport', () => {
    expect(fitScale(480, 270)).toBe(2);
    expect(fitScale(960, 540)).toBe(4);
    expect(fitScale(844, 390)).toBeCloseTo(390 / 135, 5); // 2 would waste 31%: use the fractional fit
    expect(fitScale(720, 405)).toBe(3);
    for (const [w, h] of [[320, 180], [667, 375], [844, 390], [1024, 768], [200, 100]]) {
      const s = fitScale(w, h);
      expect(LOGICAL_W * s).toBeLessThanOrEqual(w + 1e-6);
      expect(LOGICAL_H * s).toBeLessThanOrEqual(h + 1e-6);
    }
  });
});

describe('captions for the new beats', () => {
  it('every cue has a 2-6 word English caption', () => {
    for (const [name, key] of Object.entries(CAPTION)) {
      const text = (en as unknown as Record<string, string>)[key];
      expect(text, name).toBeTruthy();
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

describe('no-buddy completion (a buddy gate must never be required)', () => {
  it('every friend, every route, with bumps and no secret, reaches Reveal with no buddy', () => {
    for (const friend of WILD_ANIMALS) for (const route of ROUTES) {
      const r = new Round({ ...DEFAULT_ROUND });
      r.begin(friend, null, effectOf(null, abilityOf));
      r.chooseRoute(route);
      for (let i = 0; i < 40 && r.phase === Ph.Trail; i++) { if (i % 3 === 0) r.bump(); r.pickup(); }
      expect(r.phase, `${friend}/${route}`).toBe(Ph.Meet);
      expect(r.feed()).toBe(true);
      expect(r.tick(DEFAULT_ROUND.meetMs)).toBe(true);
      expect(r.phase).toBe(Ph.Reveal);
      expect(r.result().friend).toBe(friend);
    }
  });
});

describe('Farm and House are coming soon in v1', () => {
  it('no game is registered behind the Farm or House door (importing only the logic registers nothing)', () => {
    expect(gameForShelf('farm')).toBeUndefined();
    expect(gameForShelf('house')).toBeUndefined();
    expect(listGames().some((g) => g.shelf === 'farm' || g.shelf === 'house')).toBe(false);
  });
});
