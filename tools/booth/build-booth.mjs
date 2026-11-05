#!/usr/bin/env node
// Generates tools/booth/recording-booth.html from docs/RECORDING_SCRIPT.md + template.html + zip.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');

export function parseScript(md) {
  const scenes = [];
  let cur = null;
  const lines = md.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const h = /^### (Scene [A-Z][0-9]*: .+)$/.exec(l);
    if (h) { cur = { id: h[1].slice(6, 7), title: h[1], note: '', rows: [] }; scenes.push(cur); continue; }
    if (/^#{1,3} /.test(l) && !h) { cur = null; continue; }
    if (!cur || !l.startsWith('|')) continue;
    const cells = l.split('|').slice(1, -1).map((c) => c.trim());
    const km = /^`([a-z_.0-9]+)`$/.exec(cells[0] || '');
    if (!km) continue;
    const clean = (s) => (s || '').replace(/\*\*/g, '');
    if (cells.length >= 5) cur.rows.push({ key: km[1], text: clean(cells[1]), mood: clean(cells[2]), energy: clean(cells[3]), notes: clean(cells[4]) });
    else cur.rows.push({ key: km[1], text: clean(cells[1]), mood: '', energy: '', notes: '' });
  }
  for (const sc of scenes) {
    if (sc.id === 'C') {
      for (const r of sc.rows) r.notes = r.notes || 'Say it as a proud delighted discovery';
      sc.note = 'Say each as a proud, delighted discovery. Record all 14 in one sitting, same distance, same energy.';
    }
  }
  return scenes;
}

export function buildHtml() {
  const md = fs.readFileSync(path.join(root, 'docs', 'RECORDING_SCRIPT.md'), 'utf8');
  const scenes = parseScript(md);
  const zip = fs.readFileSync(path.join(here, 'zip.mjs'), 'utf8').replace(/^export /gm, '');
  const tpl = fs.readFileSync(path.join(here, 'template.html'), 'utf8');
  const json = JSON.stringify({ scenes }).replace(/</g, '\\u003c');
  return tpl.replace('/*__DATA__*/', () => json).replace('/*__ZIP__*/', () => zip);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = path.join(here, 'recording-booth.html');
  const html = buildHtml();
  fs.writeFileSync(out, html);
  const n = (html.match(/"key":/g) || []).length;
  console.log(`wrote ${out} (${html.length} bytes, ${n} keys)`);
}
