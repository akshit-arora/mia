// Typed access to src/data/cards.json and card-icons.json. Pure: no DOM, safe to import in tests.
import cardsJson from '../data/cards.json';
import iconsJson from '../data/card-icons.json';

export type ShelfId = 'jungle' | 'farm' | 'house';
export type TypeId = 'wild' | 'farm' | 'pet';
export type StatKind = 'size' | 'speed' | 'strength' | 'loudness';

export interface Card {
  id: string; // = entity id in entities.json (and the sprite id in the animal atlas)
  name: string; // personal name (draft); the child-facing text comes from locale key card.name.<id>
  type: TypeId;
  shelf: ShelfId;
  food: string; // icon food.<food>
  home: string; // icon home.<home>
  stats: Partial<Record<StatKind, number>>; // exactly two, 1..10
  action: string; // reaction name in src/game/reactions.ts
  ability: string; // buddy ability id; locale key ability.<ability>, effects in src/cards/abilities.ts
  review?: boolean;
  reviewNote?: string;
}
export interface IconDef { id: string; group: 'food' | 'home' | 'type' | 'ui'; emoji?: string; draw?: boolean; shape: string; colour: string }

export const SHELVES = (cardsJson as { shelves: string[] }).shelves as ShelfId[];
export const CARDS: readonly Card[] = (cardsJson as unknown as { animals: Card[] }).animals;
export const ICONS: readonly IconDef[] = iconsJson as IconDef[];
export const ANIMAL_IDS: readonly string[] = CARDS.map((c) => c.id);

const byId = new Map(CARDS.map((c) => [c.id, c] as const));
export function cardOf(id: string): Card {
  const c = byId.get(id);
  if (!c) throw new RangeError('unknown card: ' + id);
  return c;
}
export const isCard = (id: string): boolean => byId.has(id);
/** Cards on a shelf, in data order (this is also the slot order on the shelves screen). */
export function shelfCards(shelf: ShelfId): Card[] { return CARDS.filter((c) => c.shelf === shelf); }
export const abilityOf = (id: string): string => byId.get(id)?.ability ?? '';
export const foodIcon = (c: Card): string => 'food.' + c.food;
export const homeIcon = (c: Card): string => 'home.' + c.home;
export const typeIcon = (c: Card): string => 'type.' + c.type;
