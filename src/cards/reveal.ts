// THE REVEAL. Any game calls `await api.reveal(animalId)` (or `reveal(app, id)`); the animal is decided by the game, nothing is random.
//
// First time (about 7 to 7.7 s): the animal walks out of the trees to the centre -> its name (plate, caption, voice) -> its sound
//   -> a short funny action -> the "because" beat (2 s): FOOD icon, animal eats it, then the HOME icon pops up behind it
//   -> the card flips open and flies to its shelf door: "Off to the Jungle!" (voice + caption + banner).
// Repeat earn (about 2.5 s): the animal pops in, name + sound, the card gets a level-up star.
// Reduced motion: no walking, flipping or particles; the same beats as still pictures (about 5 s).
// Skip: only by a deliberate 1 second press-and-hold on the skip button (a ring fills). An accidental tap does nothing.
// Draw budget: <= 25 canvas calls per frame (typical 4 to 8, 17 at the peak of the peacock's tail fan). No allocation in the frame loop.
import { audio } from '../audio';
import { t } from '../i18n';
import { reaction, type Reaction } from '../game/reactions';
import type { App } from '../app/shell';
import { cardOf, foodIcon, homeIcon, type Card } from './data';
import { getStore, type EarnResult } from './progress';
import { SHELF_COL, disc, mk, type Cv } from './scenes';

interface Ev { t: number; fn: () => void }
interface Part { x: number; y: number; vx: number; vy: number; life: number; c: number }
const PCOL = ['#ffd93d', '#ff7aa8', '#7fe0ff', '#9be564', '#ffffff'];
const HOLD_MS = 1000;
const ease = (k: number): number => (k <= 0 ? 0 : k >= 1 ? 1 : 1 - (1 - k) * (1 - k));
const clamp01 = (k: number): number => (k < 0 ? 0 : k > 1 ? 1 : k);

export function installReveal(app: App): void {
  const { stage, kit, ui } = app;
  const stageEl = document.getElementById('stage')!;
  const bubbles = new Map<string, Cv>();
  const parts: Part[] = [];
  for (let i = 0; i < 10; i++) parts.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, c: 0 });
  let chain: Promise<unknown> = Promise.resolve();

  const bubble = (homeId: string): Cv => {
    let b = bubbles.get(homeId);
    if (!b) {
      const [c, g] = mk(44, 44);
      disc(g, 22, 22, 21.5, '#181020'); disc(g, 22, 22, 20, '#ffffff');
      g.imageSmoothingEnabled = true; g.drawImage(kit.icon(homeId, 32), 6, 6, 32, 32);
      bubbles.set(homeId, c); b = c;
    }
    return b;
  };

  const run = (id: string, quick = false): Promise<EarnResult> => new Promise<EarnResult>((resolve) => {
    const card: Card = cardOf(id);
    const res = getStore().earn(id);
    const first = res.first;
    const reduced = stage.reduced;
    const react: Reaction = reaction(card.action);

    // ---- pre-render everything this reveal draws, so no frame has to build art (cache misses are the only expensive thing)
    kit.scene(card.shelf); kit.animal(id, 64); kit.icon(foodIcon(card), 32); kit.icon('ui.star', 32);
    bubble(homeIcon(card)); kit.cardThumb(id, res.level, 40); kit.door(card.shelf, true);

    // ---- take over the screen
    app.revealing = true;
    const prevDraw = stage.draw;
    const saved = { d: stage.onDown, m: stage.onMove, u: stage.onUp, c: stage.onCancel, k: stage.onKey };
    stage.onDown = stage.onMove = stage.onUp = stage.onCancel = stage.onKey = () => {};
    const focused = document.activeElement as HTMLElement | null;
    ui.style.visibility = 'hidden';
    audio.flush();

    // ---- DOM pieces
    const root = document.createElement('div'); root.className = 'rv';
    const plate = document.createElement('div'); plate.className = 'rv-name'; plate.textContent = t('card.name.' + id); plate.hidden = true;
    const banner = document.createElement('div'); banner.className = 'rv-banner'; banner.textContent = t('home.' + card.shelf); banner.hidden = true;
    banner.style.setProperty('--c', SHELF_COL[card.shelf]);
    const skip = document.createElement('button'); skip.type = 'button'; skip.className = 'rv-skip hud-btn';
    skip.setAttribute('aria-label', t('ui.skip'));
    skip.innerHTML = '<span class="ring" aria-hidden="true"></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5l9 7-9 7zM12 5l9 7-9 7z" fill="#181020"/></svg>';
    root.append(plate, banner, skip);
    stageEl.appendChild(root);
    const ring = skip.querySelector<HTMLElement>('.ring')!;
    app.place(skip, 18, 18, 28, 28);
    app.place(plate, stage.W / 2, 23, stage.W * 0.5, 22);
    app.place(banner, stage.W / 2, stage.H - 16, 90, 20);

    // ---- plan (ms from first frame)
    const T = { name: 0, sound: 0, act: 0, food: 0, home: 0, shelf: 0, end: 0 };
    const walk = reduced ? 0 : first ? (quick ? 350 : 1000) : 300;
    if (first && quick) {
      // The 3-second reveal used by the Jungle loop: name, sound, a bite, the card. No action prop.
      T.name = walk; T.sound = walk + 550;
      T.act = T.sound; T.food = T.sound + 500;
      T.home = T.food + (reduced ? 400 : 650);
      T.shelf = T.home + 250;
      T.end = T.shelf + (reduced ? 700 : 850);
    } else if (first) {
      T.name = walk; T.sound = walk + 1000; // the name line is spoken first, then the animal's own sound
      T.act = reduced ? T.sound + 900 : walk + 1300;
      const actDur = reduced ? 0 : react.dur;
      T.food = T.act + actDur + (reduced ? 0 : 100);
      T.home = T.food + (reduced ? 1000 : 1300);
      T.shelf = T.food + (reduced ? 1700 : 1900);
      T.end = T.shelf + (reduced ? 1500 : 1600);
    } else {
      T.name = walk; T.sound = walk + 500;
      T.shelf = walk + 1000; // the star moment
      T.end = reduced ? T.shelf + 1200 : T.shelf + 1300;
    }
    const events: Ev[] = [];
    const at = (tm: number, fn: () => void) => events.push({ t: tm, fn });
    at(T.name, () => { plate.hidden = false; void audio.say('card.say.' + id, 'bholu'); });
    at(T.sound, () => { audio.animal(id); audio.vibrate(15); });
    if (first) {
      if (!quick && !reduced && react.sfx) at(T.act, () => audio.sfx(react.sfx!));
      at(T.food, () => { void audio.say('card.food.' + id, 'bholu'); });
      at(T.home, () => { audio.sfx('pop'); burst(stage.W * 0.45 + 34, stage.H * 0.72 - 44, 5); });
      at(T.shelf + 650, () => { void audio.say('card.went.' + card.shelf, 'bholu'); });
      at(T.shelf + (reduced ? 200 : 1250), () => { banner.hidden = false; audio.sfx('chime'); burst(40, stage.H - 34, 8); });
    } else {
      at(T.shelf, () => { audio.sfx('tick'); burst(stage.W * 0.45 + 66, stage.H * 0.72 - 50, 8); });
    }
    let ei = 0;

    // ---- particles (preallocated)
    function burst(x: number, y: number, n: number): void {
      if (stage.reduced) return;
      for (let i = 0, k = 0; i < parts.length && k < n; i++) {
        const p = parts[i]; if (p.life > 0) continue;
        p.x = x; p.y = y; p.vx = (Math.random() - 0.5) * 90; p.vy = -20 - Math.random() * 60; p.life = 500 + Math.random() * 300; p.c = (Math.random() * 5) | 0; k++;
      }
    }

    // ---- finish
    let done = false, t0 = 0, last = 0;
    const finish = (): void => {
      if (done) return;
      done = true;
      clearTimeout(guard);
      audio.flush();
      root.remove();
      ui.style.visibility = '';
      stage.draw = prevDraw;
      stage.onDown = saved.d; stage.onMove = saved.m; stage.onUp = saved.u; stage.onCancel = saved.c; stage.onKey = saved.k;
      for (const p of parts) p.life = 0;
      app.revealing = false;
      try { if (focused && document.contains(focused)) focused.focus({ preventScroll: true }); } catch { /* ignore */ }
      stage.invalidate();
      resolve(res);
    };
    const guard = window.setTimeout(finish, T.end + 6000); // never leave the child on a dead screen

    // ---- skip: deliberate long press only
    let holdStart = 0, holdRaf = 0, holdTimer = 0;
    const stopHold = (): void => { clearTimeout(holdTimer); cancelAnimationFrame(holdRaf); holdStart = 0; ring.style.setProperty('--p', '0%'); };
    const startHold = (): void => {
      if (holdStart) return;
      holdStart = performance.now();
      const tick = (): void => { ring.style.setProperty('--p', Math.min(100, ((performance.now() - holdStart) / HOLD_MS) * 100) + '%'); holdRaf = requestAnimationFrame(tick); };
      tick();
      holdTimer = window.setTimeout(() => { stopHold(); finish(); }, HOLD_MS);
    };
    skip.addEventListener('pointerdown', startHold);
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) skip.addEventListener(ev, stopHold);
    skip.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); startHold(); } });
    skip.addEventListener('keyup', stopHold);
    skip.addEventListener('blur', stopHold);
    skip.addEventListener('click', (e) => e.preventDefault()); // a plain tap never skips

    // ---- frame
    const level = res.level;
    stage.draw = (g, now) => {
      if (done) return;
      if (!t0) t0 = now;
      const el = now - t0;
      const dt = last ? Math.min(100, now - last) : 33; last = now;
      while (ei < events.length && events[ei].t <= el) { const ev = events[ei++]; if (el - ev.t < 700) ev.fn(); }
      if (el >= T.end) { finish(); return; }
      const W = stage.W, H = stage.H;
      const ax = Math.round(W * 0.45), feet = Math.round(H * 0.72);
      g.drawImage(kit.scene(card.shelf), 0, 0); // 1 background
      // home bubble behind the animal
      if (first && el >= T.home) {
        const k = reduced ? 1 : ease((el - T.home) / 300), s = Math.round(44 * k);
        if (s > 2) g.drawImage(bubble(homeIcon(card)), Math.round(ax + 34 - s / 2), Math.round(feet - 44 - s / 2), s, s); // 1
      }
      // animal
      let x = ax, bob = 0, sx = 1, sy = 1, dx = 0, dy = 0, rk = 0, acting = false;
      const wk = walk ? clamp01(el / walk) : 1;
      if (wk < 1) { x = Math.round(W - 20 + (ax - (W - 20)) * ease(wk)); bob = Math.round(Math.abs(Math.sin(el / 110)) * 3); }
      let pop = 1;
      if (!first && !reduced) pop = 0.5 + 0.5 * ease(el / 250);
      if (first && !quick && !reduced && el >= T.act && el < T.act + react.dur) { acting = true; rk = (el - T.act) / react.dur; const m = react.motion(rk); dx = m.dx; dy = m.dy; sx = m.sx; sy = m.sy; }
      let eat = 0;
      if (first && el >= T.food && el < T.home + 400) { // munching: squash in time with the bites
        eat = Math.min(4, ((el - T.food) / ((T.home - T.food) / 4)) | 0);
        if (!reduced) { const e = Math.abs(Math.sin((el - T.food) / 95)); sy *= 1 - e * 0.07; dy += e * 2; }
      }
      const sz = Math.round(64 * pop);
      g.fillStyle = 'rgba(24,16,32,.28)'; g.beginPath(); g.ellipse(x + dx, feet + 1, 22 * pop, 4, 0, 0, 6.2832); g.fill(); // 1 shadow
      const w = Math.round(sz * sx), h = Math.round(sz * sy);
      g.drawImage(kit.animal(id, 64), Math.round(x + dx - w / 2), Math.round(feet - h - bob + dy), w, h); // 1 animal
      if (acting && react.prop) react.prop(g, x + dx, feet + dy, rk); // <= 14
      // food
      if (first && el >= T.food && el < T.home + 500) {
        const bites = eat, fs = 32 - bites * 7;
        if (fs > 4) {
          const k = reduced ? 1 : ease((el - T.food) / 250);
          g.drawImage(kit.icon(foodIcon(card), 32), Math.round(ax - 62 + 14 * (bites / 4) - fs / 2), Math.round(feet - 28 - fs / 2 - (1 - k) * 12), fs, fs); // 1
        }
      }
      // the card: flips open, then flies into the shelf door (first) / gets a star (repeat)
      if (el >= T.shelf) {
        const sk = el - T.shelf;
        const cx0 = ax + 66, cy0 = feet - 36;
        if (first) {
          const doorX = 6, doorY = H - 68;
          const dk = reduced ? 1 : ease(sk / 350);
          g.drawImage(kit.door(card.shelf, true), Math.round(-58 + 64 * dk), doorY); // 1 shelf door slides in
          const flip = reduced ? 1 : clamp01(sk / 450);
          const fly = reduced ? 0 : ease((sk - 650) / 600);
          const cw = Math.round(40 * Math.abs(Math.cos((1 - flip) * 1.5708)) * (1 - fly * 0.65));
          const cx = cx0 + (doorX + 28 - cx0) * fly, cy = cy0 + (doorY + 40 - cy0) * fly;
          const ch = Math.round(40 * (1 - fly * 0.65));
          if (cw > 1 && fly < 1) g.drawImage(kit.cardThumb(id, level, 40), Math.round(cx - cw / 2), Math.round(cy - ch / 2), cw, ch); // 1
        } else {
          const cw = Math.round(40 * ease(sk / 250));
          if (cw > 1) g.drawImage(kit.cardThumb(id, level, 40), Math.round(cx0 - cw / 2), Math.round(cy0 - cw / 2), cw, cw); // 1
          // Level-up star pip hidden in v1 per contract
        }
      }
      // particles last, capped so the frame never passes 24 calls
      let n = 6 + (acting && react.prop ? 14 : 0);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i]; if (p.life <= 0) continue;
        p.life -= dt; p.x += (p.vx * dt) / 1000; p.y += (p.vy * dt) / 1000; p.vy += (160 * dt) / 1000;
        if (n < 24) { g.fillStyle = PCOL[p.c]; g.fillRect(Math.round(p.x), Math.round(p.y), 3, 3); n++; }
      }
      stage.invalidate();
    };
    stage.invalidate();
  });

  // queue reveals so two quick calls never overlap
  app.setReveal((id: string, opts?: { quick?: boolean }) => {
    const p = chain.then(() => run(id, !!opts?.quick));
    chain = p.catch(() => undefined);
    return p;
  });
}
