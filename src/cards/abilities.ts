// One ability per animal, derived from a real body trait. Abilities are OPTIONAL: they open a
// shortcut or a comfort, never a required path. V1 (docs/design/V1_BRIEF.md) activates exactly two:
// Gajju's trunk (a HIGH branch shortcut) and Bunty's climb (a VINE shortcut). Every other ability
// stays on the card as data and maps to 'none' on the trail, so the code for it can come back later.
export type BuddyEffect = 'trunk' | 'climb' | 'none';

/** Ability id (stored on the card) -> the effect the trail understands. Only the two v1 buddies do anything. */
export const EFFECT_OF: Record<string, BuddyEffect> = {
  trunk: 'trunk', // elephant: reaches the high branch, a shortcut over the trail
  climb: 'climb', // monkey: swings up a vine, a shortcut through the trees
  roar: 'none', pounce: 'none', sniff: 'none', fan: 'none', // deferred past v1
};

/** The effect a buddy brings, or 'none' for no buddy / an ability that is not active in v1. */
export function effectOf(animalId: string | null | undefined, abilityOf: (id: string) => string | undefined): BuddyEffect {
  if (!animalId) return 'none';
  const ability = abilityOf(animalId);
  return (ability && EFFECT_OF[ability]) || 'none';
}

/** Short, spoken lines for the buddy row (2 to 6 words, same rule as every other voice line). */
export const EFFECT_LINE: Record<BuddyEffect, string> = {
  trunk: 'Trunk reaches the high branch!',
  climb: 'Climb swings up the vine!',
  none: '',
};
