// Pure synth recipes and envelope maths. No browser globals, no AudioContext: unit-testable in node.
// A Recipe is a list of Layers; the player in index.ts turns each Layer into oscillator/noise + filter + envelope.

export type SfxName =
  | 'truck' | 'honk' | 'crate' | 'pop' | 'chime' | 'wobble' | 'sparkle'
  | 'purr' | 'splash' | 'sleep' | 'hop' | 'tick' | 'whoosh';

export const SFX_NAMES: SfxName[] = [
  'truck', 'honk', 'crate', 'pop', 'chime', 'wobble', 'sparkle', 'purr', 'splash', 'sleep', 'hop', 'tick', 'whoosh',
];

/** Sounds that get a caption (hop, tick, whoosh do not). */
export const CAPTIONED_SFX: ReadonlySet<string> = new Set([
  'truck', 'honk', 'crate', 'pop', 'chime', 'wobble', 'sparkle', 'purr', 'splash', 'sleep',
]);

export const ANIMAL_IDS = [
  'lion', 'tiger', 'elephant', 'monkey', 'bear', 'peacock', 'cow',
  'buffalo', 'goat', 'hen', 'horse', 'dog', 'cat', 'rabbit',
] as const;
export type AnimalId = typeof ANIMAL_IDS[number];

export interface FilterSpec {
  type: 'lowpass' | 'bandpass' | 'highpass';
  f0: number;
  f1?: number; // sweep target over the layer duration
  q?: number;
}

export interface Layer {
  kind: 'osc' | 'noise';
  wave?: 'sine' | 'triangle' | 'sawtooth' | 'square';
  f0: number;          // start frequency in Hz (ignored for noise)
  f1?: number;         // end frequency (linear-in-log sweep)
  t: number;           // start offset seconds
  dur: number;         // seconds
  gain: number;        // peak gain 0..1 (before master)
  attack?: number;     // seconds, floored at MIN_ATTACK
  release?: number;    // seconds
  filter?: FilterSpec;
  vibHz?: number;      // frequency modulation rate
  vibDepth?: number;   // in Hz
  amHz?: number;       // amplitude modulation rate
  amDepth?: number;    // 0..1
}

export interface Recipe {
  name: string;
  dur: number; // total seconds
  layers: Layer[];
}

export const MIN_ATTACK = 0.012; // no clicks or startles
export const MASTER_GAIN = 0.6;

// ---------- envelope maths ----------

/** Envelope value 0..1 at time t (seconds from layer start). Smooth attack, flat sustain, quadratic release. */
export function envAt(t: number, dur: number, attack = 0.02, release = 0.08): number {
  if (t <= 0 || t >= dur) return 0;
  const a = Math.max(MIN_ATTACK, Math.min(attack, dur * 0.9));
  const r = Math.max(0.01, Math.min(release, dur - a));
  if (t < a) return Math.sin((t / a) * Math.PI * 0.5);
  const relStart = dur - r;
  if (t > relStart) {
    const u = (dur - t) / r;
    return u * u;
  }
  return 1;
}

/** Log-linear sweep from f0 to f1 at position u in 0..1. */
export function sweep(f0: number, f1: number | undefined, u: number): number {
  if (f1 === undefined || f1 === f0) return f0;
  const uu = Math.min(1, Math.max(0, u));
  return f0 * Math.pow(f1 / f0, uu);
}

/** Instantaneous layer gain at absolute recipe time t. */
export function layerGainAt(l: Layer, t: number): number {
  const lt = t - l.t;
  let g = l.gain * envAt(lt, l.dur, l.attack, l.release);
  if (l.amHz && l.amDepth) {
    g *= 1 - l.amDepth + l.amDepth * (0.5 + 0.5 * Math.sin(2 * Math.PI * l.amHz * lt));
  }
  return g;
}

export function recipeDuration(r: Recipe): number {
  return r.layers.reduce((m, l) => Math.max(m, l.t + l.dur), 0);
}

/** Worst-case simultaneous summed peak gain: used to assert recipes stay soft. */
export function peakSum(r: Recipe): number {
  // max over layer start times of the summed gain of layers sounding at that moment
  let m = 0;
  for (const a of r.layers) {
    const s = r.layers.filter((l) => l.t <= a.t && a.t < l.t + l.dur).reduce((x, l) => x + l.gain, 0);
    m = Math.max(m, s);
  }
  return m;
}

/** Mean oscillator frequency, a rough "pitch fingerprint" used by tests. */
export function meanFreq(r: Recipe): number {
  const o = r.layers.filter((l) => l.kind === 'osc');
  if (!o.length) return 0;
  return o.reduce((s, l) => s + (l.f0 + (l.f1 ?? l.f0)) / 2, 0) / o.length;
}

export function fingerprint(r: Recipe): string {
  return JSON.stringify(r.layers);
}

// ---------- deterministic pseudo random (for noise buffers and scatter patterns) ----------

export function lcg(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---------- recipe helpers ----------

const osc = (wave: Layer['wave'], f0: number, f1: number | undefined, t: number, dur: number, gain: number, extra: Partial<Layer> = {}): Layer =>
  ({ kind: 'osc', wave, f0, f1, t, dur, gain, ...extra });
const noise = (t: number, dur: number, gain: number, filter: FilterSpec, extra: Partial<Layer> = {}): Layer =>
  ({ kind: 'noise', f0: 0, t, dur, gain, filter, ...extra });

function rec(name: string, layers: Layer[]): Recipe {
  return { name, layers, dur: Math.round(recipeDuration({ name, layers, dur: 0 }) * 1000) / 1000 };
}

// ---------- SFX recipes ----------

function sparkleLayers(): Layer[] {
  const r = lcg(7);
  const out: Layer[] = [];
  for (let i = 0; i < 9; i++) {
    const f = 1800 + Math.floor(r() * 2400);
    out.push(osc('sine', f, f * 1.02, i * 0.07 + r() * 0.03, 0.22, 0.07, { attack: 0.015, release: 0.2 }));
  }
  return out;
}

function chimeLayers(): Layer[] {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  return flat(notes.map((f, i) => [
    osc('sine', f, undefined, i * 0.11, 0.7, 0.11, { attack: 0.015, release: 0.65 }),
    osc('triangle', f * 2, undefined, i * 0.11, 0.4, 0.03, { attack: 0.015, release: 0.35 }),
  ]));
}

function crateLayers(): Layer[] {
  const r = lcg(11);
  const out: Layer[] = [];
  for (let i = 0; i < 6; i++) {
    const t = i * 0.12 + r() * 0.04;
    out.push(noise(t, 0.09, 0.2, { type: 'bandpass', f0: 500 + r() * 500, q: 4 }, { attack: 0.012, release: 0.07 }));
    out.push(osc('triangle', 150 + r() * 80, 90, t, 0.1, 0.12, { attack: 0.012, release: 0.08 }));
  }
  return out;
}

export const SFX_RECIPES: Record<SfxName, Recipe> = {
  truck: rec('truck', [
    osc('sawtooth', 52, 66, 0, 1.2, 0.2, { attack: 0.18, release: 0.4, amHz: 13, amDepth: 0.45, filter: { type: 'lowpass', f0: 240, q: 1 } }),
    noise(0, 1.2, 0.08, { type: 'lowpass', f0: 300 }, { attack: 0.2, release: 0.4, amHz: 13, amDepth: 0.5 }),
  ]),
  honk: rec('honk', [
    osc('square', 330, undefined, 0, 0.32, 0.1, { attack: 0.03, release: 0.12, filter: { type: 'lowpass', f0: 1400 } }),
    osc('square', 415, undefined, 0, 0.32, 0.1, { attack: 0.03, release: 0.12, filter: { type: 'lowpass', f0: 1400 } }),
  ]),
  crate: rec('crate', crateLayers()),
  pop: rec('pop', [
    osc('sine', 260, 900, 0, 0.14, 0.3, { attack: 0.012, release: 0.1 }),
    noise(0, 0.08, 0.1, { type: 'highpass', f0: 2500 }, { attack: 0.012, release: 0.06 }),
  ]),
  chime: rec('chime', chimeLayers()),
  wobble: rec('wobble', [
    osc('sine', 220, 440, 0, 0.55, 0.25, { attack: 0.02, release: 0.3, vibHz: 9, vibDepth: 40 }),
    osc('triangle', 440, 880, 0, 0.55, 0.06, { attack: 0.02, release: 0.3, vibHz: 9, vibDepth: 60 }),
  ]),
  sparkle: rec('sparkle', sparkleLayers()),
  purr: rec('purr', [
    noise(0, 1.3, 0.22, { type: 'lowpass', f0: 160, q: 2 }, { attack: 0.2, release: 0.4, amHz: 24, amDepth: 0.8 }),
    osc('sawtooth', 62, undefined, 0, 1.3, 0.06, { attack: 0.2, release: 0.4, amHz: 24, amDepth: 0.8, filter: { type: 'lowpass', f0: 220 } }),
  ]),
  splash: rec('splash', [
    noise(0, 0.6, 0.22, { type: 'bandpass', f0: 3200, f1: 900, q: 0.8 }, { attack: 0.02, release: 0.45 }),
    osc('sine', 700, 220, 0.04, 0.25, 0.08, { attack: 0.02, release: 0.2 }),
  ]),
  sleep: rec('sleep', [
    osc('sine', 196, undefined, 0, 1.6, 0.07, { attack: 0.5, release: 0.7 }),
    osc('sine', 246.94, undefined, 0, 1.6, 0.05, { attack: 0.5, release: 0.7 }),
    osc('sine', 4300, undefined, 0.3, 0.07, 0.02, { attack: 0.015, release: 0.05 }),
    osc('sine', 4300, undefined, 0.42, 0.07, 0.02, { attack: 0.015, release: 0.05 }),
    osc('sine', 4300, undefined, 0.9, 0.07, 0.02, { attack: 0.015, release: 0.05 }),
    osc('sine', 4300, undefined, 1.02, 0.07, 0.02, { attack: 0.015, release: 0.05 }),
  ]),
  hop: rec('hop', [osc('sine', 180, 340, 0, 0.12, 0.2, { attack: 0.012, release: 0.09 })]),
  tick: rec('tick', [osc('triangle', 900, 700, 0, 0.05, 0.1, { attack: 0.012, release: 0.04 })]),
  whoosh: rec('whoosh', [
    noise(0, 0.45, 0.16, { type: 'bandpass', f0: 400, f1: 2400, q: 1.2 }, { attack: 0.15, release: 0.25 }),
  ]),
};

// ---------- Animal placeholder recipes (0.5 to 0.8 s, all distinct) ----------

export const ANIMAL_RECIPES: Record<AnimalId, Recipe> = {
  lion: rec('lion', [
    osc('sawtooth', 95, 55, 0, 0.8, 0.26, { attack: 0.08, release: 0.3, amHz: 22, amDepth: 0.5, filter: { type: 'lowpass', f0: 600, q: 2 } }),
    noise(0, 0.8, 0.12, { type: 'lowpass', f0: 700 }, { attack: 0.08, release: 0.3, amHz: 22, amDepth: 0.5 }),
  ]),
  tiger: rec('tiger', [
    osc('sawtooth', 170, 120, 0, 0.6, 0.2, { attack: 0.03, release: 0.2, amHz: 42, amDepth: 0.7, filter: { type: 'bandpass', f0: 900, q: 1.5 } }),
    noise(0, 0.6, 0.16, { type: 'bandpass', f0: 1800, q: 1.2 }, { attack: 0.03, release: 0.2, amHz: 42, amDepth: 0.7 }),
  ]),
  elephant: rec('elephant', [
    osc('sawtooth', 380, 760, 0, 0.8, 0.2, { attack: 0.1, release: 0.3, vibHz: 14, vibDepth: 25, filter: { type: 'bandpass', f0: 1100, q: 1 } }),
    osc('sawtooth', 385, 520, 0.25, 0.5, 0.1, { attack: 0.05, release: 0.25, filter: { type: 'lowpass', f0: 1500 } }),
  ]),
  monkey: rec('monkey', [0, 1, 2, 3, 4, 5].map((i) =>
    osc('square', i % 2 ? 1250 : 950, i % 2 ? 1050 : 1300, i * 0.1, 0.07, 0.07, { attack: 0.012, release: 0.05, filter: { type: 'lowpass', f0: 2800 } }))),
  bear: rec('bear', [
    osc('sawtooth', 75, 52, 0, 0.45, 0.28, { attack: 0.06, release: 0.2, amHz: 11, amDepth: 0.4, filter: { type: 'lowpass', f0: 280, q: 1 } }),
    osc('sawtooth', 70, 48, 0.38, 0.38, 0.26, { attack: 0.06, release: 0.2, amHz: 11, amDepth: 0.4, filter: { type: 'lowpass', f0: 260, q: 1 } }),
  ]),
  peacock: rec('peacock', [
    osc('sawtooth', 620, 1150, 0, 0.3, 0.12, { attack: 0.04, release: 0.1, vibHz: 18, vibDepth: 40, filter: { type: 'bandpass', f0: 1500, q: 2 } }),
    osc('sawtooth', 900, 1250, 0.34, 0.4, 0.12, { attack: 0.04, release: 0.2, vibHz: 18, vibDepth: 40, filter: { type: 'bandpass', f0: 1800, q: 2 } }),
  ]),
  cow: rec('cow', [
    osc('sawtooth', 130, 105, 0, 0.8, 0.22, { attack: 0.12, release: 0.3, vibHz: 5, vibDepth: 6, filter: { type: 'bandpass', f0: 520, q: 2.5 } }),
  ]),
  buffalo: rec('buffalo', [
    osc('sawtooth', 88, 70, 0, 0.35, 0.26, { attack: 0.05, release: 0.15, filter: { type: 'lowpass', f0: 400 } }),
    osc('sawtooth', 82, 62, 0.4, 0.32, 0.24, { attack: 0.05, release: 0.15, filter: { type: 'lowpass', f0: 380 } }),
    noise(0, 0.7, 0.05, { type: 'lowpass', f0: 250 }, { attack: 0.05, release: 0.2 }),
  ]),
  goat: rec('goat', [
    osc('sawtooth', 430, 380, 0, 0.7, 0.16, { attack: 0.05, release: 0.2, amHz: 32, amDepth: 0.6, vibHz: 28, vibDepth: 20, filter: { type: 'bandpass', f0: 1200, q: 2 } }),
  ]),
  hen: rec('hen', [0, 1, 2].map((i) =>
    osc('square', 760 - i * 40, 480 - i * 30, i * 0.2, 0.1, 0.09, { attack: 0.012, release: 0.07, filter: { type: 'bandpass', f0: 1000, q: 3 } }))),
  horse: rec('horse', [
    osc('sawtooth', 700, 1400, 0, 0.3, 0.14, { attack: 0.05, release: 0.1, amHz: 18, amDepth: 0.3, filter: { type: 'bandpass', f0: 1600, q: 1.5 } }),
    osc('sawtooth', 1400, 480, 0.3, 0.5, 0.14, { attack: 0.02, release: 0.3, amHz: 20, amDepth: 0.4, filter: { type: 'bandpass', f0: 1400, q: 1.5 } }),
  ]),
  dog: rec('dog', flat([0, 0.38].map((t) => [
    osc('sawtooth', 340, 190, t, 0.14, 0.2, { attack: 0.012, release: 0.1, filter: { type: 'bandpass', f0: 800, q: 1.2 } }),
    noise(t, 0.08, 0.1, { type: 'bandpass', f0: 1500, q: 1 }, { attack: 0.012, release: 0.06 }),
  ]))),
  cat: rec('cat', [
    osc('triangle', 520, 920, 0, 0.25, 0.2, { attack: 0.05, release: 0.08, filter: { type: 'bandpass', f0: 1300, q: 2 } }),
    osc('triangle', 920, 560, 0.25, 0.4, 0.2, { attack: 0.02, release: 0.3, vibHz: 7, vibDepth: 15, filter: { type: 'bandpass', f0: 1200, q: 2 } }),
  ]),
  rabbit: rec('rabbit', [
    osc('sine', 200, 360, 0, 0.12, 0.22, { attack: 0.012, release: 0.09 }),
    osc('sine', 200, 360, 0.18, 0.12, 0.22, { attack: 0.012, release: 0.09 }),
    ...[0.4, 0.47, 0.54, 0.61].map((t) =>
      noise(t, 0.04, 0.08, { type: 'highpass', f0: 3500 }, { attack: 0.012, release: 0.03 })),
  ]),
};

/** Quiet ambience gains for level 0..1: soft pad, cricket probability. */
export function ambienceGains(level: number): { pad: number; cricket: number } {
  const l = Math.min(1, Math.max(0, Number.isFinite(level) ? level : 0));
  return { pad: 0.012 + 0.04 * l, cricket: l < 0.25 ? 0 : 0.15 + 0.5 * l };
}

export const CRICKET_RECIPE: Recipe = rec('cricket', [0, 0.06, 0.12].map((t) =>
  osc('sine', 4200, undefined, t, 0.04, 0.012, { attack: 0.012, release: 0.03 })));

/** Estimated spoken duration when no audio exists: chars*60ms, min 700. */
export function estimateMs(text: string): number {
  return Math.max(700, Math.round(text.length * 60));
}

function flat<T>(a: T[][]): T[] { return ([] as T[]).concat(...a); }
