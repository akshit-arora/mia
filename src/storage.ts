import type { Progress } from './types';

const KEY = 'animal-express.progress.v1';

export function defaultProgress(): Progress {
  return {
    v: 1, introDone: false, sessions: 0, cleanRuns: {}, seenLevels: [], confidence: {}, park: [], stickers: [],
    settings: { captions: 'auto', captionSize: 'medium', muted: false, highContrast: false, vibration: true, reducedMotion: 'auto', locale: 'en' },
  };
}

let memory: string | null = null; // fallback when localStorage is blocked

export function sanitize(raw: any): Progress {
  const d = defaultProgress();
  if (!raw || typeof raw !== 'object' || raw.v !== 1) return d;
  const arr = (a: any) => (Array.isArray(a) ? a.filter((x) => typeof x === 'string').slice(0, 200) : []);
  const rec = (o: any) => { const r: Record<string, number> = {}; if (o && typeof o === 'object') for (const k of Object.keys(o)) if (typeof o[k] === 'number') r[k] = o[k]; return r; };
  const s = raw.settings || {};
  const oneOf = <T extends string>(v: any, list: T[], dflt: T): T => (list.includes(v) ? v : dflt);
  return {
    v: 1,
    introDone: !!raw.introDone,
    sessions: Math.max(0, Math.min(100000, Number(raw.sessions) || 0)),
    cleanRuns: rec(raw.cleanRuns), seenLevels: arr(raw.seenLevels), confidence: rec(raw.confidence), park: arr(raw.park), stickers: arr(raw.stickers),
    settings: {
      captions: oneOf(s.captions, ['off', 'on', 'auto'], 'auto'),
      captionSize: oneOf(s.captionSize, ['small', 'medium', 'large'], 'medium'),
      muted: !!s.muted, highContrast: !!s.highContrast, vibration: s.vibration !== false,
      reducedMotion: oneOf(s.reducedMotion, ['auto', 'on', 'off'], 'auto'),
      locale: oneOf(s.locale, ['en', 'hi'], 'en'),
    },
  };
}

export function loadProgress(): Progress {
  try {
    const s = localStorage.getItem(KEY);
    if (s) return sanitize(JSON.parse(s));
  } catch { /* blocked or corrupt */ }
  try { if (memory) return sanitize(JSON.parse(memory)); } catch { /* ignore */ }
  return defaultProgress();
}

export function saveProgress(p: Progress): void {
  const s = JSON.stringify(p);
  memory = s;
  try { localStorage.setItem(KEY, s); } catch { /* private mode: progress lives for this visit only */ }
}

export function eraseProgress(): void {
  memory = null;
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

// Backup code: "AE1-" + base64url(JSON) + "-" + checksum. Copy/paste or write down; no network involved.
function hash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}
const b64 = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

export function makeBackupCode(p: Progress): string {
  const body = b64(JSON.stringify(p));
  return `AE1-${body}-${hash(body)}`;
}

export function parseBackupCode(code: string): Progress | null {
  try {
    const m = /^AE1-([A-Za-z0-9_-]+)-([a-z0-9]+)$/.exec(code.trim());
    if (!m || hash(m[1]) !== m[2]) return null;
    const p = sanitize(JSON.parse(unb64(m[1])));
    return p;
  } catch { return null; }
}
