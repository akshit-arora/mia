// Play Yard: tiny synthesized sounds, made once as recipes for audio.play(). Quiet and soft. The picture shows each one
// (the toy flies, the pet munches); the animal voices and the captioned sfx (purr, sleep, pop, chime) come from the shared facade.
import type { Layer, Recipe } from '../../audio/recipes';

const note = (wave: Layer['wave'], f: number, t: number, dur: number, gain: number, extra: Partial<Layer> = {}): Layer =>
  ({ kind: 'osc', wave, f0: f, t, dur, gain, attack: 0.01, release: dur * 0.7, ...extra });
const noise = (t: number, dur: number, gain: number, f0: number, f1: number, extra: Partial<Layer> = {}): Layer =>
  ({ kind: 'noise', f0: 0, t, dur, gain, attack: 0.01, release: dur * 0.6, filter: { type: 'bandpass', f0, f1, q: 0.8 }, ...extra });
const recipe = (name: string, layers: Layer[]): Recipe => ({ name, layers, dur: Math.max(...layers.map((l) => l.t + l.dur)) });

/** the toy is thrown: a soft whoosh going up */
export const THROW: Recipe = recipe('house.throw', [noise(0, 0.3, 0.12, 500, 1800)]);
/** the toy lands: a small bounce */
export const LAND: Recipe = recipe('house.land', [note('sine', 180, 0, 0.12, 0.22, { f1: 110 }), note('sine', 150, 0.13, 0.08, 0.1, { f1: 100 })]);
/** the pet has it: a pentatonic note that climbs with each heart (never a wrong note) */
const STEPS = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
export const CATCH: Recipe[] = STEPS.map((f, i) => recipe('house.catch.' + i, [note('triangle', f, 0, 0.18, 0.2), note('sine', f * 2, 0.03, 0.12, 0.06)]));
/** a skid: dust sliding */
export const SKID: Recipe = recipe('house.skid', [noise(0, 0.35, 0.14, 2400, 700)]);
/** a rabbit hop / pounce: boing */
export const BOING: Recipe = recipe('house.boing', [note('sine', 300, 0, 0.16, 0.2, { f1: 560 })]);
/** yarn unrolling / tangled wiggle */
export const TANGLE: Recipe = recipe('house.tangle', [note('triangle', 420, 0, 0.1, 0.12, { vibHz: 14, vibDepth: 40 }), note('triangle', 520, 0.12, 0.1, 0.12, { vibHz: 14, vibDepth: 40 }), note('triangle', 380, 0.24, 0.12, 0.12, { vibHz: 14, vibDepth: 40 })]);
/** digging scratches */
export const DIG: Recipe = recipe('house.dig', [0, 0.14, 0.28, 0.42].map((t) => noise(t, 0.09, 0.12, 3000, 1500)));
/** one munch: a short crunchy tap (three of these per meal) */
export const MUNCH: Recipe = recipe('house.munch', [noise(0, 0.1, 0.2, 1800, 900), note('triangle', 200, 0, 0.09, 0.14, { f1: 140 })]);
/** the food is put in the bowl: two soft notes */
export const PUTBOWL: Recipe = recipe('house.bowl', [note('triangle', 330, 0, 0.14, 0.18), note('sine', 494, 0.1, 0.2, 0.14)]);
/** the home is painted: a happy little run up */
export const PAINTED: Recipe = recipe('house.painted', [523.25, 659.25, 783.99, 1046.5].map((f, i) => note('triangle', f, i * 0.07, 0.16, 0.16)));
