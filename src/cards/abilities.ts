// One ability per animal, derived from a real body trait. Abilities are OPTIONAL: they open a
// shortcut, a badge or a comfort, never a required path. In the Jungle flagship the six wild
// animals all have a working effect; farm/house effects are reserved for their chapters.
export type BuddyEffect = 'roar' | 'pounce' | 'trunk' | 'climb' | 'sniff' | 'fan' | 'none';

/** Ability id (stored on the card) -> the effect the trail understands. */
export const EFFECT_OF: Record<string, BuddyEffect> = {
  roar: 'roar', // lion: the roar clears hazards from the chosen route
  pounce: 'pounce', // tiger: the first bump is free
  trunk: 'trunk', // elephant: never spills food when bumped
  climb: 'climb', // monkey: the high route always hides the secret
  sniff: 'sniff', // bear: the nose finds extra food
  fan: 'fan', // peacock: no sticky slowdown, and a gift on the thicket
};

/** The effect a buddy brings, or 'none' for no buddy / a card with no trail effect yet. */
export function effectOf(animalId: string | null | undefined, abilityOf: (id: string) => string | undefined): BuddyEffect {
  if (!animalId) return 'none';
  const ability = abilityOf(animalId);
  return (ability && EFFECT_OF[ability]) || 'none';
}

/** Short, spoken lines for the buddy row (2 to 6 words, same rule as every other voice line). */
export const EFFECT_LINE: Record<BuddyEffect, string> = {
  roar: 'Roar clears the way!',
  pounce: 'Pounce saves one bump!',
  trunk: 'Trunk never spills!',
  climb: 'Climb finds the secret!',
  sniff: 'Sniff finds extra food!',
  fan: 'Fan calms the bees!',
  none: '',
};
