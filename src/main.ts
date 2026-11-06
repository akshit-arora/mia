import { audio } from './audio';
import { Stage, loadAtlas, type AtlasJson } from './engine';
import { Game } from './game/game';
import { World } from './game/world';
import { LOCALES, setLocale, t } from './i18n';
import { defaultProgress, loadProgress, saveProgress } from './storage';
import type { CaptionMode, Entity, Pack, Progress, Zone } from './types';
import { initCaptions, refresh as refreshCaptions, setCaptionMode, setCaptionSize, showText } from './ui/captions';
import { closeParent, openParent } from './ui/parent';
import atlasJson from './gen/atlas.json';
import atlasUrl from './gen/atlas.png';
import entities from './data/entities.json';
import levels from './data/levels.json';
import zones from './data/zones.json';
import './style.css';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

async function boot() {
  const pack = { entities, zones, levels } as unknown as Pack;
  let progress: Progress = loadProgress();
  const save = () => saveProgress(progress);

  const canvas = $<HTMLCanvasElement>('c');
  const stage = new Stage(canvas);
  const atlas = await loadAtlas(atlasUrl, atlasJson as AtlasJson);
  const world = new World(new Map(pack.entities.map((e: Entity) => [e.id, e] as const)), atlas, stage.W, stage.H);
  world.zones = pack.zones as Zone[];
  world.rebuild(progress.park);
  for (const id of progress.park) { const e = world.entities.get(id); if (e) world.visible.add(e.accepts[0]); }
  stage.onResize = () => { world.W = stage.W; world.H = stage.H; };
  stage.draw = (g, now) => world.render(g, now);

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
    const reduced = s.reducedMotion === 'on' || (s.reducedMotion === 'auto' && !!reducedQuery?.matches);
    stage.reduced = world.reduced = reduced;
    document.body.classList.toggle('reduced', reduced);
    document.body.classList.toggle('hc', s.highContrast);
    const hc = s.highContrast || !!window.matchMedia?.('(prefers-contrast: more)').matches;
    document.body.classList.toggle('hc', hc);
    world.highContrast = hc;
    const snd = $('b-snd');
    snd.setAttribute('aria-pressed', String(!s.muted));
    snd.setAttribute('aria-label', s.muted ? t('ui.sound.off') : t('ui.sound.on'));
    $('b-cc').setAttribute('aria-label', `${t('ui.cc')}: ${t('parent.captions.' + s.captions)}`);
    $('b-par').setAttribute('aria-label', t('ui.parent'));
    const goKey = world.night > 0 ? 'ui.tomorrow' : 'ui.go';
    $('go').setAttribute('aria-label', t(goKey));
    $('go-label').textContent = t(goKey);
    $('turn').querySelector('svg')!.setAttribute('aria-label', t('ui.turn'));
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
      if (!p) progress.settings = keep;
      game.progress = progress; world.rebuild(progress.park); applySettings();
      for (const id of progress.park) { const e = world.entities.get(id); if (e) world.visible.add(e.accepts[0]); }
    },
  };
  // Grown-ups button: press and hold for 1 second; keyboard / assistive "click" opens at once.
  const par = $('b-par');
  let holdTimer = 0, holdStart = 0, raf = 0;
  const ring = par.querySelector<HTMLElement>('.ring')!;
  const stopHold = () => { clearTimeout(holdTimer); cancelAnimationFrame(raf); ring.style.setProperty('--p', '0%'); };
  par.addEventListener('pointerdown', () => {
    holdStart = performance.now();
    const tick = () => { ring.style.setProperty('--p', Math.min(100, (performance.now() - holdStart) / 10) + '%'); raf = requestAnimationFrame(tick); };
    tick();
    holdTimer = window.setTimeout(() => { stopHold(); openParent(hooks, par); }, 1000);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => par.addEventListener(ev, stopHold));
  // plain alternatives to the hold: keyboard/assistive click, or three quick taps
  let taps: number[] = [];
  par.addEventListener('click', (e) => {
    if ((e as MouseEvent).detail === 0) { openParent(hooks, par); return; }
    const n = performance.now(); taps = taps.filter((x) => n - x < 1500).concat(n);
    if (taps.length >= 3) { taps = []; openParent(hooks, par); }
  });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeParent(); });

  // Rotate hint: landscape-first; a browser tab held upright gets an icon-only hint.
  const turn = $('turn');
  const checkTurn = () => { turn.hidden = window.innerHeight <= window.innerWidth; };
  window.addEventListener('resize', checkTurn); checkTurn();

  // Game
  let game: Game;
  const go = $('go');
  const waitForGo = (): Promise<void> => new Promise((res) => {
    go.hidden = false;
    // after the evening the button says "Tomorrow", so it is clear the day is finished
    const goKey = world.night > 0 ? 'ui.tomorrow' : 'ui.go';
    $('go-label').textContent = t(goKey);
    go.setAttribute('aria-label', t(goKey));
    go.focus({ preventScroll: true });
    world.truck.show = true;
    let alive = world.night === 0;
    if (alive) world.truck.x = -80;
    const drive = async () => {
      while (alive) {
        await stage.tween(5000, (k) => { if (alive) world.truck.x = -70 + (stage.W + 100) * k; }, (k) => k);
      }
    };
    if (alive) void drive();
    if (alive) showText('app.tap_truck', 'bholu', 4000);
    const again = window.setInterval(() => { if (alive) showText('app.tap_truck', 'bholu', 4000); }, 7000);
    go.onclick = () => { alive = false; clearInterval(again); go.hidden = true; void audio.unlock().then(() => { world.truck.x = -80; res(); }); };
  });
  const loop = async () => {
    for (;;) {
      await waitForGo();
      game.resetWorldForNewSession();
      canvas.focus({ preventScroll: true });
      try { await game.runSession(); } catch (err) { console.error(err); await stage.sleep(500); } // never leave the child on a dead screen
    }
  };
  game = new Game(stage, world, pack, progress, save, async () => { /* loop continues */ });
  stage.start();
  (window as any).__ae = location.search.includes('debug') ? { game, world, stage, get progress() { return progress; } } : undefined;
  void loop();

  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    const { registerSW } = await import('virtual:pwa-register');
    registerSW({ immediate: true });
  }
  void LOCALES;
}
void boot();
