// PLAY YARD: the House door's game. A cosy yard; the pets' homes (kennel, hutch, basket) are the scenery.
//   pantry: three FOOD pictures on a shelf (bone, milk, carrot). The child taps one: that food goes in the bowl and its pet runs from its home.
//   play: tap anywhere to throw the pet's own toy (dog ball, cat yarn, rabbit leaf ball); the pet fetches / pounces / hops, with funny mishaps.
//   Every throw fills one heart. After 4 to 6 hearts the pet eats its food from the bowl, walks to its home and curls up.
//   paint: the child picks one of three colours (with patterns) for the home and the toy (saved in mia.house.v1) -> the shared reveal.
// No timers, lives, scores or fail states. Draw budget: <= 25 canvas calls per frame (counted in `render`, measured with ?debug), no allocation in the frame loop.
import { registerGame, type GameApi } from '../../app/registry';
import { setCaptionStyle } from '../../ui/captions';
import { HOME_Y, FOOD_OF, PETS, PLAY_TOP, EV, Ph, Round, Seg, T, V, bowlOf, homeX, newPetMemory, newPose, pantryOrder, poseAt, restOf, slotX, swatchX, SLOT_Y, SWATCH_Y, DECO_COUNT, TOY_OF, type PetId } from './logic';
import { buildPieces, meterStrip, shelfPanel, toySprite, yardScene } from './art';
import { BOING, CATCH, DIG, LAND, MUNCH, PAINTED, PUTBOWL, SKID, TANGLE, THROW } from './sounds';
import { createHouseStore } from './store';

const PART_CAP = 22; // sparks stop being drawn past this many calls in a frame, keeping a margin under 25
const PART_POOL = 14;
const PCOL = ['#ffd93d', '#ff7aa8', '#7fe0ff', '#9be564', '#ffffff', '#b98a55'];
const KEY_SPOTS = [[0.25, 100], [0.8, 92], [0.45, 118], [0.9, 112], [0.1, 114], [0.65, 86]] as const; // for Space / Enter: fractions of the width

interface Part { x: number; y: number; vx: number; vy: number; life: number; c: number }

registerGame({
  id: 'house',
  shelf: 'house',
  start(container, api) { return startHouse(container, api); },
});

function startHouse(container: HTMLElement, api: GameApi): () => void {
  const { stage, kit, audio } = api;
  const debug = new URLSearchParams(location.search).has('debug');
  let dead = false;

  setCaptionStyle({ noIcon: true }); // the truck narrates; sound captions (bark, purr, sleep ...) stay on
  api.exitButton();
  const canvas = stage.canvas;
  const oldLabel = canvas.getAttribute('aria-label') || '';
  canvas.setAttribute('aria-label', api.t('house.aria'));
  canvas.setAttribute('tabindex', '0');

  // ------------------------------------------------------------------ art, built once
  const store = createHouseStore();
  const piece = buildPieces(kit);
  const toys = new Map<string, HTMLCanvasElement>();
  const toyFor = (p: PetId): HTMLCanvasElement => {
    const d = store.decoOf(p), key = p + d;
    let c = toys.get(key); if (!c) { c = toySprite(p, d); toys.set(key, c); }
    return c;
  };
  const meters = new Map<number, HTMLCanvasElement>();
  const meterOf = (need: number, filled: number): HTMLCanvasElement => {
    const key = need * 10 + filled;
    let c = meters.get(key); if (!c) { c = meterStrip(need, filled); meters.set(key, c); }
    return c;
  };
  const decoNow = (): Record<PetId, number> => ({ dog: store.decoOf('dog'), cat: store.decoOf('cat'), rabbit: store.decoOf('rabbit') });
  let W = 0;
  let scene = yardScene(240, 135, decoNow());
  let shelf = shelfPanel(240);
  let sceneDirty = true;
  const checkSize = (): void => {
    if (W === stage.W && !sceneDirty) return;
    W = stage.W; sceneDirty = false;
    scene = yardScene(W, stage.H, decoNow()); shelf = shelfPanel(W);
    placeButtons();
  };

  // ------------------------------------------------------------------ state (preallocated)
  const round = new Round(Math.random, { W: stage.W, reduced: stage.reduced });
  const mem = newPetMemory();
  const ownedSet = new Set<string>();
  const owned = (): void => { ownedSet.clear(); for (const id of api.owned()) ownedSet.add(id); };
  owned();
  const firstTimer = !PETS.some((p) => ownedSet.has(p));
  const pose = newPose();
  const parts: Part[] = [];
  for (let i = 0; i < PART_POOL; i++) parts.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, c: 0 });
  let order: [PetId, PetId, PetId] = ['dog', 'cat', 'rabbit'];
  let hintSlot = 1, readyAt = 0;
  let lastPhase: number = -1;
  let revealing = false, pantryIdle = 0, lastNow = 0, keyN = 0, chosenOnce = false;
  let bowlFly = 0; // ms since the food was picked: the icon flies from the shelf to the bowl
  let fromSlot = 1;
  let dustT = 0, paintPop = 0, hintSaid = false, heartPop = 0;
  let calls = 0, maxCalls = 0;
  const stats = { frames: 0, drawMs: 0, drawMax: 0, maxCalls: 0, rounds: 0 };

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

  const burst = (x: number, y: number, n: number, c0 = -1): void => {
    if (stage.reduced) return;
    for (let i = 0, k = 0; i < parts.length && k < n; i++) {
      const p = parts[i]; if (p.life > 0) continue;
      p.x = x; p.y = y; p.vx = (Math.random() - 0.5) * 80; p.vy = -20 - Math.random() * 50; p.life = 450 + Math.random() * 300;
      p.c = c0 >= 0 ? c0 : (Math.random() * 5) | 0; k++;
    }
  };

  // ------------------------------------------------------------------ real buttons over the picture (keyboard, screen readers, big targets)
  const buttons: Array<{ el: HTMLButtonElement; cx: () => number; cy: number; w: number; h: number }> = [];
  const placeEl = (b: (typeof buttons)[number]): void => {
    const s = b.el.style;
    s.left = (b.cx() / stage.W) * 100 + '%'; s.top = (b.cy / stage.H) * 100 + '%';
    s.width = (b.w / stage.W) * 100 + '%'; s.height = (b.h / stage.H) * 100 + '%';
  };
  function placeButtons(): void { for (const b of buttons) placeEl(b); }
  const addButton = (cx: () => number, cy: number, w: number, h: number, label: string, onClick: () => void, cls = ''): void => {
    const el = document.createElement('button');
    el.type = 'button'; el.className = 'hot house-btn' + (cls ? ' ' + cls : ''); el.setAttribute('aria-label', label);
    el.addEventListener('click', () => { void audio.unlock(); onClick(); });
    const b = { el, cx, cy, w, h };
    placeEl(b); container.appendChild(el); buttons.push(b);
  };
  const clearButtons = (): void => { for (const b of buttons.splice(0)) b.el.remove(); };
  // a keyboard player gets focus on the first choice (a touch player never sees a focus ring)
  let usedKey = false;
  const focusFirst = (i = 0): void => { if (usedKey && buttons[i]) { try { buttons[i].el.focus({ preventScroll: true }); } catch { /* ignore */ } } };

  // ------------------------------------------------------------------ phases
  const enterPantry = (): void => {
    clearButtons();
    owned();
    const po = pantryOrder(ownedSet, mem, Math.random);
    order = po.order; hintSlot = po.hint;
    order.forEach((p, i) => addButton(() => slotX(i, stage.W), SLOT_Y, 38, 42, api.t('food.' + FOOD_OF[p]), () => choose(i)));
    focusFirst(hintSlot);
    pantryIdle = 0; hintSaid = false; readyAt = performance.now() + 450; // ignore a double tap that opened the door
    void audio.say('house.pick', 'bholu');
  };
  const choose = (i: number): void => {
    if (round.phase !== Ph.Pantry || revealing || performance.now() < readyAt) return;
    const p = order[i];
    if (!round.begin(p)) return;
    fromSlot = i; bowlFly = 0; chosenOnce = true;
    mem.played[p]++; mem.last = p;
    clearButtons();
    audio.play(PUTBOWL);
    stats.rounds++;
  };
  const enterPaint = (): void => {
    clearButtons();
    const pet = round.pet!;
    for (let i = 0; i < DECO_COUNT; i++) {
      addButton(() => swatchX(i, stage.W), SWATCH_Y, 34, 34, api.t('house.deco.' + i), () => {
        if (!round.paint(i)) return;
        store.setDeco(pet, i); sceneDirty = true; paintPop = 0; clearButtons();
      });
    }
    focusFirst(1);
    void audio.say('house.paint', 'bholu');
  };
  const doReveal = (): void => {
    if (revealing || !round.pet) return;
    revealing = true; clearButtons();
    const pet = round.pet;
    api.reveal(pet).catch((e) => console.error(e)).then(() => {
      revealing = false;
      if (dead) return;
      store.addPlay(pet);
      lastNow = 0; round.next(); lastPhase = -1;
    });
  };

  // ------------------------------------------------------------------ update
  const update = (dt: number): void => {
    round.opts.W = stage.W; round.opts.reduced = stage.reduced;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]; if (p.life <= 0) continue;
      p.life -= dt; p.x += (p.vx * dt) / 1000; p.y += (p.vy * dt) / 1000; p.vy += (160 * dt) / 1000;
    }
    if (paintPop >= 0) paintPop += dt;
    if (heartPop > 0) heartPop -= dt;
    if (bowlFly >= 0 && round.phase !== Ph.Pantry) bowlFly += dt;
    if (revealing) return;
    round.tick(dt);
    const ev = round.ev, pet = round.pet;
    if (round.phase !== lastPhase) {
      lastPhase = round.phase;
      if (round.phase === Ph.Pantry) enterPantry();
      else if (round.phase === Ph.Arrive && pet) audio.animal(pet);
      else if (round.phase === Ph.Home) void audio.say('house.nap', 'bholu');
      else if (round.phase === Ph.Paint) enterPaint();
      else if (round.phase === Ph.Reveal) doReveal();
    }
    if (round.phase === Ph.Pantry) pantryIdle += dt;
    if (ev && pet) {
      const bx = pose.x, by = pose.y - 10;
      if (ev & EV.Throw) { audio.play(THROW); burst(stage.W / 2, stage.H - 8, 3); }
      if (ev & EV.Land) { audio.play(LAND); burst(round.tx, round.ty - 6, 3, 5); }
      if (ev & EV.Step) {
        const o = round.outcome;
        if (o === 'skid') audio.play(SKID); else if (o === 'dig') audio.play(DIG); else if (o === 'tangle') audio.play(TANGLE);
        else if (pet === 'rabbit' || o === 'pounce') audio.play(BOING);
      }
      if (ev & EV.Catch) {
        audio.play(CATCH[Math.min(round.hearts, CATCH.length) - 1]); heartPop = 350;
        burst(bx, by, 5);
        if (round.hearts === 1 || round.hearts >= round.need) audio.animal(pet);
      }
      if (ev & EV.Munch) { audio.play(MUNCH); burst(bx - 8, by + 4, 3, 5); }
      if (ev & EV.Ate) { burst(bx, by, 8); if (pet === 'cat') audio.sfx('purr'); }
      if (ev & EV.Curled) audio.sfx('sleep');
      if (ev & EV.Painted) { audio.play(PAINTED); burst(homeX(pet, stage.W), HOME_Y - 16, 10); }
    }
    // the hint: a dot over the toy's landing area, after a few quiet seconds, until the first throw
    if (round.phase === Ph.Play && !round.everThrew && round.idleMs > T.noThrowHint && !hintSaid) { hintSaid = true; void audio.say('house.throw', 'bholu'); }
    // dust and dirt while the dog skids or digs
    if (pose.dust || (round.phase === Ph.Play && round.seg === Seg.Act && round.outcome === 'dig')) {
      dustT += dt;
      if (dustT > 90) { dustT = 0; burst(pose.x - pose.face * 8, pose.y - 2, 1, round.outcome === 'dig' ? 5 : 4); }
    }
  };

  // ------------------------------------------------------------------ render (no allocation; counts its calls)
  const render = (g: CanvasRenderingContext2D, now: number): void => {
    const Wc = stage.W;
    let n = 0;
    const ph = round.phase, pet = round.pet;
    const red = stage.reduced;
    g.drawImage(scene, 0, 0); n++;
    // sleeping owned pets at their homes (the active pet is out playing)
    for (let i = 0; i < PETS.length; i++) {
      const p = PETS[i];
      if (!ownedSet.has(p) || (pet === p && ph !== Ph.Pantry)) continue;
      const cur = piece.pets[p].curled, x = homeX(p, Wc);
      g.drawImage(cur, x - 13, HOME_Y - 14); n++;
      if (!red) { const zi = (((now / 700) | 0) + i) % 2; g.drawImage(piece.z[zi], x + 8 + zi * 3, HOME_Y - 26 - zi * 5); n++; }
    }
    if (ph === Ph.Pantry) {
      g.drawImage(shelf.img, shelf.x, shelf.y); n++;
      for (let i = 0; i < 3; i++) {
        const ic = piece.icons[order[i]];
        const bob = !red && i === hintSlot ? Math.round(Math.sin(now / 260) * 2) : 0;
        g.drawImage(ic, slotX(i, Wc) - 13, SLOT_Y - 13 + bob, 26, 26); n++;
      }
      if ((firstTimer && !chosenOnce) || pantryIdle > 6000) {
        const o = red ? 0 : Math.round(Math.abs(Math.sin(now / 320)) * 4);
        g.drawImage(piece.hand, slotX(hintSlot, Wc) - 11, SLOT_Y + 27 + o); n++;
      }
    }
    // bowl (from the moment the food is picked)
    if (pet && ph >= Ph.Arrive && ph <= Ph.Home) {
      const b = bowlOf(Wc);
      const stage4 = ph === Ph.Eat ? round.eatStep : ph > Ph.Eat ? 3 : 0;
      g.drawImage(piece.bowls[pet][stage4], b.x - 15, b.y - 22); n++;
      if (ph === Ph.Arrive && bowlFly < 500) { // the food flies from the shelf into the bowl
        const k = Math.min(1, bowlFly / 500), sx = slotX(fromSlot, Wc);
        const x = sx + (b.x - sx) * k, y = SLOT_Y + (b.y - 14 - SLOT_Y) * k - Math.sin(k * Math.PI) * 18;
        g.drawImage(piece.icons[pet], Math.round(x - 12), Math.round(y - 12), 24, 24); n++;
      }
    }
    // the active pet
    if (pet && ph >= Ph.Arrive && ph <= Ph.Reveal && !(ph === Ph.Reveal && revealing)) {
      poseAt(pose, round);
      const art = piece.pets[pet];
      let lift = pose.lift;
      if (ph === Ph.Play && round.seg === Seg.Idle && !red) lift += Math.abs(Math.sin(now / (pet === 'cat' ? 520 : 240))) * (pet === 'cat' ? 1 : 3);
      if (ph === Ph.Eat && pose.v === V.Head && !red) lift += Math.abs(Math.sin(now / 90)) * 1.5;
      const fi = pose.face > 0 ? 1 : 0;
      const px = Math.round(pose.x), py = Math.round(pose.y - lift);
      if (pose.v === V.Curled) {
        g.drawImage(art.curled, px - 13, HOME_Y - 14); n++;
        if (!red) { const zi = ((now / 700) | 0) % 2; g.drawImage(piece.z[zi], px + 8 + zi * 3, HOME_Y - 26 - zi * 5); n++; }
      } else {
        const sp = pose.v === V.Crouch ? art.crouch[fi] : pose.v === V.Tangled ? art.tangled[fi] : pose.v === V.Head ? art.head[fi] : art.stand[fi];
        const wob = pose.v === V.Crouch && !red ? Math.round(Math.sin(now / 45) * 1.5) : pose.v === V.Tangled && !red ? Math.round(Math.sin(now / 55) * 2) : 0;
        g.drawImage(sp, px - (sp.width >> 1) + wob, py - sp.height + 2); n++;
        if (pose.carry || pose.toyOn) {
          const ts = toyFor(pet);
          if (pose.carry) g.drawImage(ts, px + pose.face * 11 - 7, py - 13); else g.drawImage(ts, Math.round(pose.toyX) - 7, Math.round(pose.toyY) - 7);
          n++;
        }
      }
    }
    // the toy waiting in the child's hand (Play, before the first throw of a round)
    if (ph === Ph.Play && pet && round.seg === Seg.Idle) {
      const r = restOf(Wc), bob = red ? 0 : Math.round(Math.sin(now / 300) * 2);
      g.drawImage(toyFor(pet), r.x + 24 - 7, 125 + bob - 7); n++;
      if (!round.everThrew && round.idleMs > T.noThrowHint) {
        const o = red ? 0 : Math.round(Math.abs(Math.sin(now / 320)) * 5);
        g.drawImage(piece.hand, Wc * 0.78 - 11, 96 - o); n++;
      }
    }
    // paint choice
    if (ph === Ph.Paint) {
      for (let i = 0; i < DECO_COUNT; i++) {
        const chosen = round.deco === i;
        if (round.deco >= 0 && !chosen) continue;
        const pop = chosen && !red ? Math.round(Math.sin(Math.min(1, round.t / 400) * Math.PI) * 4) : 0;
        const bob = round.deco < 0 && !red ? Math.round(Math.sin(now / 280 + i) * 2) : 0;
        g.drawImage(piece.swatches[i], swatchX(i, Wc) - 15, SWATCH_Y - 15 - pop + bob); n++;
      }
    }
    // hearts
    if (ph === Ph.Play || ph === Ph.Eat) {
      const m = meterOf(round.need, round.hearts);
      g.drawImage(m, Math.round(Wc / 2 - m.width / 2), 3 - (heartPop > 0 && !red ? 1 : 0)); n++;
    }
    for (let i = 0; i < parts.length && n < PART_CAP; i++) {
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
  checkSize();
  stage.invalidate();

  // ------------------------------------------------------------------ input: tap anywhere to throw (read from the overlay: it covers the canvas)
  const toLogical = (e: PointerEvent): [number, number] => {
    const r = stage.canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * stage.W, ((e.clientY - r.top) / r.height) * stage.H];
  };
  container.style.touchAction = 'none';
  const throwAt = (x: number, y: number): void => { if (round.throwAt(x, y)) void audio.unlock(); };
  const onDown = (e: PointerEvent): void => {
    usedKey = false;
    if (e.target !== container || api.isRevealing() || revealing) return;
    const [x, y] = toLogical(e);
    throwAt(x, y);
  };
  container.addEventListener('pointerdown', onDown);
  const onKey = (e: KeyboardEvent): void => {
    if (e.key.length === 1 || e.key === 'Enter' || e.key.startsWith('Arrow') || e.key === 'Tab') usedKey = true;
    if (api.isRevealing() || revealing || document.querySelector('.parent') || round.phase !== Ph.Play) return;
    if (e.target instanceof HTMLButtonElement) return; // Enter / Space on a button is a click
    const r = restOf(stage.W);
    if (e.key === ' ' || e.key === 'Enter') {
      const s = KEY_SPOTS[keyN++ % KEY_SPOTS.length];
      throwAt(s[0] * stage.W, s[1]); e.preventDefault();
    } else if (e.key === 'ArrowLeft') { throwAt(r.x - 80, PLAY_TOP + 20); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { throwAt(r.x + 70, PLAY_TOP + 20); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { throwAt(r.x, PLAY_TOP); e.preventDefault(); }
    else if (e.key === 'ArrowDown') { throwAt(r.x - 20, 124); e.preventDefault(); }
  };
  window.addEventListener('keydown', onKey);
  canvas.focus({ preventScroll: true });

  // ------------------------------------------------------------------ debug hooks (?debug)
  if (debug) {
    const w = window as unknown as Record<string, unknown>;
    w.__house = {
      stats, round, store, mem,
      get state() { return { phase: round.phase, seg: round.seg, t: round.t, pet: round.pet, hearts: round.hearts, need: round.need, outcome: round.outcome, deco: round.deco, calls, maxCalls, realMax, owned: api.owned(), order, buttons: buttons.length, hintSlot, memoryOnly: store.memoryOnly }; },
      choose,
      /** start a round for a given pet (as if its food was tapped) */
      run(p: PetId) { const i = order.indexOf(p); if (round.phase !== Ph.Pantry || i < 0) return false; choose(i); return true; },
      tap(x: number, y: number) { return round.throwAt(x, y); },
      /** shorten the round: 1 heart is enough */
      short() { round.need = 1; },
      toy: TOY_OF,
      /** jump to a phase's start: 'eat' | 'paint' */
      jump(to: 'eat' | 'paint') {
        if (!round.pet) return;
        if (to === 'eat') { round.hearts = round.need; round.seg = Seg.Idle; round.phase = Ph.Eat; round.t = 0; round.eatStep = 0; }
        if (to === 'paint') { round.phase = Ph.Paint; round.t = 0; lastPhase = -1; }
      },
    };
  }

  return () => {
    dead = true;
    window.removeEventListener('keydown', onKey);
    container.removeEventListener('pointerdown', onDown);
    clearButtons();
    setCaptionStyle({});
    canvas.setAttribute('aria-label', oldLabel);
    for (const m of patched) delete ctx[m];
    if (debug) delete (window as unknown as Record<string, unknown>).__house;
  };
}
