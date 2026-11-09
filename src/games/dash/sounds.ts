// Farm Dash: tiny synthesized sounds, made once as recipes for audio.play(). Every cue has a caption key in CAPTION (locale en.json, 2-6 words).
// Never played loudly: peak gains are low; the shared limiter and the mute switch still apply. Nothing harsh: a stumble is a rubbery boing.
import type { Layer, Recipe } from '../../audio/recipes';

const note = (wave: Layer['wave'], f: number, t: number, dur: number, gain: number, extra: Partial<Layer> = {}): Layer =>
  ({ kind: 'osc', wave, f0: f, t, dur, gain, attack: 0.01, release: dur * 0.7, ...extra });
const recipe = (name: string, layers: Layer[]): Recipe => ({ name, layers, dur: Math.max(...layers.map((l) => l.t + l.dur)) });

/** HOP: a quick springy rise. The pitch follows the body: the hen is high and quick, the cow low and round, the goat in between. */
export const HOP: Record<string, Recipe> = {
  hen: recipe('hop.hen', [note('triangle', 520, 0, 0.14, 0.2, { f1: 900 })]),
  cow: recipe('hop.cow', [note('sine', 150, 0, 0.22, 0.26, { f1: 260 }), note('triangle', 300, 0.04, 0.16, 0.08, { f1: 420 })]),
  goat: recipe('hop.goat', [note('triangle', 330, 0, 0.16, 0.2, { f1: 760 }), note('sine', 990, 0.08, 0.1, 0.06)]),
  buffalo: recipe('hop.buffalo', [note('sine', 120, 0, 0.24, 0.26, { f1: 210 }), note('triangle', 240, 0.05, 0.18, 0.08, { f1: 340 })]),
  horse: recipe('hop.horse', [note('triangle', 380, 0, 0.17, 0.22, { f1: 820 }), note('sine', 760, 0.06, 0.12, 0.08, { f1: 1140 })]),
};
/** DUCK: a soft low swish. */
export const DUCK: Recipe = recipe('duck', [{ kind: 'noise', f0: 0, t: 0, dur: 0.16, gain: 0.1, attack: 0.02, release: 0.1, filter: { type: 'bandpass', f0: 1400, f1: 500, q: 0.8 } }]);

/** Pentatonic ladder for pickups: each own food in a row climbs one step (never a "wrong" note). */
const STEPS = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3];
const BASE: Record<string, number> = { seeds: 783.99, grass: 440, leaves: 587.33 };
const WAVE: Record<string, Layer['wave']> = { seeds: 'sine', grass: 'triangle', leaves: 'sine' };
export const PICKUP: Record<string, Recipe[]> = {};
for (const f of Object.keys(BASE)) {
  PICKUP[f] = STEPS.map((s, i) => recipe(`dashpick.${f}.${i}`, [note(WAVE[f], BASE[f] * s, 0, 0.16, 0.22), note('sine', BASE[f] * s * 2, 0.02, 0.1, 0.06)]));
}

/** A short start tune per animal. */
export const START: Record<string, Recipe> = {
  hen: recipe('start.hen', [784, 988, 1175, 988].map((f, i) => note('triangle', f, i * 0.07, 0.12, 0.18))),
  cow: recipe('start.cow', [196, 247, 196].map((f, i) => note('sine', f, i * 0.16, 0.34, 0.22, { attack: 0.03 }))),
  goat: recipe('start.goat', [392, 523, 659, 523, 659].map((f, i) => note('triangle', f, i * 0.08, 0.13, 0.18))),
  buffalo: recipe('start.buffalo', [146.8, 196, 220].map((f, i) => note('sine', f, i * 0.18, 0.36, 0.22, { attack: 0.03 }))),
  horse: recipe('start.horse', [440, 554.37, 659.25, 880].map((f, i) => note('triangle', f, i * 0.07, 0.14, 0.18))),
};

/** A stumble: a soft thud and a rubbery boing. Funny, never harsh. */
export const STUMBLE: Recipe = recipe('dashstumble', [
  note('sine', 170, 0, 0.14, 0.26, { f1: 85 }),
  note('triangle', 320, 0.08, 0.26, 0.14, { f1: 540, vibHz: 9, vibDepth: 28 }),
]);
/** The secret star: a small rising sparkle. */
export const STAR: Recipe = recipe('dashstar', [880, 1174.7, 1568, 2093].map((f, i) => note('sine', f, i * 0.06, 0.2, 0.13, { release: 0.15 })));
/** The basket is full: the friend stops and says hello (a warm two-note hello). */
export const MEET: Recipe = recipe('dashmeet', [note('sine', 523.25, 0, 0.18, 0.2), note('sine', 659.25, 0.12, 0.3, 0.2)]);
/** Feeding: three soft munches. */
export const FEED: Recipe = recipe('dashfeed', [0, 0.14, 0.28].map((t) => ({ kind: 'noise', f0: 0, t, dur: 0.1, gain: 0.16, attack: 0.012, release: 0.07, filter: { type: 'lowpass', f0: 900, f1: 400, q: 0.8 } }) as Layer));

/** Locale keys for every cue (all must exist in en.json and hi.json; tests/dash.test.ts checks 2-6 words). */
export const CAPTION = {
  hop: 'cc.dash.hop', duck: 'cc.dash.duck', pickup: 'cc.dash.pickup', start: 'cc.dash.start', stumble: 'cc.dash.stumble',
  star: 'cc.dash.star', meet: 'cc.dash.meet', feed: 'cc.dash.feed',
} as const;
