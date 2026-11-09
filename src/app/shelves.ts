// Shelves screen (three shelves of 14 slots) and the card view (the "Trump card").
import { audio } from '../audio';
import { t } from '../i18n';
import { showText } from '../ui/captions';
import { reaction, type Reaction } from '../game/reactions';
import { CARDS, SHELVES, cardOf, foodIcon, homeIcon, shelfCards, typeIcon, type Card, type ShelfId, type StatKind } from '../cards/data';
import { statGlyph } from '../cards/icons';
import { MAX_LEVEL, getStore } from '../cards/progress';
import { INK, SHELF_COL, SHELF_TINT, disc, mk, type Cv } from '../cards/scenes';
import type { App, Screen } from './shell';

const HDR = 24;
const STAT_COL: Record<StatKind, string> = { size: '#4a90e2', speed: '#ff8a1f', strength: '#d94a3a', loudness: '#9b59d0' };

// ---------------------------------------------------------------- shelves
export function shelvesScreen(app: App): Screen {
  const { stage, kit } = app;
  let layer: Cv | null = null;
  let off: (() => void) | null = null;
  let slotBtns: HTMLButtonElement[] = [];
  let backBtn: HTMLButtonElement | null = null;
  const geo = { s: 32, x0: 40, rowH: 37 };

  const slotRect = (row: number, k: number): [number, number] => [geo.x0 + k * (geo.s + 2), HDR + row * geo.rowH + 2];

  const build = (): void => {
    const W = stage.W, H = stage.H;
    geo.s = Math.max(24, Math.min(32, Math.floor((W - 44) / 6) - 2));
    geo.rowH = Math.floor((H - HDR) / 3);
    const [c, g] = mk(W, H);
    g.fillStyle = '#cfe9ff'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#bcdcf5'; for (let x = 0; x < W; x += 14) g.fillRect(x, 0, 5, H);
    // progress pips (14 slots, colour by shelf), no reading needed
    let px = Math.round(W / 2 - 14 * 4.5);
    for (const sh of SHELVES) for (const card of shelfCards(sh)) {
      const own = getStore().has(card.id);
      g.fillStyle = INK; g.fillRect(px, 9, 8, 8); g.fillStyle = own ? SHELF_COL[sh] : '#dfe3f0'; g.fillRect(px + 1, 10, 6, 6); px += 9;
    }
    SHELVES.forEach((sh, row) => {
      const top = HDR + row * geo.rowH;
      g.fillStyle = INK; g.fillRect(0, top + 2 + geo.s, W, 5); g.fillStyle = '#a8742f'; g.fillRect(0, top + 3 + geo.s, W, 3); g.fillStyle = '#c98a3e'; g.fillRect(0, top + 3 + geo.s, W, 1);
      // shelf label: coloured round tab with the home picture
      disc(g, 20, top + 2 + geo.s / 2, 15, INK); disc(g, 20, top + 2 + geo.s / 2, 13.5, SHELF_COL[sh]);
      g.imageSmoothingEnabled = true; g.drawImage(kit.icon('home.' + sh, 32), 8, Math.round(top + 2 + geo.s / 2 - 12), 24, 24); g.imageSmoothingEnabled = false;
      shelfCards(sh).forEach((card, k) => {
        const [x, y] = slotRect(row, k);
        const lv = getStore().levelOf(card.id);
        g.drawImage(lv ? kit.cardThumb(card.id, lv, geo.s) : kit.unknownSlot(card.id, geo.s), x, y);
      });
    });
    layer = c;
  };
  const layout = (): void => {
    let i = 0;
    SHELVES.forEach((sh, row) => shelfCards(sh).forEach((_c, k) => {
      const [x, y] = slotRect(row, k);
      app.place(slotBtns[i++], x + geo.s / 2, y + geo.s / 2, geo.s, geo.s);
    }));
    if (backBtn) app.place(backBtn, 18, 14, 28, 28);
  };

  return {
    enter() {
      build();
      slotBtns = [];
      SHELVES.forEach((sh) => shelfCards(sh).forEach((card) => {
        const owned = getStore().has(card.id);
        const b = app.hot({
          cx: 0, cy: 0, w: geo.s, h: geo.s, cls: 'slot',
          label: owned ? t('card.name.' + card.id) : t('card.locked'),
          onClick: () => {
            if (getStore().has(card.id)) { audio.sfx('tick'); app.go('card', card.id); }
            else { audio.sfx('wobble'); showText('card.locked', 'bholu', 1400); }
          },
        });
        slotBtns.push(b);
      }));
      backBtn = app.hot({ cx: 18, cy: 14, w: 28, h: 28, label: t('ui.back'), cls: 'back', onClick: () => app.go('home') });
      backBtn.innerHTML = BACK_SVG;
      layout();
      const h = document.createElement('h1'); h.className = 'sr'; h.textContent = t('ui.shelves'); app.ui.appendChild(h);
      off = getStore().onChange(() => { build(); stage.invalidate(); });
      slotBtns.find((b) => b.getAttribute('aria-label') !== t('card.locked'))?.focus({ preventScroll: true });
    },
    leave() { off?.(); off = null; },
    resize() { if (!slotBtns.length) return; build(); layout(); },
    draw(g) { if (layer) g.drawImage(layer, 0, 0); }, // 1
  };
}

export const BACK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4L6 12l9 8" fill="none" stroke="#181020" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// ---------------------------------------------------------------- card view
export function cardScreen(app: App): Screen {
  const { stage, kit } = app;
  let card: Card = CARDS[0];
  let level = 1;
  let layer: Cv | null = null;
  let reaction0: Reaction | null = null, actionT0 = 0, eatT0 = 0, pulseKind = '', pulseT0 = 0;
  let token = 0;
  const els: HTMLElement[] = [];
  let nameEl: HTMLElement | null = null;
  const C = { x: 40, y: 4, w: 100, h: 127, ax: 90, ay: 96, bx: [44, 76, 108], by: 99 };
  const badgeIcon = (): string[] => [typeIcon(card), foodIcon(card), homeIcon(card)];

  const build = (): void => {
    const W = stage.W, H = stage.H;
    const [c, g] = mk(W, H);
    g.fillStyle = SHELF_TINT[card.shelf]; g.fillRect(0, 0, W, H);
    g.fillStyle = SHELF_COL[card.shelf]; g.globalAlpha = 0.18; for (let x = -H; x < W; x += 18) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + 8, H); g.lineTo(x + 8 + H, 0); g.lineTo(x + H, 0); g.fill(); } g.globalAlpha = 1;
    // card
    g.fillStyle = INK; g.fillRect(C.x - 2, C.y - 2, C.w + 4, C.h + 4);
    g.fillStyle = SHELF_COL[card.shelf]; g.fillRect(C.x, C.y, C.w, C.h);
    g.fillStyle = '#ffffff'; g.fillRect(C.x + 3, C.y + 3, C.w - 6, C.h - 6);
    g.drawImage(kit.scene(card.shelf), C.x + 3, 30, C.w - 6, 66, C.x + 3, 30, C.w - 6, 66);
    g.fillStyle = INK; g.fillRect(C.x + 3, 29, C.w - 6, 1); g.fillRect(C.x + 3, 96, C.w - 6, 1);
    g.fillStyle = 'rgba(24,16,32,.25)'; g.beginPath(); g.ellipse(C.ax, C.ay + 1, 22, 4, 0, 0, 6.2832); g.fill();
    // three badges: type, food, home (same icon, same place, every time)
    badgeIcon().forEach((id, i) => {
      const x = C.bx[i];
      g.fillStyle = INK; g.fillRect(x - 1, C.by - 1, 30, 30); g.fillStyle = '#fff'; g.fillRect(x, C.by, 28, 28);
      g.imageSmoothingEnabled = true; g.drawImage(kit.icon(id, 32), x + 2, C.by + 2, 24, 24); g.imageSmoothingEnabled = false;
    });
    // stats: glyph + 10 pips each (colour AND glyph differ per stat)
    const x0 = 150, pw = Math.max(4, Math.min(6, Math.floor((W - 4 - (x0 + 20)) / 10)));
    Object.entries(card.stats).forEach(([k, v], i) => {
      const y = 12 + i * 24;
      g.fillStyle = INK; g.fillRect(x0 - 2, y - 2, 20, 20); g.fillStyle = '#fff'; g.fillRect(x0 - 1, y - 1, 18, 18);
      statGlyph(g, k, x0, y, INK);
      for (let p = 0; p < 10; p++) {
        g.fillStyle = INK; g.fillRect(x0 + 20 + p * pw, y, pw, 16);
        g.fillStyle = p < (v as number) ? STAT_COL[k as StatKind] : '#e6e8f2'; g.fillRect(x0 + 21 + p * pw, y + 1, pw - 1, 14);
      }
    });
    // In v1, card levels 2-4 and star grind UI are hidden from child-facing screens.
    // speaker button art
    g.fillStyle = INK; g.fillRect(x0, 80, 44, 24); g.fillStyle = '#ffd93d'; g.fillRect(x0 + 1, 81, 42, 22);
    g.fillStyle = INK; g.fillRect(x0 + 8, 88, 5, 8); g.beginPath(); g.moveTo(x0 + 13, 88); g.lineTo(x0 + 20, 83); g.lineTo(x0 + 20, 101); g.lineTo(x0 + 13, 96); g.fill();
    g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.arc(x0 + 21, 92, 5, -1, 1); g.stroke(); g.beginPath(); g.arc(x0 + 21, 92, 10, -1, 1); g.stroke();
    layer = c;
  };

  const say = (key: string, then?: () => void): void => {
    const my = ++token;
    audio.flush();
    void audio.say(key, 'bholu').then(() => { if (my === token && then) then(); });
  };
  const poke = (withSound: boolean): void => {
    reaction0 = reaction(card.action); actionT0 = performance.now(); stage.invalidate();
    if (withSound) audio.animal(card.id);
    const sfx = reaction0.sfx; if (sfx) audio.sfx(sfx);
  };
  const layout = (): void => {
    app.place(els[0], 18, 14, 28, 28); // back
    app.place(els[1], C.ax, 62, 56, 64); // animal
    badgeIcon().forEach((_i, k) => app.place(els[2 + k], C.bx[k] + 14, C.by + 14, 28, 28));
    app.place(els[5], 172, 92, 44, 24); // speaker
    if (nameEl) app.place(nameEl, C.x + C.w / 2, 15, C.w - 8, 18);
  };

  return {
    enter(id) {
      card = cardOf(id || CARDS[0].id);
      level = Math.max(1, getStore().levelOf(card.id));
      els.length = 0; token++;
      const mkHot = (label: string, onClick: () => void, cls = ''): HTMLButtonElement => {
        const b = app.hot({ cx: 0, cy: 0, w: 28, h: 28, label, onClick, cls }); els.push(b); return b;
      };
      mkHot(t('ui.back'), () => app.go('shelves'), 'back').innerHTML = BACK_SVG;
      mkHot(t('card.name.' + card.id) + ', ' + t('card.hear'), () => { say('card.say.' + card.id, () => poke(true)); poke(false); }, 'animal');
      mkHot(t('ui.type') + ': ' + t('type.' + card.type), () => { audio.sfx('tick'); showText('type.' + card.type, 'bholu', 1600); pulseKind = 'type'; pulseT0 = performance.now(); stage.invalidate(); }, 'badge');
      mkHot(t('ui.food') + ': ' + t('food.' + card.food), () => { say('card.food.' + card.id); pulseKind = 'food'; pulseT0 = eatT0 = performance.now(); stage.invalidate(); }, 'badge');
      mkHot(t('ui.home') + ': ' + t('home.' + card.home), () => { say('card.home.' + card.id); pulseKind = 'home'; pulseT0 = performance.now(); stage.invalidate(); }, 'badge');
      mkHot(t('card.hear'), () => { say('card.say.' + card.id, () => poke(true)); pulseKind = 'speaker'; pulseT0 = performance.now(); stage.invalidate(); }, 'speaker');
      nameEl = document.createElement('div');
      nameEl.className = 'cardname'; nameEl.textContent = t('card.name.' + card.id);
      app.ui.appendChild(nameEl);
      const st = document.createElement('ul'); st.className = 'sr';
      for (const [k, v] of Object.entries(card.stats)) { const li = document.createElement('li'); li.textContent = `${t('stat.' + k)}: ${v} ${t('stat.of')}`; st.appendChild(li); }
      app.ui.appendChild(st);
      build(); layout();
      els[1].focus({ preventScroll: true });
      // opening a card: say its name, then its sound (a repeated, constant routine like a Trump card)
      say('card.say.' + card.id, () => poke(true)); poke(false);
    },
    leave() { token++; audio.flush(); nameEl = null; reaction0 = null; },
    resize() { if (!els.length) return; build(); layout(); },
    draw(g, now) {
      if (layer) g.drawImage(layer, 0, 0); // 1
      let dx = 0, dy = 0, sx = 1, sy = 1;
      let busy = false;
      let r: Reaction | null = null, k = 0;
      if (reaction0 && !stage.reduced) { k = (now - actionT0) / reaction0.dur; if (k < 1) { r = reaction0; busy = true; const m = r.motion(k); dx = m.dx; dy = m.dy; sx = m.sx; sy = m.sy; } }
      if (eatT0 && !stage.reduced) { const e = (now - eatT0) / 1200; if (e < 1) { busy = true; dy += Math.abs(Math.sin(e * Math.PI * 5)) * 2; sy *= 1 - Math.abs(Math.sin(e * Math.PI * 5)) * 0.06; } else eatT0 = 0; }
      const a = kit.animal(card.id, 64);
      const w = Math.round(64 * sx), h = Math.round(64 * sy);
      g.drawImage(a, Math.round(C.ax - w / 2 + dx), Math.round(C.ay - h + dy), w, h); // 1
      if (r && r.prop) r.prop(g, C.ax + dx, C.ay + dy, k); // <= 14 small fills (fan is the largest)
      if (pulseKind) {
        const p = (now - pulseT0) / 600;
        if (p >= 1) pulseKind = '';
        else if (!stage.reduced || p < 0.5) {
          busy = true;
          const s = Math.round(28 + Math.sin(p * Math.PI) * 8);
          if (pulseKind === 'speaker') { /* the button art only flashes */ g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(150, 80, 44, 24); }
          else {
            const i = pulseKind === 'type' ? 0 : pulseKind === 'food' ? 1 : 2;
            g.drawImage(kit.icon(badgeIcon()[i], 32), Math.round(C.bx[i] + 14 - s / 2), Math.round(C.by + 14 - s / 2), s, s); // 1
          }
        }
      }
      if (busy) stage.invalidate();
    },
  };
}
