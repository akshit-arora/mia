// Audio facade: the game imports only this module.
// Node-safe: no browser globals at module top level; every access is guarded.
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import {
  ANIMAL_RECIPES, CAPTIONED_SFX, CRICKET_RECIPE, MASTER_GAIN, MIN_ATTACK, SFX_RECIPES,
  ambienceGains, estimateMs, lcg,
  type Layer, type Recipe, type SfxName as RSfxName,
} from './recipes';

export type Speaker = 'bholu' | 'chiku';
export type SfxName = RSfxName;
export interface CaptionEvent {
  kind: 'speech' | 'sound';
  key: string;
  speaker?: Speaker;
  ms: number;
}

type Sprite = Record<string, [number, number]>;
interface Pack { map: Sprite; bytes: ArrayBuffer | null; buffer: any | null; decoding: boolean }

const g: any = (typeof globalThis !== 'undefined' ? globalThis : window) as any;
const STRINGS: Record<string, Record<string, string>> = { en: en as any, hi: hi as any };

let ctx: any = null;
let master: any = null;
let sfxBus: any = null;
let speechBus: any = null;
let ambBus: any = null;
let noiseBuf: any = null;
let muted = false;
let vibrationOn = true;
let locale = 'en';
let unlockedListeners = false;
let captionCb: ((e: CaptionEvent) => void) | null = null;
let speaking = 0;
let queued = 0;
let chain: Promise<void> = Promise.resolve();
const speechPacks: Record<string, Pack> = {};
let animalPack: Pack | null = null;
let ambNodes: { pad: any[]; padGain: any; timer: any } | null = null;
let ambLevel = 0;

const sleepMs = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function emit(e: CaptionEvent): void {
  try { captionCb?.(e); } catch { /* UI errors must not break audio */ }
}

function textFor(key: string): string {
  return STRINGS[locale]?.[key] ?? STRINGS.en[key] ?? key;
}

function langMatches(voiceLang: string, loc: string): boolean {
  const v = voiceLang.toLowerCase().replace('_', '-');
  const l = loc.toLowerCase();
  return v === l || v.startsWith(l + '-');
}

function matchingVoice(): any | null {
  try {
    const ss = g.speechSynthesis;
    if (!ss || typeof ss.getVoices !== 'function') return null;
    const voices: any[] = ss.getVoices() || [];
    return voices.find((v) => langMatches(String(v.lang || ''), locale)) ?? null;
  } catch { return null; }
}

// ---------- AudioContext plumbing ----------

function ensureCtx(): any | null {
  if (ctx) return ctx;
  const AC = g.AudioContext || g.webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.knee.value = 6;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.15;
    master = ctx.createGain();
    master.gain.value = muted ? 0 : MASTER_GAIN;
    master.connect(limiter);
    limiter.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    speechBus = ctx.createGain(); speechBus.connect(master);
    ambBus = ctx.createGain(); ambBus.connect(master);
    ctx.onstatechange = () => { /* resumed by gesture/visibility handlers */ };
    return ctx;
  } catch { ctx = null; return null; }
}

function getNoise(): any {
  if (noiseBuf || !ctx) return noiseBuf;
  const len = ctx.sampleRate * 2;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  const r = lcg(12345);
  for (let i = 0; i < len; i++) d[i] = r() * 2 - 1;
  return noiseBuf;
}

function duck(on: boolean): void {
  if (!ctx) return;
  const t = ctx.currentTime;
  try {
    sfxBus.gain.setTargetAtTime(on ? 0.35 : 1, t, 0.08);
    ambBus.gain.setTargetAtTime(on ? 0.4 : 1, t, 0.15);
  } catch { /* ignore */ }
}

function playLayer(l: Layer, when: number, dest: any): void {
  const c = ctx;
  const start = when + l.t;
  const end = start + l.dur;
  const env = c.createGain();
  const a = Math.max(MIN_ATTACK, Math.min(l.attack ?? 0.02, l.dur * 0.9));
  const r = Math.max(0.01, Math.min(l.release ?? 0.08, l.dur - a));
  env.gain.setValueAtTime(0, start);
  env.gain.linearRampToValueAtTime(l.gain, start + a);
  env.gain.setValueAtTime(l.gain, Math.max(start + a, end - r));
  env.gain.linearRampToValueAtTime(0, end);
  let src: any;
  if (l.kind === 'noise') {
    src = c.createBufferSource();
    src.buffer = getNoise();
    src.loop = true;
  } else {
    src = c.createOscillator();
    src.type = l.wave || 'sine';
    src.frequency.setValueAtTime(l.f0, start);
    if (l.f1 && l.f1 !== l.f0) src.frequency.exponentialRampToValueAtTime(l.f1, end);
  }
  let node: any = src;
  if (l.filter) {
    const f = c.createBiquadFilter();
    f.type = l.filter.type;
    f.Q.value = l.filter.q ?? 1;
    f.frequency.setValueAtTime(l.filter.f0, start);
    if (l.filter.f1) f.frequency.exponentialRampToValueAtTime(l.filter.f1, end);
    node.connect(f); node = f;
  }
  node.connect(env);
  let out: any = env;
  const extra: any[] = [];
  if (l.amHz && l.amDepth) {
    const am = c.createGain();
    am.gain.value = 1 - l.amDepth / 2;
    const lfo = c.createOscillator();
    lfo.frequency.value = l.amHz;
    const lg = c.createGain();
    lg.gain.value = l.amDepth / 2;
    lfo.connect(lg); lg.connect(am.gain);
    env.connect(am); out = am;
    lfo.start(start); lfo.stop(end + 0.05);
    extra.push(lfo);
  }
  if (l.vibHz && l.vibDepth && l.kind === 'osc') {
    const lfo = c.createOscillator();
    lfo.frequency.value = l.vibHz;
    const lg = c.createGain();
    lg.gain.value = l.vibDepth;
    lfo.connect(lg); lg.connect(src.frequency);
    lfo.start(start); lfo.stop(end + 0.05);
  }
  out.connect(dest);
  if (l.kind === 'noise') src.start(start, Math.random() * 1.5); else src.start(start);
  src.stop(end + 0.05);
}

function playRecipe(r: Recipe, dest: any, delay = 0.01): void {
  if (!ensureCtx() || !ctx) return;
  const when = ctx.currentTime + delay;
  for (const l of r.layers) {
    try { playLayer(l, when, dest); } catch { /* skip bad layer */ }
  }
}

// ---------- pack loading ----------

async function fetchPack(jsonUrl: string, binUrl: string): Promise<Pack | null> {
  try {
    if (typeof g.fetch !== 'function') return null;
    const jr = await g.fetch(jsonUrl);
    if (!jr || !jr.ok) return null;
    const map = await jr.json();
    if (!map || typeof map !== 'object' || Array.isArray(map)) return null;
    const br = await g.fetch(binUrl);
    if (!br || !br.ok) return null;
    const bytes = await br.arrayBuffer();
    if (!bytes || bytes.byteLength < 64) return null;
    return { map, bytes, buffer: null, decoding: false };
  } catch { return null; }
}

async function decodePack(p: Pack | null): Promise<void> {
  if (!p || p.buffer || p.decoding || !p.bytes || !ctx) return;
  p.decoding = true;
  try {
    const copy = p.bytes.slice(0);
    p.buffer = await new Promise((res, rej) => {
      const r = ctx.decodeAudioData(copy, res, rej);
      if (r && typeof r.then === 'function') r.then(res, rej);
    });
  } catch { p.buffer = null; p.map = {}; /* undecodable: fall back to synthesis */ }
  p.decoding = false;
}

function clipMs(p: Pack | null | undefined, key: string): number | null {
  const e = p?.map?.[key];
  return e && Array.isArray(e) && e[1] > 0 ? e[1] : null;
}

function playClip(p: Pack, key: string, bus: any, gain = 1): boolean {
  if (!ctx || !p.buffer) return false;
  const e = p.map[key];
  if (!e) return false;
  try {
    const s = ctx.createBufferSource();
    s.buffer = p.buffer;
    const gn = ctx.createGain();
    gn.gain.value = gain;
    s.connect(gn); gn.connect(bus);
    s.start(ctx.currentTime + 0.01, e[0] / 1000, e[1] / 1000);
    return true;
  } catch { return false; }
}

// ---------- speech ----------

async function runSay(key: string, speaker: Speaker): Promise<void> {
  const pack = speechPacks[locale];
  const recMs = clipMs(pack, key);
  const text = textFor(key);
  const voice = recMs ? null : matchingVoice();
  const ms = recMs ?? estimateMs(text);
  emit({ kind: 'speech', key, speaker, ms });
  speaking++;
  duck(true);
  try {
    if (muted) { await sleepMs(ms); return; }
    if (recMs && pack && ctx) {
      if (!pack.buffer) await decodePack(pack);
      if (playClip(pack, key, speechBus)) { await sleepMs(recMs + 60); return; }
    }
    if (voice && g.speechSynthesis && typeof g.SpeechSynthesisUtterance === 'function') {
      await new Promise<void>((resolve) => {
        let done = false;
        const fin = () => { if (!done) { done = true; resolve(); } };
        try {
          const u = new g.SpeechSynthesisUtterance(text);
          u.voice = voice; u.lang = voice.lang;
          u.rate = speaker === 'chiku' ? 0.9 : 0.95;
          u.pitch = speaker === 'chiku' ? 1.4 : 1.1;
          u.onend = fin; u.onerror = fin;
          g.speechSynthesis.speak(u);
          setTimeout(fin, Math.max(ms * 3, 4000));
        } catch { fin(); }
      });
      return;
    }
    await sleepMs(ms);
  } catch {
    /* never throw */
  } finally {
    speaking = Math.max(0, speaking - 1);
    if (speaking === 0) duck(false);
  }
}

// ---------- ambience ----------

function startAmbience(): void {
  if (ambNodes || !ensureCtx() || !ctx) return;
  const padGain = ctx.createGain();
  padGain.gain.value = 0;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 500;
  lp.connect(padGain); padGain.connect(ambBus);
  const pad = [130.81, 196.0, 261.63].map((f, i) => {
    const o = ctx.createOscillator();
    o.type = 'sine'; o.frequency.value = f; o.detune.value = (i - 1) * 6;
    const gg = ctx.createGain(); gg.gain.value = 0.5 - i * 0.1;
    o.connect(gg); gg.connect(lp); o.start();
    return o;
  });
  const timer = setInterval(() => {
    if (muted || !ctx) return;
    if (Math.random() < ambienceGains(ambLevel).cricket) playRecipe(CRICKET_RECIPE, ambBus, 0.02);
  }, 1100);
  ambNodes = { pad, padGain, timer };
}

// ---------- the facade ----------

export const audio = {
  async unlock(): Promise<void> {
    try {
      const c = ensureCtx();
      if (!c) return;
      if (c.state !== 'running') await c.resume();
      if (!unlockedListeners) {
        unlockedListeners = true;
        const resume = () => { try { if (ctx && ctx.state !== 'running' && !muted) void ctx.resume(); } catch { /* ignore */ } };
        try {
          g.document?.addEventListener?.('visibilitychange', () => {
            if (g.document.visibilityState === 'visible') resume();
          });
          g.addEventListener?.('pointerdown', resume, { passive: true });
          g.addEventListener?.('focus', resume);
          if (ctx) ctx.onstatechange = () => { if (ctx.state === 'interrupted') resume(); };
        } catch { /* ignore */ }
      }
      for (const p of Object.values(speechPacks)) await decodePack(p);
      await decodePack(animalPack);
    } catch { /* never throw */ }
  },

  setMuted(m: boolean): void {
    muted = !!m;
    try {
      if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : MASTER_GAIN, ctx.currentTime, 0.03);
      if (muted) g.speechSynthesis?.cancel?.();
    } catch { /* ignore */ }
  },
  isMuted(): boolean { return muted; },

  hasVoice(): boolean {
    const p = speechPacks[locale];
    if (p && Object.keys(p.map).length > 0) return true;
    return matchingVoice() !== null;
  },

  onCaption(cb: (e: CaptionEvent) => void): void { captionCb = cb; },

  say(key: string, speaker: Speaker): Promise<void> {
    if (queued === 0) {
      // idle: start immediately so the caption event is emitted synchronously
      queued++;
      const p = runSay(key, speaker).then(() => { queued--; }, (e) => { queued--; throw e; });
      chain = p;
      return p;
    }
    queued++;
    const p = chain.then(() => runSay(key, speaker)).then(() => { queued--; }, (e) => { queued--; throw e; });
    chain = p;
    return p;
  },

  sfx(name: SfxName): void {
    try {
      const r = SFX_RECIPES[name];
      if (!r) return;
      if (CAPTIONED_SFX.has(name)) emit({ kind: 'sound', key: `cc.sfx.${name}`, ms: Math.round(r.dur * 1000) });
      if (muted || !ensureCtx()) return;
      playRecipe(r, sfxBus);
    } catch { /* never throw */ }
  },

  animal(id: string): void {
    try {
      const r = (ANIMAL_RECIPES as Record<string, Recipe>)[id];
      if (!r) return;
      const recMs = clipMs(animalPack, id);
      emit({ kind: 'sound', key: `cc.animal.${id}`, ms: recMs ?? Math.round(r.dur * 1000) });
      if (muted || !ensureCtx()) return;
      if (recMs && animalPack && playClip(animalPack, id, sfxBus)) return;
      playRecipe(r, sfxBus);
    } catch { /* never throw */ }
  },

  ambience(level: number): void {
    try {
      ambLevel = Math.min(1, Math.max(0, Number.isFinite(level) ? level : 0));
      if (!ensureCtx() || !ctx) return;
      startAmbience();
      ambNodes?.padGain.gain.setTargetAtTime(ambienceGains(ambLevel).pad, ctx.currentTime, 1.5);
    } catch { /* ignore */ }
  },
  stopAmbience(): void {
    try {
      if (!ambNodes || !ctx) return;
      const n = ambNodes; ambNodes = null;
      clearInterval(n.timer);
      n.padGain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
      setTimeout(() => n.pad.forEach((o) => { try { o.stop(); } catch { /* ignore */ } }), 1500);
    } catch { /* ignore */ }
  },

  async load(loc: string): Promise<void> {
    try {
      locale = loc || locale;
      const [sp, an] = await Promise.all([
        fetchPack(`./audio/${loc}/speech.json`, `./audio/${loc}/speech.webm`),
        animalPack ? Promise.resolve(animalPack) : fetchPack('./audio/core/animals.json', './audio/core/animals.webm'),
      ]);
      if (sp) speechPacks[loc] = sp;
      if (an) animalPack = an;
      if (ctx) { await decodePack(sp); await decodePack(an); }
    } catch { /* absence is normal */ }
  },

  vibrate(ms: number): void {
    try {
      if (!vibrationOn) return;
      const nav = g.navigator;
      if (nav && typeof nav.vibrate === 'function') nav.vibrate(Math.max(0, Math.min(ms, 500)));
    } catch { /* ignore */ }
  },
  setVibration(on: boolean): void { vibrationOn = !!on; },
  setLocale(l: string): void { if (l) locale = l; },
};

