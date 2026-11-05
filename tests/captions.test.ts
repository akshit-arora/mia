import { describe, expect, it } from 'vitest';
import en from '../src/locales/en.json';
import hi from '../src/locales/hi.json';
import entities from '../src/data/entities.json';

describe('locale coverage', () => {
  it('every entity has a name, caption and (if any) wonder strings in English', () => {
    for (const e of entities as any[]) {
      expect((en as any)[e.nameKey]).toBeTruthy();
      expect((en as any)[e.captionKey]).toBeTruthy();
      if (e.wonder) { expect((en as any)[e.wonder.questionKey]).toBeTruthy(); expect((en as any)[e.wonder.factKey]).toBeTruthy(); }
    }
  });
  it('Hindi stub only uses keys that exist in English', () => {
    for (const k of Object.keys(hi)) expect(k in en).toBe(true);
  });
  it('sound caption keys exist for every captioned sfx', () => {
    for (const n of ['truck', 'honk', 'crate', 'pop', 'chime', 'wobble', 'sparkle', 'purr', 'splash', 'sleep']) expect((en as any)['cc.sfx.' + n]).toBeTruthy();
  });
});
