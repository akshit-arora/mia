import { describe, expect, it } from 'vitest';
// @ts-ignore node types are not installed
import fs from 'node:fs';
// @ts-ignore node types are not installed
import path from 'node:path';
import en from '../src/locales/en.json';
import hi from '../src/locales/hi.json';
import { BADGE_IDS, parseBadges } from '../src/cards/badges';
import { parseCards, createCardStore } from '../src/cards/progress';
import { ANIMAL_IDS } from '../src/cards/data';
import { layerGainAt, peakSum, type Recipe } from '../src/audio/recipes';
import * as forageSounds from '../src/games/forage/sounds';
import * as dashSounds from '../src/games/dash/sounds';
import * as houseSounds from '../src/games/house/sounds';

const EN = en as unknown as Record<string, string>;
const HI = hi as unknown as Record<string, string>;
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

function extractRecipes(mod: Record<string, unknown>): Recipe[] {
  const recipes: Recipe[] = [];
  for (const val of Object.values(mod)) {
    if (!val || typeof val !== 'object') continue;
    if ('dur' in val && 'layers' in val) {
      recipes.push(val as Recipe);
    } else if (Array.isArray(val)) {
      for (const item of val) {
        if (item && typeof item === 'object' && 'dur' in item && 'layers' in item) {
          recipes.push(item as Recipe);
        }
      }
    } else {
      for (const sub of Object.values(val as Record<string, unknown>)) {
        if (!sub || typeof sub !== 'object') continue;
        if ('dur' in sub && 'layers' in sub) {
          recipes.push(sub as Recipe);
        } else if (Array.isArray(sub)) {
          for (const item of sub) {
            if (item && typeof item === 'object' && 'dur' in item && 'layers' in item) {
              recipes.push(item as Recipe);
            }
          }
        }
      }
    }
  }
  return recipes;
}

describe('v1 sanity: audio sound recipes', () => {
  const allRecipes = [...extractRecipes(forageSounds), ...extractRecipes(dashSounds), ...extractRecipes(houseSounds)];

  it('collects all game recipes', () => {
    expect(allRecipes.length).toBeGreaterThanOrEqual(20);
  });

  it('every recipe renders finite non-silent audio and does not clip', () => {
    for (const r of allRecipes) {
      expect(Number.isFinite(r.dur), `${r.name} dur finite`).toBe(true);
      expect(r.dur, `${r.name} dur > 0`).toBeGreaterThan(0);
      expect(r.layers.length, `${r.name} has layers`).toBeGreaterThan(0);

      const peak = peakSum(r);
      expect(peak, `${r.name} peakSum > 0`).toBeGreaterThan(0);
      expect(peak, `${r.name} peakSum <= 1.0`).toBeLessThanOrEqual(1.0);

      // Offline sample evaluation across duration
      const samplePoints = 25;
      let totalEnergy = 0;
      for (let i = 0; i <= samplePoints; i++) {
        const t = (r.dur * i) / samplePoints;
        let instantGain = 0;
        for (const l of r.layers) {
          if (t >= l.t && t <= l.t + l.dur) {
            const g = layerGainAt(l, t);
            expect(Number.isFinite(g), `${r.name} gain at t=${t} is finite`).toBe(true);
            instantGain += g;
          }
        }
        totalEnergy += Math.abs(instantGain);
      }
      expect(totalEnergy, `${r.name} total energy > 0`).toBeGreaterThan(0);
    }
  });
});

describe('v1 sanity: caption key parity and length', () => {
  const forageKeys = Object.values(forageSounds.CAPTION);
  const dashKeys = Object.values(dashSounds.CAPTION);
  const houseKeys = Object.values(houseSounds.CAPTION);
  const allCueKeys = [...forageKeys, ...dashKeys, ...houseKeys];

  it('all game cue caption keys exist in both en.json and hi.json', () => {
    for (const k of allCueKeys) {
      expect(EN[k], `en.json has ${k}`).toBeTruthy();
      expect(HI[k], `hi.json has ${k}`).toBeTruthy();
    }
  });

  it('all game UI keys (forage.*, dash.*, house.*) have parity in en and hi', () => {
    const enKeys = Object.keys(EN).filter((k) => k.startsWith('forage.') || k.startsWith('dash.') || k.startsWith('house.'));
    for (const k of enKeys) {
      expect(HI[k], `hi.json has ${k}`).toBeTruthy();
    }
  });

  it('every game cue caption text is strictly between 2 and 6 words', () => {
    for (const k of allCueKeys) {
      const enWords = EN[k].trim().split(/\s+/).length;
      expect(enWords, `en word count for ${k}="${EN[k]}" (got ${enWords})`).toBeGreaterThanOrEqual(2);
      expect(enWords, `en word count for ${k}="${EN[k]}" (got ${enWords})`).toBeLessThanOrEqual(6);

      const hiWords = HI[k].trim().split(/\s+/).length;
      expect(hiWords, `hi word count for ${k}="${HI[k]}" (got ${hiWords})`).toBeGreaterThanOrEqual(2);
      expect(hiWords, `hi word count for ${k}="${HI[k]}" (got ${hiWords})`).toBeLessThanOrEqual(6);
    }
  });
});

describe('v1 sanity: flat vector palette audit (no forbidden styles in forage and cards)', () => {
  const dirsToCheck = [
    path.join(ROOT, 'src/games/forage'),
    path.join(ROOT, 'src/games/dash'),
    path.join(ROOT, 'src/games/house'),
    path.join(ROOT, 'src/cards'),
  ];

  function getTsFiles(dir: string): string[] {
    const results: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) results.push(...getTsFiles(full));
      else if (entry.name.endsWith('.ts')) results.push(full);
    }
    return results;
  }

  it('src/games/forage and src/cards contain no globalAlpha, shadowBlur, createLinearGradient, or #000', () => {
    const files = dirsToCheck.flatMap(getTsFiles);
    const forbiddenRegex = /globalAlpha|shadowBlur|createLinearGradient|#[0]{3,6}\b/;
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('//') && forbiddenRegex.test(line.split('//')[1])) {
          // ignore comments mentioning forbidden tokens
          continue;
        }
        const code = line.split('//')[0];
        const match = code.match(forbiddenRegex);
        expect(match, `Forbidden "${match?.[0]}" in ${path.relative(ROOT, file)}:${i + 1}`).toBeNull();
      }
    }
  });
});

describe('v1 sanity: backwards compatibility of storage', () => {
  it('parseBadges ignores and drops "full" badge from legacy data without error', () => {
    const legacy = JSON.stringify({
      v: 1,
      badges: {
        bear: ['clean', 'full', 'secret'],
        monkey: ['full'],
        peacock: ['secret'],
        alien: ['clean'],
      },
    });
    const parsed = parseBadges(legacy);
    expect(parsed.bear).toEqual(['clean', 'secret']);
    expect(parsed.monkey).toBeUndefined(); // having only 'full' leaves no valid badge
    expect(parsed.peacock).toEqual(['secret']);
    expect(parsed.alien).toBeUndefined(); // alien animal dropped
    expect(BADGE_IDS).toEqual(['clean', 'secret']);
  });

  it('legacy cards with levels > 1 load cleanly without crashing', () => {
    const legacyCards = JSON.stringify({
      v: 1,
      cards: {
        bear: 4,
        monkey: 2,
        elephant: 1,
      },
    });
    const { levels } = parseCards(legacyCards, ANIMAL_IDS);
    expect(levels.bear).toBe(4);
    expect(levels.monkey).toBe(2);
    expect(levels.elephant).toBe(1);

    const store = createCardStore({
      storage: {
        getItem: () => legacyCards,
        setItem: () => {},
      },
    });
    expect(store.levelOf('bear')).toBe(4);
    expect(store.levelOf('monkey')).toBe(2);
    expect(store.owned()).toEqual(['elephant', 'monkey', 'bear']);
  });
});
