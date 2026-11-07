// Game plug-in interface. A Stage 2 game is one file that calls registerGame() and is imported by src/main.ts.
//
//   registerGame({
//     id: 'forage',            // unique
//     shelf: 'jungle',         // which home-screen door opens it (jungle | farm | house)
//     start(container, api) {  // build DOM into `container`, draw with api.stage, finish with api.reveal(animalId)
//       api.exitButton();      // standard 56 px back button (top-left) that calls api.exit()
//       ...
//       return () => { /* optional cleanup, also called by api.exit() */ };
//     },
//   });
//
// Rules for a game: the animal that is earned is decided by the game (never random);
// call `await api.reveal(id)` (it earns the card itself, plays the reveal, files it on its shelf);
// do not also call api.earn(id) for the same win (that would add a second star).
import type { Audio } from './types';
import type { Kit } from '../cards/kit';
import type { ShelfId } from '../cards/data';
import type { EarnResult } from '../cards/progress';
import type { Stage } from '../engine';

export interface GameApi {
  stage: Stage; // shared canvas. Set stage.draw / onDown / onMove / onUp / onKey; the shell resets them on exit
  kit: Kit; // pre-rendered art: animals, icons, scenes, card thumbs
  audio: Audio; // the audio facade (say / sfx / animal / vibrate)
  container: HTMLElement; // same element as start()'s first argument
  /** Show a caption/subtitle for a locale key (text is looked up in src/locales). */
  caption(key: string, ms?: number): void;
  t(key: string): string;
  /** Record an animal as earned with no reveal (debug, silent grants). Returns the new level. */
  earn(animalId: string): EarnResult;
  /** Earn the card AND play the reveal. Resolves when the child has seen it (or long-pressed to skip). */
  reveal(animalId: string): Promise<EarnResult>;
  owned(): string[];
  levelOf(animalId: string): number;
  /** true while the reveal covers the screen: ignore input in your own window listeners meanwhile */
  isRevealing(): boolean;
  /** Add the standard back button to `container`. */
  exitButton(): HTMLButtonElement;
  /** Leave the game and return to the home screen. Safe to call twice. */
  exit(): void;
  /** Register a cleanup function (timers, window listeners). Runs once on exit. */
  onExit(fn: () => void): void;
  reducedMotion(): boolean;
}

export interface GameDef {
  id: string;
  /** Which home-screen door opens it. Leave out for a game that has its own button instead (Card clash). */
  shelf?: ShelfId;
  start(container: HTMLElement, api: GameApi): void | (() => void) | Promise<void | (() => void)>;
}

const games: GameDef[] = [];
export function registerGame(def: GameDef): void {
  if (games.some((g) => g.id === def.id)) throw new Error('duplicate game id: ' + def.id);
  games.push(def);
}
export const listGames = (): readonly GameDef[] => games;
/** The game behind a home-screen door, or undefined while "coming soon". */
export const gameForShelf = (shelf: ShelfId): GameDef | undefined => games.find((g) => g.shelf === shelf);
/** A registered game by id (home-screen picture buttons that are not doors). */
export const gameById = (id: string): GameDef | undefined => games.find((g) => g.id === id);
/** For tests */
export function _clearGames(): void { games.length = 0; }
