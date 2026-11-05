// Deliver mechanic + Animal Express session arc. All content comes from data; rules live in rules.ts.
import { audio } from '../audio';
import type { Stage } from '../engine';
import { showText } from '../ui/captions';
import type { Entity, LevelConfig, Pack, Progress } from '../types';
import { acceptedZones, addResident, isAccepted, pickItems, planSession, updateConfidence } from './rules';
import { reaction } from './reactions';
import type { Res, World } from './world';

type Wait = {
  level: LevelConfig; e: Entity; mode: 'idle' | 'dragging' | 'picked';
  resolve: (z: string | null) => void; down?: { x: number; y: number }; kb: number;
};

export class Game {
  private wait: Wait | null = null;
  private hintTimers: number[] = [];
  private ghostToken = 0;
  private busyWonder = new Set<Res>();
  rng: () => number = Math.random;

  constructor(
    private stage: Stage, private world: World, private pack: Pack, public progress: Pick<Progress, never> & Progress,
    private save: () => void, private onSunset: () => Promise<void>,
  ) {
    stage.onDown = (p) => this.down(p.x, p.y);
    stage.onMove = (p) => this.move(p.x, p.y);
    stage.onUp = (p) => this.up(p.x, p.y);
    stage.onCancel = () => { if (this.wait && this.wait.mode === 'dragging') this.putBack(); };
    stage.onKey = (e) => this.key(e);
  }

  private get ents(): Map<string, Entity> { return this.world.entities; }
  private say(key: string, who: 'bholu' | 'chiku' = 'bholu') { return audio.say(key, who); }
  private sleep(ms: number) { return this.stage.sleep(ms); }
  private now() { return performance.now(); }

  // ---------------- session arc ----------------
  async runSession(): Promise<void> {
    const p = this.progress;
    const levels = this.pack.levels;
    this.world.rebuild(p.park);
    p.sessions++;
    this.save();
    if (!p.introDone) {
      await this.say('app.welcome');
      for (const id of ['intro-jungle', 'intro-farm', 'intro-home']) {
        const lv = levels.find((l) => l.id === id)!;
        await this.playLevel(lv);
      }
      p.introDone = true; this.save();
      // free flow: mixed animals, easiest first (a short run of level 3)
      const free = levels.find((l) => l.id === '3')!;
      await this.playLevel(free, 4);
    } else {
      await this.say('app.welcome');
      await this.newArrival();
      const plan = planSession(levels, p, this.rng);
      if (plan.review) await this.playLevel(plan.review, Math.min(plan.review.count, 5));
      await this.playLevel(plan.fresh);
    }
    await this.sunset();
  }

  /** The park opens as it was left, plus one new arrival. */
  private async newArrival(): Promise<void> {
    const p = this.progress;
    if (!p.park.length) return;
    const all = this.pack.levels.filter((l) => !l.intro && this.levelOpen(l)).reduce((a: string[], l) => a.concat(l.itemQuery.pool, l.itemQuery.guests || []), []);
    const cand = [...new Set(all)].filter((id) => !p.park.includes(id));
    if (!cand.length) return;
    const id = cand[Math.floor(this.rng() * cand.length)];
    const e = this.ents.get(id)!;
    this.show(e.accepts[0]);
    addResident(p, id); this.world.rebuild(p.park); this.save();
    audio.sfx('sparkle');
    const r = this.world.residents[this.world.residents.length - 1];
    if (r) this.world.sparkles.push({ ...this.world.slotPos(r), t0: this.now() });
    await this.say('park.grow');
  }
  private levelOpen(l: LevelConfig): boolean {
    if (!l.prereq) return true;
    const pre = this.pack.levels.find((x) => x.id === l.prereq);
    return !pre || pre.intro ? this.progress.introDone : (this.progress.cleanRuns[pre.id] ?? 0) >= pre.unlockRule.cleanRuns;
  }
  private show(zone: string) { this.world.visible.add(zone); }

  private async playLevel(level: LevelConfig, count?: number): Promise<void> {
    const w = this.world, p = this.progress;
    // zones that exist: this level's targets plus everywhere the park already lives
    for (const z of level.targets) this.show(z);
    for (const id of p.park) { const e = this.ents.get(id); if (e) this.show(e.accepts[0]); }
    const items = pickItems(level, this.pack.entities, p, this.rng, count);
    let wrongs = 0;
    for (let i = 0; i < items.length; i++) {
      wrongs += await this.deliverOne(level, this.ents.get(items[i])!, i);
      w.targets = [];
    }
    p.seenLevels = [...new Set([...p.seenLevels, level.id])];
    if (wrongs === 0) p.cleanRuns[level.id] = (p.cleanRuns[level.id] ?? 0) + 1;
    this.save();
  }

  // ---------------- one crate ----------------
  private async deliverOne(level: LevelConfig, e: Entity, index: number): Promise<number> {
    const w = this.world, st = this.stage, quick = level.pace > 1 || index > 0;
    // 1. truck arrives with a crate
    w.truck.show = true; w.held = null; w.resting = null; w.crate = 'closed';
    if (w.truck.x < 0 || index === 0) {
      w.truck.x = -80;
      audio.sfx('truck');
      const run = st.tween(1100 / level.pace, (t) => { w.truck.x = -80 + 90 * t; w.truck.bounce = st.reduced ? 0 : Math.sin(t * 40) * 0.7; });
      if (index === 0) { audio.sfx('honk'); await this.say('truck.arrive'); }
      await run; w.truck.bounce = 0;
    }
    // 2. mystery crate: hear it first, see it shake, then pop
    {
      audio.sfx('crate');
      const shake = st.reduced ? Promise.resolve() : st.tween(900, (t) => { w.crateShake = Math.sin(t * 38) * 2 * (1 - t * 0.3); }, (t) => t);
      if (index === 0) this.say('crate.shake');
      await this.sleep(300);
      audio.animal(e.id);
      audio.vibrate(40);
      await shake; w.crateShake = 0;
      await this.sleep(quick ? 350 : 600);
    }
    // 3. reveal
    audio.sfx('pop');
    w.crate = 'open';
    const restX = w.truck.x + 22, restY = 95;
    w.resting = { id: e.id, x: restX, y: restY };
    await st.tween(450, (t) => { w.resting!.y = restY - Math.sin(t * Math.PI) * 18; });
    w.resting.y = restY;
    w.sparkles.push({ x: restX, y: restY - 20, t0: this.now() });
    if (index === 0 && level.intro) await this.say('crate.open');
    await this.say(e.nameKey);
    if (index === 0) this.say('drag.prompt');

    // 4. the child's turn
    let wrongs = 0;
    let zoneId: string | null = null;
    for (;;) {
      zoneId = await this.waitForDrop(level, e);
      if (zoneId && isAccepted(e, zoneId, level)) break;
      if (zoneId) {
        wrongs++;
        await this.wrongDrop(e, zoneId, wrongs);
      }
    }
    // 5. success
    await this.success(level, e, zoneId, wrongs === 0, index);
    return wrongs;
  }

  private async wrongDrop(e: Entity, zone: string, n: number): Promise<void> {
    const w = this.world, st = this.stage, h = w.held!;
    w.highlight = null;
    if (!e.noGag) { audio.sfx('wobble'); if (!st.reduced) await st.tween(500, (t) => { h.x += Math.sin(t * 30) * 0.6; h.lift = Math.abs(Math.sin(t * 9)) * 5; }, (t) => t); }
    else await this.sleep(300);
    w.held = null;
    const home = { id: e.id, x: w.truck.x + 22, y: 95 };
    const hx = h.x, hy = h.y;
    w.resting = null;
    w.held = { ...h, lift: 0 };
    await st.tween(450, (t) => { w.held!.x = hx + (home.x - hx) * t; w.held!.y = hy + (home.y - hy) * t - Math.sin(t * Math.PI) * 12; });
    w.held = null; w.resting = home;
    this.say('wrong.gentle');
    if (n >= 2) { await this.sleep(500); this.say('wrong.hint'); audio.animal(e.id); }
  }

  private async success(level: LevelConfig, e: Entity, zoneId: string, firstTry: boolean, index: number): Promise<void> {
    const w = this.world, st = this.stage, p = this.progress;
    w.highlight = zoneId; w.pulse = false;
    const added = addResident(p, e.id);
    // slot where it will live
    const ghostRes: Res = { id: e.id, zone: zoneId, slot: w.residents.filter((r) => r.zone === zoneId).length };
    const dest = w.slotPos(ghostRes);
    const h = w.held!, hx = h.x, hy = h.y;
    await st.tween(450, (t) => { h.x = hx + (dest.x - hx) * t; h.y = hy + (dest.y - hy) * t - Math.sin(t * Math.PI) * 14; h.lift = 0; });
    w.held = null; w.resting = null;
    if (added) w.rebuild(p.park); else if (!w.residents.length) w.rebuild(p.park);
    w.sparkles.push({ x: dest.x, y: dest.y - 14, t0: this.now() });
    audio.sfx('chime'); audio.vibrate(25);
    updateConfidence(p, e.id, firstTry);
    this.save();
    w.highlight = null;
    const praise = ['correct.1', 'correct.2', 'correct.3'][Math.floor(this.rng() * 3)];
    const zone = this.pack.zones.find((z) => z.id === zoneId)!;
    if (level.intro || index < 2) { await this.say(praise); await this.say(zone.nameKey); } else await this.say(praise);
    // wonder bubble: about one drop in three, never gated or scored
    const res = [...w.residents].reverse().find((r) => r.id === e.id);
    if (res && e.wonder && (level.intro ? false : this.rng() < 0.34 || (index === 1 && !p.stickers.includes(e.id) && this.rng() < 0.5))) this.offerWonder(res, e);
    w.truck.eyes = 0;
    await this.sleep(300);
    // truck rolls off for the next crate
    if (index >= 0) { w.crate = 'none'; }
    if (level.hintProfile === 'intro') await this.sleep(250);
  }

  // ---------------- waiting for the child ----------------
  private waitForDrop(level: LevelConfig, e: Entity): Promise<string | null> {
    const w = this.world;
    // intro: only the right place accepts, so a wrong drop is impossible
    w.targets = level.intro ? acceptedZones(e, level) : level.targets.slice();
    w.highlight = null;
    return new Promise<string | null>((resolve) => {
      const wait: Wait = { level, e, mode: 'idle', resolve: (z) => { this.clearHints(); resolve(z); }, kb: 0 };
      this.wait = wait;
      this.scheduleHints(level, e);
    });
  }

  private clearHints() {
    this.hintTimers.forEach((t) => clearTimeout(t)); this.hintTimers = [];
    this.ghostToken++; this.world.ghost = null;
  }
  private scheduleHints(level: LevelConfig, e: Entity) {
    this.clearHints();
    const first = level.hintProfile === 'intro' ? 1200 : 3000, second = level.hintProfile === 'intro' ? 4500 : 6000;
    this.hintTimers.push(window.setTimeout(() => this.ghostHint(e, level), first));
    this.hintTimers.push(window.setTimeout(() => this.hopHint(e, level), second));
  }
  private target(e: Entity, level: LevelConfig): string { return acceptedZones(e, level).find((z) => this.world.targets.includes(z)) ?? e.accepts[0]; }
  private ghostHint(e: Entity, level: LevelConfig) {
    if (!this.wait || this.wait.mode !== 'idle' || !this.world.resting) return;
    const w = this.world, tok = ++this.ghostToken;
    const r = w.zoneRect(this.target(e, level)), a = w.resting!;
    if (level.hintProfile !== 'intro') this.say('idle.nudge');
    const loop = async () => {
      for (let i = 0; i < 3 && tok === this.ghostToken; i++) {
        await this.stage.tween(1800, (t) => { if (tok === this.ghostToken) w.ghost = { x0: a.x, y0: a.y - 10, x1: r.x + r.w / 2, y1: r.y + 30, t }; }, (t) => t);
      }
      if (tok === this.ghostToken) w.ghost = null;
    };
    void loop();
  }
  private hopHint(e: Entity, level: LevelConfig) {
    if (!this.wait || this.wait.mode !== 'idle' || !this.world.resting) return;
    const w = this.world, r = w.zoneRect(this.target(e, level)), a = w.resting!, tok = this.ghostToken;
    const x0 = a.x, y0 = a.y, x1 = x0 + (r.x + r.w / 2 - x0) / 2, y1 = y0 + (r.y + 40 - y0) / 2;
    audio.sfx('hop');
    void this.stage.tween(700, (t) => { if (!w.resting || tok !== this.ghostToken || w.resting !== a) return; w.resting.x = x0 + (x1 - x0) * t; w.resting.y = y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * 10; })
      .then(() => this.stage.tween(600, (t) => { if (!w.resting || tok !== this.ghostToken || w.resting !== a) return; w.resting.x = x1 + (x0 - x1) * t; w.resting.y = y1 + (y0 - y1) * t; }));
  }

  // ---------------- input ----------------
  private down(x: number, y: number) {
    const w = this.world, wt = this.wait;
    if (wt) {
      if (wt.mode === 'picked') {
        const z = w.hitZone(x, y, 10);
        if (z) { this.finishDrop(z); return; }
        this.putBack(); // tapped elsewhere: put it back down
        return;
      }
      if (wt.mode === 'idle' && w.hitResting(x, y)) { this.pickUp(x, y); return; }
    }
    const res = w.residentAt(x, y);
    if (res) this.tapResident(res);
  }
  private pickUp(x: number, y: number) {
    const w = this.world, wt = this.wait!, r = w.resting!;
    this.clearHints();
    wt.mode = 'dragging'; wt.down = { x, y };
    w.held = { id: r.id, x: r.x, y: r.y, picked: false, flip: false, lift: 4 };
    w.resting = null; w.pulse = true;
    audio.sfx('tick');
  }
  private move(x: number, y: number) {
    const wt = this.wait, w = this.world;
    if (!wt || wt.mode !== 'dragging' || !w.held) return;
    w.held.x = x; w.held.y = y + 10;
    w.highlight = w.hitZone(x, y - 6, 8);
  }
  private up(x: number, y: number) {
    const wt = this.wait, w = this.world;
    if (!wt || wt.mode !== 'dragging' || !w.held) return;
    const d = wt.down ? Math.hypot(x - wt.down.x, y - wt.down.y) : 99;
    if (d < 5) { // a tap: tap-then-tap alternative to dragging
      wt.mode = 'picked'; w.held.x = w.truck.x + 22; w.held.y = 88; w.held.lift = 6; w.highlight = null;
      return;
    }
    const z = w.hitZone(x, y - 6, 8);
    if (z) this.finishDrop(z); else this.putBack();
  }
  private finishDrop(zone: string) {
    const wt = this.wait; if (!wt) return;
    this.wait = null; this.world.pulse = false;
    if (this.world.resting) { this.world.held = { id: this.world.resting.id, x: this.world.resting.x, y: this.world.resting.y, picked: false, flip: false, lift: 0 }; this.world.resting = null; }
    wt.resolve(zone);
  }
  private putBack() {
    const wt = this.wait, w = this.world; if (!wt || !w.held) return;
    const h = w.held, hx = h.x, hy = h.y, tx = w.truck.x + 22, ty = 95;
    w.held = null; w.resting = null; w.pulse = false; w.highlight = null;
    wt.mode = 'idle';
    const mover = { id: h.id, x: hx, y: hy, picked: false, flip: false, lift: 0 };
    w.held = mover;
    void this.stage.tween(300, (t) => { mover.x = hx + (tx - hx) * t; mover.y = hy + (ty - hy) * t; }).then(() => {
      if (w.held === mover) { w.held = null; w.resting = { id: mover.id, x: tx, y: ty }; }
      if (this.wait === wt) this.scheduleHints(wt.level, wt.e);
    });
  }
  private key(ev: KeyboardEvent) {
    const wt = this.wait, w = this.world;
    if (!wt) return;
    const zs = w.targets;
    const k = ev.key;
    if (['ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Escape', '1', '2', '3'].includes(k)) ev.preventDefault();
    if (wt.mode === 'idle' && !w.resting) return;
    if (wt.mode === 'idle' && (k === 'Enter' || k === ' ' || k.startsWith('Arrow'))) {
      this.pickUp(w.resting!.x, w.resting!.y);
      wt.mode = 'picked'; wt.kb = 0; w.held!.lift = 6; w.highlight = zs[0] ?? null;
      return;
    }
    if (wt.mode !== 'picked') return;
    if (k === 'ArrowLeft' || k === 'ArrowRight') {
      const order = this.pack.zones.map((z) => z.id).filter((z) => zs.includes(z));
      const i = Math.max(0, order.indexOf(w.highlight ?? order[0]));
      w.highlight = order[(i + (k === 'ArrowRight' ? 1 : order.length - 1)) % order.length];
    } else if (/^[1-9]$/.test(k)) {
      const order = this.pack.zones.map((z) => z.id).filter((z) => zs.includes(z));
      if (order[+k - 1]) w.highlight = order[+k - 1];
    } else if (k === 'Enter' || k === ' ') { if (w.highlight) this.finishDrop(w.highlight); }
    else if (k === 'Escape') this.putBack();
  }

  // ---------------- park: poke and wonder ----------------
  private tapResident(res: Res) {
    if (this.world.sleeping) return;
    const e = this.ents.get(res.id)!;
    if (res.bubble && this.now() < res.bubble && e.wonder) { void this.revealWonder(res, e); return; }
    if (res.act) return;
    const rc = reaction(e.poke);
    res.act = { name: e.poke, t0: this.now(), dur: rc.dur };
    audio.animal(e.id);
    if (rc.sfx) audio.sfx(rc.sfx);
    audio.vibrate(15);
  }
  private offerWonder(res: Res, e: Entity) {
    res.bubble = this.now() + 9000;
    audio.sfx('sparkle');
    void (async () => {
      await this.say('wonder.appear', 'chiku');
      showText(e.wonder!.questionKey, 'chiku', 3500);
      await this.say('wonder.ask', 'chiku');
      await this.sleep(2500);
      if (res.bubble && this.now() < res.bubble) this.say('wonder.tap', 'chiku');
    })();
  }
  private async revealWonder(res: Res, e: Entity) {
    if (this.busyWonder.has(res)) return;
    this.busyWonder.add(res);
    res.bubble = 0;
    const wd = e.wonder!, rc = reaction(wd.action);
    res.act = { name: wd.action, t0: this.now(), dur: rc.dur };
    if (rc.sfx) audio.sfx(rc.sfx);
    await this.sleep(rc.dur * 0.55);
    await this.say('discover.wow', 'chiku');
    await this.say(wd.factKey, 'chiku');
    if (!this.progress.stickers.includes(e.id)) {
      this.progress.stickers.push(e.id); this.save();
      audio.sfx('sparkle'); await this.say('sticker.new', 'chiku');
    }
    this.busyWonder.delete(res);
  }

  // ---------------- evening ----------------
  private async sunset(): Promise<void> {
    const w = this.world, st = this.stage;
    this.clearHints();
    w.targets = []; w.held = null; w.resting = null; w.crate = 'none';
    w.sleeping = true;
    audio.sfx('sleep');
    audio.ambience(Math.min(1, this.progress.park.length / 24));
    const ending = this.say('day.end');
    await st.tween(3200, (t) => { w.night = t; }, (t) => t);
    await ending;
    // a sealed crate rattles with a "?"
    w.truck.x = 10; w.crate = 'closed'; w.truck.show = true;
    audio.sfx('crate');
    if (!st.reduced) await st.tween(700, (t) => { w.crateShake = Math.sin(t * 30) * 2; }, (t) => t);
    w.crateShake = 0;
    await this.say('day.tomorrow');
    await this.sleep(2500);
    await this.onSunset();
  }

  resetWorldForNewSession(): void {
    const w = this.world;
    this.clearHints(); this.wait = null; this.busyWonder.clear();
    w.night = 0; w.sleeping = false; w.crate = 'none'; w.truck.x = -80; w.targets = [];
    w.held = null; w.resting = null; w.highlight = null; w.pulse = false; w.sparkles = []; w.crateShake = 0;
    for (const r of w.residents) { r.bubble = 0; r.act = undefined; }
    audio.stopAmbience();
  }
}
