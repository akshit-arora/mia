// FORAGE TRAIL: the Jungle door's game. A basket with eyes runs down a three-lane forest path (landscape).
//   warm-up run (sparkles, flowers) -> FORK: three signposts, each shows a food; the lane you are in when you pass one is your choice
//   -> collect about 8 of that food (scenery turns into banana trees / hives / cane field ...) -> something comes -> the shared reveal.
// No timers, lives, scores or fail states: a missed item just scrolls by. Lion and tiger share the plain covered "meal" bowl.
// Draw budget: <= 25 canvas calls per frame (counted in `render`, and measured in ?debug), no allocation in the frame loop.
import { registerGame, type GameApi } from '../../app/registry';
import { shelfCards } from '../../cards/data';
import { setCaptionStyle } from '../../ui/captions';
import { FAR_H, GND_H, basketImages, bushSprite, butterflies, farLayer, flowerSprite, foodBadge, groundLayer, rockSprite, shelfStrip, signBoard, type Biome } from './art';
import {
  ANIMALS_OF, BASKET_X, DEFAULT_ROUND, FOODS, LANE_Y, Ph, Round, animalFor, laneAt, newForkMemory, pickFork, pickLane, topFor,
  type FoodId,
} from './logic';
import { PICKUP, RUSTLE, SETDOWN, STING, STREAK } from './sounds';

const BX = BASKET_X;
const SPEED = 48; // px per second
const MAX_CALLS = 25;
const SPARK = 5, FLOWER = 6; // item kinds beyond the five foods
const ITEM_POOL = 7, PART_POOL = 12;
const SHELF_X = 36, SHELF_Y = 2;
const PCOL = ['#ffd93d', '#ff7aa8', '#7fe0ff', '#9be564', '#ffffff'];

interface Item { x: number; lane: number; kind: number; on: boolean; ph: number }
interface Part { x: number; y: number; vx: number; vy: number; life: number; c: number }

registerGame({
  id: 'forage',
  shelf: 'jungle',
  start(container, api) { return startForage(container, api); },
});

function startForage(container: HTMLElement, api: GameApi): () => void {
  const { stage, kit, audio } = api;
  const q = new URLSearchParams(location.search);
  const debug = q.has('debug');
  let dead = false;

  // this game only: no speaker icon on spoken captions (the truck is not the animal), and no captions for sfx the picture already shows
  setCaptionStyle({ hideSfx: true, noIcon: true });
  api.exitButton();
  const canvas = stage.canvas;
  const oldLabel = canvas.getAttribute('aria-label') || '';
  canvas.setAttribute('aria-label', api.t('forage.aria'));
  canvas.setAttribute('tabindex', '0');

  // ------------------------------------------------------------------ art, built once
  const icons = FOODS.map((f) => kit.icon('food.' + f, 32));
  const sparkIcon = kit.icon('ui.sparkle', 24);
  const flower = flowerSprite();
  const itemSprite = [...icons, sparkIcon, flower];
  const badges = icons.map((ic) => foodBadge(ic));
  const signs = icons.map((ic) => signBoard(ic, 1));
  const signsBig = icons.map((ic) => signBoard(ic, 1.1));
  const basket = basketImages();
  const bush = bushSprite(), rock = rockSprite();
  const bowl = kit.icon('food.meal', 24);
  const fly = butterflies();
  const cameo = kit.animal('monkey', 20);
  const WILD = shelfCards('jungle').map((c) => c.id); // the real Jungle shelf, in the shared slot order
  let strip = shelfStrip(kit, WILD, api.levelOf);

  // scenery: tile-wrapped, rebuilt when the canvas width changes; far layers per biome are built one per frame while idle
  let T = 0;
  let gnd = groundLayer(240);
  const farCache = new Map<Biome, HTMLCanvasElement>();
  const buildQueue: Biome[] = ['jungle', 'fruit', 'honey', 'sugarcane', 'seeds', 'meal'];
  const far = (b: Biome): HTMLCanvasElement => {
    let c = farCache.get(b);
    if (!c) { c = farLayer(b, T); farCache.set(b, c); }
    return c;
  };
  const checkSize = (): void => {
    if (T === stage.W) return;
    measureHud(); T = stage.W; gnd = groundLayer(T); farCache.clear(); far('jungle'); far(farNext ?? farCur);
  };
  // the sound / captions / grown-ups buttons sit in the top right corner while a game is open: keep the food badge clear of them
  const hudEl = document.getElementById('hud');
  let hudW = 0;
  const measureHud = (): void => { hudW = hudEl ? Math.ceil(hudEl.offsetWidth / stage.scale) + 3 : 0; };
  measureHud();
  let farCur: Biome = 'jungle';
  let farNext: Biome | null = null;
  let seam = 0; // screen x where the next biome starts; it slides left with the world

  // ------------------------------------------------------------------ state (preallocated)
  const items: Item[] = [];
  for (let i = 0; i < ITEM_POOL; i++) items.push({ x: 0, lane: 0, kind: 0, on: false, ph: 0 });
  const parts: Part[] = [];
  for (let i = 0; i < PART_POOL; i++) parts.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, c: 0 });
  const signFood: FoodId[] = ['fruit', 'honey', 'sugarcane'];
  const sign = { x: 0, on: false };
  const roundOpts = { ...DEFAULT_ROUND };
  const round = new Round(roundOpts);
  const mem = newForkMemory();
  const ownedSet = new Set<string>();
  const firstTimer = !api.owned().some((id) => WILD.includes(id));

  let lane = 1, basketY = LANE_Y[1];
  let scrollX = 0, speedK = 1, lastNow = 0, blinkT = 3000, hop = 0, shelfBounce = 0;
  let spawnT = 0, sinceHit = 0, warmHits = 0, cameoT = 8000, cameoX = -40;
  let foodIdx = 0, moved = !firstTimer, hintOn = firstTimer, revealing = false, bowlT = 0, rustled = false, announced = false;
  let rounds = 0;
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

  const burst = (x: number, y: number, n: number): void => {
    if (stage.reduced) return;
    for (let i = 0, k = 0; i < parts.length && k < n; i++) {
      const p = parts[i]; if (p.life > 0) continue;
      p.x = x; p.y = y; p.vx = (Math.random() - 0.5) * 90; p.vy = -20 - Math.random() * 60; p.life = 500 + Math.random() * 300; p.c = (Math.random() * 5) | 0; k++;
    }
  };
  const setLane = (l: number): void => {
    if (l < 0) l = 0; else if (l > 2) l = 2;
    if (l === lane) return;
    lane = l; moved = true; hintOn = false; audio.sfx('hop');
  };
  const spawn = (kind: number, l: number): void => {
    for (let i = 0; i < items.length; i++) {
      const it = items[i]; if (it.on) continue;
      it.on = true; it.x = stage.W + 18; it.lane = l; it.kind = kind; it.ph = Math.random() * 6; return;
    }
  };
  const clearItems = (): void => { for (let i = 0; i < items.length; i++) items[i].on = false; };
  const setBiome = (b: Biome): void => {
    if (b === farCur && !farNext) return;
    far(b); farNext = b; seam = stage.W + 6;
  };

  const startRound = (): void => {
    round.next(); clearItems(); sign.on = false; speedK = 1; spawnT = 0; warmHits = 0; rustled = false; announced = false; bowlT = 0;
    lane = 1; owned(); strip = shelfStrip(kit, WILD, api.levelOf);
    setBiome('jungle');
    rounds++; stats.rounds = rounds;
  };

  const chooseSign = (): void => {
    const f = signFood[lane];
    foodIdx = FOODS.indexOf(f);
    owned();
    const animal = animalFor(f, ownedSet, mem);
    roundOpts.arriveMs = f === 'meal' ? 3400 : 2000;
    round.choose(f, animal);
    setBiome(f);
    hop = 220; burst(BX + 8, LANE_Y[lane] - 6, 7);
    audio.play(STING[f]);
    spawnT = -900; sinceHit = 0;
  };

  // ------------------------------------------------------------------ update
  const update = (dt: number): void => {
    const sp = SPEED * speedK * (stage.reduced ? 0.6 : 1);
    scrollX = (scrollX + (sp * dt) / 1000) % 100000;
    basketY += (LANE_Y[lane] - basketY) * Math.min(1, dt / 70);
    blinkT -= dt; if (blinkT < -140) blinkT = 2500 + Math.random() * 2500;
    if (hop > 0) hop -= dt;
    if (shelfBounce > 0) shelfBounce -= dt;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]; if (p.life <= 0) continue;
      p.life -= dt; p.x += (p.vx * dt) / 1000; p.y += (p.vy * dt) / 1000; p.vy += (160 * dt) / 1000;
    }
    // idle: build one missing far layer per frame (no hitch at the fork)
    if (buildQueue.length && T) { far(buildQueue.pop()!); }
    if (farNext) { seam -= (sp * 0.35 * dt) / 1000; if (seam <= 0) { farCur = farNext; farNext = null; } }

    const ph = round.phase;
    // items: move and collect
    for (let i = 0; i < items.length; i++) {
      const it = items[i]; if (!it.on) continue;
      it.x -= (sp * dt) / 1000;
      if (it.x < -20) { it.on = false; continue; }
      if (ph === Ph.Arrive || ph === Ph.Reveal) { it.on = false; continue; }
      if (it.lane === lane && it.x < BX + 18 && it.x > BX - 18) {
        it.on = false; hop = 160; burst(BX + 8, LANE_Y[lane] - 6, 3); sinceHit = 0;
        if (ph === Ph.Collect && it.kind === foodIdx) {
          round.pickup();
          const c = round.collected;
          audio.play(PICKUP[FOODS[foodIdx]][(c - 1) % 5]);
          if (c % 3 === 0 && c < round.opts.need) { audio.play(STREAK); burst(BX + 8, LANE_Y[lane] - 14, 8); } // a small gift every third, never a penalty
        } else if (ph === Ph.Collect) audio.sfx('tick');
        else { audio.play(PICKUP.sugarcane[warmHits % 5]); warmHits++; }
      }
    }
    // signs
    if (sign.on) {
      sign.x -= (sp * dt) / 1000;
      if (sign.x < -30) sign.on = false;
      if (ph === Ph.Fork && sign.x <= BX + 22) chooseSign();
    }
    // phase work
    if (round.tick(dt)) { // warm-up over: the fork
      const f = pickFork(ownedSet, mem, Math.random);
      signFood[0] = f[0]; signFood[1] = f[1]; signFood[2] = f[2];
      sign.on = true; sign.x = stage.W + 30;
      if (firstTimer && rounds === 0) { moved = false; hintOn = true; }
      void audio.say('forage.pick', 'bholu');
    }
    switch (round.phase) {
      case Ph.Warm:
        spawnT += dt;
        if (spawnT > 1100) { spawnT = 0; spawn(Math.random() < 0.5 ? SPARK : FLOWER, pickLane(lane, Math.random)); }
        break;
      case Ph.Collect:
        spawnT += dt; sinceHit += dt;
        if (spawnT > 1800) {
          spawnT = -((Math.random() * 300) | 0);
          const want = Math.random() < 0.7;
          // a gentle helper after a long dry spell: the next one comes in the basket's lane
          const l = sinceHit > 9000 ? lane : pickLane(lane, Math.random);
          if (sinceHit > 9000) sinceHit = 4000;
          spawn(want ? foodIdx : Math.random() < 0.5 ? SPARK : FLOWER, l);
        }
        break;
      case Ph.Arrive: {
        speedK = Math.max(0.15, speedK - dt / 700);
        const meal = round.food === 'meal';
        if (!announced) { announced = true; clearItems(); hop = 200; if (meal) void audio.say('forage.rock', 'bholu'); }
        if (meal && round.t > 900 && bowlT === 0) { bowlT = 1; }
        if (meal && bowlT === 1 && round.t > 2300) { bowlT = 2; audio.play(SETDOWN); burst(stage.W - 52, LANE_Y[1] - 6, 6); }
        if (!rustled && round.t > round.opts.arriveMs - 1100) { rustled = true; audio.play(RUSTLE); void audio.say('forage.look', 'bholu'); }
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
  };

  // ------------------------------------------------------------------ render (no allocation; counts its calls)
  const region = (g: CanvasRenderingContext2D, img: HTMLCanvasElement, fo: number, x0: number, x1: number): number => {
    let n = 0;
    for (let k = 0; k < 2; k++) {
      const ox = fo + k * T, a = x0 > ox ? x0 : ox, b = x1 < ox + T ? x1 : ox + T;
      if (b > a) { g.drawImage(img, a - ox, 0, b - a, FAR_H, a, 0, b - a, FAR_H); n++; }
    }
    return n;
  };
  const render = (g: CanvasRenderingContext2D, now: number): void => {
    const W = stage.W;
    let n = 0;
    const ph = round.phase;
    const fo = Math.round(-((scrollX * 0.35) % T)), go = Math.round(-(scrollX % T));
    if (farNext) { n += region(g, far(farCur), fo, 0, seam); n += region(g, far(farNext), fo, seam, W); } else n += region(g, far(farCur), fo, 0, W);
    g.drawImage(gnd, go, 30); g.drawImage(gnd, go + T, 30); n += 2;

    // gags: a monkey swings across overhead now and then; two butterflies drift over the field
    if (!stage.reduced) {
      if (cameoX > -30 && cameoX < W + 30) { g.drawImage(cameo, Math.round(cameoX), 30 + Math.round(Math.sin(cameoX / 22) * 5)); n++; }
      for (let i = 0; i < 2; i++) {
        const bx = W + 20 - ((now * (0.011 + i * 0.004) + i * 130) % (W + 40));
        const by = 40 + i * 38 + Math.sin(now / 420 + i * 2) * 9;
        g.drawImage(fly[i][((now / (130 + i * 20)) | 0) % 2], Math.round(bx), Math.round(by)); n++;
      }
    }
    // arrive scene: a rustling bush (and for lion/tiger, a feeding rock) where the visitor will come from
    if (ph === Ph.Arrive) {
      const shake = stage.reduced ? 0 : Math.round(Math.sin(now / 45) * (rustled ? 2 : 0));
      g.drawImage(bush, W - 44 + shake, LANE_Y[1] - 30); n++;
      if (round.food === 'meal') {
        g.drawImage(rock, W - 78, LANE_Y[1] - 6); n++;
        if (bowlT === 1) { // the covered bowl flies from the basket to the rock in a small arc
          const k = Math.min(1, Math.max(0, (round.t - 900) / 1400));
          const x = BX + 14 + (W - 78 + 11 - (BX + 14)) * k, y = LANE_Y[1] - 24 + (LANE_Y[1] - 22 - (LANE_Y[1] - 24)) * k - Math.sin(k * Math.PI) * 26;
          g.drawImage(bowl, Math.round(x), Math.round(y)); n++;
        } else if (bowlT === 2) { g.drawImage(bowl, W - 78 + 11, LANE_Y[1] - 22); n++; }
      }
    }
    // items
    for (let i = 0; i < items.length; i++) {
      const it = items[i]; if (!it.on) continue;
      const s = itemSprite[it.kind], h = s.height;
      const bob = stage.reduced ? 0 : Math.round(Math.sin(now / 220 + it.ph) * 2);
      g.drawImage(s, Math.round(it.x - s.width / 2), topFor(LANE_Y[it.lane], h) + bob); n++;
    }
    // signposts: the board in the basket's lane is a little bigger, so the choice is visible before it is made
    if (sign.on) {
      for (let l = 0; l < 3; l++) {
        const fi = FOODS.indexOf(signFood[l]), big = l === lane;
        const img = big ? signsBig[fi] : signs[fi];
        g.drawImage(img, Math.round(sign.x - img.width / 2), topFor(LANE_Y[l], img.height)); n++;
      }
    }
    // basket
    const by = Math.round(basketY) + (hop > 0 && !stage.reduced ? -3 : 0);
    const happy = ph === Ph.Arrive || ph === Ph.Reveal;
    g.drawImage(basket[happy ? 2 : blinkT < 0 ? 1 : 0], BX - 20, topFor(by, 34)); n++;
    if (ph === Ph.Arrive && round.food !== 'meal') { // the food pops out of the basket
      const k = Math.min(1, round.t / 400), s = Math.round(32 * k);
      if (s > 3) { g.drawImage(icons[foodIdx], BX - s / 2, by - 24 - s - (stage.reduced ? 0 : Math.round(Math.sin(now / 160) * 2)), s, s); n++; }
    }
    // hint: two arrows at the basket until the child has moved once (first-time children only)
    if (hintOn && ph !== Ph.Arrive && !stage.reduced) {
      const o = Math.round(Math.abs(Math.sin(now / 300)) * 4);
      g.fillStyle = '#ffffff';
      g.beginPath(); g.moveTo(BX, by - 26 - o); g.lineTo(BX - 7, by - 18 - o); g.lineTo(BX + 7, by - 18 - o); g.fill();
      g.beginPath(); g.moveTo(BX, by + 20 + o); g.lineTo(BX - 7, by + 12 + o); g.lineTo(BX + 7, by + 12 + o); g.fill(); n += 2;
    }
    // HUD: the real Jungle shelf; the wanted food (badge + bar) once chosen
    const sb = shelfBounce > 0 && !stage.reduced ? -Math.round(Math.sin((shelfBounce / 500) * 3.14) * 3) : 0;
    g.drawImage(strip, SHELF_X, SHELF_Y + sb); n++;
    if (ph === Ph.Collect || ph === Ph.Arrive) {
      g.drawImage(badges[foodIdx], W - 34 - hudW, 2); n++;
      if (ph === Ph.Collect) {
        g.fillStyle = '#181020'; g.fillRect(W - 38 - hudW, 33, 38, 5);
        g.fillStyle = '#ffd93d'; g.fillRect(W - 37 - hudW, 34, Math.round((36 * round.collected) / round.opts.need), 3); n += 2;
      }
    }
    for (let i = 0; i < parts.length && n < MAX_CALLS; i++) {
      const p = parts[i]; if (p.life <= 0) continue;
      g.fillStyle = PCOL[p.c]; g.fillRect(Math.round(p.x), Math.round(p.y), 3, 3); n++;
    }
    calls = n;
  };

  // ------------------------------------------------------------------ main draw (Stage calls this at <= 30 fps)
  stage.draw = (g, now) => {
    const t0 = debug ? performance.now() : 0;
    realCalls = 0;
    checkSize();
    let dt = lastNow ? now - lastNow : 33; lastNow = now;
    if (dt > 100) dt = 100;
    update(dt);
    // monkey cameo clock
    if (!stage.reduced) {
      if (cameoX > -30) cameoX -= dt * 0.03;
      else { cameoT -= dt; if (cameoT < 0) { cameoT = 16000 + Math.random() * 8000; cameoX = stage.W + 20; } }
    }
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

  // ------------------------------------------------------------------ input: tap a third, swipe, arrow keys
  // The game's overlay (#ui > .game-root) sits on top of the canvas, so the pointer events land on it, not on the canvas:
  // read them from the overlay itself (only when the touch is on the overlay, never when it hit a button).
  let downY = 0, swiped = false;
  const logicalY = (e: PointerEvent): number => {
    const r = stage.canvas.getBoundingClientRect();
    return ((e.clientY - r.top) / r.height) * stage.H;
  };
  container.style.touchAction = 'none';
  const onDown = (e: PointerEvent): void => {
    if (e.target !== container || api.isRevealing()) return;
    try { container.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    downY = logicalY(e); swiped = false;
    setLane(laneAt(downY));
  };
  const onMove = (e: PointerEvent): void => {
    if (swiped || e.buttons === 0 || e.target !== container || api.isRevealing()) return;
    const y = logicalY(e);
    if (y - downY < -12) { swiped = true; setLane(lane - 1); } else if (y - downY > 12) { swiped = true; setLane(lane + 1); }
  };
  container.addEventListener('pointerdown', onDown);
  container.addEventListener('pointermove', onMove);
  const onKey = (e: KeyboardEvent): void => {
    if (api.isRevealing() || document.querySelector('.parent')) return;
    if (e.key === 'ArrowUp' || e.key === 'w') { setLane(lane - 1); e.preventDefault(); }
    else if (e.key === 'ArrowDown' || e.key === 's') { setLane(lane + 1); e.preventDefault(); }
    else if (e.key === '1' || e.key === '2' || e.key === '3') setLane(+e.key - 1);
  };
  window.addEventListener('keydown', onKey);
  canvas.focus({ preventScroll: true });

  // ------------------------------------------------------------------ debug hooks (?debug)
  if (debug) {
    const w = window as unknown as Record<string, unknown>;
    w.__forage = {
      stats, round, items, mem, signFood,
      get state() { return { phase: round.phase, t: round.t, collected: round.collected, food: round.food, animal: round.animal, lane, rounds, calls, maxCalls, realMax, hint: hintOn, signX: sign.x, signOn: sign.on, owned: api.owned() }; },
      setLane,
      showBiome(b: Biome) { far(b); farCur = b; farNext = null; },
      /** skip the warm-up: the fork signs come in at once */
      toFork() { if (round.phase === Ph.Warm) round.t = round.opts.warmMs; },
      /** jump straight to the end of collecting for a given animal (tests all six): choose its food, fill the basket */
      run(animalId: string) {
        const f = FOODS.find((x) => ANIMALS_OF[x].includes(animalId));
        if (!f) return false;
        if (round.phase === Ph.Warm) round.t = round.opts.warmMs; // let the fork start
        round.phase = Ph.Fork; foodIdx = FOODS.indexOf(f); roundOpts.arriveMs = f === 'meal' ? 3400 : 2000;
        round.choose(f, animalId); setBiome(f); sign.on = false; announced = false; bowlT = 0; rustled = false;
        for (let i = 0; i < round.opts.need; i++) round.pickup();
        return true;
      },
    };
  }

  return () => {
    dead = true;
    window.removeEventListener('keydown', onKey);
    setCaptionStyle({});
    canvas.setAttribute('aria-label', oldLabel);
    for (const m of patched) delete ctx[m];
    if (debug) delete (window as unknown as Record<string, unknown>).__forage;
  };
}
