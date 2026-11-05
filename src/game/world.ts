import type { Atlas } from '../engine';
import { glyph } from '../engine';
import type { Entity, Zone } from '../types';
import { reaction } from './reactions';

export interface Res { id: string; zone: string; slot: number; act?: { name: string; t0: number; dur: number }; bubble?: number /* expiry ms */ }
export interface Rect { x: number; y: number; w: number; h: number }

export const C = {
  skyDay: '#7fd0ff', skyNight: '#1d2b53', ground: '#5cbf5a', groundDark: '#3f9a45', road: '#6b6f7a', roadLine: '#f4e04d',
  outline: '#181020', white: '#ffffff', truck: '#ff7a2f', truckDark: '#c4531a', crate: '#c88b4a', crateDark: '#8e5d2a',
};

export class World {
  zones: Zone[] = [];
  visible = new Set<string>();
  residents: Res[] = [];
  truck = { x: -80, show: true, bounce: 0, eyes: 0 };
  crate: 'none' | 'closed' | 'open' = 'none';
  crateShake = 0; // px offset
  crateSealed = false; // evening crate with ?
  mystery = false;
  held: { id: string; x: number; y: number; picked: boolean; flip: boolean; lift: number } | null = null;
  resting: { id: string; x: number; y: number } | null = null; // animal waiting on the truck
  ghost: { x0: number; y0: number; x1: number; y1: number; t: number } | null = null;
  night = 0;
  targets: string[] = [];
  highlight: string | null = null;
  pulse = false;
  highContrast = false;
  reduced = false;
  sleeping = false;
  sparkles: { x: number; y: number; t0: number }[] = [];
  fireflies = Array.from({ length: 9 }, (_, i) => ({ x: 20 + ((i * 53) % 220), y: 20 + ((i * 29) % 90), p: i * 1.7 }));

  constructor(public entities: Map<string, Entity>, public atlas: Atlas, public W: number, public H: number) {}

  zoneIndex(id: string): number { return this.zones.findIndex((z) => z.id === id); }
  zoneRect(id: string): Rect {
    const n = this.zones.length, i = Math.max(0, this.zoneIndex(id));
    const pw = Math.floor((this.W - 6 * (n + 1)) / n);
    return { x: 6 + i * (pw + 6), y: 18, w: pw, h: 56 };
  }
  slotPos(r: Res): { x: number; y: number } {
    const z = this.zoneRect(r.zone);
    const cols = Math.max(2, Math.floor((z.w - 4) / 24));
    const row = Math.floor(r.slot / cols) % 3, col = r.slot % cols;
    const extra = Math.floor(r.slot / (cols * 3)) * 10;
    const jx = ((r.slot * 7) % 5) - 2;
    return { x: z.x + 4 + 12 + col * ((z.w - 8) / cols) + (z.w - 8) / cols / 2 - 12 + jx + extra, y: z.y + 34 + row * 11 };
  }
  rebuild(park: string[]): void {
    const counts: Record<string, number> = {};
    const old = this.residents;
    this.residents = park.filter((id) => this.entities.has(id)).map((id, i) => {
      const z = this.entities.get(id)!.accepts[0];
      counts[z] = (counts[z] ?? 0) + 1;
      const prev = old[i]; // keep live state (bubbles, reactions) when the list only grew
      if (prev && prev.id === id && prev.zone === z && prev.slot === counts[z] - 1) return prev;
      return { id, zone: z, slot: counts[z] - 1 };
    });
  }
  hitZone(x: number, y: number, margin = 6): string | null {
    let best: string | null = null, bd = 1e9;
    for (const id of this.targets) {
      const r = this.zoneRect(id);
      const dx = Math.max(r.x - x, 0, x - (r.x + r.w)), dy = Math.max(r.y - y, 0, y - (r.y + r.h));
      const d = Math.hypot(dx, dy);
      if (d <= margin && d < bd) { bd = d; best = id; }
    }
    return best;
  }
  residentAt(x: number, y: number): Res | null {
    for (let i = this.residents.length - 1; i >= 0; i--) {
      const r = this.residents[i];
      if (!this.visible.has(r.zone)) continue;
      const p = this.slotPos(r);
      if (Math.abs(x - p.x) <= 14 && y <= p.y + 4 && y >= p.y - 28) return r;
    }
    return null;
  }

  // ---------- drawing ----------
  render(g: CanvasRenderingContext2D, now: number): void {
    const W = this.W, H = this.H;
    g.fillStyle = this.mix(C.skyDay, C.skyNight, this.night); g.fillRect(0, 0, W, H);
    if (this.night > 0.4) { g.fillStyle = '#fff6c0'; g.beginPath(); g.arc(W - 26, 12, 6, 0, 7); g.fill(); g.fillStyle = this.mix(C.skyDay, C.skyNight, this.night); g.beginPath(); g.arc(W - 23, 10, 5, 0, 7); g.fill(); }
    else { g.fillStyle = '#fff'; const cx = (now / 400) % (W + 40); g.fillRect(Math.round(cx - 30), 4, 22, 5); g.fillRect(Math.round(cx - 26), 2, 12, 4); }
    g.fillStyle = this.mix(C.ground, '#1f4d3a', this.night); g.fillRect(0, 74, W, H - 74);
    g.fillStyle = this.mix(C.road, '#2b2f40', this.night); g.fillRect(0, 100, W, 30);
    g.fillStyle = C.roadLine; for (let x = 4; x < W; x += 20) g.fillRect(x, 114, 10, 2);

    for (const z of this.zones) this.drawZone(g, z, now);
    for (const r of this.residents) if (this.visible.has(r.zone)) this.drawResident(g, r, now);
    for (const r of this.residents) if (r.bubble && now < r.bubble && this.visible.has(r.zone)) { const p = this.slotPos(r); this.drawBubble(g, p.x, p.y - 26, now); }
    this.drawTruck(g, now);
    if (this.resting && !this.held) this.drawAnimal(g, this.resting.id, this.resting.x, this.resting.y, now);
    if (this.ghost) this.drawGhost(g);
    if (this.held) {
      const h = this.held;
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(Math.round(h.x - 10), Math.round(h.y + 1), 20, 3);
      this.atlas.draw(g, h.id, h.x, h.y - h.lift, h.flip);
    }
    for (const s of this.sparkles) {
      const p = (now - s.t0) / 700; if (p > 1) continue;
      g.fillStyle = '#fff6a0'; g.fillRect(Math.round(s.x - 6 + p * 12), Math.round(s.y - p * 10), 2, 2); g.fillRect(Math.round(s.x + 5 - p * 10), Math.round(s.y - p * 14), 2, 2);
    }
    this.sparkles = this.sparkles.filter((s) => now - s.t0 < 700);
    if (this.night > 0) {
      g.fillStyle = `rgba(20,20,70,${(this.night * 0.5).toFixed(2)})`; g.fillRect(0, 0, W, H);
      if (this.night > 0.5 && !this.reduced) for (const f of this.fireflies) {
        const on = Math.sin(now / 900 + f.p) > -0.2; if (!on) continue;
        g.fillStyle = '#ffee66'; g.fillRect(Math.round(f.x + Math.sin(now / 1500 + f.p) * 6), Math.round(f.y + Math.cos(now / 1300 + f.p) * 4), 2, 2);
      }
    }
  }
  private mix(a: string, b: string, t: number): string {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
  }
  private drawZone(g: CanvasRenderingContext2D, z: Zone, now: number): void {
    const r = this.zoneRect(z.id);
    if (!this.visible.has(z.id)) {
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(r.x, r.y, r.w, r.h);
      glyph(g, '?', r.x + r.w / 2 - 5, r.y + r.h / 2 - 5, 'rgba(255,255,255,0.5)', 2);
      return;
    }
    const theme = z.theme;
    g.fillStyle = theme === 'jungle' ? '#1f7a3a' : theme === 'farm' ? '#b7e07a' : '#f1d6a8';
    g.fillRect(r.x, r.y, r.w, r.h);
    g.fillStyle = theme === 'jungle' ? '#176030' : theme === 'farm' ? '#9ccc5f' : '#dcbb88';
    g.fillRect(r.x, r.y + r.h - 18, r.w, 18);
    // decoration (also tells the places apart without colour)
    if (theme === 'jungle') {
      for (const tx of [r.x + 8, r.x + r.w - 14]) { g.fillStyle = '#6b4423'; g.fillRect(tx + 2, r.y + 8, 3, 14); g.fillStyle = '#0e5a24'; g.fillRect(tx - 3, r.y + 1, 13, 9); g.fillRect(tx - 1, r.y - 1, 9, 3); }
      g.fillStyle = '#ff9bd0'; g.fillRect(r.x + r.w / 2 - 1, r.y + 22, 3, 3);
    } else if (theme === 'farm') {
      g.fillStyle = '#c0392b'; g.fillRect(r.x + r.w - 26, r.y + 5, 20, 14); g.fillStyle = '#7b241c'; g.fillRect(r.x + r.w - 28, r.y + 2, 24, 4); g.fillStyle = '#fff'; g.fillRect(r.x + r.w - 19, r.y + 11, 6, 8);
      g.fillStyle = '#8b5a2b'; for (let x = r.x + 3; x < r.x + 34; x += 8) { g.fillRect(x, r.y + 12, 2, 10); } g.fillRect(r.x + 3, r.y + 14, 30, 2);
    } else {
      g.fillStyle = '#e8744a'; g.fillRect(r.x + 6, r.y + 8, 20, 14); g.fillStyle = '#8e3b1f';
      g.beginPath(); g.moveTo(r.x + 3, r.y + 9); g.lineTo(r.x + 16, r.y); g.lineTo(r.x + 29, r.y + 9); g.fill();
      g.fillStyle = '#fff'; g.fillRect(r.x + 13, r.y + 14, 6, 8); g.fillStyle = '#ffd93d'; g.fillRect(r.x + 8, r.y + 11, 3, 3);
    }
    // border: stronger in high contrast, pulses when an animal is picked up
    const hot = this.highlight === z.id;
    g.strokeStyle = hot ? '#ffffff' : this.highContrast ? '#ffffff' : C.outline;
    g.lineWidth = hot || this.highContrast ? 2 : 1;
    if (this.pulse && this.targets.includes(z.id) && !this.reduced && Math.sin(now / 250) > 0) g.lineWidth = 2;
    g.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    if (hot) { g.strokeStyle = '#ffd93d'; g.lineWidth = 1; g.strokeRect(r.x + 2.5, r.y + 2.5, r.w - 5, r.h - 5); }
  }
  private drawAnimal(g: CanvasRenderingContext2D, id: string, x: number, y: number, now: number, small = false, flip = false, m?: { dx: number; dy: number; sx: number; sy: number }): void {
    g.save();
    g.translate(Math.round(x + (m?.dx ?? 0)), Math.round(y + (m?.dy ?? 0)));
    if (m) g.scale(m.sx, m.sy);
    if (small) this.atlas.drawSmall(g, id, 0, 0, flip); else this.atlas.draw(g, id, 0, 0, flip);
    g.restore();
    void now;
  }
  private drawResident(g: CanvasRenderingContext2D, r: Res, now: number): void {
    const p = this.slotPos(r);
    const e = this.entities.get(r.id)!;
    let m: { dx: number; dy: number; sx: number; sy: number } | undefined;
    let t = 0;
    if (r.act) {
      t = (now - r.act.t0) / r.act.dur;
      if (t >= 1) r.act = undefined; else m = reaction(r.act.name).motion(t);
    }
    const breathe = this.sleeping ? 0 : (this.reduced ? 0 : Math.round(Math.sin(now / 700 + r.slot) * 0.5));
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(Math.round(p.x - 9), Math.round(p.y), 18, 2);
    if (this.sleeping) {
      this.drawAnimal(g, r.id, p.x, p.y + 1, now, true, r.slot % 2 === 0, { dx: 0, dy: 0, sx: 1.08, sy: 0.9 });
      glyph(g, 'z', p.x + 4, p.y - 30 - ((now / 500 + r.slot) % 3) * 2, '#fff', 1);
    } else this.drawAnimal(g, r.id, p.x, p.y + breathe, now, true, r.slot % 2 === 1, m);
    if (r.act) { const rc = reaction(r.act.name); rc.prop?.(g, p.x, p.y, Math.min(1, t)); }
    void e;
  }
  drawBubble(g: CanvasRenderingContext2D, x: number, y: number, now: number): void {
    const bob = this.reduced ? 0 : Math.round(Math.sin(now / 300) * 1.5);
    g.fillStyle = C.outline; g.fillRect(Math.round(x - 8), Math.round(y - 12 + bob), 16, 14);
    g.fillStyle = '#fff'; g.fillRect(Math.round(x - 7), Math.round(y - 11 + bob), 14, 12);
    g.fillStyle = C.outline; g.fillRect(Math.round(x - 1), Math.round(y + 2 + bob), 3, 3);
    glyph(g, '?', x - 5, y - 9 + bob, '#7a3fd0', 2);
  }
  private drawGhost(g: CanvasRenderingContext2D): void {
    const k = this.ghost!;
    const t = k.t, e = t < 0.15 ? 0 : t > 0.85 ? 1 : (t - 0.15) / 0.7;
    const x = k.x0 + (k.x1 - k.x0) * e, y = k.y0 + (k.y1 - k.y0) * e;
    const a = t < 0.1 ? t * 10 : t > 0.9 ? (1 - t) * 10 : 1;
    g.globalAlpha = 0.85 * a;
    g.fillStyle = C.outline; g.beginPath(); g.arc(Math.round(x), Math.round(y), 6, 0, 7); g.fill(); g.fillRect(Math.round(x - 2), Math.round(y - 12), 5, 9);
    g.fillStyle = '#fff'; g.beginPath(); g.arc(Math.round(x), Math.round(y), 5, 0, 7); g.fill(); g.fillRect(Math.round(x - 1), Math.round(y - 11), 3, 8);
    g.globalAlpha = 1;
  }
  private drawTruck(g: CanvasRenderingContext2D, now: number): void {
    if (!this.truck.show) return;
    const x = Math.round(this.truck.x), by = 126 + Math.round(this.truck.bounce);
    // bed + crate
    g.fillStyle = C.outline; g.fillRect(x - 1, by - 21, 62, 20);
    g.fillStyle = C.truck; g.fillRect(x, by - 12, 34, 10); // bed
    g.fillRect(x + 34, by - 20, 24, 18); g.fillStyle = C.truckDark; g.fillRect(x + 34, by - 6, 24, 4);
    g.fillStyle = '#bfe9ff'; g.fillRect(x + 44, by - 18, 12, 7);
    // eyes
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 49, by - 14, 4, 0, 7); g.fill();
    g.fillStyle = C.outline; const blink = !this.reduced && Math.floor(now / 2600) % 7 === 0 && now % 2600 < 140; if (blink) g.fillRect(x + 46, by - 14, 6, 1); else g.fillRect(x + 49 + Math.round(this.truck.eyes), by - 15, 2, 3);
    // wheels
    for (const wx of [x + 10, x + 46]) { g.fillStyle = C.outline; g.beginPath(); g.arc(wx, by - 2, 6, 0, 7); g.fill(); g.fillStyle = '#9aa0ad'; g.beginPath(); g.arc(wx, by - 2, 2.5, 0, 7); g.fill(); }
    if (this.crate !== 'none') {
      const cx = x + 4 + Math.round(this.crateShake), cy = by - 31;
      g.fillStyle = C.outline; g.fillRect(cx - 1, cy - 1, 26, 20);
      g.fillStyle = C.crate; g.fillRect(cx, cy, 24, 18); g.fillStyle = C.crateDark; g.fillRect(cx, cy + 8, 24, 2); g.fillRect(cx + 11, cy, 2, 18);
      if (this.crate === 'open') { g.fillStyle = C.crateDark; g.fillRect(cx - 2, cy - 5, 8, 4); g.fillRect(cx + 18, cy - 6, 8, 4); }
      else glyph(g, '?', cx + 7, cy + 2, '#fff', 2);
    }
  }
  /** Hit test for the waiting animal */
  hitResting(x: number, y: number): boolean {
    const r = this.resting; if (!r) return false;
    return Math.abs(x - r.x) <= 22 && y >= r.y - 40 && y <= r.y + 8;
  }
}
