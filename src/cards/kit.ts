// The shared art kit: every sprite the card screens need, pre-rendered once and cached.
// Frame loops only call drawImage on what is returned here. `invalidate()` on resize drops size-dependent art.
import type { Atlas, Stage } from '../engine';
import { cardOf, CARDS, type ShelfId } from './data';
import { DRAWN } from './icons';
import { INK, SHELF_COL, SHELF_TINT, doorSprite, mk, sceneFor, shelfButton, truckSprite, worldScene, type Cv } from './scenes';

export interface Kit {
  stage: Stage;
  atlas: Atlas; // animals (32 px cells)
  cardAtlas: Atlas; // food / home / ui emoji (32 px cells)
  /** icon by id ("food.fruit", "home.farm", "type.wild", "ui.star") at a size; nearest-neighbour for multiples of 32. */
  icon(id: string, size?: number): Cv;
  /** animal sprite at a size */
  animal(id: string, size?: number): Cv;
  /** small card for a shelf slot / the reveal: frame by type, animal, star pips */
  cardThumb(id: string, level: number, size: number): Cv;
  /** dark silhouette slot with a "?" */
  unknownSlot(id: string, size: number): Cv;
  scene(shelf: ShelfId): Cv;
  world(): Cv;
  door(shelf: ShelfId, open: boolean): Cv;
  truck(): Cv;
  shelfButton(ids: string[]): Cv;
  invalidate(): void;
}

export function createKit(stage: Stage, atlas: Atlas, cardAtlas: Atlas): Kit {
  const iconCache = new Map<string, Cv>();
  const animalCache = new Map<string, Cv>();
  const thumbCache = new Map<string, Cv>();
  let sized = new Map<string, Cv>(); // depends on stage.W/H

  // Every sprite is built from a 64 px source (the flat-vector bake) and downscaled with smoothing.
  // Canvas-drawn icons still start on their 32 px grid and are supersampled up to 64, so both
  // sources share one crisp, anti-aliased treatment.
  const BASE = 64;
  const base64 = (id: string): Cv => {
    const key = id + '@base';
    let c = iconCache.get(key);
    if (c) return c;
    const [cv, g] = mk(BASE, BASE);
    if (DRAWN[id]) {
      const [t, tg] = mk(32, 32);
      DRAWN[id](tg);
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(t, 0, 0, BASE, BASE);
    } else cardAtlas.drawSized(g, id, BASE / 2, BASE, BASE);
    iconCache.set(key, cv);
    return cv;
  };
  const scaled = (src: Cv, size: number): Cv => {
    if (size === src.width) return src;
    const [cv, g] = mk(size, size);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(src, 0, 0, size, size);
    return cv;
  };
  const kit: Kit = {
    stage, atlas, cardAtlas,
    icon(id, size = 32) {
      const key = id + '@' + size;
      let c = iconCache.get(key);
      if (!c) { c = scaled(base64(id), size); iconCache.set(key, c); }
      return c;
    },
    animal(id, size = 32) {
      const key = id + '@' + size;
      let c = animalCache.get(key);
      if (!c) {
        const [b, bg] = mk(BASE, BASE);
        atlas.drawSized(bg, id, BASE / 2, BASE, BASE);
        c = scaled(b, size); animalCache.set(key, c);
      }
      return c;
    },
    cardThumb(id, level, size) {
      const key = `${id}@${level}@${size}`;
      let c = thumbCache.get(key);
      if (c) return c;
      const card = cardOf(id);
      const [cv, g] = mk(size, size);
      g.fillStyle = INK; g.fillRect(0, 0, size, size);
      g.fillStyle = SHELF_COL[card.shelf]; g.fillRect(1, 1, size - 2, size - 2);
      g.fillStyle = SHELF_TINT[card.shelf]; g.fillRect(3, 3, size - 6, size - 6);
      const a = Math.round(size * 0.66);
      g.imageSmoothingEnabled = true; g.drawImage(kit.animal(id, 32), Math.round((size - a) / 2), 3 + Math.round((size - 6 - a) / 2) - 1, a, a);
      g.imageSmoothingEnabled = true;
      const stars = Math.max(0, level - 1);
      for (let i = 0; i < stars; i++) { // star pips along the bottom edge
        const sx = Math.round(size / 2 - (stars * 5) / 2 + i * 5 + 1);
        g.fillStyle = INK; g.fillRect(sx - 1, size - 7, 5, 5); g.fillStyle = '#ffd93d'; g.fillRect(sx, size - 6, 3, 3);
      }
      thumbCache.set(key, cv);
      return cv;
    },
    unknownSlot(id, size) {
      const key = `?${id}@${size}`;
      let c = thumbCache.get(key);
      if (c) return c;
      const card = cardOf(id);
      const [cv, g] = mk(size, size);
      g.fillStyle = INK; g.fillRect(0, 0, size, size);
      g.fillStyle = '#3a3552'; g.fillRect(1, 1, size - 2, size - 2);
      g.fillStyle = '#4a4568'; g.fillRect(3, 3, size - 6, size - 6);
      const a = Math.round(size * 0.66);
      const sil = atlas.silhouette(id);
      if (sil) {
        const [t, tg] = mk(a, a); tg.imageSmoothingEnabled = true; tg.drawImage(sil, 0, 0, a, a);
        tg.globalCompositeOperation = 'source-in'; tg.fillStyle = '#12101c'; tg.fillRect(0, 0, a, a);
        g.drawImage(t, Math.round((size - a) / 2), Math.round((size - a) / 2) - 1);
      }
      // "?" in 5x5 pixel style, 2x
      g.fillStyle = '#e9e6ff';
      const q = ['01110', '10001', '00110', '00000', '00100'];
      for (let r = 0; r < 5; r++) for (let k = 0; k < 5; k++) if (q[r][k] === '1') g.fillRect(Math.round(size / 2 - 5 + k * 2), Math.round(size / 2 - 6 + r * 2), 2, 2);
      void card;
      thumbCache.set(key, cv);
      return cv;
    },
    scene(shelf) {
      const key = 'scene:' + shelf;
      let c = sized.get(key);
      if (!c) { c = sceneFor(shelf, stage.W, stage.H, kit.icon); sized.set(key, c); }
      return c;
    },
    world() {
      let c = sized.get('world');
      if (!c) { c = worldScene(stage.W, stage.H); sized.set('world', c); }
      return c;
    },
    door(shelf, open) {
      const key = `door:${shelf}:${open}`;
      let c = sized.get(key);
      if (!c) { c = doorSprite(shelf, open, kit.icon, open ? kit.scene(shelf) : null); sized.set(key, c); }
      return c;
    },
    truck() {
      let c = iconCache.get('truck');
      if (!c) { c = truckSprite(); iconCache.set('truck', c); }
      return c;
    },
    shelfButton(ids) {
      const key = 'shelfbtn:' + ids.join(',');
      let c = thumbCache.get(key);
      if (!c) { c = shelfButton(ids.map((id) => kit.cardThumb(id, 1, 24))); thumbCache.set(key, c); }
      return c;
    },
    invalidate() { sized = new Map(); },
  };
  void CARDS;
  return kit;
}
