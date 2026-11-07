// MORNING ROUND: the Farm door's game. Bholu pulls a little hay cart along the farm lane (landscape, TAP ONLY).
//   warm-up ride (tap the cart to honk) -> FORK: three signposts, each shows a food (grass, leaves, seeds)
//   -> tap one: the cart rolls into that animal's home yard -> four chores (tap the glowing thing: feed, then two helpers, then open the door)
//   -> the animal walks out to the cart -> the shared reveal.
// No timers, lives, scores or fail states: a missed tap only makes the glow pulse. Nothing is random in what you earn.
// Draw budget: <= 25 canvas calls per frame (counted in `render`, and measured in ?debug), no allocation in the frame loop.
import { registerGame, type GameApi } from '../../app/registry';
import { shelfCards } from '../../cards/data';
import { butterflies, foodBadge, shelfStrip, signBoard } from '../forage/art';
import {
  GND_Y, DOOR_H, DOOR_TOP, DOOR_W, arrowDown, cartSprite, doorPanel, farLayer, forkLayer, fxSprites, glowRing, groundLayer, pipFrames, propFrames,
  stationScene, sunSprite,
} from './art';
import {
  CART_X, DEFAULT_ROUND, FOODS, LANE_Y, Ph, Round, YARD_Y, animalFor, doorX, hotX, newForkMemory, pickFork, ANIMALS_OF,
  type ChoreKind, type FoodId,
} from './logic';
import { BUMP, CHORE_DONE, DOOR_OPEN, PARK, SIGNS, STING, TAP, WELCOME } from './sounds';

const SPEED = 48; // px per second
const MAX_CALLS = 25;
const PART_POOL = 14;
const SHELF_X = 36, SHELF_Y = 2;
const SIGN_DX = 112; // sign centre is this far from the right end of the fork picture (the sound / captions / grown-ups buttons sit in the bottom right corner)
const HS_Y = 100; // centre of a chore prop
const PCOL = ['#ffd93d', '#ff7aa8', '#7fe0ff', '#9be564', '#ffffff'];
// fx sprite slots in `fx[]`
const FX_FOOD = 0, FX_DROP = 1, FX_MILK = 2, FX_EGG = 3, FX_MUD = 4, FX_STRAW = 5, FX_DUST = 6, FX_SPARK = 7;

interface Part { x: number; y: number; vx: number; vy: number; g: number; life: number; s: number; c: number }

registerGame({
  id: 'farm',
  shelf: 'farm',
  start(container, api) { return startFarm(container, api); },
});

function startFarm(container: HTMLElement, api: GameApi): () => void {
  const { stage, kit, audio } = api;
  // the sound / captions / grown-ups buttons sit in the top right while a game is open: keep the food badge clear of them
  const hudEl = document.getElementById('hud');
  let hudW = 0;
  const measureHud = (): void => { hudW = hudEl ? Math.ceil(hudEl.offsetWidth / stage.scale) + 3 : 0; };
  measureHud();
  let hudForW = stage.W;
  const q = new URLSearchParams(location.search);
  const debug = q.has('debug');
  let dead = false;

  api.exitButton();
  const canvas = stage.canvas;
  const oldLabel = canvas.getAttribute('aria-label') || '';
  canvas.setAttribute('aria-label', api.t('farm.aria'));
  canvas.setAttribute('tabindex', '0');

  // ------------------------------------------------------------------ art, built once
  const FARM = shelfCards('farm').map((c) => c.id);
  const icons = FOODS.map((f) => kit.icon('food.' + f, 32));
  const icons16 = FOODS.map((f) => kit.icon('food.' + f, 16));
  const signs = icons.map((ic) => signBoard(ic, 1));
  const signsBig = icons.map((ic) => signBoard(ic, 1.1));
  const badges = icons.map((ic) => foodBadge(ic));
  const cart = cartSprite(kit.truck());
  const ring = glowRing(), arrow = arrowDown(), sun = sunSprite();
  const fly = butterflies();
  const fxs = fxSprites();
  const fx = [icons16[0], fxs.drop, fxs.milk, fxs.egg, fxs.mud, fxs.straw, fxs.dust, kit.icon('ui.sparkle', 16)];
  const pips = pipFrames(4);
  let strip = shelfStrip(kit, FARM, api.levelOf);

  let T = 0;
  let far = farLayer(240), gnd = groundLayer(240), fork = forkLayer(240);
  const scenes = new Map<string, HTMLCanvasElement>();
  const buildQueue: string[] = [...FARM];
  const sceneOf = (a: string): HTMLCanvasElement => {
    let s = scenes.get(a);
    if (!s) { s = stationScene(a, stage.W, stage.H); scenes.set(a, s); }
    return s;
  };
  // per-station art, built when the food is chosen
  let props: HTMLCanvasElement[][] = [];
  let panel = doorPanel('hen');
  let walker = kit.animal('hen', 40);

  // ------------------------------------------------------------------ state (preallocated)
  const parts: Part[] = [];
  for (let i = 0; i < PART_POOL; i++) parts.push({ x: 0, y: 0, vx: 0, vy: 0, g: 0, life: 0, s: 0, c: 0 });
  const signFood: FoodId[] = ['grass', 'leaves', 'seeds'];
  const roundOpts = { ...DEFAULT_ROUND };
  const round = new Round(roundOpts);
  const mem = newForkMemory();
  const ownedSet = new Set<string>();
  const firstTimer = !api.owned().some((id) => FARM.includes(id));

  let scrollX = 0, speedK = 1, lastNow = 0, cartY = 85, cartTarget = 85, hop = 0, shelfBounce = 0, honkT = 0;
  let forkOn = false, forkX = 0, forkReady = false, sceneOn = false, sceneX = 0, lane = 1, signPulse = 0;
  let foodIdx = 0, hotOn = false, hotAppear = 0, hotPulse = 0, hotBump = 0, idleT = 0, tapsEver = firstTimer ? 0 : 3, landed = 0, taught = !firstTimer;
  let doorShake = 0, peekT = 0, doorOpenT = 0, walkT = 0, welcomed = false, revealing = false, rounds = 0, kbd = false, blinkT = 0;
  let calls = 0, maxCalls = 0;
  const stats = { frames: 0, drawMs: 0, drawMax: 0, maxCalls: 0, rounds: 0 };
  const owned = (): void => { ownedSet.clear(); for (const id of api.owned()) ownedSet.add(id); };
  owned();

  // debug: count every real canvas call (not only the ones render() counts by hand)
  const ctx = stage.ctx as unknown as Record<string, unknown>;
  const patched: string[] = [];
  let realCalls = 0, realMax = 0;
  if (debug) {
    for (const m of ['drawImage', 'fillRect', 'fill', 'stroke', 'strokeRect', 'fillText', 'clearRect']) {
      const orig = ctx[m] as (...a: unknown[]) => unknown;
      ctx[m] = function (this: unknown, ...a: unknown[]) { realCalls++; return orig.apply(stage.ctx, a); };
      patched.push(m);
    }
  }

  // ------------------------------------------------------------------ hotspots: real buttons placed over the picture
  const place = (el: HTMLElement, cx: number, cy: number, w: number, h: number): void => {
    const s = el.style;
    s.left = (cx / stage.W) * 100 + '%'; s.top = (cy / stage.H) * 100 + '%';
    s.width = (w / stage.W) * 100 + '%'; s.height = (h / stage.H) * 100 + '%';
  };
  const mkHot = (label: string): HTMLButtonElement => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'hot farm-hot'; b.hidden = true; b.setAttribute('aria-label', label);
    container.appendChild(b);
    return b;
  };
  const signBtn = FOODS.map((f, i) => { void i; return mkHot(api.t('food.' + f)); });
  const choreBtn = mkHot(api.t('farm.tap'));
  const layoutButtons = (): void => {
    for (let l = 0; l < 3; l++) place(signBtn[l], stage.W - SIGN_DX, LANE_Y[l], 46, 31);
    const door = round.chore?.kind === 'door';
    if (door) place(choreBtn, doorX(stage.W), DOOR_TOP + DOOR_H / 2, 40, 46);
    else place(choreBtn, hotX(stage.W), HS_Y, 46, 46);
  };
  const focusFirst = (b: HTMLElement): void => { if (kbd) { try { b.focus({ preventScroll: true }); } catch { /* ignore */ } } };
  const showSigns = (on: boolean): void => {
    for (let l = 0; l < 3; l++) {
      signBtn[l].hidden = !on;
      signBtn[l].setAttribute('aria-label', api.t('food.' + signFood[l]));
    }
    if (on) { layoutButtons(); focusFirst(signBtn[1]); }
  };
  const showChore = (on: boolean): void => {
    choreBtn.hidden = !on;
    if (on) { layoutButtons(); focusFirst(choreBtn); }
  };

  // ------------------------------------------------------------------ helpers
  const spawn = (s: number, x: number, y: number, vx: number, vy: number, grav: number, life: number, c = 0): void => {
    if (stage.reduced) return;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]; if (p.life > 0) continue;
      p.s = s; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.g = grav; p.life = life; p.c = c; return;
    }
  };
  const sparkle = (x: number, y: number, n: number): void => {
    if (stage.reduced) return;
    for (let i = 0, k = 0; i < parts.length && k < n; i++) {
      const p = parts[i]; if (p.life > 0) continue;
      p.s = -1; p.x = x; p.y = y; p.vx = (Math.random() - 0.5) * 90; p.vy = -20 - Math.random() * 60; p.g = 160; p.life = 500 + Math.random() * 300; p.c = (Math.random() * 5) | 0; k++;
    }
  };
  const clearParts = (): void => { for (let i = 0; i < parts.length; i++) parts[i].life = 0; };
  const hsPos = (): [number, number] => (round.chore?.kind === 'door' ? [doorX(stage.W), DOOR_TOP + DOOR_H / 2] : [hotX(stage.W), HS_Y]);

  const buildStation = (animal: string): void => {
    const ch = round.chores;
    props = ch.map((c) => (c.kind === 'door' ? [] : propFrames(c.kind, c.need, icons[foodIdx])));
    panel = doorPanel(animal);
    walker = kit.animal(animal, 40);
    sceneOf(animal);
  };

  const startRound = (): void => {
    round.next(); clearParts(); forkOn = false; forkReady = false; sceneOn = false; sceneX = 0; speedK = 1; lane = 1; hotOn = false; landed = 0;
    doorOpenT = 0; walkT = 0; welcomed = false; cartY = cartTarget = 85; honkT = 0;
    owned(); strip = shelfStrip(kit, FARM, api.levelOf);
    showSigns(false); showChore(false);
    rounds++; stats.rounds = rounds;
  };

  const choose = (l: number, forced?: string): void => {
    if (round.phase !== Ph.Fork || !forkReady) return;
    const f = signFood[l];
    foodIdx = FOODS.indexOf(f);
    owned();
    const animal = forced ?? animalFor(f, ownedSet, mem);
    round.choose(f, animal);
    lane = l; cartTarget = LANE_Y[l];
    buildStation(animal);
    sceneOn = true; sceneX = stage.W + 0;
    showSigns(false);
    hop = 220; sparkle(CART_X + 60, cartY - 10, 7);
    audio.play(STING[f]);
  };

  const startChore = (): void => {
    hotOn = true; hotAppear = 1; idleT = 0; hotPulse = 0; landed = 0;
    showChore(true);
    if (!taught) { taught = true; void audio.say('farm.tap', 'bholu'); }
  };

  const doTap = (): void => {
    if (round.phase !== Ph.Chore || api.isRevealing()) return;
    const ch = round.chore; if (!ch) return;
    const before = round.totalTaps;
    const k = round.taps;
    const [hx, hy] = hsPos();
    const res = round.tap();
    if (res === 'none') return;
    tapsEver++; idleT = 0; hotBump = 160; hotPulse = 0;
    const kind: ChoreKind = ch.kind;
    if (kind === 'door') {
      audio.play(DOOR_OPEN); api.caption('farm.cc.door', 2200); void audio.say('farm.look', 'bholu');
      doorOpenT = 1; hotOn = false; showChore(false); sparkle(doorX(stage.W), DOOR_TOP + 10, 8);
      return;
    }
    audio.play(TAP[kind][before % 5]);
    audio.play(BUMP); // something inside the home bumps the door
    doorShake = 260; peekT = 900; // and a pair of eyes peeks through a crack in the door (4 fills, never shows which animal)
    const dx = doorX(stage.W);
    const rnd = Math.random;
    switch (kind) {
      case 'feed': // the food flies to the doorstep; the little pile grows
        spawn(FX_FOOD, hx, hy - 10, (dx - 24 - hx) / 0.6, -70, 200, 600); landed = Math.min(3, k + 1); break;
      case 'water':
        for (let i = 0; i < 3; i++) spawn(FX_DROP, hx - 8 + i * 8, hy - 30 - i * 4, 0, 10, 220, 330); break;
      case 'milk':
        for (let i = 0; i < 2; i++) spawn(FX_MILK, hx - 3 + i * 6, hy - 34 - i * 6, 0, 10, 240, 320); break;
      case 'eggs':
        spawn(FX_EGG, hx - 4, hy - 4, (rnd() - 0.5) * 24, -100, 320, 520); break;
      case 'mud':
        for (let i = 0; i < 3; i++) spawn(FX_MUD, hx, hy + 2, (i - 1) * 34 + rnd() * 6, -70 - rnd() * 30, 300, 520); break;
      case 'rock':
        for (let i = 0; i < 2; i++) spawn(FX_DUST, hx - 6 + i * 12, hy + 8, (i ? 1 : -1) * 24, -20, 40, 420); break;
      case 'hay':
        for (let i = 0; i < 4; i++) spawn(FX_STRAW, hx, hy + 2, (rnd() - 0.5) * 70, -60 - rnd() * 40, 150, 560); break;
      case 'brush':
        for (let i = 0; i < 3; i++) spawn(FX_DUST, hx - 8 + i * 8, hy - 4, (i - 1) * 20, -24, 30, 450); break;
    }
    if (res === 'chore') {
      audio.play(CHORE_DONE); audio.sfx('chime'); hop = 220; sparkle(hx, hy - 10, 8);
      hotAppear = 1; landed = 0;
      showChore(true); // re-place for the next chore
    }
  };

  // ------------------------------------------------------------------ update
  const update = (dt: number): void => {
    const sp = SPEED * (stage.reduced ? 0.6 : 1);
    const W = stage.W;
    if (hop > 0) hop -= dt;
    if (shelfBounce > 0) shelfBounce -= dt;
    if (doorShake > 0) doorShake -= dt;
    if (peekT > 0) peekT -= dt;
    if (hotAppear > 0) hotAppear -= dt / 280;
    if (hotBump > 0) hotBump -= dt;
    if (hotPulse > 0) hotPulse -= dt;
    if (honkT > 0) honkT -= dt;
    blinkT += dt;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]; if (p.life <= 0) continue;
      p.life -= dt; p.x += (p.vx * dt) / 1000; p.y += (p.vy * dt) / 1000; p.vy += (p.g * dt) / 1000;
    }
    if (buildQueue.length && T) { sceneOf(buildQueue.pop()!); }
    cartY += (cartTarget - cartY) * Math.min(1, dt / 160);

    const ph = round.phase;
    if (round.tick(dt)) { // warm-up over: the fork rolls in
      pickForkNow();
      forkOn = true; forkX = W; forkReady = false;
    }
    switch (round.phase) {
      case Ph.Ride:
        scrollX = (scrollX + (sp * dt) / 1000) % 100000;
        break;
      case Ph.Fork:
        if (forkOn && !forkReady) {
          speedK = Math.min(1, 0.12 + forkX / 60);
          const d = (sp * speedK * dt) / 1000;
          scrollX = (scrollX + d) % 100000;
          forkX -= d;
          if (forkX <= 0) {
            forkX = 0; forkReady = true; speedK = 0; signPulse = 0;
            showSigns(true); audio.play(SIGNS); void audio.say('farm.pick', 'bholu');
          }
        }
        if (forkReady) signPulse += dt;
        break;
      case Ph.Drive: {
        const d = (sp * 1.5 * dt) / 1000;
        scrollX = (scrollX + d) % 100000;
        forkX -= d; sceneX -= d;
        if (forkX + W - SIGN_DX < CART_X + 80) cartTarget = YARD_Y; // past the sign: roll down into the yard
        if (sceneX <= 0) { sceneX = 0; round.arrive(); cartTarget = YARD_Y; audio.play(PARK); startChore(); }
        break;
      }
      case Ph.Chore:
        idleT += dt;
        break;
      case Ph.Out: {
        if (doorOpenT > 0) doorOpenT = Math.max(0, doorOpenT - dt / 380);
        walkT = Math.max(0, round.t - 450) / 2200;
        if (walkT >= 1 && !welcomed) { welcomed = true; audio.play(WELCOME); hop = 300; sparkle(110, 96, 10); }
        break;
      }
      case Ph.Reveal:
        if (!revealing) {
          revealing = true;
          const id = round.animal;
          api.reveal(id).catch((e) => console.error(e)).then(() => {
            revealing = false;
            if (dead) return;
            lastNow = 0; shelfBounce = 500; startRound();
          });
        }
        break;
    }
    void ph;
  };
  const pickForkNow = (): void => {
    owned();
    const f = pickFork(ownedSet, mem, Math.random);
    signFood[0] = f[0]; signFood[1] = f[1]; signFood[2] = f[2];
  };

  // ------------------------------------------------------------------ render (no allocation; counts its calls)
  const render = (g: CanvasRenderingContext2D, now: number): void => {
    if (stage.W !== hudForW) { hudForW = stage.W; measureHud(); }
    const W = stage.W;
    let n = 0;
    const ph = round.phase;
    const bob = stage.reduced ? 0 : ((now / 120) | 0) % 2;
    const sceneFull = sceneOn && sceneX <= 0;

    if (!sceneFull) {
      const fo = Math.round(-((scrollX * 0.35) % T)), go = Math.round(-(scrollX % T));
      g.drawImage(far, fo, 0); g.drawImage(far, fo + T, 0); n += 2;
      g.drawImage(sun, W - 30 - hudW, 4); n++;
      g.drawImage(gnd, go, GND_Y); g.drawImage(gnd, go + T, GND_Y); n += 2;
      if (!stage.reduced) {
        for (let i = 0; i < 2; i++) {
          const bx = W + 20 - ((now * (0.011 + i * 0.004) + i * 130) % (W + 40));
          const by = 44 + i * 30 + Math.sin(now / 420 + i * 2) * 8;
          g.drawImage(fly[i][((now / (130 + i * 20)) | 0) % 2], Math.round(bx), Math.round(by)); n++;
        }
      }
      if (forkOn) {
        g.drawImage(fork, Math.round(forkX), GND_Y); n++;
        // signposts ride on the end of the fork picture; the one in focus (or the one whose turn it is to pulse) is a little bigger
        const sx = forkX + W - SIGN_DX;
        if (sx > -30) {
          const pulse = forkReady && !stage.reduced ? ((signPulse / 520) | 0) % 3 : -1;
          for (let l = 0; l < 3; l++) {
            const fi = FOODS.indexOf(signFood[l]), big = l === lane && kbd ? true : l === pulse;
            const img = big ? signsBig[fi] : signs[fi];
            g.drawImage(img, Math.round(sx - img.width / 2), Math.round(LANE_Y[l] - 3 - img.height / 2)); n++;
          }
        }
      }
    }
    if (sceneOn && sceneX < W) {
      const sc = sceneOf(round.animal);
      g.drawImage(sc, Math.round(sceneX), 0); n++;
    }

    // door panel and a feeding pile (chore scene only)
    if (sceneFull) {
      const dx = doorX(W);
      if (ph === Ph.Chore || ph === Ph.Drive || (ph === Ph.Out && doorOpenT > 0)) {
        const shake = doorShake > 0 && !stage.reduced ? Math.round(Math.sin(doorShake / 22) * (round.chore?.kind === 'door' ? 1 : 2)) : 0;
        const wOpen = ph === Ph.Out ? Math.max(1, Math.round(DOOR_W * doorOpenT)) : DOOR_W;
        g.drawImage(panel, dx - DOOR_W / 2 + shake, DOOR_TOP, wOpen, DOOR_H); n++;
        if (peekT > 0 && ph === Ph.Chore && round.chore?.kind !== 'door') { // a funny peek: the crack opens, the eyes look at the pile, then the crack closes
          const k = 1 - peekT / 900, open = k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1;
          const h = Math.max(1, Math.round(6 * open)), look = stage.reduced ? 0 : Math.round(Math.sin(k * 10) * 2) - 1;
          g.fillStyle = '#181020'; g.fillRect(dx - 8 + shake, DOOR_TOP + 9, 16, h); n++;
          if (h >= 3) {
            g.fillStyle = '#ffffff'; g.fillRect(dx - 7 + shake, DOOR_TOP + 10, 14, h - 2); n++;
            g.fillStyle = '#181020'; g.fillRect(dx - 5 + look + shake, DOOR_TOP + 10, 3, h - 2); g.fillRect(dx + 2 + look + shake, DOOR_TOP + 10, 3, h - 2); n += 2;
          }
        }
      }
      // chore prop
      const ch = round.chore;
      if (ch && ch.kind !== 'door') {
        const fr = props[round.idx];
        const f = fr[Math.min(round.taps, fr.length - 1)];
        const up = hotBump > 0 && !stage.reduced ? -2 : 0;
        const appear = hotAppear > 0 && !stage.reduced ? 1 - hotAppear : 1;
        const w = Math.max(2, Math.round(f.width * appear)), h = Math.max(2, Math.round(f.height * appear));
        g.drawImage(f, Math.round(hotX(W) - w / 2), Math.round(HS_Y + 16 - h) + up, w, h); n++;
        if (round.idx === 0) for (let i = 0; i < landed; i++) { g.drawImage(icons16[foodIdx], dx - 36 + i * 11, 100 + (i % 2) * 3); n++; }
      }
      // the animal comes out
      if (ph === Ph.Out && walkT > 0) {
        const k = Math.min(1, walkT), e = k * (2 - k);
        const x = dx + (112 - dx) * e, y = 66 + (86 - 66) * e, s = Math.round(28 + 12 * e);
        const step = stage.reduced ? 0 : Math.round(Math.abs(Math.sin(now / 90)) * (k < 1 ? 2 : 0));
        g.drawImage(walker, Math.round(x - s / 2), Math.round(y - step + (40 - s)), s, s); n++;
      }
    }

    // the glowing ring, and a bobbing arrow when the child has not tapped for a while
    if (hotOn && ph === Ph.Chore) {
      const [hx, hy] = hsPos();
      const base = round.chore?.kind === 'door' ? 56 : 50;
      const sz = base + (stage.reduced ? 0 : Math.sin(now / 260) * 4) + (hotPulse > 0 && !stage.reduced ? 8 : 0);
      g.drawImage(ring, Math.round(hx - sz / 2), Math.round(hy - sz / 2), Math.round(sz), Math.round(sz)); n++;
      if (tapsEver < 3 || idleT > 4500) {
        const o = stage.reduced ? 0 : Math.round(Math.abs(Math.sin(now / 280)) * 4);
        g.drawImage(arrow, Math.round(hx - 7), Math.round(hy - sz / 2 - 12 + o)); n++;
      }
    }
    if (forkReady && ph === Ph.Fork && tapsEver < 1 && !stage.reduced) { // first time: a bobbing arrow over the middle sign
      const o = Math.round(Math.abs(Math.sin(now / 280)) * 4);
      g.drawImage(arrow, Math.round(W - SIGN_DX - 7), LANE_Y[0] - 28 + o); n++;
    }

    // cart
    const cy = Math.round(cartY) - 15 + (hop > 0 && !stage.reduced ? -3 : 0) + (ph === Ph.Ride || ph === Ph.Drive || (ph === Ph.Fork && !forkReady) ? bob : 0);
    g.drawImage(cart, CART_X, cy); n++;

    // HUD
    const sb = shelfBounce > 0 && !stage.reduced ? -Math.round(Math.sin((shelfBounce / 500) * 3.14) * 3) : 0;
    g.drawImage(strip, SHELF_X, SHELF_Y + sb); n++;
    if (ph >= Ph.Drive && ph <= Ph.Out) {
      g.drawImage(badges[foodIdx], W - 34 - hudW, 2); n++;
      g.drawImage(pips[ph === Ph.Chore ? round.idx : ph === Ph.Out ? round.chores.length : 0], SHELF_X, 28); n++;
    }
    for (let i = 0; i < parts.length && n < MAX_CALLS; i++) {
      const p = parts[i]; if (p.life <= 0) continue;
      if (p.s < 0) { g.fillStyle = PCOL[p.c]; g.fillRect(Math.round(p.x), Math.round(p.y), 3, 3); }
      else {
        const im = p.s === FX_FOOD ? icons16[foodIdx] : fx[p.s];
        g.drawImage(im, Math.round(p.x - im.width / 2), Math.round(p.y - im.height / 2));
      }
      n++;
    }
    calls = n;
  };

  const checkSize = (): void => {
    if (T === stage.W) return;
    T = stage.W;
    far = farLayer(T); gnd = groundLayer(T); fork = forkLayer(T); scenes.clear();
    buildQueue.length = 0; buildQueue.push(...FARM);
    if (round.animal) sceneOf(round.animal);
    layoutButtons();
  };

  // ------------------------------------------------------------------ main draw (Stage calls this at <= 30 fps)
  stage.draw = (g, now) => {
    const t0 = debug ? performance.now() : 0;
    realCalls = 0;
    checkSize();
    let dt = lastNow ? now - lastNow : 33; lastNow = now;
    if (dt > 100) dt = 100;
    update(dt);
    render(g, now);
    if (calls > maxCalls) maxCalls = calls;
    if (debug) {
      const d = performance.now() - t0;
      stats.frames++; stats.drawMs += d; if (d > stats.drawMax) stats.drawMax = d;
      if (realCalls > realMax) realMax = realCalls;
      stats.maxCalls = realMax;
    }
    stage.invalidate(); // the loop keeps running (30 fps)
  };
  checkSize();
  stage.invalidate();

  // ------------------------------------------------------------------ input
  // The game's overlay (#ui > .game-root) sits on top of the canvas, so pointer events land on the overlay: read them from `container`.
  // A touch on the empty picture never does a chore: it honks (ride), or makes the glow pulse (fork, chores). Real buttons do the work.
  const honk = (): void => {
    if (honkT > 0) return;
    honkT = 700; hop = 200; audio.sfx('honk');
  };
  const missed = (): void => {
    if (round.phase === Ph.Ride) honk();
    else if (round.phase === Ph.Chore) { hotPulse = 320; audio.sfx('tick'); }
    else if (round.phase === Ph.Fork && forkReady) { signPulse = 0; audio.sfx('tick'); }
  };
  container.style.touchAction = 'none';
  const onDown = (e: PointerEvent): void => {
    kbd = false;
    if (e.target !== container || api.isRevealing()) return;
    missed();
  };
  container.addEventListener('pointerdown', onDown);
  signBtn.forEach((b, l) => {
    b.addEventListener('click', () => { void audio.unlock(); kbd = kbd && b === document.activeElement; choose(l); });
    b.addEventListener('focus', () => { lane = l; });
    b.addEventListener('pointerenter', () => { lane = l; });
  });
  choreBtn.addEventListener('click', () => { void audio.unlock(); doTap(); });
  const onKey = (e: KeyboardEvent): void => {
    kbd = true;
    if (api.isRevealing() || document.querySelector('.parent')) return;
    if (e.target instanceof HTMLButtonElement) return; // buttons handle Enter and Space themselves
    const go = e.key === 'Enter' || e.key === ' ';
    if (round.phase === Ph.Fork && forkReady) {
      if (e.key === '1' || e.key === '2' || e.key === '3') choose(+e.key - 1);
      else if (e.key === 'ArrowUp' || e.key === 'w') { lane = Math.max(0, lane - 1); e.preventDefault(); }
      else if (e.key === 'ArrowDown' || e.key === 's') { lane = Math.min(2, lane + 1); e.preventDefault(); }
      else if (go) { choose(lane); e.preventDefault(); }
    } else if (round.phase === Ph.Chore && go) { doTap(); e.preventDefault(); }
    else if (round.phase === Ph.Ride && go) { honk(); e.preventDefault(); }
  };
  window.addEventListener('keydown', onKey);
  canvas.focus({ preventScroll: true });

  // ------------------------------------------------------------------ debug hooks (?debug)
  if (debug) {
    const w = window as unknown as Record<string, unknown>;
    w.__farm = {
      stats, round, mem, signFood,
      get state() {
        return {
          phase: round.phase, t: round.t, food: round.food, animal: round.animal, chore: round.chore?.kind ?? null, idx: round.idx, taps: round.taps,
          rounds, calls, maxCalls, realMax, forkReady, forkX, sceneX, owned: api.owned(), buttons: [...container.querySelectorAll('.farm-hot')].filter((b) => !(b as HTMLElement).hidden).length,
        };
      },
      /** skip the warm-up: the fork signs roll in at once */
      toFork() { if (round.phase === Ph.Ride) round.t = round.opts.rideMs; },
      /** finish the fork instantly (signs in place) */
      settleFork() { if (round.phase === Ph.Ride) round.t = round.opts.rideMs; },
      /** pick a given animal's route, whichever sign it needs (jumps through the fork) */
      pick(animalId: string) {
        const f = FOODS.find((x) => ANIMALS_OF[x].includes(animalId));
        if (!f) return false;
        if (round.phase === Ph.Ride) round.t = round.opts.rideMs;
        const l = signFood.indexOf(f);
        forkOn = true; forkX = 0; forkReady = true; round.phase = Ph.Fork; showSigns(true);
        choose(l < 0 ? 0 : l, animalId);
        return true;
      },
      /** tap the current chore n times (default: until the door chore) */
      tap(nTimes = 1) { for (let i = 0; i < nTimes; i++) doTap(); },
      /** skip the drive: arrive at the home */
      arrive() { if (round.phase === Ph.Drive) { forkX = -stage.W; sceneX = 0; } },
      /** play one animal's whole round at once, ending at the reveal */
      finish() { if (round.phase === Ph.Chore) { let guard = 40; while (round.phase === Ph.Chore && guard-- > 0) doTap(); } },
    };
  }

  return () => {
    dead = true;
    window.removeEventListener('keydown', onKey);
    canvas.setAttribute('aria-label', oldLabel);
    for (const m of patched) delete ctx[m];
    if (debug) delete (window as unknown as Record<string, unknown>).__farm;
  };
}
