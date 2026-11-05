import { describe, it, expect } from 'vitest';
// @ts-ignore node types are not installed
import fs from 'node:fs';
// @ts-ignore node types are not installed
import os from 'node:os';
// @ts-ignore node types are not installed
import path from 'node:path';
// @ts-ignore node types are not installed
import vm from 'node:vm';
// @ts-ignore node types are not installed
import { spawnSync } from 'node:child_process';
// @ts-ignore plain JS module
import { crc32, makeZip } from '../tools/booth/zip.mjs';
// @ts-ignore plain JS module
import { buildHtml, parseScript } from '../tools/booth/build-booth.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(HERE, '..');
const html = fs.readFileSync(path.join(root, 'tools/booth/recording-booth.html'), 'utf8');

describe('zip writer', () => {
  it('crc32 matches the standard check value', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
    expect(crc32(new Uint8Array(0))).toBe(0);
  });
  it('writes a structurally valid store-only zip', () => {
    const a = new TextEncoder().encode('hello');
    const b = new Uint8Array([1, 2, 3, 4, 5, 6]);
    const z = makeZip([{ name: 'en/name.lion.take1.webm', data: a }, { name: 'en/kept.json', data: b }], new Date(2026, 0, 2, 3, 4, 6));
    const dv = new DataView(z.buffer, z.byteOffset, z.byteLength);
    expect(dv.getUint32(0, true)).toBe(0x04034b50);
    expect(dv.getUint16(8, true)).toBe(0); // stored
    const eocd = z.length - 22;
    expect(dv.getUint32(eocd, true)).toBe(0x06054b50);
    expect(dv.getUint16(eocd + 10, true)).toBe(2);
    expect(dv.getUint32(dv.getUint32(eocd + 16, true), true)).toBe(0x02014b50);
  });
  it('is accepted by the system unzip (if present) and round-trips bytes', () => {
    const data = new Uint8Array(1000).map((_, i) => (i * 7) & 255);
    const z = makeZip([{ name: 'en/x.take2.ogg', data }, { name: 'hi/y.take1.mp4', data: new Uint8Array(0) }]);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zip-'));
    const f = path.join(dir, 't.zip');
    fs.writeFileSync(f, z);
    const t = spawnSync('unzip', ['-tq', f], { encoding: 'utf8' });
    if (t.error) return; // unzip not installed
    expect(t.status, t.stdout + t.stderr).toBe(0);
    spawnSync('unzip', ['-q', f, '-d', dir]);
    expect(new Uint8Array(fs.readFileSync(path.join(dir, 'en/x.take2.ogg')))).toEqual(data);
  });
});

describe('recording booth', () => {
  const data = JSON.parse(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/.exec(html)![1]);
  const rows = data.scenes.flatMap((s: any) => s.rows);
  it('embeds all 51 keys, matching docs/RECORDING_SCRIPT.md', () => {
    expect(rows).toHaveLength(51);
    const script = fs.readFileSync(path.join(root, 'docs/RECORDING_SCRIPT.md'), 'utf8');
    const keys = [...script.matchAll(/^\| `([a-z_.0-9]+)` \|/gm)].map((m) => m[1]);
    expect(rows.map((r: any) => r.key)).toEqual(keys);
    expect(data.scenes).toHaveLength(10);
  });
  it('texts equal locale strings; scene C has the discovery note', () => {
    const en = JSON.parse(fs.readFileSync(path.join(root, 'src/locales/en.json'), 'utf8'));
    for (const r of rows) expect(r.text, r.key).toBe(en[r.key]);
    const c = data.scenes.find((s: any) => s.id === 'C');
    expect(c.rows).toHaveLength(14);
    expect(c.rows.every((r: any) => /proud delighted discovery/.test(r.notes))).toBe(true);
    const a = data.scenes.find((s: any) => s.id === 'A').rows[0];
    expect(a.mood).toMatch(/Inviting/);
    expect(a.notes).toMatch(/gift/);
  });
  it('generated file is up to date and self-contained', () => {
    expect(buildHtml()).toBe(html);
    expect(html).not.toMatch(/\b(src|href)=["']https?:/i);
    expect(html).not.toMatch(/\bfetch\(|XMLHttpRequest|@import/);
  });
  it('inline script compiles and contains zip + crc32', () => {
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    expect(scripts).toHaveLength(1);
    expect(() => new vm.Script(scripts[0])).not.toThrow();
    expect(scripts[0]).toContain('function makeZip');
    expect(scripts[0]).not.toMatch(/^export /m);
  });
  it('parseScript handles names table with only key+text', () => {
    const s = parseScript('### Scene C: x\n\n| Key | Say exactly |\n|---|---|\n| `name.lion` | Lion! |\n');
    expect(s[0].rows[0]).toMatchObject({ key: 'name.lion', text: 'Lion!', mood: '' });
  });
});
