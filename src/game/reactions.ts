// Poke reactions and Wonder actions: small procedural motions plus pixel props. Data picks the name.
export interface Motion { dx: number; dy: number; sx: number; sy: number; flip?: boolean }
export interface Reaction {
  dur: number;
  motion: (t: number) => Motion;
  prop?: (g: CanvasRenderingContext2D, x: number, y: number, t: number) => void; // x,y = sprite bottom centre
  sfx?: 'purr' | 'splash' | 'hop' | 'sparkle';
}
const M = (dx = 0, dy = 0, sx = 1, sy = 1): Motion => ({ dx, dy, sx, sy });
const hop = (n: number, h: number) => (t: number) => M(0, -Math.abs(Math.sin(t * Math.PI * n)) * h);
const sway = (n: number, a: number) => (t: number) => M(Math.sin(t * Math.PI * 2 * n) * a);
const nod = (n: number, a: number) => (t: number) => M(0, Math.abs(Math.sin(t * Math.PI * n)) * a);
const stretch = (t: number) => { const s = Math.sin(t * Math.PI); return M(0, 0, 1 - s * 0.08, 1 + s * 0.18); };
const rect = (g: CanvasRenderingContext2D, c: string, x: number, y: number, w: number, h: number) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
const dot = (g: CanvasRenderingContext2D, c: string, x: number, y: number, r: number) => { g.fillStyle = c; g.beginPath(); g.arc(Math.round(x), Math.round(y), r, 0, 7); g.fill(); };

const drops = (g: CanvasRenderingContext2D, x: number, y: number, t: number) => {
  for (let i = 0; i < 6; i++) { const p = (t * 1.3 + i / 6) % 1; dot(g, '#7fd3ff', x + 10 + p * 14, y - 24 + Math.sin(p * Math.PI) * -8 + p * 22, 1); }
};
const puddle = (g: CanvasRenderingContext2D, x: number, y: number) => { g.fillStyle = '#5aa9e6'; g.fillRect(Math.round(x - 14), Math.round(y - 2), 28, 3); };
const ball = (g: CanvasRenderingContext2D, x: number, y: number, t: number) => dot(g, '#ff4d4d', x + 12, y - 30 - Math.sin(t * Math.PI) * 8, 3);
const banana = (g: CanvasRenderingContext2D, x: number, y: number, t: number) => {
  rect(g, t < 0.5 ? '#ffd93d' : '#fff3a8', x + 8, y - 22, 3, 8); rect(g, '#ffd93d', x + 10, y - 14, 5, 3);
  if (t > 0.5) { rect(g, '#e0b800', x + 14, y - 12 + (t - 0.5) * 10, 4, 2); }
};
const egg = (g: CanvasRenderingContext2D, x: number, y: number, t: number) => { dot(g, '#fff', x + 14, y - 4 - Math.sin(t * Math.PI) * 3, 3); };
const carrot = (g: CanvasRenderingContext2D, x: number, y: number) => { rect(g, '#ff8c1a', x + 9, y - 6, 6, 3); rect(g, '#3cb043', x + 14, y - 7, 3, 2); };
const stick = (g: CanvasRenderingContext2D, x: number, y: number, t: number) => rect(g, '#8b5a2b', x + 6 + Math.sin(t * Math.PI) * 14, y - 6, 8, 2);
const leaf = (g: CanvasRenderingContext2D, x: number, y: number) => { rect(g, '#3cb043', x + 10, y - 8, 4, 3); };
const fan = (g: CanvasRenderingContext2D, x: number, y: number, t: number) => {
  const open = Math.min(1, t * 2.2);
  for (let i = 0; i < 7; i++) { const a = Math.PI + (i / 6) * Math.PI; const r = 16 * open; rect(g, i % 2 ? '#1fa3a3' : '#2bd1d1', x + Math.cos(a) * r - 1, y - 14 + Math.sin(a) * r - 1, 3, 3); dot(g, '#ffd93d', x + Math.cos(a) * r, y - 14 + Math.sin(a) * r, 1); }
};
const rock = (g: CanvasRenderingContext2D, x: number, y: number) => { rect(g, '#8d8d8d', x + 10, y - 9, 12, 9); rect(g, '#b0b0b0', x + 12, y - 11, 8, 3); };
const chick = (g: CanvasRenderingContext2D, x: number, y: number, t: number) => {
  rect(g, '#fff', x + 10, y - 7, 6, 6); if (t < 0.45) rect(g, '#bbb', x + 10, y - 5, 6, 1);
  else { dot(g, '#ffe14d', x + 13, y - 8 - (t - 0.45) * 8, 3); rect(g, '#ff9f1a', x + 15, y - 9 - (t - 0.45) * 8, 2, 1); rect(g, '#fff', x + 10, y - 3, 6, 3); }
};
const hearts = (g: CanvasRenderingContext2D, x: number, y: number, t: number) => { for (let i = 0; i < 3; i++) dot(g, '#ff7fa8', x + 6 + i * 6, y - 30 - ((t * 20 + i * 5) % 14), 1.5); };
const zzz = (g: CanvasRenderingContext2D, x: number, y: number, t: number) => { rect(g, '#fff', x + 8, y - 28 - t * 6, 3, 1); rect(g, '#fff', x + 10, y - 31 - t * 6, 3, 1); };

export const REACTIONS: Record<string, Reaction> = {
  yawn: { dur: 1400, motion: stretch, prop: zzz },
  stretch: { dur: 1300, motion: (t) => { const m = stretch(t); m.dx = Math.sin(t * 18) * 1; return m; } },
  spray: { dur: 1500, motion: nod(2, 2), prop: drops, sfx: 'splash' },
  scratch: { dur: 1400, motion: sway(3, 2) },
  rub: { dur: 1400, motion: sway(2.5, 3) },
  fan: { dur: 1700, motion: (t) => M(0, 0, 1 + Math.sin(t * Math.PI) * 0.08, 1), prop: fan, sfx: 'sparkle' },
  swish: { dur: 1300, motion: sway(2, 1.5) },
  roll: { dur: 1400, motion: (t) => M(0, 0, 1 + Math.sin(t * Math.PI) * 0.1, 1 - Math.sin(t * Math.PI) * 0.1), prop: (g, x, y) => puddle(g, x, y), sfx: 'splash' },
  hop: { dur: 1300, motion: hop(3, 6), prop: leaf, sfx: 'hop' },
  peck: { dur: 1500, motion: nod(4, 3), prop: egg },
  trot: { dur: 1400, motion: hop(5, 3), sfx: 'hop' },
  fetch: { dur: 1700, motion: (t) => M(Math.sin(t * Math.PI) * 14), prop: stick },
  lick: { dur: 1300, motion: nod(3, 2) },
  nibble: { dur: 1500, motion: nod(5, 2), prop: (g, x, y) => carrot(g, x, y), sfx: 'hop' },
  // Wonder actions
  ball: { dur: 1700, motion: (t) => M(0, 0, 1, 1 + Math.sin(t * Math.PI) * 0.1), prop: ball, sfx: 'sparkle' },
  banana: { dur: 1700, motion: sway(2, 1.5), prop: banana },
  climb: { dur: 1700, motion: (t) => M(Math.min(1, t * 2) * 8, -Math.min(1, t * 2) * 9 + (t > 0.7 ? Math.sin((t - 0.7) * 20) : 0)), prop: (g, x, y) => rock(g, x, y), sfx: 'hop' },
  chick: { dur: 1800, motion: nod(2, 1), prop: chick, sfx: 'sparkle' },
  purr: { dur: 2000, motion: sway(1.5, 1), prop: hearts, sfx: 'purr' },
};
export function reaction(name: string): Reaction { return REACTIONS[name] || REACTIONS.hop; }
