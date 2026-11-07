// CARD CLASH (Trump mode): a toy for two cards. Pick a power (size, speed, strength, cuddly), the higher number wins the round.
// Play with the phone or pass the phone between two children. Five rounds, a hand of five cards each, drawn only from the cards
// the child already owns. Nothing is ever taken away, there are no scores that punish and no timers.
// No reading: pictures and bars. Every card face repeats the animal, its name (voice + text), type badge, food and home icons.
// Draw budget: <= 25 canvas calls per frame (measure with ?fps), no allocation in the frame loop except the round's cached art.
import { registerGame, type GameApi } from '../../app/registry';
import { CARDS, SHELVES } from '../../cards/data';
import { reaction, type Reaction } from '../../game/reactions';
import { ANIMAL_BOX, SIDE_COL, SIDE_TINT, STAT_COL, cardBack, cardFace, geo, friendsPic, lockedPanel, passPic, phonePic, roundPips, statTile, type Geo } from './art';
import { CHEER, DEAL, FLIP, PASS, SHRUG, TICK, TIE, WIN } from './sounds';
import { Match, ROUNDS, canPlay, rowsOf, seeded, valueOf, type ClashStat, type Mode, type RoundResult, type Side } from './logic';

type Phase = 'locked' | 'menu' | 'pass' | 'deal' | 'pick' | 'think' | 'flip' | 'bars' | 'result' | 'end';
const T_DEAL = 450, T_THINK = 1100, T_FLIP = 480, T_BAR = 90, T_RESULT = 2000, T_END = 5200;
const PART_POOL = 10;
const MAX_CALLS = 25;
const TILE_Y: Record<number, number[]> = { 2: [62, 98], 3: [43, 80, 117] };

registerGame({
  id: 'trump',
  start(container, api) { return startClash(container, api); },
});

interface Part { x: number; y: number; vx: number; vy: number; life: number; kind: number }

function startClash(container: HTMLElement, api: GameApi): () => void {
  const { stage, kit, audio } = api;
  const q = new URLSearchParams(location.search);
  let dead = false;
  const canvas = stage.canvas;
  const oldLabel = canvas.getAttribute('aria-label') || '';
  canvas.setAttribute('aria-label', api.t('trump.aria'));
  api.exitButton();

  const seedParam = q.get('seed');
  const makeRng = (): (() => number) => seeded(seedParam ? parseInt(seedParam, 10) || 1 : (Date.now() ^ ((Math.random() * 1e9) | 0)) >>> 0);

  // ---- state
  let phase: Phase = 'menu';
  let t0 = 0, now0 = 0;
  let match: Match | null = null;
  let mode: Mode = 'phone';
  let result: RoundResult | null = null;
  let picked: ClashStat | null = null;
  let tickN = 0;
  const up: [boolean, boolean] = [false, false];
  const flipT: [number, number] = [-1e9, -1e9]; // when each card last turned
  let G: Geo = geo(stage.W);
  let tiles: HTMLButtonElement[] = [];
  let tileKind: ClashStat[] = [];
  let overlayBtn: HTMLButtonElement | null = null;
  let menuBtns: HTMLButtonElement[] = [];
  let doorsBtn: HTMLButtonElement | null = null;
  let homeBtn: HTMLButtonElement | null = null;
  const names: [HTMLDivElement, HTMLDivElement] = [document.createElement('div'), document.createElement('div')];
  for (const n of names) { n.className = 'cardname'; n.hidden = true; container.appendChild(n); }
  const parts: Part[] = [];
  for (let i = 0; i < PART_POOL; i++) parts.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, kind: 0 });
  let endBurst = -1;
  let lastNow = 0, reactionW: Reaction | null = null, skipOk = 0;
  let pips = roundPips(0, ROUNDS, '#ffd93d');
  const clearTimers: number[] = [];

  // ---- helpers
  const owned = (): string[] => api.owned();
  const say = (key: string): void => { void audio.say(key, 'bholu'); };
  const set = (p: Phase, now: number): void => { phase = p; t0 = now; };
  const burst = (x: number, y: number, n: number, kind: number): void => {
    if (stage.reduced) return;
    for (let i = 0, k = 0; i < parts.length && k < n; i++) {
      const p = parts[i]; if (p.life > 0) continue;
      p.x = x; p.y = y; p.vx = (Math.random() - 0.5) * 110; p.vy = -30 - Math.random() * 70; p.life = 700 + Math.random() * 400; p.kind = kind; k++;
    }
  };
  const cardX = (side: Side): number => (side === 0 ? G.lx : G.rx);
  let curCards: [string, string] = ['lion', 'tiger']; // the two cards on the table this round (match.cards() moves on as soon as a round is played)
  const ids = (): [string, string] => curCards;
  const rowsIndex = (side: Side, k: ClashStat): number => rowsOf(curCards[side]).findIndex((r) => r.kind === k);

  const clearUi = (): void => {
    for (const b of tiles) b.remove();
    for (const b of menuBtns) b.remove();
    overlayBtn?.remove(); doorsBtn?.remove(); homeBtn?.remove();
    tiles = []; menuBtns = []; overlayBtn = null; doorsBtn = null; homeBtn = null;
    for (const n of names) n.hidden = true;
  };
  const placeNames = (): void => {
    if (!match) return;
    const cs = ids();
    ([0, 1] as Side[]).forEach((s) => {
      const el = names[s];
      el.textContent = api.t('card.name.' + cs[s]);
      api.container.appendChild(el);
      const st = el.style, W = stage.W, H = stage.H;
      st.left = ((cardX(s) + G.cw / 2) / W) * 100 + '%'; st.top = ((G.y + 9.5) / H) * 100 + '%';
      st.width = ((G.cw - 14) / W) * 100 + '%'; st.height = '';
      el.hidden = !up[s] || phase === 'pass' || phase === 'menu' || phase === 'locked';
      el.setAttribute('aria-hidden', String(el.hidden));
    });
  };
  const hot = (cx: number, cy: number, w: number, h: number, label: string, onClick: () => void, cls = ''): HTMLButtonElement => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'hot ' + cls; b.setAttribute('aria-label', label);
    const W = stage.W, H = stage.H, s = b.style;
    s.left = (cx / W) * 100 + '%'; s.top = (cy / H) * 100 + '%'; s.width = (w / W) * 100 + '%'; s.height = (h / H) * 100 + '%';
    b.addEventListener('click', () => { void audio.unlock(); onClick(); });
    container.appendChild(b);
    return b;
  };

  // ---- screens
  const toMenu = (now: number): void => {
    clearUi(); match = null; result = null; picked = null; up[0] = up[1] = false;
    G = geo(stage.W);
    if (!canPlay(owned().length)) { toLocked(now); return; }
    set('menu', now);
    const W = stage.W;
    menuBtns = [
      hot(W * 0.3, 74, 88, 72, api.t('trump.play.phone'), () => begin('phone'), 'clashbtn'),
      hot(W * 0.7, 74, 88, 72, api.t('trump.play.friend'), () => begin('friend'), 'clashbtn'),
    ];
    menuBtns[0].focus({ preventScroll: true });
    stage.invalidate();
  };
  const toLocked = (now: number): void => {
    set('locked', now);
    const W = stage.W;
    doorsBtn = hot(W / 2, 112, 100, 40, api.t('trump.locked'), () => api.exit());
    doorsBtn.focus({ preventScroll: true });
    say('trump.locked');
  };
  const begin = (m: Mode): void => {
    mode = m;
    match = new Match(m, owned(), makeRng());
    audio.sfx('pop');
    nextRound(performance.now());
  };
  const nextRound = (now: number): void => {
    clearUi(); result = null; picked = null; reactionW = null;
    if (!match || match.over) { toEnd(now); return; }
    G = geo(stage.W);
    pips = roundPips(match.round, ROUNDS, '#ffd93d');
    const picker = match.picker();
    if (mode === 'friend') {
      up[0] = up[1] = false;
      set('pass', now);
      overlayBtn = hot(stage.W / 2, stage.H / 2, stage.W, stage.H, api.t('trump.pass'), () => deal(performance.now()), 'passbtn');
      overlayBtn.focus({ preventScroll: true });
      audio.play(PASS); say('trump.pass');
      void picker;
    } else deal(now);
  };
  const deal = (now: number): void => {
    clearUi();
    if (!match) return;
    const picker = match.picker();
    up[0] = mode === 'phone' ? true : picker === 0; up[1] = false;
    if (mode === 'friend') up[1] = picker === 1;
    flipT[0] = flipT[1] = now - 1e6;
    set('deal', now);
    audio.play(DEAL);
    curCards = match.cards(); tileKind = match.options();
    placeNames();
    const first = match.round === 0;
    const mine = up[0] ? ids()[0] : ids()[1];
    void audio.say('card.say.' + mine, 'bholu').then(() => { if (!dead && first && phase === 'pick') say('trump.pick'); });
  };
  const toPick = (now: number): void => {
    if (!match) return;
    const picker = match.picker();
    const phoneTurn = mode === 'phone' && picker === 1;
    const src = ids()[picker];
    // the three powers of the picker's card, in its own row order
    tileKind = match.options();
    if (phoneTurn) { set('think', now); return; }
    set('pick', now);
    tiles = tileKind.map((k, i) => hot(stage.W / 2, TILE_Y[tileKind.length][i], 30, 30, api.t('stat.' + k) + ': ' + valueOf(src, k), () => choose(k), 'tile'));
    tiles[0].focus({ preventScroll: true });
  };
  const choose = (k: ClashStat): void => {
    if (!match || (phase !== 'pick' && phase !== 'think')) return;
    const now = performance.now();
    picked = k;
    for (const b of tiles) b.remove();
    tiles = [];
    result = match.play(k);
    const was: [boolean, boolean] = [up[0], up[1]];
    up[0] = up[1] = true;
    flipT[0] = was[0] ? now - 1e6 : now; flipT[1] = was[1] ? now - 1e6 : now; // only a face-down card turns over
    audio.play(FLIP);
    set('flip', now);
    placeNames();
    // say the name of the card that has just been turned over
    const turned = mode === 'phone' ? result.b : result.picker === 0 ? result.b : result.a;
    say('card.say.' + turned);
    tickN = 0;
  };
  const toEnd = (now: number): void => {
    clearUi();
    set('end', now);
    audio.play(CHEER); say('trump.done');
    burst(stage.W / 2, 60, 10, 0);
    homeBtn = hot(stage.W / 2, stage.H / 2, stage.W, stage.H, api.t('trump.again'), () => toMenu(performance.now()), 'passbtn');
    homeBtn.focus({ preventScroll: true });
  };

  // ---- update (per frame)
  const update = (now: number, dt: number): void => {
    const e = now - t0;
    for (let i = 0; i < parts.length; i++) { const p = parts[i]; if (p.life <= 0) continue; p.life -= dt; p.x += (p.vx * dt) / 1000; p.y += (p.vy * dt) / 1000; p.vy += (170 * dt) / 1000; }
    switch (phase) {
      case 'deal': if (e > T_DEAL) toPick(now); break;
      case 'think': {
        if (e > T_THINK && match) {
          const k = match.phonePick();
          picked = k;
          choose(k);
        }
        break;
      }
      case 'flip': if (e > T_FLIP) { set('bars', now); tickN = 0; } break;
      case 'bars': {
        const top = Math.max(result!.va, result!.vb);
        const n = Math.min(top, Math.floor(e / T_BAR));
        while (tickN < n) { audio.play(TICK[tickN % 5]); tickN++; }
        if (e > top * T_BAR + 350) startResult(now);
        break;
      }
      case 'result': if (e > T_RESULT) nextRound(now); break;
      case 'end': {
        const b = Math.floor(e / 450);
        if (b !== endBurst && e < T_END - 900) { endBurst = b; burst(40 + Math.random() * (stage.W - 80), 30, 3, b % 2); }
        if (e > T_END) toMenu(now);
        break;
      }
      default: break;
    }
  };
  const startResult = (now: number): void => {
    const r = result!;
    set('result', now); skipOk = now + 700;
    const wx = (s: Side): number => cardX(s) + G.cw / 2;
    if (r.winner === 'tie') {
      audio.play(TIE); say('trump.tie');
      burst(wx(0), G.y + 40, 5, 1); burst(wx(1), G.y + 40, 5, 1);
      reactionW = null;
    } else {
      const w = r.winner as Side, l = (1 - w) as Side;
      audio.play(WIN); burst(wx(w), G.y + 40, 9, 0); reactionW = reaction(CARDS.find((c) => c.id === (w === 0 ? r.a : r.b))!.action);
      audio.animal(w === 0 ? r.a : r.b);
      window.setTimeout(() => { if (!dead) audio.play(SHRUG); }, 450);
      void l;
      if (mode === 'phone') say(w === 0 ? 'trump.win' : 'trump.lose'); else say('trump.win');
    }
  };

  // ---- render
  let calls = 0;
  const cardImg = (side: Side, now: number): [HTMLCanvasElement, number] => {
    // returns the image to draw and the x scale (a quick turn-over when the card flips)
    const id = ids()[side];
    const k = Math.min(1, (now - flipT[side]) / T_FLIP);
    const isUp = up[side];
    if (stage.reduced || k >= 1) return [isUp ? cardFace(kit, id, G.cw, G.ch) : cardBack(G.cw, G.ch, side), 1];
    const wasUp = !isUp;
    const half = k < 0.5;
    const showUp = half ? wasUp : isUp;
    return [showUp ? cardFace(kit, id, G.cw, G.ch) : cardBack(G.cw, G.ch, side), Math.abs(1 - 2 * k)];
  };
  const render = (g: CanvasRenderingContext2D, now: number): void => {
    const W = stage.W, H = stage.H;
    calls = 0;
    const e = now - t0;
    // backdrop
    if (phase === 'menu' || phase === 'locked' || phase === 'end') { g.fillStyle = '#fff6d6'; g.fillRect(0, 0, W, H); calls++; }
    else {
      g.fillStyle = SIDE_TINT[0]; g.fillRect(0, 0, W / 2, H); g.fillStyle = SIDE_TINT[1]; g.fillRect(W / 2, 0, W / 2, H); calls += 2;
    }
    if (phase === 'menu') {
      g.drawImage(phonePic(), Math.round(W * 0.3 - 44), 38); g.drawImage(friendsPic(), Math.round(W * 0.7 - 44), 38); calls += 2;
      g.drawImage(kit.icon('ui.star', 24), Math.round(W / 2 - 12), 6 + Math.round(stage.reduced ? 0 : Math.sin(now / 300) * 2)); calls++;
      return;
    }
    if (phase === 'locked') {
      g.drawImage(lockedPanel(kit, owned(), CARDS.map((c) => c.id).filter((i) => !owned().includes(i)), W, H), 0, 0); calls++;
      // three little doors and a bobbing hand: "go and play to find more friends"
      const bob = stage.reduced ? 0 : Math.round(Math.abs(Math.sin(now / 350)) * 4);
      for (let i = 0; i < 3; i++) {
        const dw = 28, dh = 33;
        g.drawImage(kit.door(SHELVES[i], true), Math.round(W / 2 - 46 + i * 32), 96, dw, dh); calls++;
      }
      void bob;
      return;
    }
    if (phase === 'end') {
      g.drawImage(kit.icon('ui.star', 32), Math.round(W / 2 - 16), 14 + Math.round(Math.sin(now / 200) * 3)); calls++;
      for (let i = 0; i < ROUNDS; i++) { g.drawImage(kit.animal(match ? match.hands[0][i] : CARDS[0].id, 32), Math.round(W / 2 - 80 + i * 32), 62 + Math.round(Math.abs(Math.sin(now / 180 + i)) * -8)); calls++; }
      drawParts(g, now); return;
    }
    if (!match) return;
    const cs = ids();
    // pips (rounds so far)
    g.drawImage(pips, Math.round(W / 2 - pips.width / 2), 3); calls++;
    if (phase === 'pass') {
      const picker = match.picker();
      g.fillStyle = SIDE_COL[picker]; g.globalAlpha = 0.8; g.fillRect(picker === 0 ? 0 : W / 2, 0, W / 2, H); g.globalAlpha = 1; calls++;
      const pc = passPic(SIDE_COL[picker]);
      const bob = stage.reduced ? 0 : Math.round(Math.sin(now / 260) * 3);
      g.drawImage(cardBack(G.cw, G.ch, picker), cardX(picker), G.y + bob); calls++;
      g.drawImage(pc, Math.round(W / 2 - pc.width / 2), 44); calls++;
      return;
    }
    // cards
    const slide = phase === 'deal' ? Math.max(0, 1 - e / T_DEAL) : 0;
    let dxs: [number, number] = [-slide * 60, slide * 60];
    let rot: [number, number] = [0, 0], hop: [number, number] = [0, 0];
    let ax: [number, number] = [0, 0], asy: [number, number] = [1, 1], ady: [number, number] = [0, 0];
    if (phase === 'result' && result && !stage.reduced) {
      const k = e / T_RESULT;
      if (result.winner !== 'tie') {
        const w = result.winner as Side, l = (1 - w) as Side;
        hop[w] = -Math.abs(Math.sin(Math.min(1, k * 2.5) * Math.PI * 2)) * 6 * (1 - Math.min(1, k * 1.5));
        const rk = reactionW ? Math.min(1, e / reactionW.dur) : 1;
        if (reactionW && rk < 1) { const m = reactionW.motion(rk); ax[w] = m.dx; ady[w] = m.dy; asy[w] = m.sy; }
        // the other card shrugs: tilts, shrinks a little, slides back
        const s = Math.sin(Math.min(1, k * 2) * Math.PI);
        rot[l] = (l === 0 ? -1 : 1) * 0.07 * s; hop[l] = 2 * s; asy[l] = 1 - 0.1 * s; ax[l] = (l === 0 ? -1 : 1) * 2 * Math.sin(k * 12) * (1 - k);
      } else { const s = Math.sin(Math.min(1, k * 3) * Math.PI); hop[0] = hop[1] = -3 * s; }
    }
    void dxs;
    dxs = [-slide * 60, slide * 60];
    for (const side of [0, 1] as Side[]) {
      const [img, sx] = cardImg(side, now);
      const x = cardX(side) + dxs[side], y = G.y + hop[side];
      if (rot[side] !== 0) {
        g.save(); g.translate(x + G.cw / 2, y + G.ch); g.rotate(rot[side]); g.drawImage(img, -G.cw / 2, -G.ch); g.restore(); calls++;
      } else if (sx < 1) g.drawImage(img, Math.round(x + (G.cw * (1 - sx)) / 2), y, Math.round(G.cw * sx), G.ch);
      else g.drawImage(img, x, y);
      if (rot[side] === 0) calls++;
      if (up[side] && sx >= 1 - 1e-6 && (stage.reduced || now - flipT[side] >= T_FLIP / 2)) {
        const a = kit.animal(cs[side], 32);
        const h = Math.round(32 * asy[side]);
        g.drawImage(a, Math.round(x + G.cw / 2 - 16 + ax[side]), Math.round(y + ANIMAL_BOX.bottom - h + ady[side] + (rot[side] ? 0 : 0)), 32, h); calls++;
      }
    }
    // the chosen power is outlined on both cards
    if (result && (phase === 'flip' || phase === 'bars' || phase === 'result')) {
      g.strokeStyle = '#ffd93d'; g.lineWidth = 2;
      for (const side of [0, 1] as Side[]) { if (now - flipT[side] >= T_FLIP) { g.strokeRect(cardX(side) + 3, G.y + 65 + rowsIndex(side, result!.kind) * 12, G.cw - 6, 13); calls++; } }
    }
    // the centre column
    const mid = Math.round(W / 2);
    if (phase === 'deal' || phase === 'pick' || phase === 'think') {
      const picker = match.picker();
      const glow = phase === 'pick' && !stage.reduced ? 0.3 + 0.3 * Math.abs(Math.sin(now / 300)) : 0.25;
      const cyc = phase === 'think' ? Math.floor(e / 140) % Math.max(1, tileKind.length) : -1;
      const ty = TILE_Y[tileKind.length] ?? TILE_Y[3];
      if (tileKind.length === 0 && match) tileKind = match.options();
      for (let i = 0; i < tileKind.length; i++) {
        if (phase === 'deal' && e < T_DEAL * 0.6) break;
        g.fillStyle = SIDE_COL[picker]; g.globalAlpha = i === cyc ? 0.9 : glow; g.fillRect(mid - 19, ty[i] - 19, 38, 38); g.globalAlpha = 1;
        g.drawImage(statTile(tileKind[i], 30, i === cyc), mid - 15, ty[i] - 15); calls += 2;
      }
    } else if (result) {
      const k = result.kind;
      g.drawImage(statTile(k, 30, true), mid - 15, 28); calls++;
      const top = phase === 'bars' ? Math.min(Math.max(result.va, result.vb), Math.floor(e / T_BAR)) : 99;
      const val = [Math.min(result.va, top), Math.min(result.vb, top)];
      const base = 130;
      const win = phase === 'result' && result.winner !== 'tie' ? (result.winner as number) : -1;
      const flash = win >= 0 && !stage.reduced && Math.floor(now / 160) % 2 === 0;
      for (let s = 0; s < 2; s++) {
        const bx = mid - 17 + s * 20, h = val[s] * 7;
        g.fillStyle = '#181020'; g.fillRect(bx - 1, base - h - 1, 16, h + 2);
        g.fillStyle = win === s ? (flash ? '#fff2a0' : '#ffd93d') : STAT_COL[k]; g.fillRect(bx, base - h, 14, h); calls += 2;
      }
      void SIDE_COL;
    }
    if (phase === 'result' && result) {
      if (result.winner === 'tie') { g.drawImage(kit.icon('ui.sparkle', 24), mid - 12, 60); calls++; }
      else {
        const w = result.winner as Side;
        g.drawImage(kit.icon('ui.star', 24), cardX(w) + Math.round(G.cw / 2 - 12), G.y - 10 + Math.round(stage.reduced ? 0 : Math.sin(now / 150) * 2)); calls++;
      }
    }
    drawParts(g, now);
  };
  const drawParts = (g: CanvasRenderingContext2D, now: number): void => {
    void now;
    for (let i = 0; i < parts.length && calls < MAX_CALLS - 3; i++) {
      const p = parts[i]; if (p.life <= 0) continue;
      g.drawImage(kit.icon(p.kind === 0 ? 'ui.star' : 'ui.sparkle', 16), Math.round(p.x - 6), Math.round(p.y - 6), 12, 12); calls++;
    }
  };

  stage.draw = (g, now) => {
    if (G.cw !== geo(stage.W).cw) { G = geo(stage.W); }
    const dt = lastNow ? Math.min(100, now - lastNow) : 33; lastNow = now;
    if (!now0) now0 = now;
    if (t0 === 0) t0 = now;
    update(now, dt);
    render(g, now);
    stage.invalidate(); // keeps the loop going (30 fps while a game is open)
  };

  // ---- input: tapping during the result moves on (never needed, only quicker); keys 1 to 3 pick a power
  const onTap = (e: PointerEvent): void => {
    if (e.target !== container) return;
    if (phase === 'result' && performance.now() > skipOk + 0) { nextRound(performance.now()); }
  };
  container.addEventListener('pointerdown', onTap);
  const onKey = (e: KeyboardEvent): void => {
    if (document.querySelector('.parent') || api.isRevealing()) return;
    if (phase === 'pick' && (e.key === '1' || e.key === '2' || e.key === '3')) { choose(tileKind[+e.key - 1]); }
    else if (e.key === 'Escape' && phase !== 'menu' && phase !== 'locked') { e.stopPropagation(); toMenu(performance.now()); }
  };
  window.addEventListener('keydown', onKey, true);

  // the menu waits for a first frame so t0 is the stage clock
  t0 = 0;
  toMenu(performance.now());
  t0 = 0;
  if (q.has('debug')) {
    (window as unknown as Record<string, unknown>).__clash = {
      get state() { return { phase, mode, round: match?.round ?? -1, result, owned: owned().length }; },
      get match() { return match; },
      begin, choose, skip: () => nextRound(performance.now()),
    };
  }
  stage.invalidate();

  return () => {
    dead = true;
    for (const id of clearTimers) clearTimeout(id);
    window.removeEventListener('keydown', onKey, true);
    container.removeEventListener('pointerdown', onTap);
    canvas.setAttribute('aria-label', oldLabel);
    if (q.has('debug')) delete (window as unknown as Record<string, unknown>).__clash;
  };
}

