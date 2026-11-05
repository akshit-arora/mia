#!/usr/bin/env node
// Fails (exit 1) if a file in sounds/animals or sounds/sfx has no row in sounds/SOURCES.csv,
// if a row's licence is not allowed, or if a licence mentions NC/ND. Passes on empty folders.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ALLOWED = ['CC0', 'CC-BY-4.0', 'CC-BY-3.0', 'CC-BY-2.0', 'own'];
export const HEADER = ['id', 'file', 'url', 'author', 'licence', 'date_checked', 'processing'];
const DIRS = ['animals', 'sfx'];

export function parseCsv(text) {
  const rows = [];
  let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); cur = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else cur += c;
  }
  row.push(cur);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  return rows;
}

function licenceProblem(l) {
  const lic = l.trim();
  if (/(^|[-_ ])(NC|ND)([-_ .\d]|$)/i.test(lic)) return `licence "${lic}" contains NC/ND`;
  if (!ALLOWED.includes(lic)) return `licence "${lic}" is not one of ${ALLOWED.join(', ')}`;
  return null;
}

/** Returns an array of error strings (empty = pass). `root` is the sounds/ directory. */
export function checkSources(soundsDir) {
  const errors = [];
  const csvPath = path.join(soundsDir, 'SOURCES.csv');
  let rows = [];
  if (fs.existsSync(csvPath)) rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  else errors.push('sounds/SOURCES.csv is missing');
  const header = rows.shift() || [];
  if (rows.length && header.map((h) => h.trim()).join(',') !== HEADER.join(',')) errors.push(`SOURCES.csv header must be: ${HEADER.join(',')}`);
  const listed = new Set();
  rows.forEach((r, i) => {
    const line = i + 2;
    if (r.length !== HEADER.length) { errors.push(`SOURCES.csv line ${line}: expected ${HEADER.length} columns, got ${r.length}`); return; }
    const [id, file, , , licence] = r;
    if (!id.trim() || !file.trim()) errors.push(`SOURCES.csv line ${line}: id and file are required`);
    const p = licenceProblem(licence);
    if (p) errors.push(`SOURCES.csv line ${line} (${file}): ${p}`);
    listed.add(file.trim().replace(/^\.?\//, '').replace(/^sounds\//, ''));
  });
  for (const d of DIRS) {
    const dir = path.join(soundsDir, d);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (/^readme(\.md)?$/i.test(f) || f.startsWith('.')) continue;
      if (!fs.statSync(path.join(dir, f)).isFile()) continue;
      if (!listed.has(`${d}/${f}`)) errors.push(`sounds/${d}/${f} has no row in SOURCES.csv`);
    }
  }
  return errors;
}

const here = path.dirname(fileURLToPath(import.meta.url));
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(here, '..', 'sounds');
  const errors = checkSources(dir);
  if (errors.length) {
    console.error('check-sources FAILED:');
    for (const e of errors) console.error('  - ' + e);
    process.exit(1);
  }
  console.log('check-sources OK');
}
