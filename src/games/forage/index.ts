// FORAGE TRAIL (Jungle, v1): friend-first.
//   ASK   pick a hungry friend, then (optionally) a buddy to bring along
//   TRAIL a three-lane path; a fork picks the route; fill the basket with THAT friend's food. The food behaves its own way
//   MEET  basket full (holds 5, the trail offers 6): the friend steps out; the run ends ONLY when the child taps the friend or basket to feed it.
//         A 6th food can be left on the trail: no penalty, no slowdown.     REVEAL  the quick card reveal, then badges
// No timers, lives or fail screens: a bump spills one item and the basket wobbles, nothing more. Every trail completes with no buddy;
// Gajju's trunk and Bunty's climb only add an optional shortcut gate (V1_BRIEF).
// Draw budget: <= 25 canvas calls per frame, no allocation in the frame loop.
import { registerGame, type GameApi } from '../../app/registry';
import { effectOf } from '../../cards/abilities';
import { getBadgeStore } from '../../cards/badges';
import { abilityOf, shelfCards } from '../../cards/data';
import { setCaptionStyle } from '../../ui/captions';
import type { Recipe } from '../../audio/recipes';
import {
  FAR_H, GND_H, basketImages, bushSprite, butterflies, farLayer, flowerSprite, foodBadge, groundLayer, hazardSprites, routeSign,
  secretSprite, shelfStrip, shortcutSprites, tile, vectorAnimal, type Biome,
} from './art';
import {
  BASKET_X, BEHAVIOUR_OF, captionGate, DEFAULT_ROUND, FOODS, LANE_Y, Ph, ROUTE, ROUTES, Round, foodOf, laneAt, newWaitingMemory,
  pickBuddies, pickLane, pickWaiting, rollSpawn, secretChance, shortcutOf, topFor, V1_ANIMALS, type FoodId,
} from './logic';
import { hasVector, POSES, type Pose } from './sprites';
import { BUDDY, BUMP, CAPTION, FEED, MEET, PICKUP, RUSTLE, SECRET, SHORTCUT_SFX, STING, STREAK } from './sounds';

const BX = BASKET_X;
const SPEED = 48; // px per second
const MAX_CALLS = 25;
const K_FOOD = 0, K_GIFT = 1, K_HAZARD = 2, K_SECRET = 3, K_GATE = 4; // K_GATE: Gajju's high branch / Bunty's vine
const ITEM_POOL = 10, PART_POOL = 12;
const SHELF_X = 36, SHELF_Y = 2;
const PCOL = ['#ffd93d', '#ff7aa8', '#7fe0ff', '#9be564', '#ffffff'];
const TILE = 52;
const ANIMAL_PX = 40, BUDDY_PX = 24; // sprite sizes on the tile / trail, and the buddy riding the basket

interface Item { x: number; lane: number; kind: number; on: boolean; ph: number; sub: number; hopped: boolean }
interface Part { x: number; y: number; vx: number; vy: number; life: number; c: number }

registerGame({
  id: 'forage',
  shelf: 'jungle',
  start(container, api) { return startForage(container, api); },
});

function startForage(container: HTMLElement, api: GameApi): () => void {
  const { stage, kit, audio } = api;
  const debug = new URLSearchParams(location.search).has('debug');
  let dead = false;

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
  const [thorn, bee] = hazardSprites();
  const secret = secretSprite();
  const gates = shortcutSprites();
  const badges = icons.map((ic) => foodBadge(ic));
  const signs = ROUTES.map((r) => routeSign(r, 1));
  const signsBig = ROUTES.map((r) => routeSign(r, 1.1));
  const basket = basketImages();
  const bush = bushSprite();
  const fly = butterflies();
  const WILD = shelfCards('jungle').map((c) => c.id).filter((id) => V1_ANIMALS.includes(id)); // lion and tiger: card data kept, never offered or shown in v1
  let strip = shelfStrip(kit, WILD, api.levelOf);
  const soloTile = tile(basket[0], TILE);
  const soloTileHot = tile(basket[2], TILE, true);
  const tileCache = new Map<string, HTMLCanvasElement>();
  // flat-vector animals (sprites.ts): rendered once per (animal, pose, size) here, never in the frame loop. Others use the kit sprite.
  const vecCache = new Map<string, HTMLCanvasElement>();
  const animalImg = (id: string, size: number, pose: Pose = 0): HTMLCanvasElement => {
    const k = id + ':' + pose + ':' + size;
    let c = vecCache.get(k);
    if (!c) { c = (hasVector(id) ? vectorAnimal(id, pose, size) : null) ?? kit.animal(id, size); vecCache.set(k, c); }
    return c;
  };
  for (const id of WILD) for (const pose of POSES) { animalImg(id, ANIMAL_PX, pose); animalImg(id, BUDDY_PX, pose); }
  const animalTile = (id: string, hot: boolean): HTMLCanvasElement => {
    const k = id + (hot ? '!' : '');
    let c = tileCache.get(k);
    if (!c) { c = tile(animalImg(id, ANIMAL_PX), TILE, hot); tileCache.set(k, c); }
    return c;
  };
  // cues: a sound plus its caption, throttled so a run of pickups does not flood the captions
  const lastCap = new Map<string, number>();
  const cue = (r: Recipe, key: string, gap = 1800): void => audio.play(r, captionGate(lastCap, key, performance.now(), gap) ? key : undefined);

  // scenery: tile-wrapped, rebuilt when the canvas width changes
  let T = 0;
  let gnd = groundLayer(240);
  const farCache = new Map<Biome, HTMLCanvasElement>();
  let farCur: Biome = 'jungle';
  const far = (b: Biome): HTMLCanvasElement => {
    let c = farCache.get(b);
    if (!c) { c = farLayer(b, T); farCache.set(b, c); }
    return c;
  };
  const hudEl = document.getElementById('hud');
  let hudW = 0;
  const measureHud = (): void => { hudW = hudEl ? Math.ceil(hudEl.offsetWidth / stage.scale) + 3 : 0; };
  const checkSize = (): void => {
    if (T === stage.W) return;
    measureHud(); T = stage.W; gnd = groundLayer(T); farCache.clear(); far(farCur);
  };
  measureHud();

  // ------------------------------------------------------------------ state (preallocated)
  const items: Item[] = [];
  for (let i = 0; i < ITEM_POOL; i++) items.push({ x: 0, lane: 0, kind: 0, on: false, ph: 0, sub: 0, hopped: false });
  const parts: Part[] = [];
  for (let i = 0; i < PART_POOL; i++) parts.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, c: 0 });
  const sign = { x: 0, on: false, done: false };
  const round = new Round({ ...DEFAULT_ROUND });
  const mem = newWaitingMemory();
  const ownedSet = new Set<string>();
  const owned = (): void => { ownedSet.clear(); for (const id of api.owned()) ownedSet.add(id); };
  owned();
  const firstTimer = !api.owned().some((id) => WILD.includes(id));

  let offers: string[] = ['', '', ''];
  let buddyOffers: string[] = [];
  let askStep = 0; // 0 pick a friend, 1 pick a buddy
  let pickedFriend = '';
  let hot = -1; // tile under the finger
  let lane = 1, basketY = LANE_Y[1];
  let scrollX = 0, speedK = 1, lastNow = 0, blinkT = 3000, hop = 0, wobble = 0, shelfBounce = 0, stickT = 0;
  let friendImgs: HTMLCanvasElement[] = [], buddyImgs: HTMLCanvasElement[] = [];
  let spawnT = 0, sinceHit = 0, secretT = -1, gateT = -1, meetHello = false;
  let moved = !firstTimer, hintOn = firstTimer, revealing = false, meetStart = false, feedT = 0, enterT = 0;
  let calls = 0, maxCalls = 0, rounds = 0, lastCarried = 0;
  const stats = { frames: 0, drawMs: 0, drawMax: 0, maxCalls: 0, rounds: 0 };

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
    if (round.phase !== Ph.Trail && !(round.phase === Ph.Meet && !round.fed)) return;
    if (l < 0) l = 0; else if (l > 2) l = 2;
    if (l === lane) return;
    lane = l; moved = true; hintOn = false; audio.sfx('hop');
  };
  /** `fixed` keeps a food in its lane (shortcut patterns and the 6th food do not bounce away). */
  const spawn = (kind: number, l: number, sub = 0, dx = 0, fixed = false): void => {
    for (let i = 0; i < items.length; i++) {
      const it = items[i]; if (it.on) continue;
      it.on = true; it.x = stage.W + 18 + dx; it.lane = l; it.kind = kind; it.sub = sub; it.hopped = fixed; it.ph = Math.random() * 6;
      if (kind === K_FOOD) round.offer();
      return;
    }
  };
  const clearItems = (): void => { for (let i = 0; i < items.length; i++) items[i].on = false; };

  // ------------------------------------------------------------------ the Ask board
  const openAsk = (): void => {
    owned(); strip = shelfStrip(kit, WILD, api.levelOf);
    const w = pickWaiting(ownedSet, mem, Math.random);
    offers = [w[0], w[1], w[2]];
    askStep = 0; pickedFriend = ''; hot = -1; farCur = 'jungle'; far('jungle');
    clearItems(); sign.on = false; sign.done = false; speedK = 1; lane = 1; basketY = LANE_Y[1];
    api.caption('forage.friend', 3000);
  };
  const tilesNow = (): string[] => (askStep === 0 ? offers : [...buddyOffers, '']); // '' = go solo
  const tileX = (i: number, n: number): number => Math.round(stage.W / 2 + (i - (n - 1) / 2) * (TILE + 12));
  const tileY = (): number => 78;

  const begin = (buddy: string | null): void => {
    const effect = effectOf(buddy, abilityOf);
    round.begin(pickedFriend, buddy, effect);
    friendImgs = POSES.map((p) => animalImg(pickedFriend, ANIMAL_PX, p)); // resolved once per run: the frame loop never builds keys
    buddyImgs = buddy ? POSES.map((p) => animalImg(buddy, BUDDY_PX, p)) : [];
    farCur = foodOf(pickedFriend) as Biome; far(farCur);
    clearItems(); sign.on = false; sign.done = false; speedK = 1; spawnT = -600; sinceHit = 0; secretT = -1; gateT = -1;
    meetStart = false; feedT = 0; lastCarried = 0; stickT = 0;
    lane = 1; basketY = LANE_Y[1]; rounds++; stats.rounds = rounds;
    cue(STING[round.food], CAPTION.sting);
  };

  const pickTile = (i: number): void => {
    const list = tilesNow();
    if (i < 0 || i >= list.length) return;
    if (askStep === 0) {
      pickedFriend = list[i]; audio.animal(pickedFriend); audio.sfx('pop'); burst(tileX(i, list.length), tileY(), 6);
      owned();
      buddyOffers = pickBuddies(pickedFriend, mem, Math.random);
      mem.lastFriend = pickedFriend;
      if (!buddyOffers.length) { begin(null); return; }
      askStep = 1; hot = -1; api.caption('forage.buddy', 3000);
    } else {
      const b = list[i] || null;
      if (b) { mem.lastBuddy = b; audio.animal(b); cue(BUDDY, CAPTION.buddy); }
      audio.sfx('pop'); begin(b);
    }
  };

  // ------------------------------------------------------------------ update
  const speedOf = (): number => (round.routeChosen ? ROUTE[round.route].speed : 1);
  const update = (dt: number): void => {
    const ph = round.phase;
    const sp = SPEED * speedOf() * speedK * (stage.reduced ? 0.6 : 1);
    if (ph === Ph.Trail || ph === Ph.Meet) scrollX = (scrollX + (sp * dt) / 1000) % 100000;
    const heavy = ph === Ph.Trail && BEHAVIOUR_OF[round.food] === 'heavy';
    basketY += (LANE_Y[lane] - basketY) * Math.min(1, dt / (heavy ? 170 : 70));
    blinkT -= dt; if (blinkT < -140) blinkT = 2500 + Math.random() * 2500;
    if (hop > 0) hop -= dt;
    if (wobble > 0) wobble -= dt;
    if (shelfBounce > 0) shelfBounce -= dt;
    if (stickT > 0) { stickT -= dt; speedK = stickT > 0 ? 0.55 : 1; }
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]; if (p.life <= 0) continue;
      p.life -= dt; p.x += (p.vx * dt) / 1000; p.y += (p.vy * dt) / 1000; p.vy += (160 * dt) / 1000;
    }

    if (ph === Ph.Trail) {
      for (let i = 0; i < items.length; i++) {
        const it = items[i]; if (!it.on) continue;
        it.x -= (sp * dt) / 1000;
        if (it.x < -20) { it.on = false; continue; }
        // fruit bounces once to another lane before it reaches the basket: it has to be chased
        if (it.kind === K_FOOD && !it.hopped && BEHAVIOUR_OF[round.food] === 'bounce' && it.x < stage.W * 0.55) {
          it.hopped = true; it.lane = (it.lane + 1 + ((Math.random() * 2) | 0)) % 3;
        }
        if (it.lane === lane && it.x < BX + 18 && it.x > BX - 18) {
          it.on = false; sinceHit = 0;
          if (it.kind === K_FOOD) {
            hop = 160; burst(BX + 8, LANE_Y[lane] - 6, 3);
            if (!round.pickup()) continue;
            const c = round.carried;
            cue(PICKUP[round.food][(c - 1) % 5], CAPTION.pickup, 2500);
            if (BEHAVIOUR_OF[round.food] === 'sticky') { stickT = 650; }
            if (c % 3 === 0 && c < round.opts.need) { cue(STREAK, CAPTION.streak); burst(BX + 8, LANE_Y[lane] - 14, 8); }
          } else if (it.kind === K_GIFT) {
            hop = 160; burst(BX + 8, LANE_Y[lane] - 6, 5); audio.sfx('sparkle');
          } else if (it.kind === K_GATE) { // the buddy's optional shortcut: lay down a pattern the other trails never have
            const def = shortcutOf(round.effect);
            if (def && round.takeShortcut()) {
              hop = 220; burst(BX + 8, LANE_Y[lane] - 12, 10); cue(SHORTCUT_SFX, CAPTION.shortcut, 600);
              for (const p of def.pattern) spawn(K_FOOD, p.lane, 0, p.dx, true);
            }
          } else if (it.kind === K_SECRET) {
            round.findSecret(); burst(BX + 8, LANE_Y[lane] - 12, 12); cue(SECRET, CAPTION.secret, 600);
          } else { // hazard: a funny wobble, a spill, nothing lost for good
            wobble = 450; round.bump(); cue(BUMP, CAPTION.bump, 600); burst(BX + 8, LANE_Y[lane] - 10, 5);
          }
        }
      }
      if (round.phase === Ph.Trail) {
        // the fork
        if (!sign.done && !sign.on && round.t >= round.opts.forkAt) {
          sign.on = true; sign.x = stage.W + 30;
          if (firstTimer && rounds === 1) { moved = false; hintOn = true; }
        }
        if (sign.on) {
          sign.x -= (sp * dt) / 1000;
          if (sign.x <= BX + 22) {
            sign.on = false; sign.done = true;
            round.chooseRoute(ROUTES[lane]); hop = 220; burst(BX + 8, LANE_Y[lane] - 6, 7);
            secretT = Math.random() < secretChance(round.route, round.effect) ? 2500 + Math.random() * 2000 : -1;
            gateT = shortcutOf(round.effect) ? 1400 : -1;
            spawnT = -700;
          }
        }
        if (gateT >= 0) { gateT -= dt; if (gateT < 0) { const def = shortcutOf(round.effect); if (def) spawn(K_GATE, def.gateLane); gateT = -1; } }
        if (secretT >= 0) { secretT -= dt; if (secretT < 0) { spawn(K_SECRET, pickLane(lane, Math.random)); secretT = -1; } }
        // spawns: wanted food, gifts, hazards, as the route says. Never allocate here
        spawnT += dt; sinceHit += dt;
        if (spawnT > (BEHAVIOUR_OF[round.food] === 'scatter' ? 1500 : 1250)) {
          spawnT = -((Math.random() * 250) | 0);
          let kind = rollSpawn(round.route, round.effect, Math.random);
          if (kind === 'hazard' && !round.routeChosen) kind = 'gift'; // gentle before the fork
          const l = sinceHit > 8000 ? lane : pickLane(lane, Math.random);
          if (sinceHit > 8000) sinceHit = 4000; // a helper after a dry spell
          if (kind === 'food') {
            spawn(K_FOOD, l);
            if (BEHAVIOUR_OF[round.food] === 'scatter') spawn(K_FOOD, (l + 1 + ((Math.random() * 2) | 0)) % 3, 0, 14); // seeds scatter: more, but spread out
          } else if (kind === 'gift') spawn(K_GIFT, l, Math.random() < 0.5 ? 0 : 1);
          else spawn(K_HAZARD, l, round.food === 'honey' ? 1 : 0);
        }
        if (round.carried !== lastCarried) lastCarried = round.carried;
      }
    }
    if (round.phase === Ph.Meet) {
      if (!meetStart) {
        meetStart = true; meetHello = false; sign.on = false; enterT = 0; hop = 200; hintOn = false; cue(RUSTLE, CAPTION.rustle); api.caption('forage.look', 3000);
        // basket full: only wanted food stays on the trail. Make sure a 6th is there to be left (a choice, never a penalty)
        let foods = 0;
        for (let i = 0; i < items.length; i++) { const it = items[i]; if (!it.on) continue; if (it.kind === K_FOOD) { foods++; it.sub = 0; } else it.on = false; }
        for (let k = 0, owe = Math.max(round.owesFood(), foods ? 0 : 1); k < owe; k++) spawn(K_FOOD, (lane + 1 + ((Math.random() * 2) | 0)) % 3, 0, k * 40, true);
      }
      // food still drifting by is left where it is: counted, never punished
      for (let i = 0; i < items.length; i++) {
        const it = items[i]; if (!it.on) continue;
        it.x -= (sp * dt) / 1000;
        if (it.x < -20) it.on = false;
        else if (it.sub === 0 && it.x < BX - 18) { it.sub = 1; round.leave(); }
      }
      enterT += dt;
      if (!meetHello && enterT >= 650) { meetHello = true; cue(MEET, CAPTION.meet); }
      speedK = Math.max(0.5, speedK - dt / 600); // the world eases, the basket does not
      if (round.fed) feedT += dt;
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

  // ------------------------------------------------------------------ render (no allocation; counts its calls)
  const region = (g: CanvasRenderingContext2D, img: HTMLCanvasElement, fo: number, x0: number, x1: number): number => {
    let n = 0;
    for (let k = 0; k < 2; k++) {
      const ox = fo + k * T, a = x0 > ox ? x0 : ox, b = x1 < ox + T ? x1 : ox + T;
      if (b > a) { g.drawImage(img, a - ox, 0, b - a, FAR_H, a, 0, b - a, FAR_H); n++; }
    }
    return n;
  };
  const itemImg = (it: Item): HTMLCanvasElement =>
    it.kind === K_FOOD ? icons[FOODS.indexOf(round.food as FoodId)] : it.kind === K_GATE ? gates[round.effect === 'trunk' ? 0 : 1] : it.kind === K_GIFT ? (it.sub ? flower : sparkIcon) : it.kind === K_SECRET ? secret : it.sub ? bee : thorn;

  const render = (g: CanvasRenderingContext2D, now: number): void => {
    const W = stage.W;
    let n = 0;
    const ph = round.phase;
    const fo = Math.round(-((scrollX * 0.35) % T)), go = Math.round(-(scrollX % T));
    n += region(g, far(farCur), fo, 0, W);
    g.drawImage(gnd, go, 30); g.drawImage(gnd, go + T, 30); n += 2;

    if (!stage.reduced) {
      for (let i = 0; i < 2; i++) {
        const bx = W + 20 - ((now * (0.011 + i * 0.004) + i * 130) % (W + 40));
        const by = 40 + i * 38 + Math.sin(now / 420 + i * 2) * 9;
        g.drawImage(fly[i][((now / (130 + i * 20)) | 0) % 2], Math.round(bx), Math.round(by)); n++;
      }
    }

    if (ph === Ph.Ask) {
      const list = tilesNow();
      for (let i = 0; i < list.length; i++) {
        const x = tileX(i, list.length), y = tileY(), on = i === hot;
        const bob = stage.reduced ? 0 : Math.round(Math.sin(now / 300 + i * 1.7) * 2);
        const img = list[i] ? animalTile(list[i], on) : on ? soloTileHot : soloTile;
        g.drawImage(img, x - TILE / 2, y - TILE / 2 + bob); n++;
      }
      // the shelf, so the child sees what is still missing
      g.drawImage(strip, SHELF_X, SHELF_Y); n++;
      for (let i = 0; i < parts.length && n < MAX_CALLS; i++) {
        const p = parts[i]; if (p.life <= 0) continue;
        g.fillStyle = PCOL[p.c]; g.fillRect(Math.round(p.x), Math.round(p.y), 3, 3); n++;
      }
      calls = n; return;
    }

    // items
    for (let i = 0; i < items.length; i++) {
      const it = items[i]; if (!it.on) continue;
      const s = itemImg(it), h = s.height;
      const bob = stage.reduced ? 0 : Math.round(Math.sin(now / 220 + it.ph) * 2);
      g.drawImage(s, Math.round(it.x - s.width / 2), topFor(LANE_Y[it.lane], h) + bob); n++;
    }
    // route signs: the board in the basket's lane is a little bigger
    if (sign.on) {
      for (let l = 0; l < 3; l++) {
        const img = l === lane ? signsBig[l] : signs[l];
        g.drawImage(img, Math.round(sign.x - img.width / 2), topFor(LANE_Y[l], img.height)); n++;
      }
    }
    // the friend: steps out from the bush at Meet
    if (ph === Ph.Meet || ph === Ph.Reveal) {
      const k = Math.min(1, enterT / 700);
      g.drawImage(bush, W - 44, LANE_Y[1] - 30); n++;
      const fx = Math.round(W - 90 + (1 - k) * 60), fy = LANE_Y[1] - 38 + (round.fed ? -Math.round(Math.abs(Math.sin(feedT / 90)) * 4) : 0);
      g.drawImage(friendImgs[round.fed ? 1 : 0], fx, fy); n++;
      if (!round.fed && k >= 1 && !stage.reduced && firstTimer && rounds === 1) { // run one only: pulse the friend. After that nothing glows (brief criteria 1 and 8)
        const o = Math.round(Math.abs(Math.sin(now / 280)) * 3);
        g.drawImage(icons[FOODS.indexOf(round.food)], fx + 8, fy - 24 - o, 24, 24); n++;
      }
    }
    // basket (with a wobble when bumped) and the buddy riding on it
    const by = Math.round(basketY) + (hop > 0 && !stage.reduced ? -3 : 0);
    const wob = wobble > 0 && !stage.reduced ? Math.round(Math.sin(wobble / 28) * 3) : 0;
    const happy = ph === Ph.Meet || ph === Ph.Reveal;
    g.drawImage(basket[happy ? 2 : blinkT < 0 ? 1 : 0], BX - 20 + wob, topFor(by, 34)); n++;
    if (round.buddy && buddyImgs.length) { g.drawImage(buddyImgs[happy ? 1 : 0], BX - 12 + wob, topFor(by, 34) - 17); n++; }
    if (ph === Ph.Meet && round.fed) { // the food hops from the basket to the friend
      const k = Math.min(1, feedT / 500), s = 24;
      const fx = BX + (W - 90 + 8 - BX) * k, fy = by - 20 - Math.sin(k * Math.PI) * 24;
      g.drawImage(icons[FOODS.indexOf(round.food)], Math.round(fx), Math.round(fy), s, s); n++;
    }
    if (hintOn && ph === Ph.Trail && !stage.reduced) {
      const o = Math.round(Math.abs(Math.sin(now / 300)) * 4);
      g.fillStyle = '#ffffff';
      g.beginPath(); g.moveTo(BX, by - 26 - o); g.lineTo(BX - 7, by - 18 - o); g.lineTo(BX + 7, by - 18 - o); g.fill();
      g.beginPath(); g.moveTo(BX, by + 20 + o); g.lineTo(BX - 7, by + 12 + o); g.lineTo(BX + 7, by + 12 + o); g.fill(); n += 2;
    }
    // HUD
    const sb = shelfBounce > 0 && !stage.reduced ? -Math.round(Math.sin((shelfBounce / 500) * 3.14) * 3) : 0;
    g.drawImage(strip, SHELF_X, SHELF_Y + sb); n++;
    if (ph === Ph.Trail || ph === Ph.Meet) {
      g.drawImage(badges[FOODS.indexOf(round.food)], W - 34 - hudW, 2); n++;
      g.fillStyle = '#181020'; g.fillRect(W - 38 - hudW, 33, 38, 5);
      g.fillStyle = '#ffd93d'; g.fillRect(W - 37 - hudW, 34, Math.round((36 * round.carried) / round.opts.need), 3); n += 2;
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
    render(g, now);
    if (calls > maxCalls) maxCalls = calls;
    if (debug) {
      const d = performance.now() - t0;
      stats.frames++; stats.drawMs += d; if (d > stats.drawMax) stats.drawMax = d;
      if (realCalls > realMax) realMax = realCalls;
      stats.maxCalls = realMax;
    }
    stage.invalidate();
  };
  openAsk();
  checkSize();
  stage.invalidate();

  const doFeed = (): boolean => {
    if (!round.feed()) return false;
    cue(FEED, CAPTION.feed, 600); audio.sfx('pop'); burst(stage.W - 70, LANE_Y[1] - 20, 8);
    return true;
  };

  // ------------------------------------------------------------------ input
  // The game overlay sits over the canvas, so read pointer events from it (only when the touch is on the overlay, never a button).
  let downY = 0, swiped = false;
  const logical = (e: PointerEvent): { x: number; y: number } => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * stage.W, y: ((e.clientY - r.top) / r.height) * stage.H };
  };
  const tileAt = (x: number, y: number): number => {
    const list = tilesNow();
    for (let i = 0; i < list.length; i++) {
      const cx = tileX(i, list.length), cy = tileY();
      // never smaller than 48 device px, whatever the scale
      const hx = Math.max(TILE / 2 + 5, 24 / stage.scale), hy = Math.max(TILE / 2 + 8, 24 / stage.scale);
      if (Math.abs(x - cx) <= hx && Math.abs(y - cy) <= hy) return i;
    }
    return -1;
  };
  container.style.touchAction = 'none';
  const onDown = (e: PointerEvent): void => {
    if (e.target !== container || api.isRevealing()) return;
    try { container.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    const p = logical(e);
    if (round.phase === Ph.Ask) { hot = tileAt(p.x, p.y); if (hot >= 0) pickTile(hot); return; }
    if (round.phase === Ph.Meet) { if (round.fed) return; if (onFeeder(p.x, p.y)) doFeed(); else { downY = p.y; swiped = false; setLane(laneAt(downY)); } return; }
    downY = p.y; swiped = false;
    setLane(laneAt(downY));
  };
  /** The friend or the basket: either is a feed tap (at least 48 device px wide, whatever the scale). */
  const onFeeder = (x: number, y: number): boolean => {
    const pad = Math.max(0, 24 / stage.scale - 14);
    const fx = stage.W - 90, fy = LANE_Y[1] - 38;
    const onFriend = x >= fx - 6 - pad && x <= fx + ANIMAL_PX + 8 + pad && y >= fy - 26 - pad && y <= fy + ANIMAL_PX + 6 + pad;
    const onBasket = Math.abs(x - BX) <= 24 + pad && Math.abs(y - basketY) <= 22 + pad;
    return onFriend || onBasket;
  };
  const onMove = (e: PointerEvent): void => {
    if (e.target !== container || api.isRevealing()) return;
    const p = logical(e);
    if (round.phase === Ph.Ask) { hot = tileAt(p.x, p.y); return; }
    if (swiped || e.buttons === 0 || (round.phase !== Ph.Trail && round.phase !== Ph.Meet)) return;
    if (p.y - downY < -12) { swiped = true; setLane(lane - 1); } else if (p.y - downY > 12) { swiped = true; setLane(lane + 1); }
  };
  container.addEventListener('pointerdown', onDown);
  container.addEventListener('pointermove', onMove);
  const onKey = (e: KeyboardEvent): void => {
    if (api.isRevealing() || document.querySelector('.parent')) return;
    if (round.phase === Ph.Ask) {
      if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4') { pickTile(+e.key - 1); e.preventDefault(); }
      return;
    }
    if (round.phase === Ph.Meet && (e.key === ' ' || e.key === 'Enter')) { doFeed(); e.preventDefault(); return; }
    if (round.phase === Ph.Meet && round.fed) return;
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
      stats, round, items, mem,
      get state() { return { phase: round.phase, t: round.t, carried: round.carried, food: round.food, friend: round.friend, buddy: round.buddy, route: round.route, lane, rounds, calls, maxCalls, realMax, bumps: round.bumps, secret: round.secretFound, shortcut: round.shortcut, left: round.left, offered: round.offered, effect: round.effect, fed: round.fed, owned: api.owned() }; },
      setLane, pickTile,
      /** start a trail for an animal and optional buddy */
      go(friend: string, buddy: string | null = null) { pickedFriend = friend; begin(buddy); return true; },
      /** fill the basket: jump to the Meet beat */
      fill() { for (let i = 0; i < round.opts.need; i++) round.pickup(); },
      feed() { return doFeed(); },
      /** run the simulation for `ms` of game time in small steps (the dev pane draws at ~1 fps) */
      sim(ms: number, step = 33) { for (let t = 0; t < ms; t += step) update(step); stage.invalidate(); },
      /** steer the basket into the first on-screen item of a kind (0 food, 4 gate...) so a run can be driven without a finger */
      aim(kind: number) { const it = items.filter((i) => i.on && i.kind === kind).sort((x, y) => x.x - y.x)[0]; if (it) setLane(it.lane); return !!it; },
      /** jump to the fork so the route, and the buddy's shortcut gate, arrive without waiting */
      fork() { round.t = Math.max(round.t, round.opts.forkAt); },
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
