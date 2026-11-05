import { describe, it, expect } from 'vitest';
// @ts-ignore node types are not installed
import fs from 'node:fs';
// @ts-ignore node types are not installed
import os from 'node:os';
// @ts-ignore node types are not installed
import path from 'node:path';
// @ts-ignore plain JS module
import { checkSources, parseCsv } from '../tools/check-sources.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const H = 'id,file,url,author,licence,date_checked,processing\n';
function mk(files: string[], csv: string | null) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'src-'));
  for (const f of files) { fs.mkdirSync(path.dirname(path.join(d, f)), { recursive: true }); fs.writeFileSync(path.join(d, f), 'x'); }
  if (csv !== null) fs.writeFileSync(path.join(d, 'SOURCES.csv'), csv);
  return d;
}

describe('check-sources', () => {
  it('passes on empty folders', () => {
    expect(checkSources(mk(['animals/README.md'], H))).toEqual([]);
  });
  it('fails when a file has no row', () => {
    const e = checkSources(mk(['animals/lion.wav'], H));
    expect(e.join()).toContain('animals/lion.wav has no row');
  });
  it('passes with a valid row, including quoted commas', () => {
    const d = mk(['animals/lion.wav', 'sfx/x.ogg'], H + 'lion,animals/lion.wav,https://x,"Doe, J",CC0,2026-01-01,"trim, norm"\nx,sfx/x.ogg,,me,own,2026-01-01,none\n');
    expect(checkSources(d)).toEqual([]);
  });
  it('rejects disallowed licences and NC/ND', () => {
    for (const l of ['CC-BY-NC-4.0', 'CC-BY-ND-4.0', 'CC-BY-SA-4.0', 'GPL', '']) {
      const d = mk(['animals/a.wav'], H + `a,animals/a.wav,,,${l},2026-01-01,\n`);
      expect(checkSources(d).length, l).toBeGreaterThan(0);
    }
  });
  it('parseCsv handles CRLF and quotes', () => {
    expect(parseCsv('a,"b ""q""",c\r\n1,2,3\r\n')).toEqual([['a', 'b "q"', 'c'], ['1', '2', '3']]);
  });
  it('the real project passes right now', () => {
    expect(checkSources(path.resolve(HERE, '../sounds'))).toEqual([]);
  });
});
