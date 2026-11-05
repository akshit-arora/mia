import { describe, it, expect } from 'vitest';
import entities from '../src/data/entities.json';
import zones from '../src/data/zones.json';
import levels from '../src/data/levels.json';
import en from '../src/locales/en.json';
import hi from '../src/locales/hi.json';
import { validatePack } from '../tools/validate-lib.mjs';

describe('shipped data pack', () => {
  const r = validatePack({ entities, zones, levels }, { en, hi });
  it('has no validation errors', () => expect(r.errors).toEqual([]));
  it('cow is farm only and has no wrong-drop gag (D6)', () => {
    const cow = (entities as any[]).find((e) => e.id === 'cow');
    expect(cow.accepts).toEqual(['farm']);
    expect(cow.noGag).toBe(true);
  });
  it('first level has no prereq and exactly one root', () => {
    expect((levels as any[]).filter((l) => l.prereq === null)).toHaveLength(1);
  });
});
