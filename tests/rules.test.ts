import { describe, expect, it } from 'vitest';
import entities from '../src/data/entities.json';
import levels from '../src/data/levels.json';
import { acceptedZones, addResident, isAccepted, levelUnlocked, pickItems, planSession, updateConfidence } from '../src/game/rules';
import { defaultProgress, makeBackupCode, parseBackupCode, sanitize } from '../src/storage';
import type { Entity, LevelConfig } from '../src/types';

const E = entities as unknown as Entity[];
const L = levels as unknown as LevelConfig[];
const by = (id: string) => E.find((e) => e.id === id)!;
const lvl = (id: string) => L.find((l) => l.id === id)!;
const seeded = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

describe('deliver rules', () => {
  it('cow is accepted at the farm only, in every level', () => {
    for (const l of L) {
      expect(isAccepted(by('cow'), 'farm', l)).toBe(true);
      expect(isAccepted(by('cow'), 'jungle', l)).toBe(false);
      expect(isAccepted(by('cow'), 'home', l)).toBe(false);
    }
  });
  it('dog double-yes only applies with primary-plus-also', () => {
    expect(acceptedZones(by('dog'), lvl('7'))).toEqual(['home']);
    expect(acceptedZones(by('dog'), { ...lvl('7'), accept: 'primary-plus-also' })).toEqual(['home', 'farm']);
  });
  it('every generated item is winnable and the first items cover every target', () => {
    for (let s = 1; s < 30; s++) for (const l of L.filter((x) => !x.intro)) {
      const items = pickItems(l, E, defaultProgress(), seeded(s));
      expect(items.length).toBe(l.count);
      for (const id of items) expect(acceptedZones(by(id), l).some((z) => l.targets.includes(z))).toBe(true);
      if (l.targets.length > 1) for (const z of l.targets) expect(items.slice(0, l.targets.length).some((id) => isAccepted(by(id), z, l))).toBe(true);
    }
  });
  it('never repeats the same animal twice in a row', () => {
    for (let s = 1; s < 20; s++) { const it = pickItems(lvl('7'), E, defaultProgress(), seeded(s)); for (let i = 1; i < it.length - 1; i++) expect(it[i]).not.toBe(it[i - 1]); }
  });
  it('level 8 can bring a guest, intro levels use only the intro entity', () => {
    const seen = new Set<string>();
    for (let s = 1; s < 40; s++) pickItems(lvl('8'), E, defaultProgress(), seeded(s)).forEach((i) => seen.add(i));
    expect(seen.has('elephant') || seen.has('horse')).toBe(true);
    expect(pickItems(lvl('intro-farm'), E, defaultProgress(), seeded())).toEqual(['cow']);
  });
  it('unlock needs two clean runs of the prerequisite; intro unlock needs introDone', () => {
    const p = defaultProgress();
    expect(levelUnlocked(lvl('4'), L, p)).toBe(false);
    p.cleanRuns['3'] = 2;
    expect(levelUnlocked(lvl('4'), L, p)).toBe(true);
    expect(levelUnlocked(lvl('3'), L, p)).toBe(false);
    p.introDone = true;
    expect(levelUnlocked(lvl('3'), L, p)).toBe(true);
  });
  it('plans one review and one new level', () => {
    const p = defaultProgress(); p.introDone = true; p.cleanRuns['3'] = 2;
    const plan = planSession(L, p, seeded());
    expect(plan.fresh.id).toBe('4');
    expect(plan.review && plan.review.order < 4).toBe(true);
  });
  it('confidence rises on first-try and falls otherwise, silently', () => {
    const p = defaultProgress();
    updateConfidence(p, 'lion', true); const a = p.confidence.lion;
    updateConfidence(p, 'lion', false);
    expect(p.confidence.lion).toBeLessThan(a);
  });
  it('the park never shrinks and caps duplicates', () => {
    const p = defaultProgress();
    expect(addResident(p, 'cow')).toBe(true); expect(addResident(p, 'cow')).toBe(true); expect(addResident(p, 'cow')).toBe(false);
    expect(p.park.length).toBe(2);
  });
});

describe('progress storage', () => {
  it('round-trips a backup code and rejects tampering', () => {
    const p = defaultProgress(); p.park = ['lion', 'cow']; p.introDone = true;
    const code = makeBackupCode(p);
    expect(parseBackupCode(code)?.park).toEqual(['lion', 'cow']);
    expect(parseBackupCode(code.replace(/.$/, 'x'))).toBeNull();
    expect(parseBackupCode('hello')).toBeNull();
  });
  it('sanitises junk', () => {
    expect(sanitize({ v: 1, park: [1, 'cow'], settings: { captions: 'bad' } }).park).toEqual(['cow']);
    expect(sanitize({ v: 1, settings: { captions: 'bad' } }).settings.captions).toBe('auto');
    expect(sanitize(null).sessions).toBe(0);
  });
});
