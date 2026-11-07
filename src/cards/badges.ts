// Trail badges: a small, persistent record of HOW a child played, not whether they won.
// Every run earns a card; badges are the optional mastery layer (clean / full / secret).
// Pure logic (no DOM). Storage is injected; a blocked localStorage falls back to memory so
// the game never stops. Key `mia.badges.v1`; cards stay in `mia.cards.v1`.
import { ANIMAL_IDS } from './data';

export const BADGE_STORE_KEY = 'mia.badges.v1';
export const BADGE_IDS = ['clean', 'full', 'secret'] as const;
export type BadgeId = (typeof BADGE_IDS)[number];
export type BadgeMap = Record<string, BadgeId[]>;

export interface BadgeStorage { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem?(k: string): void }

const isBadge = (v: unknown): v is BadgeId => typeof v === 'string' && (BADGE_IDS as readonly string[]).includes(v);

/** Parse stored text. Never throws. Unknown animals and unknown badges are dropped. */
export function parseBadges(raw: string | null | undefined, valid: readonly string[] = ANIMAL_IDS): BadgeMap {
  if (!raw) return {};
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return {}; }
  if (!data || typeof data !== 'object') return {};
  const obj = data as { v?: unknown; badges?: unknown };
  if (obj.v !== 1 || !obj.badges || typeof obj.badges !== 'object' || Array.isArray(obj.badges)) return {};
  const out: BadgeMap = {};
  for (const [id, list] of Object.entries(obj.badges as Record<string, unknown>)) {
    if (!valid.includes(id) || !Array.isArray(list)) continue;
    const keep = [...new Set(list.filter(isBadge))];
    if (keep.length) out[id] = BADGE_IDS.filter((b) => keep.includes(b));
  }
  return out;
}

export interface BadgeStore {
  badgesOf(id: string): BadgeId[];
  has(id: string, badge: BadgeId): boolean;
  /** Award badges, returning only the ones that were new. Never throws on storage errors. */
  award(id: string, badges: readonly BadgeId[]): BadgeId[];
  count(): number;
  onChange(fn: (id: string, added: BadgeId[]) => void): () => void;
  reset(): void;
}

/** Memory-only fallback and the injectable base. `unlockAll` is a debug switch (writes nothing). */
export function createBadgeStore(opts: { storage?: BadgeStorage | null; unlockAll?: boolean } = {}): BadgeStore {
  const storage = opts.storage ?? null;
  let map: BadgeMap = opts.unlockAll
    ? Object.fromEntries(ANIMAL_IDS.map((id) => [id, [...BADGE_IDS]]))
    : parseBadges(storage ? safeGet(storage) : null);
  const listeners = new Set<(id: string, added: BadgeId[]) => void>();

  function persist(): void {
    if (opts.unlockAll || !storage) return;
    try { storage.setItem(BADGE_STORE_KEY, JSON.stringify({ v: 1, badges: map })); } catch { /* memory only */ }
  }

  return {
    badgesOf: (id) => [...(map[id] ?? [])],
    has: (id, badge) => (map[id] ?? []).includes(badge),
    award(id, badges) {
      if (!ANIMAL_IDS.includes(id)) throw new RangeError('unknown card: ' + id);
      const have = new Set(map[id] ?? []);
      const added = [...new Set(badges)].filter((b) => isBadge(b) && !have.has(b));
      if (!added.length) return [];
      map[id] = BADGE_IDS.filter((b) => have.has(b) || added.includes(b));
      persist();
      for (const fn of listeners) { try { fn(id, added); } catch { /* a bad listener must not break the game */ } }
      return added;
    },
    count: () => Object.values(map).reduce((n, list) => n + list.length, 0),
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    reset() {
      map = {};
      if (!opts.unlockAll && storage) { try { storage.removeItem?.(BADGE_STORE_KEY); } catch { /* ignore */ } }
      for (const fn of listeners) { try { fn('', []); } catch { /* ignore */ } }
    },
  };
}

function safeGet(storage: BadgeStorage): string | null {
  try { return storage.getItem(BADGE_STORE_KEY); } catch { return null; }
}

let singleton: BadgeStore | null = null;
/** The app-wide badge store (localStorage when available, otherwise memory). */
export function getBadgeStore(): BadgeStore {
  if (singleton) return singleton;
  let storage: BadgeStorage | null = null;
  try { storage = globalThis.localStorage ?? null; } catch { storage = null; }
  return (singleton = createBadgeStore({ storage }));
}
