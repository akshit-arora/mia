// Forage Trail: tiny synthesized sounds, made once as recipes for audio.play(). Every cue has a caption key in CAPTION (locale en.json, 2-6 words).
// Never played loudly: peak gains are low; the shared limiter and the mute switch still apply.
import type { Layer, Recipe } from '../../audio/recipes';
import type { FoodId } from './logic';

const note = (wave: Layer['wave'], f: number, t: number, dur: number, gain: number, extra: Partial<Layer> = {}): Layer =>
  ({ kind: 'osc', wave, f0: f, t, dur, gain, attack: 0.012, release: dur * 0.7, ...extra });
const recipe = (name: string, layers: Layer[]): Recipe => ({ name, layers, dur: Math.max(...layers.map((l) => l.t + l.dur)) });

/** Pentatonic ladder used for pickups: each wanted pickup in a row climbs one step, then starts again (never a "wrong" note). */
const STEPS = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3];
const BASE: Record<FoodId, number> = { fruit: 523.25, honey: 392, sugarcane: 440, seeds: 783.99, meal: 261.63 };
const WAVE: Record<FoodId, Layer['wave']> = { fruit: 'triangle', honey: 'sine', sugarcane: 'triangle', seeds: 'sine', meal: 'triangle' };

/** pickup[food][step]: one short pleasant note with a soft octave sparkle */
export const PICKUP: Record<FoodId, Recipe[]> = {} as Record<FoodId, Recipe[]>;
for (const f of Object.keys(BASE) as FoodId[]) {
  PICKUP[f] = STEPS.map((s, i) => recipe(`pick.${f}.${i}`, [
    note(WAVE[f], BASE[f] * s, 0, 0.16, 0.22),
    note('sine', BASE[f] * s * 2, 0.02, 0.1, 0.06),
  ]));
}

/** a different short musical sting for each food, played when the basket picks a sign */
export const STING: Record<FoodId, Recipe> = {
  fruit: recipe('sting.fruit', [523.25, 659.25, 783.99, 1046.5].map((f, i) => note('triangle', f, i * 0.085, 0.22, 0.2))),
  honey: recipe('sting.honey', [293.66, 369.99, 440].map((f, i) => note('sine', f, i * 0.16, 0.5, 0.2, { attack: 0.04, vibHz: 6, vibDepth: 5 }))),
  sugarcane: recipe('sting.sugarcane', [440, 523.25, 659.25, 523.25, 659.25, 880].map((f, i) => note('triangle', f, i * 0.07, 0.14, 0.18, { release: 0.1 }))),
  seeds: recipe('sting.seeds', [1318.5, 1568, 1318.5, 1760].map((f, i) => note('sine', f, i * 0.07, 0.09, 0.16, { release: 0.07 }))),
  meal: recipe('sting.meal', [
    note('triangle', 196, 0, 0.35, 0.26, { filter: { type: 'lowpass', f0: 700 } }),
    note('triangle', 261.63, 0.2, 0.5, 0.26, { filter: { type: 'lowpass', f0: 700 } }),
  ]),
};

/** small sparkle for a streak of three (a gift, never a penalty when the streak ends) */
export const STREAK: Recipe = recipe('streak', [1568, 1975.5, 2349.3, 3135.9].map((f, i) => note('sine', f, i * 0.05, 0.18, 0.09, { release: 0.14 })));
/** the bowl is set down on the rock: two soft low notes */
export const SETDOWN: Recipe = recipe('setdown', [note('triangle', 220, 0, 0.18, 0.25, { filter: { type: 'lowpass', f0: 600 } }), note('sine', 330, 0.1, 0.22, 0.12)]);
/** the bush rustles */
export const RUSTLE: Recipe = recipe('rustle', [{ kind: 'noise', f0: 0, t: 0, dur: 0.5, gain: 0.12, attack: 0.05, release: 0.3, filter: { type: 'bandpass', f0: 2600, f1: 1200, q: 0.9 }, amHz: 14, amDepth: 0.6 }]);

/** A bump: a soft low thud and a rubbery boing. Funny, never harsh. */
export const BUMP: Recipe = recipe('bump', [
  note('sine', 180, 0, 0.14, 0.26, { f1: 90 }),
  note('triangle', 330, 0.08, 0.22, 0.14, { f1: 520, vibHz: 9, vibDepth: 25 }),
]);
/** The secret star: a small rising sparkle. */
export const SECRET: Recipe = recipe('secret', [880, 1174.7, 1568, 2093].map((f, i) => note('sine', f, i * 0.06, 0.2, 0.13, { release: 0.15 })));
/** A buddy hops aboard: two quick bouncy notes. */
export const BUDDY: Recipe = recipe('buddy', [note('triangle', 392, 0, 0.1, 0.2), note('triangle', 587.33, 0.09, 0.16, 0.2)]);
/** Feeding: three soft munches. */
export const FEED: Recipe = recipe('feed', [0, 0.14, 0.28].map((t) => ({ kind: 'noise', f0: 0, t, dur: 0.1, gain: 0.16, attack: 0.012, release: 0.07, filter: { type: 'lowpass', f0: 900, f1: 400, q: 0.8 } }) as Layer));
/** Meeting the friend: a warm two-note hello (with the rustle just before it). */
export const MEET: Recipe = recipe('meet', [note('sine', 523.25, 0, 0.18, 0.2), note('sine', 659.25, 0.12, 0.3, 0.2)]);

/** Locale keys for every cue (all must exist in en.json; tests/forage.test.ts checks 2-6 words). */
export const CAPTION = {
  pickup: 'cc.forage.pickup', streak: 'cc.forage.streak', sting: 'cc.forage.sting', rustle: 'cc.forage.rustle',
  bump: 'cc.forage.bump', secret: 'cc.forage.secret', buddy: 'cc.forage.buddy', feed: 'cc.forage.feed', meet: 'cc.forage.meet',
} as const;
