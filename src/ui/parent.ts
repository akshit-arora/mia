// Parent corner: plain HTML buttons with text labels so assistive tools and keyboards work.
import { LOCALES, t } from '../i18n';
import { eraseProgress, makeBackupCode, parseBackupCode } from '../storage';
import type { Progress } from '../types';

export interface ParentHooks {
  progress: () => Progress;
  apply: () => void; // re-apply settings after a change
  replace: (p: Progress | null) => void; // replace whole progress (restore), or null to reset
}

let dlg: HTMLElement | null = null;
let opener: HTMLElement | null = null;

export function closeParent(): void {
  dlg?.remove();
  dlg = null;
  const c = document.getElementById('c');
  (c ?? opener)?.focus();
}

export interface ParentLink { href: string; labelKey: string }

export function openParent(hooks: ParentHooks, from: HTMLElement, links: ParentLink[] = []): void {
  if (dlg) return;
  opener = from;
  const p = hooks.progress();
  dlg = document.createElement('div');
  dlg.className = 'parent';
  dlg.setAttribute('role', 'dialog');
  dlg.setAttribute('aria-modal', 'true');
  dlg.setAttribute('aria-labelledby', 'parent-h');
  document.body.appendChild(dlg);
  const render = () => {
    const s = p.settings;
    const seg = (label: string, name: string, opts: [string, string][], cur: string, set: (v: string) => void, help?: string) => `
      <fieldset><legend>${label}</legend><div class="seg" role="group">${opts
        .map(([v, l]) => `<button type="button" data-set="${name}" data-v="${v}" aria-pressed="${cur === v}">${l}</button>`)
        .join('')}</div>${help ? `<p class="help">${help}</p>` : ''}</fieldset>`;
    dlg!.innerHTML = `<div class="panel">
      <h2 id="parent-h">${t('parent.title')}</h2>
      <p>${t('parent.intro')}</p>
      ${links.length ? `<fieldset><legend>${t('ui.mia')}</legend>${links.map((l) => `<a class="parent-link" href="${l.href}">${t(l.labelKey)}</a>`).join('')}</fieldset>` : ''}
      ${seg(t('parent.captions'), 'captions', [['off', t('parent.captions.off')], ['on', t('parent.captions.on')], ['auto', t('parent.captions.auto')]], s.captions, () => {}, t('parent.captions.auto.help'))}
      ${seg(t('parent.size'), 'captionSize', [['small', t('parent.size.small')], ['medium', t('parent.size.medium')], ['large', t('parent.size.large')]], s.captionSize, () => {})}
      <fieldset><legend>${t('parent.sound')}</legend><div class="seg">
        <button type="button" data-toggle="muted" aria-pressed="${!s.muted}">${s.muted ? t('ui.sound.off') : t('ui.sound.on')}</button>
        <button type="button" data-toggle="highContrast" aria-pressed="${s.highContrast}">${t('parent.contrast')}</button>
        <button type="button" data-toggle="vibration" aria-pressed="${s.vibration}">${t('parent.vibration')}</button></div></fieldset>
      ${seg(t('parent.motion'), 'reducedMotion', [['auto', t('parent.motion.auto')], ['on', t('parent.motion.on')], ['off', t('parent.motion.off')]], s.reducedMotion, () => {})}
      ${seg(t('parent.language'), 'locale', LOCALES.map((l) => [l.id, l.name] as [string, string]), s.locale, () => {})}
      <fieldset><legend>${t('parent.backup')}</legend>
        <button type="button" id="mk">${t('parent.backup.make')}</button>
        <label>${t('parent.backup.code')} <input id="code" type="text" autocomplete="off" spellcheck="false"></label>
        <button type="button" id="rs">${t('parent.backup.restore')}</button>
        <p id="msg" role="status"></p>
      </fieldset>
      <fieldset><legend>${t('parent.reset')}</legend><button type="button" id="rst">${t('parent.reset')}</button></fieldset>
      <details><summary>${t('parent.about')}</summary><p>${t('parent.about.text')}</p><p>${t('parent.privacy')}</p></details>
      <button type="button" id="close" class="close">${t('parent.close')}</button></div>`;
    dlg!.querySelectorAll<HTMLButtonElement>('[data-set]').forEach((b) => b.addEventListener('click', () => {
      (s as any)[b.dataset.set!] = b.dataset.v; hooks.apply(); render(); dlg!.querySelector<HTMLButtonElement>(`[data-set="${b.dataset.set}"][data-v="${b.dataset.v}"]`)?.focus();
    }));
    dlg!.querySelectorAll<HTMLButtonElement>('[data-toggle]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.toggle as 'muted' | 'highContrast' | 'vibration';
      s[k] = !s[k]; hooks.apply(); render(); dlg!.querySelector<HTMLButtonElement>(`[data-toggle="${k}"]`)?.focus();
    }));
    const msg = dlg!.querySelector<HTMLElement>('#msg')!;
    const code = dlg!.querySelector<HTMLInputElement>('#code')!;
    dlg!.querySelector('#mk')!.addEventListener('click', () => { code.value = makeBackupCode(hooks.progress()); code.select(); });
    dlg!.querySelector('#rs')!.addEventListener('click', () => {
      const np = parseBackupCode(code.value);
      if (!np) { msg.textContent = t('parent.backup.bad'); return; }
      hooks.replace(np); msg.textContent = t('parent.backup.done');
    });
    let armed = false;
    const rst = dlg!.querySelector<HTMLButtonElement>('#rst')!;
    rst.addEventListener('click', () => {
      if (!armed) { armed = true; rst.textContent = t('parent.reset.confirm'); return; }
      eraseProgress(); hooks.replace(null); closeParent();
    });
    dlg!.querySelector('#close')!.addEventListener('click', closeParent);
  };
  render();
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeParent(); return; }
    if (e.key === 'Tab') { // simple focus trap
      const f = dlg!.querySelectorAll<HTMLElement>('button, input, summary, a');
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  dlg.querySelector<HTMLElement>('button')!.focus();
}
