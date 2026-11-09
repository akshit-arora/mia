// FARM DASH (Farm door): a single-lane runner for six-year-olds.
//   ASK    pick the runner: hen, cow or goat. Each animal's body changes the play (jump height, weight, legs)
//   RUN    the world scrolls, the animal stays put. Tap = HOP over low things, hold or swipe down = DUCK under high things.
//          Floating food: ONLY this animal's own food counts (seeds / grass / leaves). Other foods pass harmlessly.
//   MEET   basket full (holds 5): the animal stops, happy, with the basket beside it. The run ends ONLY when the child taps the animal or basket to feed.
//   REVEAL the quick card reveal, then badges (clean = no stumbles, secret = the golden star), then back to Ask.
// No timer, lives or fail screen: a hit is a funny stumble that drops at most one carried item. Draw budget: ~25 canvas calls per frame, no allocation in the frame loop.
import { registerGame, type GameApi } from '../../app/registry';
import { getBadgeStore } from '../../cards/badges';
import { setCaptionStyle } from '../../ui/captions';
import type { Recipe } from '../../audio/recipes';
import type { Cv } from '../../cards/scenes';
import { basketImages, secretSprite, shelfStrip, tile } from '../forage/art';
import {
  BEAM_Y, GROUND_H, GROUND_TOP, MID_Y, POSE_TOTAL, RUNNER_BASE, RUNNER_PX, basketPips, farLayer, groundLayer, foodPlate, hintArrow, midLayer, obstacleSprites,
  runnerImage, shadowImage,
} from './art';
import {
  DASH_ANIMALS, DASH_ROUND, DUCK_Y, DashRound, DashWorld, EV, GROUND_Y, HOP_Y, K, OBSTACLES, POSE, Ph, RUNNER_X, STAR_Y, FOOD_PX, autopilot, bodyOf,
  captionGate, decoysOf, foodOf, type Item,
} from './logic';
import { CAPTION, DUCK, FEED, HOP, MEET, PICKUP, STAR, START, STUMBLE } from './sounds';

const MAX_CALLS = 25;
const PART_POOL = 14;
const SHELF_X = 36, SHELF_Y = 2;
const TILE = 52;
const HOLD_MS = 180; // a press this long becomes a duck
const SWIPE_PX = 10; // a swipe down this far ducks at once
const BASKET_X = RUNNER_X + 44; // where the basket sits beside the animal at Meet
const TIME_REDUCED = 0.75; // reduced motion slows game time (everything stays winnable: the whole simulation slows together)
const PCOL = ['#FFC93C', '#E8654A', '#FFF6E5', '#7BD389', '#3FA9D9'];

interface Part { x: number; y: number; vx: number; vy: number; life: number; c: number }

registerGame({
  id: 'dash',
  shelf: 'farm',
  start(container, api) { return startDash(container, api); },
});

function startDash(container: HTMLElement, api: GameApi): () => void {
  const { stage, kit, audio } = api;
  const debug = new URLSearchParams(location.search).has('debug');
  let dead = false;

  setCaptionStyle({ hideSfx: true, noIcon: true });
  api.exitButton();
  const canvas = stage.canvas;
  const oldLabel = canvas.getAttribute('aria-label') || '';
  canvas.setAttribute('aria-label', api.t('dash.aria'));
  canvas.setAttribute('tabindex', '0');

  // ------------------------------------------------------------------ art, built once
  const T = 240;
  const far = farLayer(T), mid = midLayer(T), gnd = groundLayer(T);
  const obs = obstacleSprites();
  const star = secretSprite();
  const basket = basketImages();
  const shadows = new Map<string, Cv>(), poses = new Map<string, Cv[]>(), pips = new Map<string, Cv[]>(), tiles = new Map<string, Cv>();
  const foodIcon = new Map<string, Cv>();
  const rawIcon = new Map<string, Cv>();
  for (const f of new Set(DASH_ANIMALS.map(foodOf))) { rawIcon.set(f, kit.icon('food.' + f, 32)); foodIcon.set(f, foodPlate(rawIcon.get(f)!, FOOD_PX)); }
  for (const id of DASH_ANIMALS) {
    const imgs: Cv[] = [];
    for (let p = 0; p < POSE_TOTAL; p++) imgs.push(runnerImage(id, p));
    poses.set(id, imgs);
    shadows.set(id, shadowImage(Math.max(18, bodyOf(id).width * 2 + 12)));
    const ic = rawIcon.get(foodOf(id))!;
    pips.set(id, [0, 1, 2, 3, 4, 5].map((n) => basketPips(ic, n)));
    tiles.set(id, tile(runnerImage(id, 0, 40), TILE));
    tiles.set(id + '!', tile(runnerImage(id, 0, 40), TILE, true));
  }
  const arrowUp = hintArrow(true), arrowDown = hintArrow(false);
  let strip = shelfStrip(kit, [...DASH_ANIMALS], api.levelOf);

  const lastCap = new Map<string, number>();
  const cue = (r: Recipe, key: string, gap = 1800): void => audio.play(r, captionGate(lastCap, key, performance.now(), gap) ? key : undefined);

  const hudEl = document.getElementById('hud');
  let hudW = 0;
  const measureHud = (): void => { hudW = hudEl ? Math.ceil(hudEl.offsetWidth / stage.scale) + 3 : 0; };
  measureHud();

  // ------------------------------------------------------------------ state
  const round = new DashRound({ ...DASH_ROUND });
  let world = new DashWorld(bodyOf('hen'), Math.random);
  let friend = '';
  let friendImgs: Cv[] = [], friendShadow = shadows.get('hen')!, friendPips: Cv[] = [], foodImg = foodIcon.get('seeds')!, decoyImgs: Cv[] = [];
  const parts: Part[] = [];
  for (let i = 0; i < PART_POOL; i++) parts.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, c: 0 });
  const firstTimer = !api.owned().some((id) => (DASH_ANIMALS as readonly string[]).includes(id));
  let rounds = 0, lastNow = 0, hot = -1, enterT = 0, feedT = 0, shelfBounce = 0, hintOn = firstTimer;
  let didHop = false, didDuck = false, revealing = false, meetStart = false, auto = false;
  let calls = 0, maxCalls = 0;
  const stats = { frames: 0, rounds: 0, maxCalls: 0 };

  const burst = (x: number, y: number, n: number): void => {
    if (stage.reduced) return;
    for (let i = 0, k = 0; i < parts.length && k < n; i++) {
      const p = parts[i]; if (p.life > 0) continue;
      p.x = x; p.y = y; p.vx = (Math.random() - 0.5) * 90; p.vy = -20 - Math.random() * 60; p.life = 500 + Math.random() * 300; p.c = (Math.random() * PCOL.length) | 0; k++;
    }
  };

  // ------------------------------------------------------------------ Ask board
  const tileX = (i: number): number => Math.round(stage.W / 2 + (i - 1) * (TILE + 14));
  const TILE_Y = 76;
  const openAsk = (): void => {
    strip = shelfStrip(kit, [...DASH_ANIMALS], api.levelOf);
    hot = -1; friend = ''; hintOn = false;
    world = new DashWorld(bodyOf('hen'), Math.random); world.items.forEach((i) => { i.on = false; });
    api.caption('dash.friend', 3000);
  };

  const begin = (animal: string): void => {
    friend = animal;
    round.begin(animal);
    world = new DashWorld(bodyOf(animal), Math.random);
    friendImgs = poses.get(animal)!; friendShadow = shadows.get(animal)!; friendPips = pips.get(animal)!;
    foodImg = foodIcon.get(foodOf(animal))!; decoyImgs = decoysOf(animal).map((f) => foodIcon.get(f)!);
    didHop = false; didDuck = false; meetStart = false; enterT = 0; feedT = 0; rounds++; stats.rounds = rounds;
    hintOn = firstTimer && rounds === 1; // arrows only on the very first run of a new player; after that nothing glows
    cue(START[animal], CAPTION.start);
  };

  const pickTile = (i: number): void => {
    if (round.phase !== Ph.Ask || i < 0 || i >= DASH_ANIMALS.length) return;
    const id = DASH_ANIMALS[i];
    audio.animal(id); burst(tileX(i), TILE_Y, 6);
    begin(id);
  };

  // ------------------------------------------------------------------ actions
  const doHop = (): void => {
    if (round.phase === Ph.Ask || round.phase === Ph.Reveal) return;
    if (world.runner.hop()) { didHop = true; cue(HOP[friend], CAPTION.hop, 700); }
  };
  const duckOn = (): void => {
    if (round.phase !== Ph.Trail) return;
    if (!world.runner.duckHeld) { world.runner.setDuck(true); didDuck = true; cue(DUCK, CAPTION.duck, 700); }
  };
  const duckOff = (): void => world.runner.setDuck(false);

  const gotFull = (): void => {
    world.settle();
    meetStart = true; enterT = 0; feedT = 0; hintOn = false;
    world.runner.setDuck(false);
    cue(MEET, CAPTION.meet); api.caption('dash.look', 3000);
    if (world.ownAhead() === 0) world.putLeftover(); // the 6th: it drifts past a full basket, a choice and never a penalty
  };
  const doFeed = (): boolean => {
    if (!round.feed()) return false;
    cue(FEED, CAPTION.feed, 600); burst(RUNNER_X + 6, GROUND_Y - 30, 8);
    return true;
  };

  // ------------------------------------------------------------------ update
  const step = (h: number): void => {
    if (auto && round.phase === Ph.Trail) autopilot(world, 0);
    world.tick(h);
    const ev = world.events;
    for (let i = 0; i < ev.length; i++) {
      const e = ev[i];
      if (e === EV.Own) {
        if (round.pickup()) {
          cue(PICKUP[round.food][(round.carried - 1) % 5], CAPTION.pickup, 900);
          burst(RUNNER_X + 6, GROUND_Y - world.runner.offset - 24, 4);
          if (round.phase === Ph.Meet) gotFull();
        }
      } else if (e === EV.Hit) {
        const dropped = round.stumble();
        cue(STUMBLE, CAPTION.stumble, 600); burst(RUNNER_X, GROUND_Y - 24, dropped ? 8 : 4);
      } else if (e === EV.Star) {
        round.findSecret(); burst(RUNNER_X + 6, GROUND_Y - world.runner.offset - 28, 12); cue(STAR, CAPTION.star, 600);
      } else if (e === EV.Left) round.leave();
    }
  };
  const update = (dt: number): void => {
    const ph = round.phase;
    if (shelfBounce > 0) shelfBounce -= dt;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]; if (p.life <= 0) continue;
      p.life -= dt; p.x += (p.vx * dt) / 1000; p.y += (p.vy * dt) / 1000; p.vy += (160 * dt) / 1000;
    }
    if (ph === Ph.Trail || ph === Ph.Meet) {
      let left = dt * (stage.reduced ? TIME_REDUCED : 1);
      while (left > 0) { const h = left > 25 ? 25 : left; step(h); left -= h; } // small steps: a fast frame never skips an obstacle
      if (ph === Ph.Meet || round.phase === Ph.Meet) {
        enterT += dt;
        if (round.fed) feedT += dt;
      }
    }
    if (round.tick(dt) && round.phase === Ph.Reveal && !revealing) {
      revealing = true;
      const res = round.result();
      api.reveal(res.friend, { quick: true }).catch((e) => console.error(e)).then(() => {
        revealing = false;
        if (dead) return;
        try { getBadgeStore().award(res.friend, res.badges); } catch { /* badges are optional */ }
        lastNow = 0; shelfBounce = 500; round.next(); openAsk();
      });
    }
  };

  // ------------------------------------------------------------------ render
  const wrapDraw = (g: CanvasRenderingContext2D, img: Cv, off: number, y: number): number => {
    const o = -Math.round(((off % T) + T) % T);
    g.drawImage(img, o, y); g.drawImage(img, o + T, y);
    return 2;
  };
  const itemSprite = (it: Item): Cv => {
    if (it.kind === K.Low) return obs.low[it.variant];
    if (it.kind === K.High) return obs.high[it.variant];
    if (it.kind === K.Star) return star;
    return it.own ? foodImg : decoyImgs[it.decoy];
  };
  const render = (g: CanvasRenderingContext2D, now: number): void => {
    const W = stage.W;
    let n = 0;
    const ph = round.phase;
    const sc = ph === Ph.Ask ? 0 : world.distance;
    n += wrapDraw(g, far, sc * 0.2, 0);
    n += wrapDraw(g, mid, sc * 0.55, MID_Y);
    n += wrapDraw(g, gnd, sc, GROUND_TOP);

    if (ph === Ph.Ask) {
      for (let i = 0; i < DASH_ANIMALS.length; i++) {
        const id = DASH_ANIMALS[i], on = i === hot;
        const bob = stage.reduced ? 0 : Math.round(Math.sin(now / 300 + i * 1.7) * 2);
        g.drawImage(tiles.get(on ? id + '!' : id)!, tileX(i) - TILE / 2, TILE_Y - TILE / 2 + bob); n++;
      }
      g.drawImage(strip, SHELF_X, SHELF_Y); n++;
      for (let i = 0; i < parts.length && n < MAX_CALLS; i++) {
        const p = parts[i]; if (p.life <= 0) continue;
        g.fillStyle = PCOL[p.c]; g.fillRect(Math.round(p.x), Math.round(p.y), 3, 3); n++;
      }
      calls = n; return;
    }

    const r = world.runner;
    // items: obstacles hang or sit, food and the star float
    for (let i = 0; i < world.items.length; i++) {
      const it = world.items[i]; if (!it.on || it.x > W + 24) continue;
      const s = itemSprite(it), x = Math.round(it.x - s.width / 2);
      if (it.kind === K.Low) g.drawImage(s, x, GROUND_Y - s.height + (it.variant === 0 ? 4 : 1));
      else if (it.kind === K.High) g.drawImage(s, x, BEAM_Y);
      else {
        const cy = it.kind === K.Star ? STAR_Y : it.slot === 0 ? HOP_Y : DUCK_Y;
        const bob = stage.reduced ? 0 : Math.round(Math.sin(now / 240 + it.ph) * 2);
        g.drawImage(s, x, GROUND_Y - cy - s.height / 2 + bob);
      }
      n++;
    }
    // the runner: a hard shadow stays on the ground while the animal hops
    const happy = ph === Ph.Meet || ph === Ph.Reveal;
    const pose = happy && r.grounded ? POSE.Happy : r.pose;
    const shake = r.stumbling && !stage.reduced ? Math.round(Math.sin(r.stumble / 35) * 2) : 0;
    const bounce = round.fed && !stage.reduced ? -Math.round(Math.abs(Math.sin(feedT / 90)) * 4) : 0;
    g.drawImage(friendShadow, Math.round(RUNNER_X - friendShadow.width / 2) - 1, GROUND_Y - 1); n++;
    g.drawImage(friendImgs[pose], RUNNER_X - RUNNER_PX / 2 + shake, GROUND_Y - RUNNER_BASE - Math.round(r.offset) + bounce); n++;

    if (happy) { // the basket sits beside the animal; the child taps either to feed
      const k = Math.min(1, enterT / 500), bx = Math.round(BASKET_X + (1 - k) * 70);
      g.drawImage(basket[2], bx - 20, GROUND_Y - 34 + 2); n++;
      if (ph === Ph.Meet && round.fed) {
        const f = Math.min(1, feedT / 500);
        g.drawImage(foodImg, Math.round(bx + (RUNNER_X + 12 - bx) * f - 9), Math.round(GROUND_Y - 30 - Math.sin(f * Math.PI) * 22)); n++;
      } else if (!round.fed && k >= 1 && !stage.reduced && firstTimer && rounds === 1) { // run one only: pulse the food over the basket. After that nothing glows
        const o = Math.round(Math.abs(Math.sin(now / 280)) * 3);
        g.drawImage(foodImg, bx - 9, GROUND_Y - 58 - o); n++;
      }
    }
    if (hintOn && ph === Ph.Trail && !stage.reduced) { // run one only, until the child has tried both moves: an arrow when the matching obstacle is near
      let next: Item | null = null;
      for (let i = 0; i < world.items.length; i++) { const it = world.items[i]; if (it.on && !it.done && (it.kind === K.Low || it.kind === K.High) && it.x > RUNNER_X && (!next || it.x < next.x)) next = it; }
      if (next && next.x < RUNNER_X + 100) {
        const o = Math.round(Math.abs(Math.sin(now / 300)) * 3);
        if (next.kind === K.Low && !didHop) { g.drawImage(arrowUp, RUNNER_X - 8, GROUND_Y - RUNNER_BASE - 8 - o); n++; }
        else if (next.kind === K.High && !didDuck) { g.drawImage(arrowDown, RUNNER_X - 8, GROUND_Y - RUNNER_BASE - 8 - o); n++; }
      }
    }
    // HUD: the shelf and the basket pips
    const sb = shelfBounce > 0 && !stage.reduced ? -Math.round(Math.sin((shelfBounce / 500) * 3.14) * 3) : 0;
    g.drawImage(strip, SHELF_X, SHELF_Y + sb); n++;
    g.drawImage(friendPips[Math.min(5, round.carried)], W - hudW - 72, 2); n++;
    for (let i = 0; i < parts.length && n < MAX_CALLS; i++) {
      const p = parts[i]; if (p.life <= 0) continue;
      g.fillStyle = PCOL[p.c]; g.fillRect(Math.round(p.x), Math.round(p.y), 3, 3); n++;
    }
    calls = n;
  };

  stage.draw = (g, now) => {
    let dt = lastNow ? now - lastNow : 33; lastNow = now;
    if (dt > 100) dt = 100;
    update(dt);
    render(g, now);
    if (calls > maxCalls) maxCalls = calls;
    stats.frames++; stats.maxCalls = maxCalls;
    stage.invalidate();
  };
  openAsk();
  stage.invalidate();

  // ------------------------------------------------------------------ input
  const logical = (e: PointerEvent): { x: number; y: number } => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * stage.W, y: ((e.clientY - r.top) / r.height) * stage.H };
  };
  const tileAt = (x: number, y: number): number => {
    for (let i = 0; i < DASH_ANIMALS.length; i++) {
      const hx = Math.max(TILE / 2 + 5, 24 / stage.scale), hy = Math.max(TILE / 2 + 8, 24 / stage.scale); // never smaller than 48 device px
      if (Math.abs(x - tileX(i)) <= hx && Math.abs(y - TILE_Y) <= hy) return i;
    }
    return -1;
  };
  /** The animal or the basket: either is a feed tap (at least 48 device px wide, whatever the scale). */
  const onFeeder = (x: number, y: number): boolean => {
    const pad = Math.max(0, 24 / stage.scale - 14);
    const onAnimal = Math.abs(x - RUNNER_X) <= 24 + pad && y >= GROUND_Y - 44 - pad && y <= GROUND_Y + 6 + pad;
    const onBasket = Math.abs(x - BASKET_X) <= 24 + pad && y >= GROUND_Y - 36 - pad && y <= GROUND_Y + 6 + pad;
    return onAnimal || onBasket;
  };
  container.style.touchAction = 'none';
  let pDown = false, pDucked = false, pY = 0, holdTimer = 0, keyDuck = false;
  const clearHold = (): void => { if (holdTimer) { clearTimeout(holdTimer); holdTimer = 0; } };
  const onDown = (e: PointerEvent): void => {
    if (e.target !== container || api.isRevealing()) return;
    try { container.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    const p = logical(e);
    if (round.phase === Ph.Ask) { hot = tileAt(p.x, p.y); if (hot >= 0) pickTile(hot); return; }
    if (round.phase === Ph.Meet) { if (round.fed) return; if (onFeeder(p.x, p.y)) doFeed(); else doHop(); return; }
    if (round.phase !== Ph.Trail) return;
    pDown = true; pDucked = false; pY = p.y; hintOn = hintOn && !(didHop && didDuck);
    clearHold(); holdTimer = window.setTimeout(() => { holdTimer = 0; if (pDown && !pDucked) { pDucked = true; duckOn(); } }, HOLD_MS);
  };
  const onMove = (e: PointerEvent): void => {
    if (e.target !== container || api.isRevealing()) return;
    const p = logical(e);
    if (round.phase === Ph.Ask) { hot = tileAt(p.x, p.y); return; }
    if (pDown && !pDucked && p.y - pY > SWIPE_PX) { pDucked = true; clearHold(); duckOn(); } // a swipe down ducks at once
  };
  const onUp = (): void => {
    if (!pDown) return;
    pDown = false; clearHold();
    if (pDucked) { pDucked = false; if (!keyDuck) duckOff(); } else doHop(); // a quick tap hops, on release
  };
  container.addEventListener('pointerdown', onDown);
  container.addEventListener('pointermove', onMove);
  container.addEventListener('pointerup', onUp);
  container.addEventListener('pointercancel', onUp);

  const onKey = (e: KeyboardEvent): void => {
    if (api.isRevealing() || document.querySelector('.parent')) return;
    if (round.phase === Ph.Ask) {
      if (e.key === '1' || e.key === '2' || e.key === '3') { pickTile(+e.key - 1); e.preventDefault(); }
      return;
    }
    if (round.phase === Ph.Meet && !round.fed && (e.key === ' ' || e.key === 'Enter')) { doFeed(); e.preventDefault(); return; }
    if (e.repeat) { if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); return; }
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') { doHop(); e.preventDefault(); }
    else if (e.key === 'ArrowDown' || e.key === 's') { keyDuck = true; duckOn(); e.preventDefault(); }
  };
  const onKeyUp = (e: KeyboardEvent): void => { if (e.key === 'ArrowDown' || e.key === 's') { keyDuck = false; if (!pDucked) duckOff(); } };
  const onBlur = (): void => { keyDuck = false; pDown = false; pDucked = false; clearHold(); duckOff(); };
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.focus({ preventScroll: true });

  // ------------------------------------------------------------------ debug hooks (?debug)
  if (debug) {
    const w = window as unknown as Record<string, unknown>;
    w.__dash = {
      stats, round, bodyOf,
      get world() { return world; },
      get state() {
        const r = world.runner;
        return {
          phase: round.phase, friend, carried: round.carried, food: round.food, stumbles: round.stumbles, spills: round.spills, left: round.left, fed: round.fed,
          secret: round.secretFound, badges: round.result().badges, pose: r.pose, offset: Math.round(r.offset), ducking: r.ducking, stumbling: r.stumbling, speed: Math.round(world.speed),
          t: Math.round(world.t), rounds, calls, maxCalls, owned: api.owned(), items: world.items.filter((i) => i.on).map((i) => [i.kind, Math.round(i.x), i.slot, i.own ? 1 : 0]),
        };
      },
      pickTile,
      go(animal: string) { begin(animal); return true; },
      hop() { doHop(); }, duck(on: boolean) { if (on) duckOn(); else duckOff(); },
      /** autopilot on/off: plays like a calm child (hops and ducks at the right moments) */
      setAuto(on: boolean) { auto = on; },
      fill() { for (let i = 0; i < round.opts.need && round.phase === Ph.Trail; i++) round.pickup(); if (round.phase === Ph.Meet && !meetStart) gotFull(); },
      feed() { return doFeed(); },
      /** run the simulation for `ms` of game time in small steps (the dev pane draws at ~1 fps) */
      sim(ms: number, h = 16) { for (let t = 0; t < ms; t += h) update(h); stage.invalidate(); },
      /** move the nearest item of a kind (0 low, 1 high, 2 food, 3 star) right in front of the runner, e.g. to test a hit */
      bring(kind: number, dx = 40) { const it = world.items.filter((i) => i.on && i.kind === kind && !i.done).sort((a, b) => a.x - b.x)[0]; if (it) it.x = RUNNER_X + dx; return !!it; },
      obstacles: OBSTACLES,
    };
  }

  return () => {
    dead = true;
    clearHold();
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    setCaptionStyle({});
    canvas.setAttribute('aria-label', oldLabel);
    if (debug) delete (window as unknown as Record<string, unknown>).__dash;
  };
}
