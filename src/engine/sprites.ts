// Baked sprite atlas (see tools/bake-emoji.mjs). Cells are 32x32; a 24 px copy is made once for the park.
export interface AtlasJson { cell: number; cols: number; sprites: Record<string, { x: number; y: number }> }

export class Atlas {
  private small: Record<string, HTMLCanvasElement> = {};
  private flat: Record<string, HTMLCanvasElement> = {};
  constructor(private img: HTMLImageElement, private json: AtlasJson) {}
  has(id: string): boolean { return !!this.json.sprites[id]; }
  /** Draw at full 32 px; bottom-centre anchored. */
  draw(ctx: CanvasRenderingContext2D, id: string, cx: number, by: number, flip = false): void {
    const s = this.json.sprites[id]; if (!s) return;
    const c = this.json.cell;
    if (flip) {
      ctx.save(); ctx.translate(Math.round(cx), 0); ctx.scale(-1, 1);
      ctx.drawImage(this.img, s.x, s.y, c, c, -c / 2, Math.round(by - c), c, c);
      ctx.restore();
    } else ctx.drawImage(this.img, s.x, s.y, c, c, Math.round(cx - c / 2), Math.round(by - c), c, c);
  }
  /** 24 px version, pre-scaled once with smoothing so the park looks tidy. */
  drawSmall(ctx: CanvasRenderingContext2D, id: string, cx: number, by: number, flip = false): void {
    let cv = this.small[id];
    if (!cv) {
      const s = this.json.sprites[id]; if (!s) return;
      cv = document.createElement('canvas'); cv.width = 24; cv.height = 24;
      const g = cv.getContext('2d')!; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(this.img, s.x, s.y, this.json.cell, this.json.cell, 0, 0, 24, 24);
      this.small[id] = cv;
    }
    if (flip) { ctx.save(); ctx.translate(Math.round(cx), 0); ctx.scale(-1, 1); ctx.drawImage(cv, -12, Math.round(by - 24)); ctx.restore(); }
    else ctx.drawImage(cv, Math.round(cx - 12), Math.round(by - 24));
  }
  /** Flat dark silhouette (used for sleeping animals and silhouette reveals). */
  silhouette(id: string): HTMLCanvasElement | null {
    if (this.flat[id]) return this.flat[id];
    const s = this.json.sprites[id]; if (!s) return null;
    const cv = document.createElement('canvas'); cv.width = 32; cv.height = 32;
    const g = cv.getContext('2d')!;
    g.drawImage(this.img, s.x, s.y, 32, 32, 0, 0, 32, 32);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = '#1d2b53'; g.fillRect(0, 0, 32, 32);
    return (this.flat[id] = cv);
  }
}

export function loadAtlas(imgUrl: string, json: AtlasJson): Promise<Atlas> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(new Atlas(img, json));
    img.onerror = () => rej(new Error('atlas failed'));
    img.src = imgUrl;
  });
}

// Tiny 5x5 pixel glyphs so the canvas never needs a font file.
const GLYPHS: Record<string, string[]> = {
  '?': ['01110', '10001', '00110', '00000', '00100'],
  z: ['11111', '00010', '00100', '01000', '11111'],
  '*': ['00100', '10101', '01110', '10101', '00100'],
  h: ['01010', '11111', '11111', '01110', '00100'],
};
export function glyph(ctx: CanvasRenderingContext2D, ch: string, x: number, y: number, color: string, s = 1): void {
  const g = GLYPHS[ch]; if (!g) return;
  ctx.fillStyle = color;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (g[r][c] === '1') ctx.fillRect(Math.round(x + c * s), Math.round(y + r * s), s, s);
}
