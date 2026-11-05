import { describe, it, expect } from 'vitest';
import { validatePack } from '../tools/validate-lib.mjs';

const en = {
  _meta: { name: 'English' },
  'name.a': 'A!', 'name.b': 'B!', 'cc.a': 'A', 'cc.b': 'B',
  'zone.x': 'X', 'zone.y': 'Y', 'p.go': 'Go', 'f.a': 'A does a thing!', 'q.a': 'Why?',
};
const base = () => ({
  zones: [
    { id: 'x', nameKey: 'zone.x', theme: 'x' },
    { id: 'y', nameKey: 'zone.y', theme: 'y' },
  ],
  entities: [
    { id: 'a', nameKey: 'name.a', emoji: '1f981', tags: [], relations: { livesAt: ['x'] }, accepts: ['x'], sound: 'animal.a', captionKey: 'cc.a', poke: 'yawn',
      wonder: { questionKey: 'q.a', action: 'ball', factKey: 'f.a' } },
    { id: 'b', nameKey: 'name.b', emoji: '1f405', tags: [], relations: { livesAt: ['y'] }, accepts: ['y'], sound: 'animal.b', captionKey: 'cc.b', poke: 'stretch' },
  ],
  levels: [
    lvl('l1', 1, null, ['x'], ['a']),
    lvl('l2', 2, 'l1', ['x', 'y'], ['a', 'b']),
  ],
});
function lvl(id: string, order: number, prereq: string | null, targets: string[], pool: string[]): Record<string, unknown> {
  return { id, mechanic: 'deliver', order, prereq, lens: 'lives-at', targets, itemQuery: { pool }, count: 1, distractors: 0, accept: 'strict',
    reveal: 'full', hintProfile: 'standard', pace: 1, introEntities: [], surpriseSlot: false, teaches: [], estDuration: 30,
    unlockRule: { cleanRuns: 2 }, reward: 'park-resident', promptId: 'p.go' };
}
const run = (mut: (p: any) => void, locales: Record<string, unknown> = { en }) => {
  const p = base();
  mut(p);
  return validatePack(p, locales);
};
const hasErr = (r: { errors: string[] }, re: RegExp) => expect(r.errors.some((e) => re.test(e)), r.errors.join('\n')).toBe(true);

describe('validatePack', () => {
  it('accepts a good fixture', () => {
    const r = validatePack(base(), { en });
    expect(r.errors).toEqual([]);
  });
  it('rejects duplicate entity ids', () => hasErr(run((p) => p.entities.push({ ...p.entities[0] })), /duplicate entity id "a"/));
  it('rejects missing required field', () => hasErr(run((p) => delete p.entities[0].sound), /"sound"/));
  it('rejects unknown livesAt zone', () => hasErr(run((p) => (p.entities[0].relations.livesAt = ['nope'])), /livesAt zone "nope"/));
  it('rejects unknown accepts zone and empty accepts', () => {
    hasErr(run((p) => (p.entities[0].accepts = ['nope'])), /accepts zone "nope"/);
    hasErr(run((p) => (p.entities[0].accepts = [])), /accepts must be a non-empty/);
  });
  it('rejects unknown level target', () => hasErr(run((p) => (p.levels[0].targets = ['zz'])), /target zone "zz"/));
  it('rejects unknown pool/guests/introEntities refs', () => {
    hasErr(run((p) => (p.levels[0].itemQuery.pool = ['ghost'])), /pool entity "ghost"/);
    hasErr(run((p) => (p.levels[0].itemQuery.guests = ['ghost'])), /guests entity "ghost"/);
    hasErr(run((p) => (p.levels[0].introEntities = ['ghost'])), /introEntities entity "ghost"/);
  });
  it('rejects an unwinnable level', () => hasErr(run((p) => (p.levels[0].itemQuery.pool = ['a', 'b'])), /unwinnable for "b"/));
  it('honours acceptsAlso only with primary-plus-also', () => {
    const mut = (accept: string) => (p: any) => { p.entities[1].acceptsAlso = ['x']; p.levels[0].accept = accept; p.levels[0].itemQuery.pool = ['b']; };
    hasErr(run(mut('strict')), /unwinnable/);
    expect(run(mut('primary-plus-also')).errors).toEqual([]);
  });
  it('rejects missing prereq and cycles', () => {
    hasErr(run((p) => (p.levels[1].prereq = 'zzz')), /prereq "zzz" does not exist/);
    hasErr(run((p) => (p.levels[0].prereq = 'l2')), /prereq cycle/);
  });
  it('rejects duplicate order', () => hasErr(run((p) => (p.levels[1].order = 1)), /order 1 duplicates/));
  it('rejects animal-specific level fields', () => hasErr(run((p) => (p.levels[0].cowOnly = true)), /non-generic field "cowOnly"/));
  it('rejects unresolved locale keys', () => {
    hasErr(run((p) => (p.levels[0].promptId = 'no.such')), /promptId "no.such"/);
    hasErr(run((p) => (p.entities[0].nameKey = 'no.such')), /nameKey "no.such"/);
    hasErr(run((p) => (p.entities[0].captionKey = 'no.such')), /captionKey "no.such"/);
    hasErr(run((p) => (p.entities[0].wonder.questionKey = 'no.such')), /questionKey/);
    hasErr(run((p) => (p.entities[0].wonder.factKey = 'no.such')), /factKey/);
    hasErr(run((p) => (p.zones[0].nameKey = 'no.such')), /nameKey "no.such"/);
  });
  it('rejects facts longer than 8 words', () => {
    const long = { ...en, 'f.a': 'one two three four five six seven eight nine' };
    hasErr(validatePack(base(), { en: long }), /9 words/);
  });
  it('locale subset rule: extra key fails, missing key only warns', () => {
    hasErr(validatePack(base(), { en, hi: { _meta: {}, 'zzz.extra': 'x' } }), /hi.json: key "zzz.extra"/);
    const r = validatePack(base(), { en, hi: { _meta: {}, 'name.a': 'ए' } });
    expect(r.errors).toEqual([]);
    expect(r.warnings.join()).toMatch(/hi.json.*missing/);
  });
  it('flags cow in engine/game source', () => {
    const r = validatePack(base(), { en }, { sourceFiles: [{ file: 'src/game/x.ts', text: 'a\nif (id === "cow") {}' }] });
    hasErr(r, /src\/game\/x.ts:2/);
    expect(validatePack(base(), { en }, { sourceFiles: [{ file: 'src/game/x.ts', text: 'if (e.noGag) {}' }] }).errors).toEqual([]);
  });
});
