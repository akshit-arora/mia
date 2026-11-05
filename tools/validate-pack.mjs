#!/usr/bin/env node
// Validates src/data + src/locales. Exit 1 on error. Usage: node tools/validate-pack.mjs
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePack } from './validate-lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (rel) => {
  try { return JSON.parse(readFileSync(join(root, rel), 'utf8')); }
  catch (e) { console.error(`ERROR ${rel}: ${e.message}`); process.exit(1); }
};
const walk = (dir) => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
};

const pack = {
  entities: readJson('src/data/entities.json'),
  zones: readJson('src/data/zones.json'),
  levels: readJson('src/data/levels.json'),
};
const locales = {};
for (const f of readdirSync(join(root, 'src/locales')).filter((n) => n.endsWith('.json'))) {
  locales[f.slice(0, -5)] = readJson(`src/locales/${f}`);
}
const sourceFiles = ['src/engine', 'src/game']
  .flatMap((d) => walk(join(root, d)))
  .filter((p) => ['.ts', '.tsx'].includes(extname(p)))
  .map((p) => ({ file: p.slice(root.length + 1), text: readFileSync(p, 'utf8') }));

const { errors, warnings } = validatePack(pack, locales, { sourceFiles });
for (const w of warnings) console.warn(`WARN  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);
console.log(`validate: ${pack.entities.length} entities, ${pack.zones.length} zones, ${pack.levels.length} levels, ${Object.keys(locales).length} locales, ${sourceFiles.length} engine/game files scanned; ${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
