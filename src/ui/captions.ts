// Closed captions: real text over the canvas (system fonts), never baked into the pixel art.
import { audio, type CaptionEvent, type Speaker } from '../audio';
import { t } from '../i18n';
import type { CaptionMode } from '../types';

const ICONS: Record<string, string> = {
  bholu: '<svg viewBox="0 0 24 16" width="1.6em" height="1.1em" aria-hidden="true"><rect x="1" y="5" width="13" height="7" fill="#ff7a2f" stroke="#181020"/><rect x="14" y="2" width="9" height="10" fill="#ff7a2f" stroke="#181020"/><circle cx="6" cy="13" r="2.5" fill="#181020"/><circle cx="19" cy="13" r="2.5" fill="#181020"/><circle cx="19" cy="6" r="2" fill="#fff" stroke="#181020"/></svg>',
  chiku: '<svg viewBox="0 0 24 16" width="1.6em" height="1.1em" aria-hidden="true"><ellipse cx="11" cy="9" rx="8" ry="5" fill="#a0693c" stroke="#181020"/><circle cx="18" cy="6" r="3.5" fill="#a0693c" stroke="#181020"/><path d="M21 6l3 1-3 1z" fill="#ffb21f"/><circle cx="18.5" cy="5.5" r="1" fill="#181020"/><path d="M3 9l-3-3 1 5z" fill="#6b4423"/></svg>',
  sound: '<svg viewBox="0 0 24 16" width="1.5em" height="1.1em" aria-hidden="true"><path d="M2 5h4l5-4v14l-5-4H2z" fill="#181020"/><path d="M14 4q3 4 0 8M17 2q5 6 0 12" fill="none" stroke="#181020" stroke-width="1.6"/></svg>',
};

let box: HTMLElement;
let live: HTMLElement;
let mode: CaptionMode = 'auto';
/** A game may hide sfx captions that the picture already shows and the speaker icon (reset when it exits). */
const style = { hideSfx: false, noIcon: false };
export function setCaptionStyle(o: { hideSfx?: boolean; noIcon?: boolean }): void { style.hideSfx = !!o.hideSfx; style.noIcon = !!o.noIcon; }
let resolveText: (k: string) => string = t;

function visible(): boolean {
  if (mode === 'on') return true;
  if (mode === 'off') return false;
  return audio.isMuted() || !audio.hasVoice();
}

export function initCaptions(root: HTMLElement, liveRegion: HTMLElement): void {
  box = root;
  live = liveRegion;
  audio.onCaption((e) => showEvent(e));
}

export function setCaptionMode(m: CaptionMode): void { mode = m; refresh(); }
export function setCaptionSize(s: string): void { box.dataset.size = s; }
export function setTextResolver(f: (k: string) => string): void { resolveText = f; }
export function refresh(): void {
  box.hidden = !visible();
  if (box.hidden) box.textContent = '';
}

function showEvent(e: CaptionEvent): void {
  if (style.hideSfx && e.kind === 'sound' && e.key.startsWith('cc.sfx.')) return;
  const speaker = e.kind === 'speech' ? e.speaker : undefined;
  push(resolveText(e.key), e.kind === 'speech' ? e.speaker || 'bholu' : 'sound', Math.max(e.ms, 2000), e.kind === 'speech', speaker);
}

/** Caption for text that has no audio (for example Chiku's visual question). */
export function showText(key: string, speaker: Speaker, ms = 2600): void {
  push(resolveText(key), speaker, ms, true, speaker);
}

function push(text: string, icon: string, ms: number, speech: boolean, speaker?: Speaker): void {
  if (live) live.textContent = text; // assistive tools always get the text
  if (!visible()) return;
  // a new spoken line replaces older spoken lines; sound descriptions stack (max 2 lines in all)
  if (speech) box.querySelectorAll('[data-speech]').forEach((n) => n.remove());
  const row = document.createElement('div');
  row.className = 'cc-row' + (speech ? '' : ' cc-sound');
  if (speech) row.setAttribute('data-speech', '1');
  const label = speaker ? t(`cc.speaker.${speaker}`) : '';
  if (!(style.noIcon && speech)) row.innerHTML = `<span class="cc-icon" title="${label}">${ICONS[icon] || ICONS.sound}</span>`;
  const span = document.createElement('span');
  span.textContent = text;
  row.appendChild(span);
  box.appendChild(row);
  while (box.children.length > 2) box.firstElementChild!.remove();
  setTimeout(() => row.remove(), ms);
}
