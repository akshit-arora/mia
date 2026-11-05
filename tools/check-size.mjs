#!/usr/bin/env node
// Measures dist/ against tools/size-budget.json. Run after `npm run build`.
// Usage: node tools/check-size.mjs [--json] [--dist=path]
// Exit: 0 ok, 1 budget exceeded, 2 dist/ missing (this script never builds).
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative, extname, basename, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const asJson = args.includes('--json');
const distArg = args.find((a) => a.startsWith('--dist='));
const dist = distArg ? resolve(process.cwd(), distArg.slice(7)) : join(root, 'dist');

if (!existsSync(dist)) {
  const msg = `dist/ not found at ${dist}. Run "npm run build" first (check-size never builds).`;
  if (asJson) console.log(JSON.stringify({ error: msg }));
  else console.error(msg);
  process.exit(2);
}
const budget = JSON.parse(readFileSync(join(root, 'tools/size-budget.json'), 'utf8')).gzip;

const walk = (d) => readdirSync(d).flatMap((n) => {
  const p = join(d, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

const AUDIO_EXT = new Set(['.webm', '.ogg', '.opus', '.m4a', '.mp3', '.wav']);
export function categorize(rel) {
  const parts = rel.split('/');
  const name = basename(rel);
  const ext = extname(rel).toLowerCase();
  if (parts[0] === 'audio' && parts[1] === 'core') return 'audioCore';
  if (parts[0] === 'audio' || AUDIO_EXT.has(ext)) return 'audioGame';
  if (name === 'sw.js' || /^workbox-.*\.js$/.test(name) || name === 'registerSW.js') return 'other';
  if (/^(icon|apple-touch-icon|favicon|maskable)/.test(name)) return 'other';
  if (/manifest/.test(name) || ext === '.webmanifest' || ext === '.ico' || ext === '.svg') return 'other';
  if (ext === '.png' || ext === '.webp' || ext === '.gif') return 'art';
  if (['.js', '.mjs', '.css', '.html'].includes(ext)) return 'app';
  return 'other';
}

const cats = {};
for (const k of Object.keys(budget)) if (k !== 'total') cats[k] = { raw: 0, gzip: 0, files: 0 };
for (const f of walk(dist)) {
  const rel = relative(dist, f).split(sep).join('/');
  if (rel.endsWith('.map')) continue;
  const buf = readFileSync(f);
  const c = cats[categorize(rel)] ?? cats.other;
  c.raw += buf.length;
  c.gzip += gzipSync(buf, { level: 9 }).length;
  c.files += 1;
}
const total = Object.values(cats).reduce((a, c) => ({ raw: a.raw + c.raw, gzip: a.gzip + c.gzip, files: a.files + c.files }), { raw: 0, gzip: 0, files: 0 });
const label = { app: 'App code (js+css+html)', art: 'Art (png)', audioCore: 'Audio core pack', audioGame: 'Audio game/language', other: 'Icons, manifest, SW', total: 'TOTAL first install' };
const rows = [...Object.entries(cats), ['total', total]].map(([k, v]) => ({
  category: k, label: label[k], files: v.files, rawBytes: v.raw, gzipBytes: v.gzip,
  budgetBytes: budget[k] * 1024, over: v.gzip > budget[k] * 1024,
}));
const failed = rows.some((r) => r.over);

if (asJson) console.log(JSON.stringify({ ok: !failed, rows }, null, 2));
else {
  const kb = (n) => (n / 1024).toFixed(1).padStart(8);
  console.log(`${'Category'.padEnd(26)}${'Files'.padStart(6)}${'Raw KB'.padStart(9)}${'Gzip KB'.padStart(9)}${'Budget'.padStart(9)}  Status`);
  for (const r of rows) console.log(`${r.label.padEnd(26)}${String(r.files).padStart(6)}${kb(r.rawBytes)}${kb(r.gzipBytes)}${kb(r.budgetBytes)}  ${r.over ? 'OVER' : 'ok'}`);
  console.log(failed ? '\nsize: budget exceeded' : '\nsize: within budget');
}
process.exit(failed ? 1 : 0);
