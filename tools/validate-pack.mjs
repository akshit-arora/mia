#!/usr/bin/env node
// Validates src/data + src/locales. Exit 1 on error. Usage: node tools/validate-pack.mjs
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePack, validateCards } from './validate-lib.mjs';

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

// card data: cards.json + card-icons.json cross-checked against locales, reactions, the card atlas and the drawn icons
const text = (rel) => readFileSync(join(root, rel), 'utf8');
const cardRes = validateCards(readJson('src/data/cards.json'), readJson('src/data/card-icons.json'), pack.entities, locales, {
  actions: [...text('src/game/reactions.ts').matchAll(/^ {2}([a-z]+): \{ dur/gm)].map((m) => m[1]),
  drawn: [...text('src/cards/icons.ts').matchAll(/^ {2}'((?:food|home|type|ui)\.[a-z]+)': /gm)].map((m) => m[1]),
  atlas: Object.keys(readJson('src/gen/card-atlas.json').sprites),
});
errors.push(...cardRes.errors);
for (const w of warnings) console.warn(`WARN  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);
console.log(`validate: ${readJson('src/data/cards.json').animals.length} cards, ${pack.entities.length} entities, ${pack.zones.length} zones, ${pack.levels.length} levels, ${Object.keys(locales).length} locales, ${sourceFiles.length} engine/game files scanned; ${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
