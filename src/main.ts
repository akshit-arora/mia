// MIA: the card game shell. Home (three doors), shelves, card view, the shared reveal, and the game plug-in registry.
// The old sorting game lives on in sort.html / src/sort-main.ts (reachable from the Grown-ups corner).
import { audio } from './audio';
import { Stage, loadAtlas, type AtlasJson } from './engine';
import { LOCALES, setLocale, t } from './i18n';
import { defaultProgress, loadProgress, saveProgress } from './storage';
import type { CaptionMode, Progress } from './types';
import { initFps } from './ui/fps';
import { initCaptions, refresh as refreshCaptions, setCaptionMode, setCaptionSize, showText } from './ui/captions';
import { closeParent, openParent } from './ui/parent';
import { createApp } from './app/shell';
import { homeScreen } from './app/home';
import { cardScreen, shelvesScreen } from './app/shelves';
import { installReveal } from './cards/reveal';
import { createKit } from './cards/kit';
import { getStore } from './cards/progress';
import { isCard } from './cards/data';
import './games/forage'; // Jungle door: Forage Trail (registers itself)
import './games/dash'; // Farm door: Farm Dash (registers itself)
// The House door is "coming soon" (docs/design/V1_BRIEF.md): its game is not imported, so gameForShelf('house') is undefined and the home
// screen shows the closed door. The old Farm tap game (src/games/farm) and House game stay in the tree, unimported, for later.
// Card clash (src/games/trump) is out of v1 scope: files kept, not imported, so no registry entry and no home button
import atlasJson from './gen/atlas.json';
import atlasUrl from './gen/atlas.png';
import cardAtlasJson from './gen/card-atlas.json';
import cardAtlasUrl from './gen/card-atlas.png';
import './style.css';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

async function boot() {
  let progress: Progress = loadProgress(); // settings only: sound, captions, vibration, locale, motion, contrast
  const save = () => saveProgress(progress);
  const q = new URLSearchParams(location.search);
  // debug: ?timerraf drives the frame loop with timers (a hidden browser pane pauses requestAnimationFrame)
  if (q.has('timerraf')) window.requestAnimationFrame = (cb) => window.setTimeout(() => cb(performance.now()), 16);

  const canvas = $<HTMLCanvasElement>('c');
  const stage = new Stage(canvas);
  initFps(stage); // ?fps overlay (nothing happens without it)
  const [atlas, cardAtlas] = await Promise.all([
    loadAtlas(atlasUrl, atlasJson as AtlasJson),
    loadAtlas(cardAtlasUrl, cardAtlasJson as AtlasJson),
  ]);
  const kit = createKit(stage, atlas, cardAtlas);
  const app = createApp(stage, kit, $('ui'));
  app.register('home', homeScreen(app));
  app.register('shelves', shelvesScreen(app));
  app.register('card', cardScreen(app));
  installReveal(app);
  if (import.meta.env.DEV && q.has('demo')) await import('./games/demo'); // dev only: stand-in games for the plug-in interface (not in the production bundle)

  initCaptions($('cc'), $('live'));

  const reducedQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const applySettings = () => {
    const s = progress.settings;
    setLocale(s.locale);
    void audio.load(s.locale);
    audio.setMuted(s.muted);
    audio.setVibration(s.vibration);
    setCaptionMode(s.captions);
    setCaptionSize(s.captionSize);
    stage.reduced = s.reducedMotion === 'on' || (s.reducedMotion === 'auto' && !!reducedQuery?.matches);
    document.body.classList.toggle('reduced', stage.reduced);
    document.body.classList.toggle('hc', s.highContrast || !!window.matchMedia?.('(prefers-contrast: more)').matches);
    const snd = $('b-snd');
    snd.setAttribute('aria-pressed', String(!s.muted));
    snd.setAttribute('aria-label', s.muted ? t('ui.sound.off') : t('ui.sound.on'));
    $('b-cc').setAttribute('aria-label', `${t('ui.cc')}: ${t('parent.captions.' + s.captions)}`);
    $('b-par').setAttribute('aria-label', t('ui.parent'));
    $('turn').querySelector('svg')!.setAttribute('aria-label', t('ui.turn'));
    canvas.setAttribute('aria-label', t('ui.mia'));
    refreshCaptions();
    stage.invalidate();
    save();
  };
  setLocale(progress.settings.locale);
  applySettings();
  reducedQuery?.addEventListener?.('change', applySettings);

  // HUD
  $('b-snd').addEventListener('click', () => { progress.settings.muted = !progress.settings.muted; void audio.unlock(); applySettings(); });
  $('b-cc').addEventListener('click', () => {
    const order: CaptionMode[] = ['auto', 'on', 'off'];
    const s = progress.settings; s.captions = order[(order.indexOf(s.captions) + 1) % 3]; applySettings();
    showText('ui.cc', 'bholu', 1200);
  });
  const hooks = {
    progress: () => progress,
    apply: applySettings,
    replace: (p: Progress | null) => {
      const keep = progress.settings;
      progress = p ?? defaultProgress();
      if (!p) { progress.settings = keep; getStore().reset(); app.exitGame(); app.go('home'); } // "start again" also empties the shelves
      applySettings();
    },
  };
  const parentLinks = [{ href: './sort.html', labelKey: 'parent.classic' }];
  // Grown-ups button: press and hold for 1 second; keyboard / assistive "click" opens at once.
  const par = $('b-par');
  let holdTimer = 0, holdStart = 0, raf = 0;
  const ring = par.querySelector<HTMLElement>('.ring')!;
  const stopHold = () => { clearTimeout(holdTimer); cancelAnimationFrame(raf); ring.style.setProperty('--p', '0%'); };
  par.addEventListener('pointerdown', () => {
    holdStart = performance.now();
    const tick = () => { ring.style.setProperty('--p', Math.min(100, (performance.now() - holdStart) / 10) + '%'); raf = requestAnimationFrame(tick); };
    tick();
    holdTimer = window.setTimeout(() => { stopHold(); openParent(hooks, par, parentLinks); }, 1000);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => par.addEventListener(ev, stopHold));
  let taps: number[] = [];
  par.addEventListener('click', (e) => {
    if ((e as MouseEvent).detail === 0) { openParent(hooks, par, parentLinks); return; }
    const n = performance.now(); taps = taps.filter((x) => n - x < 1500).concat(n);
    if (taps.length >= 3) { taps = []; openParent(hooks, par, parentLinks); }
  });
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || document.querySelector('.parent')) return; // the Grown-ups dialog handles its own Escape
    app.back();
  }, true);
  void closeParent;

  // Rotate hint: landscape-first; a browser tab held upright gets an icon-only hint.
  const turn = $('turn');
  const checkTurn = () => { turn.hidden = window.innerHeight <= window.innerWidth; };
  window.addEventListener('resize', checkTurn); checkTurn();

  // first gesture anywhere unlocks audio
  window.addEventListener('pointerdown', () => { void audio.unlock(); }, { once: true, passive: true });

  stage.start();
  app.go('home');
  const wantCard = q.get('card');
  if (wantCard && isCard(wantCard)) app.go('card', wantCard);
  else if (q.get('screen') === 'shelves') app.go('shelves');
  const wantReveal = q.get('reveal');
  if (wantReveal && isCard(wantReveal)) void app.reveal(wantReveal);
  (window as any).__mia = q.has('debug') ? { app, kit, stage, store: getStore(), stats: app.stats } : undefined;

  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    const { registerSW } = await import('virtual:pwa-register');
    registerSW({ immediate: true });
  }
  void LOCALES;
}
void boot();
