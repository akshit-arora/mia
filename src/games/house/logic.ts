// Play Yard: the pure parts (no DOM, no canvas), unit-tested in tests/house.test.ts.
// Which pet a food brings, the pantry order, the round state machine (pantry -> arrive -> play -> eat -> home -> paint -> reveal),
// the throw / fetch timeline and the pet's pose along it. Nothing can fail: every throw fills one heart.

export type Rng = () => number;
export type PetId = 'dog' | 'cat' | 'rabbit';
export const PETS: readonly PetId[] = ['dog', 'cat', 'rabbit'];

/** The pets' own food: the shared card icons `food.<id>` (same as cards.json). */
export const FOOD_OF: Record<PetId, string> = { dog: 'bone', cat: 'milk', rabbit: 'carrot' };
export const PET_OF_FOOD: Record<string, PetId> = { bone: 'dog', milk: 'cat', carrot: 'rabbit' };
/** The pet's own toy: dog ball, cat yarn, rabbit leaf ball. */
export const TOY_OF: Record<PetId, string> = { dog: 'ball', cat: 'yarn', rabbit: 'leaf' };
/** Funny things that can happen on a throw. Never the same twice in a row. */
export const OUTCOMES: Record<PetId, readonly string[]> = {
  dog: ['fetch', 'skid', 'dig'],
  cat: ['pounce', 'tangle', 'bat'],
  rabbit: ['hop', 'side', 'nibble'],
};
export const DECO_COUNT = 3; // toy colour + home decoration choices (colour with a pattern, so colour is never the only cue)

// ---------------------------------------------------------------- pantry order
/** Memory of the session: how often each pet was played, the last one, and how many pantries were shown. */
export interface PetMemory { played: Record<PetId, number>; last: PetId | null; rounds: number }
export const newPetMemory = (): PetMemory => ({ played: { dog: 0, cat: 0, rabbit: 0 }, last: null, rounds: 0 });

/**
 * The pantry always shows all three foods (no wrong choice; each brings a different pet).
 * `hint` is the slot of the suggested pet: an unowned pet if any is left, least played first, and not the one just played when there
 * is another choice. It sits in the CENTRE (where the hand rests) two pantries out of three, and on the left / right side every third
 * pantry, so a child who always taps the same slot still meets every pet. The other two fill the remaining slots in random order.
 */
export function pantryOrder(owned: ReadonlySet<string>, mem: PetMemory, rng: Rng): { order: [PetId, PetId, PetId]; hint: number } {
  const score = (p: PetId): number => mem.played[p] + (p === mem.last ? 0.6 : 0) + rng() * 0.4;
  const unowned = PETS.filter((p) => !owned.has(p));
  const pool = unowned.length ? unowned : PETS;
  const pick = [...pool].sort((a, b) => score(a) - score(b))[0];
  const r = mem.rounds++;
  const slot = r % 3 === 2 ? (Math.floor(r / 3) % 2 === 0 ? 0 : 2) : 1;
  const rest = PETS.filter((p) => p !== pick);
  if (rng() < 0.5) rest.reverse();
  const order: [PetId, PetId, PetId] = ['dog', 'dog', 'dog'];
  let k = 0;
  for (let i = 0; i < 3; i++) order[i] = i === slot ? pick : rest[k++];
  return { order, hint: slot };
}

// ---------------------------------------------------------------- layout (logical canvas, short side 135; W 240 to 300)
export const HOME_Y = 84; // pets' feet when at home
export const PLAY_TOP = 80, PLAY_BOT = 124; // where a thrown toy can land (feet y)
export const homeX = (p: PetId, W: number): number => (p === 'dog' ? 36 : p === 'rabbit' ? Math.round(W * 0.44) : W - 88);
export const restOf = (W: number): { x: number; y: number } => ({ x: Math.round(W * 0.56), y: 112 });
export const bowlOf = (W: number): { x: number; y: number } => ({ x: restOf(W).x - 40, y: 120 });
/** where the pet stands to eat (right of the bowl, facing left) */
export const eatSpot = (W: number): { x: number; y: number } => ({ x: bowlOf(W).x + 22, y: 118 });
export const clampX = (x: number, W: number): number => (x < 26 ? 26 : x > W - 26 ? W - 26 : x);
export const clampY = (y: number): number => (y < PLAY_TOP ? PLAY_TOP : y > PLAY_BOT ? PLAY_BOT : y);
/** Pantry shelf slots (centres, logical px): left, centre, right */
export const slotX = (i: number, W: number): number => Math.round(W * 0.42 + (i - 1) * 44);
export const SLOT_Y = 33;
/** Paint swatches (centres) */
export const swatchX = (i: number, W: number): number => Math.round(W * 0.4 + (i - 1) * 38);
export const SWATCH_Y = 108;

// ---------------------------------------------------------------- timeline
export const Ph = { Pantry: 0, Arrive: 1, Play: 2, Eat: 3, Home: 4, Paint: 5, Reveal: 6 } as const;
export type PhaseId = (typeof Ph)[keyof typeof Ph];
export const Seg = { Idle: 0, Fly: 1, Chase: 2, Act: 3, Back: 4 } as const;
export type SegId = (typeof Seg)[keyof typeof Seg];
/** Event bits set by Round.tick / throwAt (read once per frame, then they are cleared at the next tick) */
export const EV = { Throw: 1, Land: 2, Catch: 4, Done: 8, Arrived: 16, Munch: 32, Ate: 64, Curled: 128, Painted: 256, Reveal: 512, Step: 1024 } as const;

export const T = {
  arrive: 2300, flyMs: 520, eatWalk: 900, eatMunch: 3000, homeWalk: 2600, homeCurl: 1000, paintIdle: 9000, paintAfter: 1200,
  noThrowHint: 3500, // after this long with no throw the hint hand shows
} as const;
export const EAT_TOTAL = T.eatWalk + T.eatMunch;
export const HOME_TOTAL = T.homeWalk + T.homeCurl;
const MUNCH_AT = [0.2, 0.5, 0.8] as const; // fractions of eatMunch when the food gets smaller

export const NEED_MIN = 4, NEED_MAX = 6;
/** The pets play at their own, unhurried pace: every chase / mishap / return is this much slower than the base timings below. */
export const PACE = 1.35;

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
const easeOut = (k: number): number => 1 - (1 - k) * (1 - k);
const easeIO = (k: number): number => (k < 0.5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k));
const hopsFor = (d: number): number => Math.max(2, Math.ceil(d / 20));

/** Durations of the segments after the toy lands, for a throw of distance d (px) from rest to the target */
export function chaseMs(p: PetId, d: number): number {
  if (p === 'dog') return clamp(d / 0.16, 500, 1500);
  if (p === 'cat') return 450 + clamp(d / 0.16, 400, 1200); // crouch and wiggle, then a dash
  return hopsFor(d) * 230;
}
export function actMs(p: PetId, outcome: string): number {
  switch (outcome) {
    case 'fetch': return 350;
    case 'skid': return 750;
    case 'dig': return 950;
    case 'pounce': return 600;
    case 'tangle': return 1150;
    case 'bat': return 1000;
    case 'hop': return 500;
    case 'side': return 800;
    case 'nibble': return 950;
    default: return p === 'dog' ? 350 : 600;
  }
}
export function backMs(p: PetId, d: number): number {
  if (p === 'dog') return clamp(d / 0.15, 650, 1500);
  if (p === 'cat') return clamp(d / 0.13, 750, 1700);
  return Math.max(700, hopsFor(d) * 230);
}

export interface RoundOpts { W: number; reduced: boolean }

/** One round of Play Yard. The visuals read its state; it never fails and always ends at Reveal. */
export class Round {
  phase: PhaseId = Ph.Pantry;
  t = 0;
  pet: PetId | null = null;
  need = NEED_MIN;
  hearts = 0;
  throws = 0;
  seg: SegId = Seg.Idle;
  segT = 0;
  segMs = 0;
  outcome = '';
  prevOutcome = '';
  tx = 0; ty = 0; // target (feet)
  ox = 0; oy = 0; // overshoot / side point used by some outcomes (skid, bat, side)
  idleMs = 0; // time in Play/Idle with no throw
  everThrew = false;
  eatStep = 0; // 0 full .. 3 empty
  deco = -1; // the decoration chosen in the Paint phase (-1 none yet)
  ev = 0;
  private dChase = 0; private dAct = 0; private dBack = 0;

  constructor(public rng: Rng, public opts: RoundOpts) {}

  /** The child picked a food (Pantry only): that pet comes. */
  begin(pet: PetId): boolean {
    if (this.phase !== Ph.Pantry) return false;
    this.pet = pet; this.need = NEED_MIN + Math.floor(this.rng() * (NEED_MAX - NEED_MIN + 1));
    this.hearts = 0; this.throws = 0; this.eatStep = 0; this.deco = -1; this.prevOutcome = ''; this.outcome = '';
    this.seg = Seg.Idle; this.idleMs = 0; this.everThrew = false;
    this.go(Ph.Arrive);
    return true;
  }

  /** A tap at logical (x, y). Counts only in Play while the pet is waiting. Returns whether a throw started. */
  throwAt(x: number, y: number): boolean {
    if (this.phase !== Ph.Play || this.seg !== Seg.Idle || !this.pet) return false;
    const W = this.opts.W;
    this.ty = clampY(y); this.tx = clampX(x, W);
    if (this.ty > 94 && this.tx > W - 66) this.tx = W - 66; // keep clear of the sound / caption / settings buttons
    const r = restOf(W);
    const d = Math.hypot(this.tx - r.x, this.ty - r.y);
    const list = OUTCOMES[this.pet];
    let o = list[Math.floor(this.rng() * list.length)];
    if (o === this.prevOutcome) o = list[(list.indexOf(o) + 1 + Math.floor(this.rng() * (list.length - 1))) % list.length];
    this.outcome = o; this.prevOutcome = o;
    // overshoot / side offset points (kept inside the yard)
    const dir = this.tx >= r.x ? 1 : -1;
    const lim = (v: number): number => (this.ty > 94 && v > W - 66 ? W - 66 : clampX(v, W));
    this.ox = lim(this.tx + dir * 26); this.oy = this.ty;
    if (o === 'side') { this.ox = lim(this.tx + (this.rng() < 0.5 ? -24 : 24)); this.oy = clampY(this.ty + (this.rng() < 0.5 ? -8 : 8)); }
    if (o === 'bat') { this.ox = lim(this.tx + (this.tx > W / 2 ? -28 : 28)); this.oy = clampY(this.ty + 6); }
    const k = (this.opts.reduced ? 0.7 : 1) * PACE;
    this.dChase = chaseMs(this.pet, d) * k; this.dAct = actMs(this.pet, o) * k;
    this.dBack = backMs(this.pet, Math.hypot((o === 'bat' ? this.ox : this.tx) - r.x, (o === 'bat' ? this.oy : this.ty) - r.y)) * k;
    this.enter(Seg.Fly, T.flyMs * (this.opts.reduced ? 0.7 : 1));
    this.throws++; this.everThrew = true; this.idleMs = 0;
    this.ev |= EV.Throw;
    return true;
  }

  /** The decoration the child picked (Paint only). */
  paint(i: number): boolean {
    if (this.phase !== Ph.Paint || this.deco >= 0 || i < 0 || i >= DECO_COUNT) return false;
    this.deco = i; this.t = 0; this.ev |= EV.Painted;
    return true;
  }

  /** Advance by dt ms. Events are in `ev` afterwards (cleared at the start of each tick). */
  tick(dt: number): void {
    this.ev = this.ev & EV.Throw ? EV.Throw : 0; // keep a throw started between ticks
    this.t += dt;
    switch (this.phase) {
      case Ph.Arrive:
        if (this.t >= T.arrive) { this.go(Ph.Play); this.ev |= EV.Arrived; this.idleMs = 0; }
        break;
      case Ph.Play: this.tickPlay(dt); break;
      case Ph.Eat: {
        const m = this.t - T.eatWalk;
        while (this.eatStep < 3 && m >= MUNCH_AT[this.eatStep] * T.eatMunch) { this.eatStep++; this.ev |= EV.Munch; }
        if (this.t >= EAT_TOTAL) { this.eatStep = 3; this.ev |= EV.Ate; this.go(Ph.Home); }
        break;
      }
      case Ph.Home:
        if (this.t >= HOME_TOTAL) { this.ev |= EV.Curled; this.go(Ph.Paint); }
        break;
      case Ph.Paint:
        if ((this.deco >= 0 && this.t >= T.paintAfter) || this.t >= T.paintIdle) { this.ev |= EV.Reveal; this.go(Ph.Reveal); }
        break;
      default: break;
    }
  }

  /** Back to the pantry after the reveal. */
  next(): void { this.pet = null; this.go(Ph.Pantry); this.seg = Seg.Idle; this.hearts = 0; this.throws = 0; this.deco = -1; }

  // ---- internals
  private tickPlay(dt: number): void {
    if (this.seg === Seg.Idle) { this.idleMs += dt; return; }
    this.segT += dt;
    while (this.segT >= this.segMs && this.seg !== Seg.Idle) {
      const over = this.segT - this.segMs;
      switch (this.seg) {
        case Seg.Fly: this.ev |= EV.Land; this.enter(Seg.Chase, this.dChase); break;
        case Seg.Chase: this.ev |= EV.Step; this.enter(Seg.Act, this.dAct); break;
        case Seg.Act: // the pet has the toy: a heart fills (every outcome, never a miss)
          this.hearts++; this.ev |= EV.Catch; this.enter(Seg.Back, this.dBack); break;
        case Seg.Back:
          this.ev |= EV.Done; this.seg = Seg.Idle; this.segT = 0; this.idleMs = 0;
          if (this.hearts >= this.need) { this.go(Ph.Eat); return; }
          break;
        default: return;
      }
      if (this.seg !== Seg.Idle) this.segT = over;
    }
  }
  private enter(s: SegId, ms: number): void { this.seg = s; this.segT = 0; this.segMs = Math.max(1, ms); }
  private go(p: PhaseId): void { this.phase = p; this.t = 0; }
}

// ---------------------------------------------------------------- pose: where the pet and its toy are
export const V = { Stand: 0, Crouch: 1, Tangled: 2, Curled: 3, Head: 4 } as const;
export interface Pose { x: number; y: number; lift: number; face: number; v: number; toyOn: boolean; toyX: number; toyY: number; carry: boolean; dust: boolean }
export const newPose = (): Pose => ({ x: 0, y: 0, lift: 0, face: 1, v: 0, toyOn: false, toyX: 0, toyY: 0, carry: false, dust: false });

const hopArc = (k: number, hops: number, h: number): number => { const f = (k * hops) % 1; return Math.sin(f * Math.PI) * h; };
const sgn = (v: number): number => (v >= 0 ? 1 : -1);

/** Fill `o` with the pose for the round's current state. Pure and allocation-free. Toy start (hand) is at the bottom of the screen. */
export function poseAt(o: Pose, r: Round): Pose {
  const W = r.opts.W;
  const rest = restOf(W);
  o.lift = 0; o.v = V.Stand; o.toyOn = false; o.carry = false; o.dust = false; o.face = o.face || 1;
  const pet = r.pet;
  if (!pet) { o.x = rest.x; o.y = rest.y; return o; }
  const hx = homeX(pet, W);
  switch (r.phase) {
    case Ph.Arrive: { // runs from home to rest
      const k = easeOut(clamp(r.t / T.arrive, 0, 1));
      o.x = lerp(hx, rest.x, k); o.y = lerp(HOME_Y, rest.y, k);
      o.face = sgn(rest.x - hx) || 1;
      if (k < 1) o.lift = hopArc(clamp(r.t / T.arrive, 0, 1), pet === 'rabbit' ? 5 : 8, pet === 'rabbit' ? 7 : 3);
      return o;
    }
    case Ph.Play: return playPose(o, r, rest, pet);
    case Ph.Eat: {
      const ex = eatSpot(W);
      const k = easeIO(clamp(r.t / T.eatWalk, 0, 1));
      o.x = lerp(rest.x, ex.x, k); o.y = lerp(rest.y, ex.y, k); o.face = -1;
      if (r.t < T.eatWalk) o.lift = hopArc(r.t / T.eatWalk, pet === 'rabbit' ? 3 : 5, pet === 'rabbit' ? 5 : 2);
      else o.v = V.Head;
      return o;
    }
    case Ph.Home: {
      const ex = eatSpot(W);
      const k = easeIO(clamp(r.t / T.homeWalk, 0, 1));
      o.x = lerp(ex.x, hx, k); o.y = lerp(ex.y, HOME_Y, k); o.face = sgn(hx - ex.x) || 1;
      if (r.t < T.homeWalk) o.lift = hopArc(r.t / T.homeWalk, pet === 'rabbit' ? 6 : 9, pet === 'rabbit' ? 6 : 2);
      else o.v = V.Curled;
      return o;
    }
    case Ph.Paint: case Ph.Reveal:
      o.x = hx; o.y = HOME_Y; o.v = V.Curled; return o;
    default: o.x = rest.x; o.y = rest.y; return o;
  }
}

function playPose(o: Pose, r: Round, rest: { x: number; y: number }, pet: PetId): Pose {
  const k = r.segMs > 0 ? clamp(r.segT / r.segMs, 0, 1) : 0;
  const out = r.outcome;
  o.x = rest.x; o.y = rest.y;
  if (r.seg === Seg.Idle) { o.face = o.face || 1; return o; }
  const dir = sgn(r.tx - rest.x);
  switch (r.seg) {
    case Seg.Fly: {
      o.face = dir; if (pet === 'cat') o.v = V.Crouch;
      o.toyOn = true; o.toyX = lerp(rest.x + 24, r.tx, k); o.toyY = lerp(134, r.ty - 4, k) - Math.sin(k * Math.PI) * 38;
      return o;
    }
    case Seg.Chase: {
      o.toyOn = true; o.toyX = r.tx; o.toyY = r.ty - 4 - (k < 0.25 ? Math.abs(Math.sin(k * 12.6)) * 4 * (1 - k * 4) : 0);
      o.face = dir;
      if (pet === 'dog') {
        const to = out === 'skid' ? { x: r.ox, y: r.oy } : { x: r.tx, y: r.ty };
        const e = out === 'skid' ? easeOut(k) * 0.5 + k * 0.5 : k;
        o.x = lerp(rest.x, to.x, e); o.y = lerp(rest.y, to.y, e); o.lift = Math.abs(Math.sin(k * 14)) * 2.5;
        o.dust = out === 'skid' && k > 0.7;
      } else if (pet === 'cat') {
        const crouchEnd = Math.min(0.5, (450 * PACE * (r.opts.reduced ? 0.7 : 1)) / r.segMs);
        if (k < crouchEnd) { o.v = V.Crouch; } else {
          const e = easeOut((k - crouchEnd) / (1 - crouchEnd));
          const sx = r.tx - dir * 8;
          o.x = lerp(rest.x, sx, e); o.y = lerp(rest.y, r.ty, e); o.lift = Math.sin(e * Math.PI) * 2;
        }
      } else { // rabbit hops
        const hops = Math.max(1, Math.round(r.segMs / 230));
        if (out === 'side') { // wanders off sideways, then hops to the toy
          o.x = lerp(rest.x, r.tx, k) + (r.ox - r.tx) * Math.sin(k * Math.PI);
          o.y = lerp(rest.y, r.ty, k);
        } else { o.x = lerp(rest.x, r.tx, k); o.y = lerp(rest.y, r.ty, k); }
        o.lift = hopArc(k, hops, 7);
      }
      return o;
    }
    case Seg.Act: {
      let px = r.tx, py = r.ty;
      o.toyOn = true; o.toyX = r.tx; o.toyY = r.ty - 4; o.face = dir;
      if (pet === 'dog') {
        if (out === 'skid') { // slides back from the overshoot, spins round, grabs it
          px = lerp(r.ox, r.tx, easeOut(k)); py = r.ty; o.face = k < 0.45 ? dir : -dir; o.dust = k < 0.5;
        } else if (out === 'dig') { o.v = V.Head; o.lift = Math.abs(Math.sin(k * 20)) * 2; }
        else o.lift = Math.sin(k * Math.PI) * 4;
        if (k > 0.7) o.carry = true;
      } else if (pet === 'cat') {
        if (out === 'pounce') { px = r.tx - dir * 8 + dir * 8 * k; o.lift = Math.sin(k * Math.PI) * 9; if (k > 0.55) o.carry = true; }
        else if (out === 'tangle') { px = r.tx; o.v = V.Tangled; o.lift = k < 0.25 ? Math.sin(k * 4 * Math.PI) * 6 : 0; o.carry = true; }
        else { // bat: knocks the yarn away and runs after it
          const m = easeOut(clamp(k * 1.6, 0, 1));
          o.toyX = lerp(r.tx, r.ox, m); o.toyY = r.ty - 4 - Math.sin(m * Math.PI) * 6;
          px = lerp(r.tx - dir * 8, r.ox - dir * 8, easeIO(k)); py = lerp(r.ty, r.oy, k);
          o.lift = Math.sin(k * 3 * Math.PI) * 3;
          if (k > 0.8) o.carry = true;
        }
      } else { // rabbit
        if (out === 'nibble') { o.v = V.Head; o.lift = k > 0.2 && k < 0.8 ? Math.abs(Math.sin(k * 24)) * 1.5 : 0; if (k > 0.85) o.carry = true; }
        else if (out === 'side') { px = r.tx + (r.ox - r.tx) * 0.5 * Math.sin(k * Math.PI); o.lift = Math.abs(Math.sin(k * 10)) * 4; if (k > 0.7) o.carry = true; }
        else { o.v = V.Head; if (k > 0.8) o.carry = true; }
      }
      o.x = px; o.y = py;
      if (o.carry) { o.toyOn = false; }
      return o;
    }
    case Seg.Back: {
      const sx = out === 'bat' ? r.ox - dir * 8 : r.tx;
      const from = out === 'bat' ? r.oy : r.ty;
      o.x = lerp(sx, rest.x, easeIO(k)); o.y = lerp(from, rest.y, easeIO(k));
      o.face = sgn(rest.x - sx) || 1; o.carry = true;
      if (pet === 'rabbit') o.lift = hopArc(k, Math.max(2, Math.round(r.segMs / 230)), 7);
      else if (pet === 'dog') o.lift = Math.abs(Math.sin(k * 12)) * 2.5;
      else o.lift = Math.abs(Math.sin(k * 10)) * 1.5;
      if (out === 'tangle' && k < 0.5) o.v = V.Tangled;
      return o;
    }
    default: return o;
  }
}
