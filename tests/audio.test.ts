import { describe, it, expect, vi } from 'vitest';
import { audio, type CaptionEvent } from '../src/audio';
import {
  ANIMAL_IDS, ANIMAL_RECIPES, SFX_NAMES, SFX_RECIPES, CAPTIONED_SFX,
  envAt, sweep, fingerprint, meanFreq, peakSum, estimateMs, ambienceGains, MIN_ATTACK,
} from '../src/audio/recipes';
import en from '../src/locales/en.json';

describe('recipes', () => {
  it('every SfxName has a recipe with layers and sane duration', () => {
    expect(SFX_NAMES).toHaveLength(13);
    for (const n of SFX_NAMES) {
      const r = SFX_RECIPES[n];
      expect(r, n).toBeTruthy();
      expect(r.layers.length).toBeGreaterThan(0);
      expect(r.dur).toBeGreaterThan(0);
      expect(r.dur).toBeLessThan(2.5);
      expect(peakSum(r)).toBeLessThan(0.7);
    }
  });
  it('14 animals have distinct recipes of 0.5-0.8 s', () => {
    expect(ANIMAL_IDS).toHaveLength(14);
    const prints = new Set<string>();
    for (const id of ANIMAL_IDS) {
      const r = ANIMAL_RECIPES[id];
      expect(r, id).toBeTruthy();
      expect(r.dur, id).toBeGreaterThanOrEqual(0.5);
      expect(r.dur, id).toBeLessThanOrEqual(0.8);
      prints.add(fingerprint(r));
    }
    expect(prints.size).toBe(14);
  });
  it('tiger and bear differ clearly; rabbit has hops plus nibbles', () => {
    expect(meanFreq(ANIMAL_RECIPES.tiger)).toBeGreaterThan(meanFreq(ANIMAL_RECIPES.bear) * 1.5);
    const rb = ANIMAL_RECIPES.rabbit.layers;
    expect(rb.filter((l) => l.kind === 'osc').length).toBe(2);
    expect(rb.filter((l) => l.kind === 'noise').length).toBeGreaterThanOrEqual(3);
  });
  it('no recipe attack is harsher than the floor and envelope is soft', () => {
    expect(envAt(0, 1)).toBe(0);
    expect(envAt(MIN_ATTACK / 2, 1, 0)).toBeLessThan(1);
    expect(envAt(0.5, 1)).toBe(1);
    expect(envAt(1, 1)).toBe(0);
    expect(sweep(100, 400, 0.5)).toBeCloseTo(200);
    expect(estimateMs('a')).toBe(700);
    expect(estimateMs('x'.repeat(30))).toBe(1800);
    expect(ambienceGains(0).cricket).toBe(0);
    expect(ambienceGains(1).pad).toBeGreaterThan(ambienceGains(0).pad);
  });
  it('locale has the caption keys the facade emits', () => {
    for (const id of ANIMAL_IDS) expect((en as any)[`cc.animal.${id}`], id).toBeTruthy();
    for (const n of CAPTIONED_SFX) expect((en as any)[`cc.sfx.${n}`], n).toBeTruthy();
  });
});

describe('facade in node (no AudioContext)', () => {
  it('say emits caption first and resolves', async () => {
    const events: CaptionEvent[] = [];
    audio.onCaption((e) => events.push(e));
    let resolved = false;
    const p = audio.say('app.tap_truck', 'bholu').then(() => { resolved = true; });
    expect(events).toHaveLength(1);
    expect(resolved).toBe(false);
    expect(events[0]).toMatchObject({ kind: 'speech', key: 'app.tap_truck', speaker: 'bholu' });
    expect(events[0].ms).toBeGreaterThanOrEqual(700);
    await p;
    expect(resolved).toBe(true);
  });
  it('speech queues and is not interrupted', async () => {
    const events: CaptionEvent[] = [];
    audio.onCaption((e) => events.push(e));
    const order: string[] = [];
    const a = audio.say('truck.honk', 'bholu').then(() => order.push('a'));
    const b = audio.say('crate.shake', 'chiku').then(() => order.push('b'));
    expect(events.map((e) => e.key)).toEqual(['truck.honk']);
    await Promise.all([a, b]);
    expect(order).toEqual(['a', 'b']);
    expect(events.map((e) => e.key)).toEqual(['truck.honk', 'crate.shake']);
  });
  it('sfx and animal captions; hop/tick/whoosh silent; unknown ignored', () => {
    const events: CaptionEvent[] = [];
    audio.onCaption((e) => events.push(e));
    audio.sfx('crate'); audio.sfx('hop'); audio.sfx('tick'); audio.sfx('whoosh'); audio.sfx('sleep');
    audio.animal('lion'); audio.animal('nope');
    expect(events.map((e) => e.key)).toEqual(['cc.sfx.crate', 'cc.sfx.sleep', 'cc.animal.lion']);
    expect(events.every((e) => e.kind === 'sound')).toBe(true);
  });
  it('muted state still captions and still resolves', async () => {
    const events: CaptionEvent[] = [];
    audio.onCaption((e) => events.push(e));
    audio.setMuted(true);
    expect(audio.isMuted()).toBe(true);
    audio.sfx('pop');
    await audio.say('correct.3', 'bholu');
    expect(events.map((e) => e.key)).toEqual(['cc.sfx.pop', 'correct.3']);
    audio.setMuted(false);
    expect(audio.isMuted()).toBe(false);
  });
  it('hasVoice false in node, unlock/ambience/vibrate never throw', async () => {
    expect(audio.hasVoice()).toBe(false);
    await expect(audio.unlock()).resolves.toBeUndefined();
    audio.ambience(0.5); audio.stopAmbience(); audio.vibrate(30); audio.setVibration(false); audio.setLocale('en');
  });
  it('load never throws when fetch fails or is 404 or returns junk', async () => {
    const orig = (globalThis as any).fetch;
    (globalThis as any).fetch = vi.fn(() => Promise.reject(new Error('offline')));
    await expect(audio.load('en')).resolves.toBeUndefined();
    (globalThis as any).fetch = vi.fn(async () => ({ ok: false, status: 404 }));
    await expect(audio.load('hi')).resolves.toBeUndefined();
    (globalThis as any).fetch = vi.fn(async () => ({ ok: true, json: async () => { throw new Error('html'); } }));
    await expect(audio.load('en')).resolves.toBeUndefined();
    (globalThis as any).fetch = undefined;
    await expect(audio.load('en')).resolves.toBeUndefined();
    (globalThis as any).fetch = orig;
    expect(audio.hasVoice()).toBe(false);
  });
});
