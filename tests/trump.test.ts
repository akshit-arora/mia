import { describe, expect, it } from 'vitest';
import { ANIMAL_IDS } from '../src/cards/data';
import { ALL_STATS, HAND_SIZE, Match, ROUNDS, canPlay, compare, drawHand, drawHands, rowsOf, seeded, valueOf, type ClashStat } from '../src/games/trump/logic';

const all = [...ANIMAL_IDS];

describe('trump logic', () => {
  it('locked below 4 owned cards, playable from 4', () => {
    expect(canPlay(0)).toBe(false); expect(canPlay(3)).toBe(false); expect(canPlay(4)).toBe(true);
    expect(() => new Match('phone', all.slice(0, 3), seeded(1))).toThrow();
  });
  it('hands only come from owned cards, five each, distinct when possible', () => {
    for (let s = 1; s < 40; s++) {
      const owned = all.slice(0, 4 + (s % 10));
      const [a, b] = drawHands(owned, seeded(s));
      for (const h of [a, b]) {
        expect(h).toHaveLength(HAND_SIZE);
        for (const id of h) expect(owned).toContain(id);
        if (owned.length >= HAND_SIZE) expect(new Set(h).size).toBe(HAND_SIZE);
      }
    }
    expect(drawHand(all.slice(0, 4), seeded(3))).toHaveLength(5);
  });
  it('with six or more cards the two cards in a round are different animals', () => {
    for (let s = 1; s < 200; s++) {
      const [a, b] = drawHands(all.slice(0, 6 + (s % 9)), seeded(s));
      for (let i = 0; i < HAND_SIZE; i++) expect(a[i]).not.toBe(b[i]);
    }
  });
  it('every card offers three comparable rows and any stat has a number 1..10', () => {
    for (const id of all) {
      expect(rowsOf(id)).toHaveLength(3);
      for (const k of ALL_STATS) { const v = valueOf(id, k); expect(v).toBeGreaterThanOrEqual(1); expect(v).toBeLessThanOrEqual(10); }
    }
  });
  it('a pick is only offered on powers both cards show: shared stored stats plus cuddly (2 or 3 choices)', () => {
    for (let s = 1; s < 60; s++) {
      const m = new Match('friend', all, seeded(s));
      while (!m.over) {
        const o = m.options(); const [a, b] = m.cards();
        expect(o.length).toBeGreaterThanOrEqual(2); expect(o.length).toBeLessThanOrEqual(3);
        expect(o).toContain('cuddly');
        for (const k of o) if (k !== 'cuddly') { expect(rowsOf(a).some((r) => r.kind === k)).toBe(true); expect(rowsOf(b).some((r) => r.kind === k)).toBe(true); }
        m.play(o[0]);
      }
    }
  });
  it('higher wins, equal is a tie', () => {
    expect(compare('elephant', 'hen', 'size')).toBe(0);
    expect(compare('hen', 'elephant', 'size')).toBe(1);
    expect(compare('lion', 'lion', 'speed')).toBe('tie');
    expect(compare('cat', 'dog', 'speed')).toBe('tie'); // both 7
  });
  it('nothing is ever taken away: hands and owned cards are unchanged after a whole match', () => {
    const owned = all.slice(0, 6); const copy = owned.slice();
    const m = new Match('friend', owned, seeded(9));
    const before = JSON.stringify(m.hands);
    let n = 0;
    while (!m.over) { { const o = m.options(); m.play(o[n++ % o.length]); } }
    expect(m.results).toHaveLength(ROUNDS);
    expect(JSON.stringify(m.hands)).toBe(before);
    expect(owned).toEqual(copy);
    expect(m.hands[0]).toHaveLength(5); expect(m.hands[1]).toHaveLength(5);
  });
  it('a tie is reported as a tie for both, with no winner side', () => {
    const m = new Match('friend', ['cat', 'dog', 'cat', 'dog'], seeded(2));
    const r = m.play('speed'); // cat and dog both 7, whatever the draw gives at least a legal result
    expect(['tie', 0, 1]).toContain(r.winner);
    expect(r.va === r.vb).toBe(r.winner === 'tie');
  });
  it('the phone plays each of its cards once and the sides take turns picking', () => {
    const m = new Match('phone', all, seeded(5));
    const seen: string[] = [];
    const pickers: number[] = [];
    while (!m.over) { pickers.push(m.picker()); seen.push(m.cards()[1]); const k = m.picker() === 1 ? m.phonePick() : m.options()[0]; m.play(k); }
    expect(pickers).toEqual([0, 1, 0, 1, 0]);
    expect([...seen].sort()).toEqual([...m.hands[1]].sort());
  });
  const rate = (owned: string[], strat: 'random' | 'best' | 'worst', runs: number): number => {
    let wins = 0, total = 0;
    for (let s = 1; s <= runs; s++) {
      const rng = seeded(s * 7919);
      const m = new Match('phone', owned, rng);
      while (!m.over) {
        let k: ClashStat;
        if (m.picker() === 1) k = m.phonePick();
        else {
          const opts = m.options(); const [a, b] = m.cards();
          const d = (x: ClashStat) => valueOf(a, x) - valueOf(b, x);
          k = strat === 'random' ? opts[Math.floor(rng() * opts.length)] : opts.slice().sort((x, y) => (strat === 'best' ? d(y) - d(x) : d(x) - d(y)))[0];
        }
        const r = m.play(k); total++; if (r.winner === 0) wins++;
      }
    }
    return wins / total;
  };
  it('the phone lets the child win about half the time (35 to 65 percent) for a random or a clever child (a child who always picks the weakest stat still wins over 20 percent)', () => {
    const lines: string[] = [];
    const bad: string[] = [];
    for (const n of [4, 6, 9, 14]) for (const strat of ['random', 'best', 'worst'] as const) {
      const r = rate(all.slice(0, n), strat, 400);
      lines.push(`${n} ${strat} ${r.toFixed(3)}`);
      if (strat === 'worst' ? r <= 0.2 : r <= 0.35 || r >= 0.65) bad.push(`${n} cards, ${strat}: ${r.toFixed(3)}`);
    }
    expect(bad, lines.join('; ')).toEqual([]);
  });
  it('is repeatable with a seed', () => {
    const a = new Match('phone', all, seeded(77)), b = new Match('phone', all, seeded(77));
    expect(a.hands).toEqual(b.hands);
  });
});
