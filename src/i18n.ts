import en from './locales/en.json';
import hi from './locales/hi.json';
import { audio } from './audio';

const packs: Record<string, Record<string, any>> = { en, hi };
export const LOCALES = [
  { id: 'en', name: 'English' },
  { id: 'hi', name: 'हिन्दी (stub)' },
];
let cur = 'en';
export function setLocale(l: string): void {
  if (!packs[l]) l = 'en';
  cur = l;
  try { document.documentElement.lang = l; } catch { /* ignore */ }
  audio.setLocale(l);
}
export function getLocale(): string { return cur; }
/** Look up a string; falls back to English, then to the key. */
export function t(key: string): string {
  const v = packs[cur][key] ?? (en as Record<string, any>)[key];
  return typeof v === 'string' ? v : key;
}
