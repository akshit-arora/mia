// Pure, testable rules. All behaviour comes from data (entity.accepts, level.accept); no names are special-cased.
import type { Entity, LevelConfig, Progress } from '../types';

export function acceptedZones(e: Entity, level: LevelConfig): string[] {
  const z = [...e.accepts];
  if (level.accept === 'primary-plus-also' && e.acceptsAlso) z.push(...e.acceptsAlso);
  return z;
}
export function isAccepted(e: Entity, zoneId: string, level: LevelConfig): boolean {
  return acceptedZones(e, level).includes(zoneId);
}

export type Rng = () => number;

/** Weighted pick that favours low confidence and avoids immediate repeats. */
export function pickItems(level: LevelConfig, entities: Entity[], progress: Progress, rng: Rng, countOverride?: number): string[] {
  const byId = new Map(entities.map((e) => [e.id, e] as const));
  if (level.intro) return level.introEntities.slice();
  const pool = level.itemQuery.pool.filter((id) => byId.has(id) && acceptedZones(byId.get(id)!, level).some((z) => level.targets.includes(z)));
  const count = countOverride ?? level.count;
  const out: string[] = [];
  const guests = (level.itemQuery.guests || []).filter((id) => byId.has(id));
  // make sure every target gets at least one item first, so the choice is real
  const need = level.targets.slice().sort(() => rng() - 0.5);
  for (let i = 0; i < count; i++) {
    let cands = pool.filter((id) => id !== out[out.length - 1]);
    if (!cands.length) cands = pool;
    if (i < need.length) {
      // the first items cover every target once, so a real choice exists early
      const c2 = cands.filter((id) => isAccepted(byId.get(id)!, need[i], level));
      if (c2.length) cands = c2;
    }
    const w = cands.map((id) => 1.2 - (progress.confidence[id] ?? 0.3));
    const total = w.reduce((a, b) => a + b, 0);
    let r = rng() * total, pick = cands[cands.length - 1];
    for (let k = 0; k < cands.length; k++) { r -= w[k]; if (r <= 0) { pick = cands[k]; break; } }
    out.push(pick);
  }
  if (guests.length && level.surpriseSlot && out.length > 2) out[out.length - 1] = guests[Math.floor(rng() * guests.length)];
  return out;
}

export function levelUnlocked(level: LevelConfig, levels: LevelConfig[], progress: Progress): boolean {
  if (!level.prereq) return true;
  const pre = levels.find((l) => l.id === level.prereq);
  if (!pre) return true;
  if (pre.intro) return progress.introDone;
  return (progress.cleanRuns[pre.id] ?? 0) >= pre.unlockRule.cleanRuns;
}

/** Next new level, plus a review level (earlier, never intro). */
export function planSession(levels: LevelConfig[], progress: Progress, rng: Rng): { review: LevelConfig | null; fresh: LevelConfig } {
  const playable = levels.filter((l) => !l.intro).sort((a, b) => a.order - b.order);
  const ladder = playable.filter((l) => !l.replayOnly);
  let fresh = ladder.find((l) => levelUnlocked(l, levels, progress) && (progress.cleanRuns[l.id] ?? 0) < l.unlockRule.cleanRuns);
  if (!fresh) fresh = ladder[ladder.length - 1];
  const earlier = playable.filter((l) => l.order < fresh!.order && levelUnlocked(l, levels, progress));
  const review = earlier.length ? earlier[Math.floor(rng() * earlier.length)] : null;
  return { review, fresh };
}

export function updateConfidence(progress: Progress, id: string, firstTry: boolean): void {
  const c = progress.confidence[id] ?? 0.3;
  progress.confidence[id] = Math.max(0, Math.min(1, c * 0.7 + (firstTry ? 0.3 : 0)));
}

export const PARK_CAP_PER_ENTITY = 2;
export function addResident(progress: Progress, id: string): boolean {
  if (progress.park.filter((p) => p === id).length >= PARK_CAP_PER_ENTITY) return false;
  progress.park.push(id);
  return true;
}
