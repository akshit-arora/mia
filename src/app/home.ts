// Home screen: a little world with three big picture doors (Jungle, Farm, House) that are the games,
// a shelf button for the collection and Bholu the truck. (Card clash is out of v1: not imported, no button.) No reading needed.
import { audio } from '../audio';
import { t } from '../i18n';
import { SHELVES, shelfCards, type ShelfId } from '../cards/data';
import { getStore } from '../cards/progress';
import { DOOR_H, DOOR_W, INK, SHELF_COL, mk, type Cv } from '../cards/scenes';
import { gameForShelf } from './registry';
import type { App, Screen } from './shell';

const DOOR_X = [0.2, 0.5, 0.8];
const DOOR_CY = 60;
const WOBBLE_MS = 800;

export function homeScreen(app: App): Screen {
  const { stage, kit } = app;
  const wobble: Record<string, number> = { jungle: 0, farm: 0, house: 0 };
  let truckHop = 0;
  const pipCache = new Map<string, Cv>();
  const doorBtns: HTMLButtonElement[] = [];
  let truckBtn: HTMLButtonElement, shelfBtn: HTMLButtonElement;
  let handArt: Cv | null = null;
  let shelfArt: Cv;
  let off: (() => void) | null = null;

  const pips = (shelf: ShelfId): Cv => {
    const cards = shelfCards(shelf);
    const key = shelf + cards.map((c) => (getStore().has(c.id) ? 1 : 0)).join('');
    let c = pipCache.get(key);
    if (!c) {
      const n = cards.length, w = n * 8 + 4;
      const [cv, g] = mk(w, 10);
      g.fillStyle = INK; g.fillRect(0, 0, w, 10); g.fillStyle = '#ffffff'; g.fillRect(1, 1, w - 2, 8);
      cards.forEach((card, i) => {
        const own = getStore().has(card.id);
        g.fillStyle = INK; g.fillRect(3 + i * 8, 2, 6, 6);
        g.fillStyle = own ? SHELF_COL[shelf] : '#d6d9e6'; g.fillRect(4 + i * 8, 3, 4, 4);
      });
      pipCache.set(key, cv); c = cv;
    }
    return c;
  };
  const ownedShelfIds = (): string[] => {
    const ids = getStore().owned();
    return ids.slice(-3);
  };

  const layout = (): void => {
    const W = stage.W, H = stage.H;
    SHELVES.forEach((s, i) => app.place(doorBtns[i], W * DOOR_X[i], DOOR_CY, DOOR_W, DOOR_H));
    app.place(truckBtn, W * 0.4, H - 18, 48, 30);
    app.place(shelfBtn, 30, H - 20, 44, 34);
    shelfArt = kit.shelfButton(ownedShelfIds());
  };

  return {
    enter() {
      kit.world(); kit.truck(); // pre-render before the first frame
      for (const s of SHELVES) { kit.door(s, !!gameForShelf(s)); pips(s); }
      doorBtns.length = 0;
      SHELVES.forEach((s) => {
        doorBtns.push(app.hot({
          cx: 0, cy: 0, w: DOOR_W, h: DOOR_H, label: t('home.' + s) + (gameForShelf(s) ? '' : ', ' + t('home.soon')), cls: 'door',
          onClick: () => {
            const def = gameForShelf(s);
            if (def) { audio.sfx('pop'); app.launch(def); return; }
            wobble[s] = performance.now(); audio.sfx('wobble'); audio.vibrate(30); void audio.say('home.soon', 'bholu'); stage.invalidate();
          },
        }));
      });
      truckBtn = app.hot({ cx: 0, cy: 0, w: 48, h: 30, label: t('ui.truck'), onClick: () => { truckHop = performance.now(); audio.sfx('honk'); stage.invalidate(); } });
      shelfBtn = app.hot({ cx: 0, cy: 0, w: 44, h: 34, label: t('ui.shelves'), onClick: () => { audio.sfx('tick'); app.go('shelves'); } });
      handArt = kit.icon('ui.hand', 32); // Twemoji pointing-down hand
      layout();
      off = getStore().onChange(() => { shelfArt = kit.shelfButton(ownedShelfIds()); stage.invalidate(); }); // a card arrived while we were away or behind the reveal
      doorBtns[0].focus({ preventScroll: true });
    },
    leave() { audio.flush(); off?.(); off = null; },
    resize() { if (doorBtns.length) layout(); },
    draw(g, now) {
      const W = stage.W, H = stage.H;
      g.drawImage(kit.world(), 0, 0); // 1
      let busy = false;
      for (let i = 0; i < 3; i++) { // 3 doors + 3 pip strips
        const s = SHELVES[i];
        const cx = Math.round(W * DOOR_X[i]), by = DOOR_CY + DOOR_H / 2;
        const open = !!gameForShelf(s);
        const k = wobble[s] ? (now - wobble[s]) / WOBBLE_MS : 1;
        const img = kit.door(s, open);
        if (k < 1 && !stage.reduced) {
          busy = true;
          g.save(); g.translate(cx, by); g.rotate(Math.sin(k * 22) * 0.1 * (1 - k)); g.drawImage(img, -DOOR_W / 2, -DOOR_H); g.restore();
        } else {
          if (k >= 1) wobble[s] = 0;
          g.drawImage(img, cx - DOOR_W / 2, by - DOOR_H);
        }
        const p = pips(s);
        g.drawImage(p, Math.round(cx - p.width / 2), by - 16);
      }
      const hop = truckHop && !stage.reduced ? (now - truckHop) / 500 : 1;
      let hy = 0;
      if (hop < 1) { busy = true; hy = -Math.round(Math.abs(Math.sin(hop * Math.PI * 2)) * 6 * (1 - hop)); } else truckHop = 0;
      g.drawImage(kit.truck(), Math.round(W * 0.4 - 24), H - 33 + hy); // 1
      g.drawImage(shelfArt, 8, H - 37); // 1
      // first run only: a bobbing hand over the Jungle door, until the first card is earned
      if (handArt && getStore().owned().length === 0) {
        const bob = stage.reduced ? 0 : Math.round(Math.abs(Math.sin(now / 280)) * 4);
        g.drawImage(handArt, Math.round(W * DOOR_X[0]) - 16, 2 + bob); // 1
        busy = !stage.reduced || busy;
      }
      if (busy) stage.invalidate();
    },
  };
}
