// The app shell: owns the shared stage, switches screens (home, shelves, card view), launches registered games
// and hosts the reveal. One canvas, one overlay (#ui) of real HTML buttons placed over the picture.
import { audio } from '../audio';
import type { Stage } from '../engine';
import { t } from '../i18n';
import { showText } from '../ui/captions';
import { getStore, type EarnResult } from '../cards/progress';
import type { Kit } from '../cards/kit';
import type { GameApi, GameDef } from './registry';

export interface Screen {
  enter(arg?: string): void;
  leave(): void;
  resize(): void;
  draw(g: CanvasRenderingContext2D, now: number): void;
}
export type ScreenName = 'home' | 'shelves' | 'card';

export interface HotOpts { cx: number; cy: number; w: number; h: number; label: string; cls?: string; onClick: () => void }

export interface App {
  stage: Stage;
  kit: Kit;
  ui: HTMLElement;
  go(name: ScreenName, arg?: string): void;
  /** Escape key / back: card -> shelves -> home. Does nothing during a reveal or inside a game (the game has its own back button). */
  back(): void;
  launch(def: GameDef): void;
  exitGame(): void;
  reveal(id: string, opts?: { quick?: boolean }): Promise<EarnResult>;
  setReveal(fn: (id: string, opts?: { quick?: boolean }) => Promise<EarnResult>): void;
  /** Hotspot: a real <button> positioned in logical canvas pixels (centre cx,cy and size w,h). Min 56 CSS px. */
  hot(o: HotOpts): HTMLButtonElement;
  place(el: HTMLElement, cx: number, cy: number, w: number, h: number): void;
  revealing: boolean;
  stats: { frames: number; drawMs: number; drawMax: number };
  currentGame(): string | null;
  register(name: ScreenName, s: Screen): void;
  start(name: ScreenName): void;
}

export function createApp(stage: Stage, kit: Kit, ui: HTMLElement): App {
  const screens = {} as Record<ScreenName, Screen>;
  let cur: Screen | null = null;
  let curName: ScreenName = 'home';
  let game: { def: GameDef; root: HTMLElement; cleanups: Array<() => void>; done: boolean } | null = null;
  let revealFn: (id: string, opts?: { quick?: boolean }) => Promise<EarnResult> = () => Promise.reject(new Error('reveal not ready'));
  const stats = { frames: 0, drawMs: 0, drawMax: 0 };
  const debug = /[?&]debug\b/.test(location.search);

  const resetHandlers = (): void => {
    stage.onDown = () => {}; stage.onMove = () => {}; stage.onUp = () => {}; stage.onCancel = () => {}; stage.onKey = () => {};
  };
  const place = (el: HTMLElement, cx: number, cy: number, w: number, h: number): void => {
    const s = el.style;
    s.left = (cx / stage.W) * 100 + '%'; s.top = (cy / stage.H) * 100 + '%';
    s.width = (w / stage.W) * 100 + '%'; s.height = (h / stage.H) * 100 + '%';
  };
  const app: App = {
    stage, kit, ui, revealing: false, stats,
    register(name, s) { screens[name] = s; },
    go(name, arg) {
      if (cur) cur.leave();
      ui.replaceChildren();
      resetHandlers();
      cur = screens[name]; curName = name;
      stage.draw = (g, now) => {
        if (debug) {
          const t0 = performance.now(); cur!.draw(g, now);
          const d = performance.now() - t0; stats.frames++; stats.drawMs += d; if (d > stats.drawMax) stats.drawMax = d;
        } else cur!.draw(g, now);
      };
      cur.enter(arg);
      stage.invalidate();
    },
    start(name) { app.go(name); },
    back() {
      if (app.revealing || (game && !game.done)) return;
      if (curName === 'card') app.go('shelves'); else if (curName === 'shelves') app.go('home');
    },
    hot(o) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'hot' + (o.cls ? ' ' + o.cls : '');
      b.setAttribute('aria-label', o.label);
      app.place(b, o.cx, o.cy, o.w, o.h);
      b.addEventListener('click', () => { void audio.unlock(); o.onClick(); });
      (game && !game.done ? game.root : ui).appendChild(b);
      return b;
    },
    place,
    setReveal(fn) { revealFn = fn; },
    reveal(id, opts) { return revealFn(id, opts); },
    currentGame: () => (game && !game.done ? game.def.id : null),
    launch(def) {
      if (game && !game.done) return;
      if (cur) cur.leave();
      ui.replaceChildren();
      resetHandlers();
      const root = document.createElement('div');
      root.className = 'game-root'; root.dataset.game = def.id;
      ui.appendChild(root);
      const g = { def, root, cleanups: [] as Array<() => void>, done: false };
      game = g;
      document.body.classList.add('ingame'); // the corner buttons move to the top right and fade while a game is open
      const api: GameApi = {
        stage, kit, audio, container: root, t,
        caption: (key, ms) => showText(key, 'bholu', ms ?? 2600),
        earn: (id) => getStore().earn(id),
        reveal: (id, opts) => revealFn(id, opts),
        owned: () => getStore().owned(),
        levelOf: (id) => getStore().levelOf(id),
        isRevealing: () => app.revealing,
        exitButton() {
          const b = app.hot({ cx: 18, cy: 16, w: 28, h: 28, label: t('ui.back'), cls: 'back', onClick: () => app.exitGame() });
          b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3L2 12h3v9h5v-6h4v6h5v-9h3z" fill="#181020"/></svg>';
          return b;
        },
        exit: () => app.exitGame(),
        onExit: (fn) => { g.cleanups.push(fn); },
        reducedMotion: () => stage.reduced,
      };
      try {
        const r = def.start(root, api);
        if (typeof r === 'function') g.cleanups.push(r);
        else if (r && typeof (r as Promise<unknown>).then === 'function') {
          (r as Promise<void | (() => void)>).then((fn) => { if (typeof fn === 'function') { if (g.done) fn(); else g.cleanups.push(fn); } }, (e) => { console.error(e); app.exitGame(); });
        }
      } catch (e) { console.error(e); app.exitGame(); }
    },
    exitGame() {
      const g = game;
      if (!g || g.done) return;
      g.done = true;
      for (const fn of g.cleanups.splice(0)) { try { fn(); } catch (e) { console.error(e); } }
      g.root.remove();
      game = null;
      document.body.classList.remove('ingame');
      audio.flush();
      app.go('home');
    },
  };
  stage.onResize = () => { kit.invalidate(); document.documentElement.style.setProperty('--u', stage.scale + 'px'); cur?.resize(); };
  document.documentElement.style.setProperty('--u', stage.scale + 'px');
  return app;
}
