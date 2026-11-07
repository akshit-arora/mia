// Card clash: tiny synthesized sounds for audio.play(). Warm and short; nothing harsh, no buzzer.
import type { Layer, Recipe } from '../../audio/recipes';

const note = (wave: Layer['wave'], f: number, t: number, dur: number, gain: number, extra: Partial<Layer> = {}): Layer =>
  ({ kind: 'osc', wave, f0: f, t, dur, gain, attack: 0.012, release: dur * 0.7, ...extra });
const recipe = (name: string, layers: Layer[]): Recipe => ({ name, layers, dur: Math.max(...layers.map((l) => l.t + l.dur)) });

export const DEAL = recipe('clash.deal', [note('triangle', 330, 0, 0.09, 0.18), note('triangle', 494, 0.07, 0.1, 0.16)]);
export const FLIP = recipe('clash.flip', [note('sine', 600, 0, 0.1, 0.16, { f1: 900 }), note('sine', 900, 0.08, 0.08, 0.1)]);
export const TICK = [0, 1, 2, 3, 4].map((i) => recipe('clash.tick' + i, [note('triangle', 392 * Math.pow(1.122, i * 2), 0, 0.07, 0.17)]));
export const WIN = recipe('clash.win', [
  note('triangle', 523.25, 0, 0.14, 0.22), note('triangle', 659.25, 0.12, 0.14, 0.22), note('triangle', 783.99, 0.24, 0.14, 0.22),
  note('sine', 1046.5, 0.38, 0.4, 0.2), note('sine', 2093, 0.4, 0.3, 0.05),
]);
/** A friendly "bwomp" shrug: slides down a little and comes back up. Never a buzzer. */
export const SHRUG = recipe('clash.shrug', [
  note('triangle', 420, 0, 0.28, 0.2, { f1: 260 }), note('triangle', 300, 0.3, 0.2, 0.17, { f1: 380 }),
]);
export const TIE = recipe('clash.tie', [note('sine', 784, 0, 0.18, 0.2), note('sine', 784, 0.2, 0.3, 0.2), note('sine', 1568, 0.2, 0.25, 0.05)]);
export const PASS = recipe('clash.pass', [note('sine', 440, 0, 0.12, 0.17), note('sine', 660, 0.1, 0.16, 0.17)]);
export const CHEER = recipe('clash.cheer', [
  note('triangle', 523.25, 0, 0.12, 0.2), note('triangle', 659.25, 0.1, 0.12, 0.2), note('triangle', 783.99, 0.2, 0.12, 0.2),
  note('triangle', 1046.5, 0.3, 0.12, 0.2), note('sine', 1318.5, 0.42, 0.5, 0.2),
]);
