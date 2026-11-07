// Card progress: which animals the child has earned and each card's star level.
// Pure logic (no DOM). Storage is injected; failures fall back to memory so a blocked
// localStorage never stops the game. Key `mia.cards.v1`; the old `animal-express.progress.v1` is never touched.
import { ANIMAL_IDS } from './data';

export const STORE_KEY = 'mia.cards.v1';
/** Level 1 = card owned; every repeat earn adds a star up to this level (so at most MAX_LEVEL - 1 stars). */
export const MAX_LEVEL = 4;

export interface StorageLike { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem?(k: string): void }
export interface EarnResult { id: string; first: boolean; level: number; prevLevel: number; leveledUp: boolean }
export type Levels = Record<string, number>;

/**
 * Parse stored text. Never throws. Unknown animals are dropped, levels clamped to 1..MAX_LEVEL,
 * junk ignored. A newer version (v > 1) is reported as `foreign` so we do not overwrite data we cannot read.
 */
export function parseCards(raw: string | null | undefined, valid: readonly string[]): { levels: Levels; foreign: boolean } {
  const out: Levels = {};
  if (!raw) return { levels: out, foreign: false };
  let o: any;
  try { o = JSON.parse(raw); } catch { return { levels: out, foreign: false }; }
  if (!o || typeof o !== 'object') return { levels: out, foreign: false };
  if (typeof o.v === 'number' && o.v > 1) return { levels: out, foreign: true };
  if (o.v !== 1) return { levels: out, foreign: false };
  const c = o.cards;
  if (c && typeof c === 'object' && !Array.isArray(c)) {
    for (const id of valid) {
      const n = Number(c[id]);
      if (Number.isFinite(n) && n >= 1) out[id] = Math.min(MAX_LEVEL, Math.floor(n));
    }
  }
  return { levels: out, foreign: false };
}

export interface CardStore {
  earn(id: string): EarnResult;
  owned(): string[];
  has(id: string): boolean;
  levelOf(id: string): number; // 0 = not owned
  onChange(cb: (r: EarnResult | null) => void): () => void; // null = reset; returns an unsubscribe
  reset(): void;
}

export interface StoreOptions {
  storage?: StorageLike | null;
  validIds?: readonly string[];
  key?: string;
  /** Debug (?unlock=all): every card counts as owned (level 1 at least) and nothing is written. */
  unlockAll?: boolean;
}

export function createCardStore(opts: StoreOptions = {}): CardStore {
  const valid = opts.validIds ?? ANIMAL_IDS;
  const key = opts.key ?? STORE_KEY;
  const storage = opts.storage ?? null;
  let levels: Levels = {};
  let foreign = false; // stored data is from a newer version: keep it, play in memory only
  const subs: Array<(r: EarnResult | null) => void> = [];

  try {
    const p = parseCards(storage ? storage.getItem(key) : null, valid);
    levels = p.levels; foreign = p.foreign;
  } catch { /* blocked storage: start empty, memory only */ }

  const write = () => {
    if (opts.unlockAll || foreign || !storage) return;
    try { storage.setItem(key, JSON.stringify({ v: 1, cards: levels })); } catch { /* private mode: memory only */ }
  };
  const lvl = (id: string) => levels[id] || (opts.unlockAll && valid.includes(id) ? 1 : 0);
  const emit = (r: EarnResult | null) => { for (const cb of subs.slice()) { try { cb(r); } catch { /* a listener must not break the store */ } } };

  return {
    earn(id) {
      if (!valid.includes(id)) throw new RangeError('unknown card: ' + id);
      const prevLevel = lvl(id);
      const level = Math.min(MAX_LEVEL, prevLevel + 1);
      levels[id] = level;
      write();
      const r: EarnResult = { id, first: prevLevel === 0, level, prevLevel, leveledUp: level > prevLevel && prevLevel > 0 };
      emit(r);
      return r;
    },
    owned: () => valid.filter((id) => lvl(id) > 0),
    has: (id) => lvl(id) > 0,
    levelOf: lvl,
    onChange(cb) { subs.push(cb); return () => { const i = subs.indexOf(cb); if (i >= 0) subs.splice(i, 1); }; },
    reset() {
      levels = {}; foreign = false;
      if (storage && !opts.unlockAll) { try { storage.removeItem ? storage.removeItem(key) : storage.setItem(key, JSON.stringify({ v: 1, cards: {} })); } catch { /* ignore */ } }
      emit(null);
    },
  };
}

// ---- the app-wide store, created lazily so importing this module never touches the browser ----
let shared: CardStore | null = null;
function browserStorage(): StorageLike | null {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
}
export function getStore(): CardStore {
  if (!shared) {
    let unlockAll = false;
    try { unlockAll = typeof location !== 'undefined' && /[?&]unlock=all\b/.test(location.search); } catch { /* ignore */ }
    shared = createCardStore({ storage: browserStorage(), unlockAll });
  }
  return shared;
}
/** For tests and tools: replace the shared store. */
export function setStore(s: CardStore | null): void { shared = s; }

export const earn = (id: string): EarnResult => getStore().earn(id);
export const owned = (): string[] => getStore().owned();
export const levelOf = (id: string): number => getStore().levelOf(id);
export const onChange = (cb: (r: EarnResult | null) => void): (() => void) => getStore().onChange(cb);
