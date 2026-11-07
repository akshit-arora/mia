// Play Yard's tiny save: which toy colour / home decoration each pet has (cosmetic only). Key `mia.house.v1`.
// localStorage can be missing or throw (private mode, blocked): then the choice lives in memory for this visit.
// Data written by a newer version is read but never overwritten.
import { DECO_COUNT, PETS, type PetId } from './logic';

export const HOUSE_KEY = 'mia.house.v1';
export interface HouseData { v: 1; deco: Record<PetId, number>; plays: Record<PetId, number> }
export interface StorageLike { getItem(k: string): string | null; setItem(k: string, v: string): void }

export const defaultHouse = (): HouseData => ({ v: 1, deco: { dog: 0, cat: 1, rabbit: 2 }, plays: { dog: 0, cat: 0, rabbit: 0 } });

/** Parse saved text; anything wrong falls back to defaults field by field. */
export function parseHouse(raw: string | null | undefined): { data: HouseData; foreign: boolean } {
  const d = defaultHouse();
  if (!raw) return { data: d, foreign: false };
  try {
    const j = JSON.parse(raw) as { v?: unknown; deco?: Record<string, unknown>; plays?: Record<string, unknown> };
    if (!j || typeof j !== 'object') return { data: d, foreign: false };
    const foreign = typeof j.v === 'number' && j.v > 1;
    for (const p of PETS) {
      const a = j.deco?.[p], b = j.plays?.[p];
      if (typeof a === 'number' && Number.isInteger(a) && a >= 0 && a < DECO_COUNT) d.deco[p] = a;
      if (typeof b === 'number' && Number.isInteger(b) && b >= 0 && b < 1e6) d.plays[p] = b;
    }
    return { data: d, foreign };
  } catch { return { data: d, foreign: false }; }
}

export interface HouseStore {
  decoOf(p: PetId): number;
  playsOf(p: PetId): number;
  setDeco(p: PetId, i: number): void;
  addPlay(p: PetId): void;
  /** true when the data on disk could not be written (memory fallback in use) */
  readonly memoryOnly: boolean;
}

export function createHouseStore(storage?: StorageLike | null): HouseStore {
  let st: StorageLike | null = null;
  try { st = storage === undefined ? (typeof localStorage !== 'undefined' ? localStorage : null) : storage; } catch { st = null; }
  let raw: string | null = null;
  try { raw = st ? st.getItem(HOUSE_KEY) : null; } catch { st = null; }
  const { data, foreign } = parseHouse(raw);
  let memoryOnly = !st || foreign;
  const save = (): void => {
    if (!st || foreign) { memoryOnly = true; return; }
    try { st.setItem(HOUSE_KEY, JSON.stringify(data)); } catch { memoryOnly = true; }
  };
  return {
    decoOf: (p) => data.deco[p],
    playsOf: (p) => data.plays[p],
    setDeco(p, i) { if (i >= 0 && i < DECO_COUNT) { data.deco[p] = i; save(); } },
    addPlay(p) { data.plays[p]++; save(); },
    get memoryOnly() { return memoryOnly; },
  };
}
