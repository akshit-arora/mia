// Baked sprite atlas (see tools/bake-emoji.mjs). Cells are 64x64 (flat-vector bake); callers draw them
// at any logical size. Downscaling is always smoothed, so the art stays crisp instead of pixelated.
export interface AtlasJson { cell: number; cols: number; sprites: Record<string, { x: number; y: number }> }

export class Atlas {
  private small: Record<string, HTMLCanvasElement> = {};
  private flat: Record<string, HTMLCanvasElement> = {};
  constructor(private img: HTMLImageElement, private json: AtlasJson) {}
  has(id: string): boolean { return !!this.json.sprites[id]; }
  /** Draw bottom-centre anchored at an explicit logical size. Smoothing is the caller's setting. */
  drawSized(ctx: CanvasRenderingContext2D, id: string, cx: number, by: number, size: number, flip = false): void {
    const s = this.json.sprites[id]; if (!s) return;
    const c = this.json.cell;
    if (flip) {
      ctx.save(); ctx.translate(Math.round(cx), 0); ctx.scale(-1, 1);
      ctx.drawImage(this.img, s.x, s.y, c, c, -size / 2, Math.round(by - size), size, size);
      ctx.restore();
    } else ctx.drawImage(this.img, s.x, s.y, c, c, Math.round(cx - size / 2), Math.round(by - size), size, size);
  }
  /** Legacy 32 px draw (the classic sorting game uses it); bottom-centre anchored. */
  draw(ctx: CanvasRenderingContext2D, id: string, cx: number, by: number, flip = false): void {
    this.drawSized(ctx, id, cx, by, 32, flip);
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
  silhouette(id: string, size = 64): HTMLCanvasElement | null {
    const key = `${id}@${size}`;
    if (this.flat[key]) return this.flat[key];
    const s = this.json.sprites[id]; if (!s) return null;
    const cv = document.createElement('canvas'); cv.width = size; cv.height = size;
    const g = cv.getContext('2d')!; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(this.img, s.x, s.y, this.json.cell, this.json.cell, 0, 0, size, size);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = '#1d2b53'; g.fillRect(0, 0, size, size);
    return (this.flat[key] = cv);
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
