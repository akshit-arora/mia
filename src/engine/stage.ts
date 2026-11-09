// Micro-engine: logical-resolution canvas, integer scaling, dirty-flag loop, tweens, pointer input.
/** Fixed logical canvas: 240 x 135, letterboxed by the page (centred, night background). */
export const LOGICAL_W = 240;
export const LOGICAL_H = 135;
/**
 * Fill as much of the screen as the 16:9 canvas allows. The scale is fractional (rounded DOWN to 0.01 so it never overflows):
 * on a phone in landscape an integer scale left huge blue bars, so the picture now grows until it touches the screen edges
 * on the limiting side. Only the leftover of a wider-than-16:9 screen stays as letterbox.
 */
export function fitScale(vw: number, vh: number): number {
  const s = Math.min(Math.max(vw, 1) / LOGICAL_W, Math.max(vh, 1) / LOGICAL_H);
  return Math.floor(s * 100) / 100;
}

export type Ease = (t: number) => number;
export const easeOut: Ease = (t) => 1 - (1 - t) * (1 - t);
export const easeInOut: Ease = (t) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
export const lin: Ease = (t) => t;

interface Tw { t0: number; ms: number; fn: (t: number) => void; done: () => void; ease: Ease }

export interface PointerEv { x: number; y: number; id: number }

export class Stage {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  W = 240;
  H = 135;
  scale = 1;
  reduced = false;
  draw: (ctx: CanvasRenderingContext2D, now: number) => void = () => {};
  onDown: (p: PointerEv) => void = () => {};
  onMove: (p: PointerEv) => void = () => {};
  onUp: (p: PointerEv) => void = () => {};
  onCancel: () => void = () => {};
  onKey: (e: KeyboardEvent) => void = () => {};
  onResize: () => void = () => {};
  /** Optional frame probe (the ?fps overlay). null = off, and then the frame loop pays one null check. */
  probe: { begin(): void; end(now: number): void } | null = null;
  private dirty = true;
  private tws: Tw[] = [];
  private last = 0;
  private lastIdle = 0;
  private boost = 0; // keep 60 fps while > now
  private pointerDown = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 100));
    const pt = (e: PointerEvent): PointerEv => {
      const r = canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * this.W, y: ((e.clientY - r.top) / r.height) * this.H, id: e.pointerId };
    };
    canvas.addEventListener('pointerdown', (e) => {
      this.pointerDown = true;
      try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      this.boost = performance.now() + 1e9;
      this.onDown(pt(e));
      this.invalidate();
    });
    canvas.addEventListener('pointermove', (e) => { if (this.pointerDown) { this.onMove(pt(e)); this.invalidate(); } });
    const up = (e: PointerEvent) => {
      if (!this.pointerDown) return;
      this.pointerDown = false;
      this.boost = 0;
      this.onUp(pt(e));
      this.invalidate();
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', () => {
      if (!this.pointerDown) return;
      this.pointerDown = false; this.boost = 0; this.onCancel(); this.invalidate();
    });
    canvas.addEventListener('keydown', (e) => { this.onKey(e); this.invalidate(); });
    this.resize();
  }

  resize(): void {
    this.H = LOGICAL_H;
    this.W = LOGICAL_W;
    this.scale = fitScale(window.innerWidth, window.innerHeight);
    this.canvas.width = this.W;
    this.canvas.height = this.H;
    this.canvas.style.width = this.W * this.scale + 'px';
    this.canvas.style.height = this.H * this.scale + 'px';
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.onResize();
    this.invalidate();
  }

  invalidate(): void { this.dirty = true; }

  /** Run fn(eased t) over ms. With reduced motion, jumps to the end almost at once. */
  tween(ms: number, fn: (t: number) => void, ease: Ease = easeInOut): Promise<void> {
    return new Promise((done) => {
      this.tws.push({ t0: performance.now(), ms: this.reduced ? Math.min(ms, 60) : ms, fn, done, ease });
      this.invalidate();
    });
  }

  sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }

  start(): void {
    const frame = (now: number) => {
      requestAnimationFrame(frame);
      if (document.hidden) return;
      const fast = this.boost > 0;
      if (now - this.last < (fast ? 15 : 32)) return; // 60 fps while dragging, otherwise 30
      this.last = now;
      if (this.tws.length) {
        const still: Tw[] = [];
        for (const tw of this.tws) {
          const p = Math.min(1, (now - tw.t0) / tw.ms);
          tw.fn(tw.ease(p));
          if (p >= 1) tw.done(); else still.push(tw);
        }
        this.tws = still;
        this.dirty = true;
      }
      if (!this.dirty && now - this.lastIdle < 250) return; // idle animation at 4 fps
      this.dirty = false;
      this.lastIdle = now;
      const p = this.probe;
      if (p) p.begin();
      this.draw(this.ctx, now);
      if (p) p.end(now);
    };
    requestAnimationFrame(frame);
  }
}
