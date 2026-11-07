import { describe, expect, it } from 'vitest';
import cardsJson from '../src/data/cards.json';
import iconsJson from '../src/data/card-icons.json';
import entities from '../src/data/entities.json';
import atlas from '../src/gen/card-atlas.json';
import en from '../src/locales/en.json';
import hi from '../src/locales/hi.json';
import { REACTIONS } from '../src/game/reactions';
import { DRAWN_IDS } from '../src/cards/icons';
import { ANIMAL_IDS, CARDS, SHELVES, cardOf, shelfCards } from '../src/cards/data';
import { MAX_LEVEL, STORE_KEY, createCardStore, parseCards, type StorageLike } from '../src/cards/progress';
// @ts-ignore plain JS module
import { validateCards } from '../tools/validate-lib.mjs';

const E = en as unknown as Record<string, string>;
const mem = (init: Record<string, string> = {}): StorageLike & { data: Record<string, string> } => {
  const data = { ...init };
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = v; }, removeItem: (k) => { delete data[k]; } };
};
const brokenStorage = (): StorageLike => ({ getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } });

describe('card progress', () => {
  it('earn: first time level 1, repeats add stars up to the cap', () => {
    const s = createCardStore({ storage: mem() });
    expect(s.owned()).toEqual([]);
    expect(s.levelOf('lion')).toBe(0);
    const a = s.earn('lion');
    expect(a).toMatchObject({ id: 'lion', first: true, level: 1, prevLevel: 0, leveledUp: false });
    const b = s.earn('lion');
    expect(b).toMatchObject({ first: false, level: 2, prevLevel: 1, leveledUp: true });
    for (let i = 0; i < 10; i++) s.earn('lion');
    expect(s.levelOf('lion')).toBe(MAX_LEVEL);
    expect(s.earn('lion')).toMatchObject({ level: MAX_LEVEL, leveledUp: false });
    expect(s.owned()).toEqual(['lion']);
  });
  it('owned() is in data order and ignores nothing valid', () => {
    const s = createCardStore({ storage: mem() });
    s.earn('rabbit'); s.earn('lion'); s.earn('cow');
    expect(s.owned()).toEqual(['lion', 'cow', 'rabbit']);
  });
  it('rejects unknown animals', () => {
    const s = createCardStore({ storage: mem() });
    expect(() => s.earn('dragon')).toThrow(RangeError);
    expect(s.owned()).toEqual([]);
  });
  it('persists under mia.cards.v1 and reloads', () => {
    const st = mem();
    createCardStore({ storage: st }).earn('tiger');
    expect(JSON.parse(st.data[STORE_KEY])).toEqual({ v: 1, cards: { tiger: 1 } });
    expect(STORE_KEY).toBe('mia.cards.v1');
    const again = createCardStore({ storage: st });
    expect(again.levelOf('tiger')).toBe(1);
    again.earn('tiger');
    expect(createCardStore({ storage: st }).levelOf('tiger')).toBe(2);
  });
  it('never touches the old sorting game key', () => {
    const st = mem({ 'animal-express.progress.v1': '{"v":1}' });
    const s = createCardStore({ storage: st }); s.earn('cat'); s.reset();
    expect(st.data['animal-express.progress.v1']).toBe('{"v":1}');
  });
  it('onChange fires on earn and reset, and can unsubscribe; a throwing listener does not break earn', () => {
    const s = createCardStore({ storage: mem() });
    const seen: unknown[] = [];
    const off = s.onChange((r) => seen.push(r));
    s.onChange(() => { throw new Error('bad listener'); });
    s.earn('goat');
    expect(seen).toHaveLength(1);
    expect((seen[0] as any).id).toBe('goat');
    s.reset();
    expect(seen[1]).toBeNull();
    expect(s.owned()).toEqual([]);
    off(); s.earn('goat');
    expect(seen).toHaveLength(2);
  });
  it('blocked storage: works in memory, never throws', () => {
    const s = createCardStore({ storage: brokenStorage() });
    expect(s.owned()).toEqual([]);
    s.earn('dog'); s.earn('dog');
    expect(s.levelOf('dog')).toBe(2);
    s.reset();
    expect(s.owned()).toEqual([]);
    expect(() => createCardStore({ storage: null }).earn('hen')).not.toThrow();
  });
  it('parsing is migration-safe: junk, wrong shapes, unknown ids, bad levels', () => {
    const v = ANIMAL_IDS;
    expect(parseCards(null, v).levels).toEqual({});
    expect(parseCards('not json', v).levels).toEqual({});
    expect(parseCards('[]', v).levels).toEqual({});
    expect(parseCards('{"v":1}', v).levels).toEqual({});
    expect(parseCards('{"v":0,"cards":{"lion":1}}', v).levels).toEqual({});
    expect(parseCards('{"v":1,"cards":[1,2]}', v).levels).toEqual({});
    const p = parseCards(JSON.stringify({ v: 1, cards: { lion: 2.7, tiger: 99, cow: -1, dog: 'x', cat: null, rabbit: 1, dragon: 3 } }), v);
    expect(p.levels).toEqual({ lion: 2, tiger: MAX_LEVEL, rabbit: 1 });
    expect(p.foreign).toBe(false);
  });
  it('data from a newer version is kept, not overwritten', () => {
    const future = JSON.stringify({ v: 2, cards: { lion: { stars: 3 } } });
    const st = mem({ [STORE_KEY]: future });
    const s = createCardStore({ storage: st });
    expect(s.owned()).toEqual([]);
    s.earn('lion');
    expect(s.levelOf('lion')).toBe(1); // works in memory for this visit
    expect(st.data[STORE_KEY]).toBe(future); // but the unreadable newer data is untouched
  });
  it('unlockAll (debug) owns everything and writes nothing', () => {
    const st = mem();
    const s = createCardStore({ storage: st, unlockAll: true });
    expect(s.owned()).toEqual([...ANIMAL_IDS]);
    expect(s.levelOf('cow')).toBe(1);
    s.earn('cow');
    expect(st.data[STORE_KEY]).toBeUndefined();
  });
});

describe('card data', () => {
  it('has the 14 animals, each with name/type/shelf/food/home/stats/action', () => {
    expect(CARDS).toHaveLength(14);
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(14);
    for (const c of CARDS) {
      for (const f of ['name', 'type', 'shelf', 'food', 'home', 'action'] as const) expect(c[f], `${c.id}.${f}`).toBeTruthy();
      expect(Object.keys(c.stats), c.id).toHaveLength(2);
      for (const v of Object.values(c.stats)) expect(Number.isInteger(v) && v! >= 1 && v! <= 10).toBe(true);
    }
  });
  it('every card is an entity (sprite, sound, caption) and its action is a real reaction', () => {
    const ent = new Set((entities as any[]).map((e) => e.id));
    for (const c of CARDS) { expect(ent.has(c.id), c.id).toBe(true); expect(REACTIONS[c.action], `${c.id} action ${c.action}`).toBeTruthy(); }
  });
  it('every referenced icon exists, is drawn or baked, and every locale key exists', () => {
    const icons = new Map((iconsJson as any[]).map((i) => [i.id, i] as const));
    const atlasIds = Object.keys(atlas.sprites);
    for (const i of icons.values()) expect(i.draw ? DRAWN_IDS.includes(i.id) : atlasIds.includes(i.id), i.id).toBe(true);
    for (const c of CARDS) {
      for (const id of [`food.${c.food}`, `home.${c.home}`, `type.${c.type}`]) expect(icons.has(id), `${c.id}: ${id}`).toBe(true);
      for (const k of [`card.name.${c.id}`, `card.say.${c.id}`, `card.food.${c.id}`, `card.home.${c.id}`, `food.${c.food}`, `home.${c.home}`, `type.${c.type}`]) expect(E[k], k).toBeTruthy();
      for (const s of Object.keys(c.stats)) expect(E['stat.' + s], s).toBeTruthy();
    }
    for (const s of SHELVES) for (const k of [`home.${s}`, `ui.shelf.${s}`, `card.went.${s}`]) expect(E[k], k).toBeTruthy();
  });
  it('icons differ in shape AND colour within their group (colour-blind safety)', () => {
    const by: Record<string, { shape: Set<string>; colour: Set<string> }> = {};
    for (const i of iconsJson as any[]) {
      const g = (by[i.group] ??= { shape: new Set(), colour: new Set() });
      expect(g.shape.has(i.shape), `${i.id} shape ${i.shape}`).toBe(false);
      expect(g.colour.has(i.colour), `${i.id} colour ${i.colour}`).toBe(false);
      g.shape.add(i.shape); g.colour.add(i.colour);
    }
  });
  it('carnivores show a plain drawn meal bowl and are flagged for review', () => {
    for (const id of ['lion', 'tiger']) {
      const c = cardOf(id);
      expect(c.food).toBe('meal'); expect(c.review).toBe(true); expect(c.reviewNote).toMatch(/drumstick|prey/i);
    }
    const meal = (iconsJson as any[]).find((i) => i.id === 'food.meal');
    expect(meal.draw).toBe(true); expect(meal.emoji).toBeUndefined();
  });
  it('spoken lines are short (2 to 6 words) and hi never invents keys', () => {
    const words = (k: string) => E[k].trim().split(/\s+/).length;
    for (const c of CARDS) for (const p of ['card.say.', 'card.food.', 'card.home.']) expect(words(p + c.id), p + c.id).toBeGreaterThanOrEqual(2), expect(words(p + c.id)).toBeLessThanOrEqual(6);
    for (const s of SHELVES) expect(words('card.went.' + s)).toBeLessThanOrEqual(4);
    for (const k of Object.keys(hi)) expect(k in en, k).toBe(true);
  });
  it('the validator passes on the shipped data and catches problems', () => {
    const ok = (cards: any, icons: any = iconsJson, loc: any = { en }) =>
      validateCards(cards, icons, entities, loc, { actions: Object.keys(REACTIONS), drawn: DRAWN_IDS, atlas: Object.keys(atlas.sprites) }).errors as string[];
    expect(ok(cardsJson)).toEqual([]);
    const clone = () => JSON.parse(JSON.stringify(cardsJson));
    let c = clone(); c.animals[0].food = 'gold'; expect(ok(c).join('\n')).toMatch(/food.gold/);
    c = clone(); c.animals[1].shelf = 'farm'; expect(ok(c).join('\n')).toMatch(/belongs on shelf/);
    c = clone(); c.animals[2].stats = { size: 5 }; expect(ok(c).join('\n')).toMatch(/exactly 2 stats/);
    c = clone(); c.animals[3].action = 'moonwalk'; expect(ok(c).join('\n')).toMatch(/moonwalk/);
    const noName = { ...en } as any; delete noName['card.name.cow'];
    expect(ok(cardsJson, iconsJson, { en: noName }).join('\n')).toMatch(/card.name.cow/);
    const noHome = { ...en } as any; delete noHome['card.home.dog'];
    expect(ok(cardsJson, iconsJson, { en: noHome }).join('\n')).toMatch(/card.home.dog/);
    const dup = (iconsJson as any[]).map((i) => (i.id === 'food.bone' ? { ...i, colour: 'orange' } : i));
    expect(ok(cardsJson, dup).join('\n')).toMatch(/share the colour/);
    const emojiMeal = (iconsJson as any[]).map((i) => (i.id === 'food.meal' ? { id: i.id, group: 'food', emoji: '1f357', shape: 'dome', colour: 'red' } : i));
    expect(ok(cardsJson, emojiMeal).join('\n')).toMatch(/plain canvas-drawn/);
  });
});

describe('shelf placement rules', () => {
  it('three shelves; every animal is on exactly one; type decides the shelf', () => {
    expect(SHELVES).toEqual(['jungle', 'farm', 'house']);
    const all = SHELVES.flatMap((s) => shelfCards(s).map((c) => c.id));
    expect(all.sort()).toEqual([...ANIMAL_IDS].sort());
    const map = (cardsJson as any).typeShelf as Record<string, string>;
    for (const c of CARDS) expect(c.shelf, c.id).toBe(map[c.type]);
    expect(shelfCards('jungle').map((c) => c.id)).toEqual(['lion', 'tiger', 'elephant', 'monkey', 'bear', 'peacock']);
    expect(shelfCards('farm').map((c) => c.id)).toEqual(['cow', 'buffalo', 'goat', 'hen', 'horse']);
    expect(shelfCards('house').map((c) => c.id)).toEqual(['dog', 'cat', 'rabbit']);
  });
  it('the cow is on the Farm shelf only (and farm type, farm home)', () => {
    const cow = cardOf('cow');
    expect(cow.shelf).toBe('farm'); expect(cow.type).toBe('farm'); expect(cow.home).toBe('farm');
    for (const s of SHELVES.filter((x) => x !== 'farm')) expect(shelfCards(s).some((c) => c.id === 'cow')).toBe(false);
    expect(CARDS.filter((c) => c.id === 'cow')).toHaveLength(1);
  });
  it('every shelf fits its slot row (6 slots max)', () => {
    for (const s of SHELVES) expect(shelfCards(s).length).toBeLessThanOrEqual(6);
  });
});

import { _clearGames, gameForShelf, listGames, registerGame } from '../src/app/registry';
describe('game registry', () => {
  it('registers by id and finds the game for a shelf', () => {
    _clearGames();
    expect(gameForShelf('jungle')).toBeUndefined();
    registerGame({ id: 'a', shelf: 'jungle', start() {} });
    expect(gameForShelf('jungle')?.id).toBe('a');
    expect(gameForShelf('farm')).toBeUndefined();
    expect(() => registerGame({ id: 'a', shelf: 'farm', start() {} })).toThrow(/duplicate/);
    expect(listGames()).toHaveLength(1);
    _clearGames();
  });
});
