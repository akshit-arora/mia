// Cushion Trick-Shot: tiny synthesized sounds, made once as recipes for audio.play().
// Every cue has a caption key in CAPTION (locale en.json and hi.json, 2-6 words).
// Never played loudly: peak gains are low; the shared limiter and mute switch still apply.
import type { Layer, Recipe } from '../../audio/recipes';

const note = (wave: Layer['wave'], f: number, t: number, dur: number, gain: number, extra: Partial<Layer> = {}): Layer =>
  ({ kind: 'osc', wave, f0: f, t, dur, gain, attack: 0.01, release: dur * 0.7, ...extra });
const recipe = (name: string, layers: Layer[]): Recipe => ({ name, layers, dur: Math.max(...layers.map((l) => l.t + l.dur)) });

/** TOSS: a soft whoosh on toy release. */
export const TOSS: Recipe = recipe('housetoss', [
  { kind: 'noise', f0: 0, t: 0, dur: 0.15, gain: 0.12, attack: 0.02, release: 0.1, filter: { type: 'bandpass', f0: 900, f1: 300, q: 0.9 } },
  note('sine', 280, 0.02, 0.12, 0.14, { f1: 180 }),
]);

/** BOING: super elastic cushion ricochet. Springy upward glide with warmth. */
export const BOING: Recipe = recipe('houseboing', [
  note('triangle', 240, 0, 0.22, 0.24, { f1: 640 }),
  note('sine', 480, 0.03, 0.18, 0.1, { f1: 880 }),
]);

/** CLACK: crisp bounce off wall, floor or bookshelf. */
export const CLACK: Recipe = recipe('houseclack', [
  note('triangle', 420, 0, 0.07, 0.2, { f1: 180 }),
  { kind: 'noise', f0: 0, t: 0, dur: 0.04, gain: 0.14, attack: 0.005, release: 0.03, filter: { type: 'bandpass', f0: 1600, f1: 800, q: 1.2 } },
]);

/** TUMBLE: wobbly box toppling over. */
export const TUMBLE: Recipe = recipe('housetumble', [
  note('sine', 160, 0, 0.14, 0.2, { f1: 90 }),
  note('triangle', 220, 0.06, 0.12, 0.14, { f1: 120 }),
  { kind: 'noise', f0: 0, t: 0.04, dur: 0.12, gain: 0.1, attack: 0.01, release: 0.09, filter: { type: 'lowpass', f0: 800, f1: 300, q: 0.7 } },
]);

/** CATCH: pet leaps or catches toy with happy snap. */
export const CATCH: Recipe = recipe('housecatch', [
  note('sine', 440, 0, 0.1, 0.18, { f1: 660 }),
  note('triangle', 660, 0.06, 0.14, 0.2, { f1: 880 }),
]);

/** Pentatonic ladder for collecting foods (1 to 5). */
const STEPS = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3];
const FOOD_BASE: Record<string, number> = { bone: 523.25, milk: 659.25, carrot: 587.33 };
export const PICKUP: Record<string, Recipe[]> = {};
for (const f of ['bone', 'milk', 'carrot']) {
  const base = FOOD_BASE[f] || 523.25;
  PICKUP[f] = STEPS.map((s, i) => recipe(`housepick.${f}.${i}`, [
    note('triangle', base * s, 0, 0.16, 0.22),
    note('sine', base * s * 2, 0.02, 0.12, 0.08),
  ]));
}

/** STAR: secret golden star chime. */
export const STAR: Recipe = recipe('housestar', [
  note('sine', 880, 0, 0.2, 0.14),
  note('sine', 1174.7, 0.05, 0.2, 0.14),
  note('sine', 1568, 0.1, 0.25, 0.16),
  note('sine', 2093, 0.15, 0.3, 0.18),
]);

/** MEET: victory bowl fanfare when 5 foods are collected. */
export const MEET: Recipe = recipe('housemeet', [
  note('sine', 523.25, 0, 0.16, 0.18),
  note('sine', 659.25, 0.1, 0.18, 0.2),
  note('sine', 783.99, 0.2, 0.28, 0.22),
]);

/** MUNCH: crunchy / lappy munching at the bowl. */
export const MUNCH: Recipe = recipe('housemunch', [
  { kind: 'noise', f0: 0, t: 0, dur: 0.08, gain: 0.14, attack: 0.01, release: 0.06, filter: { type: 'bandpass', f0: 1200, f1: 500, q: 0.8 } },
  { kind: 'noise', f0: 0, t: 0.1, dur: 0.08, gain: 0.14, attack: 0.01, release: 0.06, filter: { type: 'bandpass', f0: 1100, f1: 450, q: 0.8 } },
  { kind: 'noise', f0: 0, t: 0.2, dur: 0.1, gain: 0.14, attack: 0.01, release: 0.08, filter: { type: 'bandpass', f0: 1300, f1: 550, q: 0.8 } },
]);

/** PET: affectionate purr / happy pant when child pets the friend. */
export const PET: Record<string, Recipe> = {
  dog: recipe('pet.dog', [note('sine', 280, 0, 0.18, 0.22, { f1: 380 }), note('sine', 380, 0.12, 0.2, 0.18)]),
  cat: recipe('pet.cat', [note('triangle', 587, 0, 0.22, 0.2, { vibHz: 18, vibDepth: 20 }), note('sine', 880, 0.08, 0.25, 0.14)]),
  rabbit: recipe('pet.rabbit', [note('sine', 520, 0, 0.12, 0.18, { f1: 720 }), note('sine', 720, 0.08, 0.15, 0.16)]),
};

/** Intro start chime per pet. */
export const START: Record<string, Recipe> = {
  dog: recipe('start.dog', [392, 523.25, 659.25].map((f, i) => note('triangle', f, i * 0.08, 0.14, 0.2))),
  cat: recipe('start.cat', [523.25, 659.25, 783.99].map((f, i) => note('sine', f, i * 0.08, 0.16, 0.2))),
  rabbit: recipe('start.rabbit', [440, 587.33, 740].map((f, i) => note('triangle', f, i * 0.07, 0.15, 0.18))),
};

/** Locale keys for every cue (must exist in en.json and hi.json; 2-6 words). */
export const CAPTION = {
  toss: 'cc.house.toss',
  boing: 'cc.house.boing',
  clack: 'cc.house.clack',
  fetch: 'cc.house.fetch',
  star: 'cc.house.star',
  munch: 'cc.house.munch',
  purr: 'cc.house.purr',
} as const;
