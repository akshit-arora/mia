#!/usr/bin/env node
// Packs voice recordings and animal clips into Opus/WebM sprite files.
//   recordings/<locale>/<key>[.takeN].(wav|m4a|webm|mp3|ogg)  ->  public/audio/<locale>/speech.webm + speech.json
//   sounds/animals/<id>.(wav|ogg|mp3|flac)                      ->  public/audio/core/animals.webm + animals.json
// A recordings/<locale>/kept.json (exported by the booth) chooses the take when --take is not given.
// Options: --locale en  --take N  --dry-run  --in <root>  --out <dir>  --no-animals  --no-speech
// <root> must contain recordings/ and sounds/ (default: project root). <dir> default: <project>/public/audio.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The spoken keys, taken from the table rows of docs/RECORDING_SCRIPT.md.
export const SPOKEN_KEYS = [
  'app.tap_truck', 'app.welcome', 'truck.honk', 'truck.arrive', 'crate.shake', 'crate.open',
  'name.lion', 'name.tiger', 'name.elephant', 'name.monkey', 'name.bear', 'name.peacock',
  'name.cow', 'name.buffalo', 'name.goat', 'name.hen', 'name.horse', 'name.dog', 'name.cat',
  'name.rabbit', 'drag.prompt', 'idle.nudge', 'zone.jungle', 'zone.farm', 'zone.home', 'correct.1',
  'correct.2', 'correct.3', 'wrong.gentle', 'wrong.hint', 'wonder.appear', 'wonder.ask',
  'wonder.tap', 'discover.wow', 'discover.again', 'sticker.new', 'fact.elephant.trunk',
  'fact.monkey.banana', 'fact.peacock.feathers', 'fact.goat.climb', 'fact.hen.chicks',
  'fact.cat.purr', 'day.done', 'day.end', 'day.tomorrow'
];
export const ANIMAL_IDS = ['lion', 'tiger', 'elephant', 'monkey', 'bear', 'peacock', 'cow', 'buffalo', 'goat', 'hen', 'horse', 'dog', 'cat', 'rabbit'];
const SPEECH_EXT = ['wav', 'm4a', 'mp4', 'webm', 'mp3', 'ogg'];
const ANIMAL_EXT = ['wav', 'ogg', 'mp3', 'flac'];
const GAP_MS = 150;
const RATE = 48000;

export function parseArgs(argv) {
  const o = { locale: null, take: null, dryRun: false, in: PROJECT, out: path.join(PROJECT, 'public', 'audio'), speech: true, animals: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') o.dryRun = true;
    else if (a === '--locale') o.locale = argv[++i];
    else if (a === '--take') o.take = Number(argv[++i]);
    else if (a === '--in') o.in = path.resolve(argv[++i]);
    else if (a === '--out') o.out = path.resolve(argv[++i]);
    else if (a === '--no-animals') o.animals = false;
    else if (a === '--no-speech') o.speech = false;
    else { console.error(`Unknown option ${a}`); process.exit(2); }
  }
  return o;
}

/** Group files by key; pick the wanted take. Returns Map key -> {file, take, candidates}. */
export function pickFiles(dir, exts, take, kept = {}) {
  const found = new Map();
  if (!fs.existsSync(dir)) return found;
  for (const f of fs.readdirSync(dir).sort()) {
    const ext = path.extname(f).slice(1).toLowerCase();
    if (!exts.includes(ext)) continue;
    const base = f.slice(0, -(ext.length + 1));
    const m = /^(.*?)(?:\.take(\d+))?$/.exec(base);
    const key = m[1];
    const n = m[2] ? Number(m[2]) : null;
    if (!found.has(key)) found.set(key, []);
    found.get(key).push({ file: path.join(dir, f), take: n });
  }
  const picked = new Map();
  for (const [key, list] of found) {
    let c = null;
    const want = take != null ? take : kept[key];
    if (want != null) c = list.find((x) => x.take === want);
    if (!c) c = list.find((x) => x.take == null);
    if (!c) c = list.slice().sort((a, b) => b.take - a.take)[0];
    picked.set(key, { ...c, candidates: list.length, warn: want != null && c.take !== want ? `take ${want} not found, using ${c.take ?? 'plain'}` : null });
  }
  return picked;
}

export function coverage(expected, picked) {
  const have = expected.filter((k) => picked.has(k));
  const missing = expected.filter((k) => !picked.has(k));
  const extra = [...picked.keys()].filter((k) => !expected.includes(k));
  return { have, missing, extra };
}

function printCoverage(title, expected, picked) {
  const c = coverage(expected, picked);
  console.log(`\nCOVERAGE REPORT: ${title}: ${c.have.length}/${expected.length}`);
  if (c.missing.length) console.log(`  missing (${c.missing.length}): ${c.missing.join(', ')}`);
  else console.log('  all keys present');
  if (c.extra.length) console.log(`  not in the list (ignored): ${c.extra.join(', ')}`);
  return c;
}

function findFfmpeg() {
  const r = spawnSync('which', ['ffmpeg'], { encoding: 'utf8' });
  const p = (r.stdout || '').trim();
  return r.status === 0 && p ? p : null;
}

const MANUAL = `ffmpeg was not found, so nothing was packed. Manual steps:
  1. Install ffmpeg (macOS: brew install ffmpeg) and run this script again, or:
  2. For each recording, trim leading/trailing silence, normalise loudness
     (loudnorm I=-16), convert to mono 48 kHz.
  3. Join the clips in one file with 150 ms of silence between them and note each
     clip's start and duration in milliseconds.
  4. Encode: ffmpeg -i joined.wav -c:a libopus -b:a 24k -ac 1 speech.webm   (animals: -b:a 32k)
  5. Write speech.json as {"<key>":[startMs,durMs], ...} next to it, in
     public/audio/<locale>/ (animals: public/audio/core/animals.json + animals.webm).`;

/** Parse a WAV buffer (PCM16) and return the raw sample data + rate + channels. */
export function parseWav(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF') throw new Error('not a WAV');
  let p = 12, fmt = null, data = null;
  while (p + 8 <= buf.length) {
    const id = buf.toString('ascii', p, p + 4);
    let size = buf.readUInt32LE(p + 4);
    const body = p + 8;
    if (id === 'data' && body + size > buf.length) size = buf.length - body; // streamed wav
    if (id === 'fmt ') fmt = { ch: buf.readUInt16LE(body + 2), rate: buf.readUInt32LE(body + 4), bits: buf.readUInt16LE(body + 14) };
    if (id === 'data') { data = buf.subarray(body, body + size); break; }
    p = body + size + (size & 1);
  }
  if (!fmt || !data) throw new Error('bad WAV');
  return { ...fmt, data };
}

export function makeWav(pcm, rate = RATE) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

/** Concatenate PCM16 mono chunks with gaps; returns {pcm, map}. */
export function buildSprite(items, gapMs = GAP_MS, rate = RATE) {
  const gap = Buffer.alloc(Math.round((rate * gapMs) / 1000) * 2);
  const parts = [], map = {};
  let samples = 0;
  for (const { key, pcm } of items) {
    const n = pcm.length / 2;
    map[key] = [Math.round((samples / rate) * 1000), Math.round((n / rate) * 1000)];
    parts.push(pcm, gap);
    samples += n + gap.length / 2;
  }
  return { pcm: Buffer.concat(parts), map };
}

function processClip(ffmpeg, src, tmpWav, isAnimal) {
  const tgt = isAnimal ? -18 : -16;
  const trim = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03';
  const af = `${trim},areverse,${trim},areverse,loudnorm=I=${tgt}:TP=-1.5:LRA=11`;
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', src, '-af', af, '-ac', '1', '-ar', String(RATE), '-c:a', 'pcm_s16le', tmpWav]);
  return parseWav(fs.readFileSync(tmpWav));
}

function packGroup({ label, picked, expected, outDir, base, kbps, ffmpeg, dryRun, isAnimal }) {
  const keys = expected.filter((k) => picked.has(k));
  if (!keys.length) { console.log(`${label}: nothing to pack`); return false; }
  console.log(`\n${label}: ${keys.length} clip(s) -> ${path.join(outDir, base)}.webm / .json`);
  for (const k of keys) {
    const p = picked.get(k);
    console.log(`  ${k.padEnd(24)} <- ${path.basename(p.file)}${p.candidates > 1 ? ` (${p.candidates} takes)` : ''}${p.warn ? `  [${p.warn}]` : ''}`);
  }
  if (dryRun) { console.log('  --dry-run: no files written'); return true; }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'audio-pack-'));
  try {
    const items = [];
    for (const k of keys) {
      const w = processClip(ffmpeg, picked.get(k).file, path.join(tmp, 'clip.wav'), isAnimal);
      if (w.bits !== 16 || w.ch !== 1) throw new Error(`unexpected format for ${k}`);
      const ms = (w.data.length / 2 / RATE) * 1000;
      if (isAnimal && ms > 1000) console.log(`  warning: ${k} is ${Math.round(ms)} ms; plan wants 500 to 800 ms. Trim it.`);
      if (ms < 50) { console.log(`  warning: ${k} is nearly empty after trimming, skipped`); continue; }
      items.push({ key: k, pcm: w.data });
    }
    const { pcm, map } = buildSprite(items);
    const joined = path.join(tmp, 'joined.wav');
    fs.writeFileSync(joined, makeWav(pcm));
    fs.mkdirSync(outDir, { recursive: true });
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', joined, '-c:a', 'libopus', '-b:a', `${kbps}k`, '-application', 'voip', '-ac', '1', '-f', 'webm', path.join(outDir, `${base}.webm`)]);
    fs.writeFileSync(path.join(outDir, `${base}.json`), JSON.stringify(map));
    const size = fs.statSync(path.join(outDir, `${base}.webm`)).size;
    console.log(`  wrote ${base}.webm (${(size / 1024).toFixed(1)} KB) and ${base}.json`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  return true;
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  const recRoot = path.join(o.in, 'recordings');
  const locales = o.locale ? [o.locale]
    : fs.existsSync(recRoot) ? fs.readdirSync(recRoot, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];
  if (!locales.length) locales.push('en');

  const jobs = [];
  if (o.speech) {
    for (const loc of locales) {
      let kept = {};
      try { kept = JSON.parse(fs.readFileSync(path.join(recRoot, loc, 'kept.json'), 'utf8')); } catch { /* optional, written by the booth */ }
      const picked = pickFiles(path.join(recRoot, loc), SPEECH_EXT, o.take, kept);
      printCoverage(`speech [${loc}]`, SPOKEN_KEYS, picked);
      if (picked.size) jobs.push({ label: `speech [${loc}]`, picked, expected: SPOKEN_KEYS, outDir: path.join(o.out, loc), base: 'speech', kbps: 24, isAnimal: false });
    }
  }
  if (o.animals) {
    const picked = pickFiles(path.join(o.in, 'sounds', 'animals'), ANIMAL_EXT, o.take);
    const c = printCoverage('animal sounds', ANIMAL_IDS, picked);
    if (c.missing.includes('rabbit')) console.log('  (rabbit is synthesized by design; missing others use synthesized placeholders in the game)');
    if (picked.size) jobs.push({ label: 'animals', picked, expected: ANIMAL_IDS, outDir: path.join(o.out, 'core'), base: 'animals', kbps: 32, isAnimal: true });
  }

  if (!jobs.length) { console.log('\nnothing to pack'); return; }
  let ffmpeg = null;
  if (!o.dryRun) {
    ffmpeg = findFfmpeg();
    if (!ffmpeg) { console.log(`\n${MANUAL}`); return; }
  }
  for (const j of jobs) packGroup({ ...j, ffmpeg, dryRun: o.dryRun });
  console.log('\ndone');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
