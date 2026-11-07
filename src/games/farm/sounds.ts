// Morning Round: tiny synthesized sounds, made once as recipes for audio.play(). Pentatonic only, so no tap is ever a "wrong" note.
// Peak gains are low; the shared limiter and the mute switch still apply.
import type { Layer, Recipe } from '../../audio/recipes';
import type { ChoreKind, FoodId } from './logic';

const note = (wave: Layer['wave'], f: number, t: number, dur: number, gain: number, extra: Partial<Layer> = {}): Layer =>
  ({ kind: 'osc', wave, f0: f, t, dur, gain, attack: 0.01, release: dur * 0.7, ...extra });
const noise = (t: number, dur: number, gain: number, f0: number, f1: number, extra: Partial<Layer> = {}): Layer =>
  ({ kind: 'noise', f0: 0, t, dur, gain, attack: 0.01, release: dur * 0.7, filter: { type: 'bandpass', f0, f1, q: 0.8 }, ...extra });
const recipe = (name: string, layers: Layer[]): Recipe => ({ name, layers, dur: Math.max(...layers.map((l) => l.t + l.dur)) });

/** Pentatonic ladder: each tap in a row climbs one step (five steps, then again). */
const STEPS = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3];
interface Voice { base: number; wave: Layer['wave']; extra?: (f: number) => Layer[] }
const VOICE: Record<Exclude<ChoreKind, 'door'>, Voice> = {
  feed: { base: 523.25, wave: 'triangle' },
  eggs: { base: 659.25, wave: 'sine', extra: (f) => [note('sine', f * 2, 0.03, 0.07, 0.08, { release: 0.05 })] },
  water: { base: 392, wave: 'sine', extra: () => [noise(0, 0.14, 0.05, 2400, 1200)] },
  milk: { base: 440, wave: 'sine', extra: () => [noise(0, 0.12, 0.04, 3000, 1800)] },
  mud: { base: 261.63, wave: 'triangle', extra: () => [noise(0, 0.18, 0.08, 700, 300)] },
  rock: { base: 329.63, wave: 'square', extra: (f) => [note('sine', f * 2, 0.03, 0.12, 0.07)] },
  hay: { base: 349.23, wave: 'triangle', extra: () => [noise(0, 0.12, 0.05, 3200, 1500)] },
  brush: { base: 587.33, wave: 'triangle', extra: () => [noise(0, 0.1, 0.05, 4200, 2600)] },
};
export const TAP = {} as Record<Exclude<ChoreKind, 'door'>, Recipe[]>;
for (const k of Object.keys(VOICE) as Array<keyof typeof VOICE>) {
  const v = VOICE[k];
  TAP[k] = STEPS.map((s, i) => recipe(`farm.tap.${k}.${i}`, [note(v.wave, v.base * s, 0, k === 'rock' ? 0.14 : 0.17, k === 'rock' ? 0.12 : 0.2), ...(v.extra ? v.extra(v.base * s) : [])]));
}

/** a chore is finished: a small rising happy run */
export const CHORE_DONE: Recipe = recipe('farm.done', [523.25, 659.25, 783.99, 1046.5].map((f, i) => note('triangle', f, i * 0.07, 0.2, 0.17)));
/** something inside the home bumps the door (funny, soft) */
export const BUMP: Recipe = recipe('farm.bump', [note('sine', 150, 0, 0.14, 0.22, { f1: 80, release: 0.1 }), noise(0, 0.06, 0.05, 900, 400)]);
/** the door creaks and pops open */
export const DOOR_OPEN: Recipe = recipe('farm.door', [
  note('sawtooth', 220, 0, 0.35, 0.08, { f1: 330, filter: { type: 'lowpass', f0: 700 } }),
  note('triangle', 659.25, 0.34, 0.2, 0.16), note('triangle', 880, 0.42, 0.28, 0.16),
]);
/** the animal has walked out: a short welcome tune */
export const WELCOME: Recipe = recipe('farm.welcome', [523.25, 659.25, 783.99, 659.25, 880, 1046.5].map((f, i) => note('triangle', f, i * 0.1, 0.24, 0.18)));
/** the cart rolls into the home yard: two soft low notes */
export const PARK: Recipe = recipe('farm.park', [note('triangle', 196, 0, 0.3, 0.2, { filter: { type: 'lowpass', f0: 800 } }), note('triangle', 261.63, 0.18, 0.4, 0.2, { filter: { type: 'lowpass', f0: 800 } })]);
/** the fork's signposts roll in */
export const SIGNS: Recipe = recipe('farm.signs', [392, 523.25, 659.25].map((f, i) => note('sine', f, i * 0.09, 0.2, 0.12)));

/** a different short sting for each food, played when a signpost is picked */
export const STING: Record<FoodId, Recipe> = {
  grass: recipe('farm.sting.grass', [293.66, 392, 440, 587.33].map((f, i) => note('triangle', f, i * 0.1, 0.24, 0.18))),
  leaves: recipe('farm.sting.leaves', [880, 783.99, 659.25, 783.99].map((f, i) => note('sine', f, i * 0.08, 0.18, 0.15, { vibHz: 7, vibDepth: 6 }))),
  seeds: recipe('farm.sting.seeds', [1318.5, 1046.5, 1318.5, 1568].map((f, i) => note('sine', f, i * 0.065, 0.09, 0.14, { release: 0.06 }))),
};
