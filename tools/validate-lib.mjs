// Pure pack validation. No fs access: callers pass data in.
// validatePack(pack, locales, opts) -> { errors: string[], warnings: string[] }
//   pack    = { entities, zones, levels }
//   locales = { en: {...}, hi: {...}, ... }  (en is required)
//   opts    = { files?: {entities,zones,levels,locale(code)} display names,
//               sourceFiles?: [{ file, text }] engine/game sources for the "no cow in code" check }

export const LEVEL_KEYS = {
  required: [
    'id', 'mechanic', 'order', 'prereq', 'lens', 'targets', 'itemQuery', 'count', 'distractors',
    'accept', 'reveal', 'hintProfile', 'pace', 'introEntities', 'surpriseSlot', 'teaches',
    'estDuration', 'unlockRule', 'reward', 'promptId',
  ],
  optional: ['replayOnly', 'intro'],
};
const ENTITY_REQUIRED = ['id', 'nameKey', 'emoji', 'tags', 'relations', 'accepts', 'sound', 'captionKey', 'poke'];
const ENTITY_OPTIONAL = ['acceptsAlso', 'wonder', 'noGag'];
const ZONE_REQUIRED = ['id', 'nameKey', 'theme'];
const MAX_FACT_WORDS = 8;

export function validatePack(pack, locales, opts = {}) {
  const errors = [];
  const warnings = [];
  const F = { entities: 'src/data/entities.json', zones: 'src/data/zones.json', levels: 'src/data/levels.json', ...(opts.files || {}) };
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);
  const en = (locales && locales.en) || null;
  if (!en) err('src/locales/en.json: missing (English is the key source of truth)');

  const entities = Array.isArray(pack.entities) ? pack.entities : (err(`${F.entities}: must be an array`), []);
  const zones = Array.isArray(pack.zones) ? pack.zones : (err(`${F.zones}: must be an array`), []);
  const levels = Array.isArray(pack.levels) ? pack.levels : (err(`${F.levels}: must be an array`), []);

  const hasKey = (k) => en && typeof k === 'string' && Object.prototype.hasOwnProperty.call(en, k) && k !== '_meta';
  const needKey = (file, id, field, k) => {
    if (typeof k !== 'string' || !k) err(`${file}: "${id}" ${field} is missing or not a string`);
    else if (en && !hasKey(k)) err(`${file}: "${id}" ${field} "${k}" not found in src/locales/en.json`);
  };

  // zones
  const zoneIds = new Set();
  for (const [i, z] of zones.entries()) {
    const id = z && z.id;
    for (const f of ZONE_REQUIRED) if (!z || z[f] === undefined || z[f] === '') err(`${F.zones}: zone #${i} (${id ?? '?'}) missing required field "${f}"`);
    if (id !== undefined) {
      if (zoneIds.has(id)) err(`${F.zones}: duplicate zone id "${id}"`);
      zoneIds.add(id);
    }
    if (z && z.nameKey) needKey(F.zones, id, 'nameKey', z.nameKey);
  }

  // entities
  const entById = new Map();
  for (const [i, e] of entities.entries()) {
    const id = e && e.id;
    for (const f of ENTITY_REQUIRED) if (!e || e[f] === undefined || e[f] === '') err(`${F.entities}: entity #${i} (${id ?? '?'}) missing required field "${f}"`);
    if (e) for (const k of Object.keys(e)) if (!ENTITY_REQUIRED.includes(k) && !ENTITY_OPTIONAL.includes(k)) err(`${F.entities}: "${id}" has unknown field "${k}"`);
    if (id === undefined) continue;
    if (entById.has(id)) err(`${F.entities}: duplicate entity id "${id}"`);
    entById.set(id, e);
    if (!e) continue;
    if (e.nameKey) needKey(F.entities, id, 'nameKey', e.nameKey);
    if (e.captionKey) needKey(F.entities, id, 'captionKey', e.captionKey);
    if (e.emoji !== undefined && !/^[0-9a-f]{4,6}(-[0-9a-f]{4,6})*$/.test(String(e.emoji))) err(`${F.entities}: "${id}" emoji "${e.emoji}" must be lowercase hex codepoint(s)`);
    const lives = e.relations && e.relations.livesAt;
    if (!Array.isArray(lives) || lives.length === 0) err(`${F.entities}: "${id}" relations.livesAt must be a non-empty array`);
    else for (const z of lives) if (!zoneIds.has(z)) err(`${F.entities}: "${id}" livesAt zone "${z}" does not exist in ${F.zones}`);
    if (!Array.isArray(e.accepts) || e.accepts.length === 0) err(`${F.entities}: "${id}" accepts must be a non-empty array`);
    else for (const z of e.accepts) if (!zoneIds.has(z)) err(`${F.entities}: "${id}" accepts zone "${z}" does not exist in ${F.zones}`);
    if (e.acceptsAlso !== undefined) {
      if (!Array.isArray(e.acceptsAlso)) err(`${F.entities}: "${id}" acceptsAlso must be an array`);
      else for (const z of e.acceptsAlso) if (!zoneIds.has(z)) err(`${F.entities}: "${id}" acceptsAlso zone "${z}" does not exist in ${F.zones}`);
    }
    if (e.wonder) {
      const w = e.wonder;
      for (const f of ['questionKey', 'action', 'factKey']) if (!w[f]) err(`${F.entities}: "${id}" wonder.${f} is missing`);
      if (w.questionKey) needKey(F.entities, id, 'wonder.questionKey', w.questionKey);
      if (w.factKey) {
        needKey(F.entities, id, 'wonder.factKey', w.factKey);
        const text = en && en[w.factKey];
        if (typeof text === 'string') {
          const words = text.trim().split(/\s+/).filter(Boolean).length;
          if (words > MAX_FACT_WORDS) err(`src/locales/en.json: fact "${w.factKey}" (entity "${id}") has ${words} words, max ${MAX_FACT_WORDS} (PLAN 4.6)`);
        }
      }
    }
  }

  // levels
  const lvlById = new Map();
  const orders = new Map();
  const allowed = new Set([...LEVEL_KEYS.required, ...LEVEL_KEYS.optional]);
  for (const [i, l] of levels.entries()) {
    const id = l && l.id;
    for (const f of LEVEL_KEYS.required) if (!l || l[f] === undefined) err(`${F.levels}: level #${i} (${id ?? '?'}) missing required field "${f}"`);
    if (l) for (const k of Object.keys(l)) if (!allowed.has(k)) err(`${F.levels}: level "${id}" has non-generic field "${k}" (LevelConfig must stay free of animal-specific keys; see src/types.ts)`);
    if (id === undefined) continue;
    if (lvlById.has(id)) err(`${F.levels}: duplicate level id "${id}"`);
    lvlById.set(id, l);
    if (!l) continue;
    if (typeof l.order === 'number') {
      if (orders.has(l.order)) err(`${F.levels}: level "${id}" order ${l.order} duplicates level "${orders.get(l.order)}"`);
      else orders.set(l.order, id);
    } else if (l.order !== undefined) err(`${F.levels}: level "${id}" order must be a number`);

    const targets = Array.isArray(l.targets) ? l.targets : [];
    if (!Array.isArray(l.targets) || targets.length === 0) err(`${F.levels}: level "${id}" targets must be a non-empty array`);
    for (const t of targets) if (!zoneIds.has(t)) err(`${F.levels}: level "${id}" target zone "${t}" does not exist in ${F.zones}`);

    const q = l.itemQuery || {};
    const pool = Array.isArray(q.pool) ? q.pool : [];
    if (!Array.isArray(q.pool) || pool.length === 0) err(`${F.levels}: level "${id}" itemQuery.pool must be a non-empty array`);
    const refs = [['itemQuery.pool', pool], ['itemQuery.guests', q.guests || []], ['introEntities', l.introEntities || []]];
    for (const [name, arr] of refs) for (const eid of arr) if (!entById.has(eid)) err(`${F.levels}: level "${id}" ${name} entity "${eid}" does not exist in ${F.entities}`);

    // winnable: every pool entity must be accepted by at least one target
    for (const eid of pool) {
      const e = entById.get(eid);
      if (!e || !Array.isArray(e.accepts)) continue;
      const ok = new Set(e.accepts);
      if (l.accept === 'primary-plus-also' && Array.isArray(e.acceptsAlso)) e.acceptsAlso.forEach((z) => ok.add(z));
      if (!targets.some((t) => ok.has(t))) err(`${F.levels}: level "${id}" is unwinnable for "${eid}": none of targets [${targets.join(', ')}] is in its accepted zones [${[...ok].join(', ')}]`);
    }
    if (l.promptId !== undefined) needKey(F.levels, id, 'promptId', l.promptId);
  }
  // prereq + cycles
  for (const [id, l] of lvlById) {
    if (l && l.prereq !== null && l.prereq !== undefined) {
      if (!lvlById.has(l.prereq)) err(`${F.levels}: level "${id}" prereq "${l.prereq}" does not exist`);
    }
  }
  const state = new Map();
  const visit = (id, path) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) { err(`${F.levels}: prereq cycle: ${[...path, id].join(' -> ')}`); return; }
    state.set(id, 1);
    const p = lvlById.get(id) && lvlById.get(id).prereq;
    if (p && lvlById.has(p)) visit(p, [...path, id]);
    state.set(id, 2);
  };
  for (const id of lvlById.keys()) visit(id, []);

  // locales
  if (en) {
    for (const [code, loc] of Object.entries(locales)) {
      if (code === 'en' || !loc) continue;
      const file = `src/locales/${code}.json`;
      const extra = Object.keys(loc).filter((k) => k !== '_meta' && !Object.prototype.hasOwnProperty.call(en, k));
      for (const k of extra) err(`${file}: key "${k}" does not exist in src/locales/en.json`);
      const missing = Object.keys(en).filter((k) => k !== '_meta' && !Object.prototype.hasOwnProperty.call(loc, k));
      if (missing.length) warn(`${file}: ${missing.length} key(s) missing vs en.json (falls back to English), e.g. ${missing.slice(0, 3).join(', ')}`);
    }
  }

  // cow rule stays data
  for (const s of opts.sourceFiles || []) {
    const m = /\bcows?\b/i.exec(s.text);
    if (m) {
      const line = s.text.slice(0, m.index).split('\n').length;
      err(`${s.file}:${line}: contains "${m[0]}"; entity-specific rules must live in data (noGag, accepts), not in code`);
    }
  }
  return { errors, warnings };
}

// ---------------------------------------------------------------------------
// Card data (src/data/cards.json + card-icons.json). Pure, like validatePack.
//   cards   = parsed cards.json   ({ shelves, types, statKinds, typeShelf, animals })
//   icons   = parsed card-icons.json (array)
//   entities= parsed entities.json (array)
//   locales = { en, hi? }
//   opts    = { actions?: string[] (reaction names), drawn?: string[] (ids drawn on canvas),
//               atlas?: string[] (ids baked in the card atlas) }
// ---------------------------------------------------------------------------
const words = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

export function validateCards(cards, icons, entities, locales, opts = {}) {
  const errors = [];
  const err = (m) => errors.push(m);
  const FC = 'src/data/cards.json', FI = 'src/data/card-icons.json';
  const en = (locales && locales.en) || {};
  const hasKey = (k) => Object.prototype.hasOwnProperty.call(en, k) && typeof en[k] === 'string' && en[k] !== '';
  const needKey = (who, k) => { if (!hasKey(k)) err(`src/locales/en.json: missing key "${k}" (needed by ${who})`); };
  const range = (who, k, lo, hi) => { if (hasKey(k)) { const n = words(en[k]); if (n < lo || n > hi) err(`src/locales/en.json: "${k}" has ${n} words, expected ${lo} to ${hi} (${who})`); } };

  // icons
  const iconById = new Map();
  if (!Array.isArray(icons)) { err(`${FI}: must be an array`); icons = []; }
  const seen = { food: { shape: new Map(), colour: new Map() }, home: { shape: new Map(), colour: new Map() }, type: { shape: new Map(), colour: new Map() }, ui: { shape: new Map(), colour: new Map() } };
  for (const ic of icons) {
    if (!ic || !ic.id) { err(`${FI}: an icon has no id`); continue; }
    if (iconById.has(ic.id)) err(`${FI}: duplicate icon "${ic.id}"`);
    iconById.set(ic.id, ic);
    if (!seen[ic.group]) { err(`${FI}: icon "${ic.id}" has unknown group "${ic.group}"`); continue; }
    if (!ic.id.startsWith(ic.group + '.')) err(`${FI}: icon "${ic.id}" must start with "${ic.group}."`);
    if (!!ic.emoji === !!ic.draw) err(`${FI}: icon "${ic.id}" needs exactly one of "emoji" (baked) or "draw": true (canvas)`);
    if (ic.emoji && !/^[0-9a-f]{4,6}(-[0-9a-f]{4,6})*$/.test(ic.emoji)) err(`${FI}: icon "${ic.id}" emoji must be lowercase hex`);
    if (!ic.shape || !ic.colour) err(`${FI}: icon "${ic.id}" needs "shape" and "colour" (every icon must differ in shape AND colour)`);
    for (const f of ['shape', 'colour']) {
      const m = seen[ic.group][f];
      if (ic[f] && m.has(ic[f])) err(`${FI}: icons "${m.get(ic[f])}" and "${ic.id}" share the ${f} "${ic[f]}" (colour-blind safety: same group must differ in shape and colour)`);
      else if (ic[f]) m.set(ic[f], ic.id);
    }
    if (ic.draw && opts.drawn && !opts.drawn.includes(ic.id)) err(`${FI}: icon "${ic.id}" is canvas-drawn but src/cards/icons.ts has no drawing for it`);
    if (ic.emoji && opts.atlas && !opts.atlas.includes(ic.id)) err(`${FI}: icon "${ic.id}" is missing from src/gen/card-atlas.json (run: npm run bake:cards)`);
  }

  const shelves = Array.isArray(cards && cards.shelves) ? cards.shelves : (err(`${FC}: shelves must be an array`), []);
  const types = Array.isArray(cards && cards.types) ? cards.types : (err(`${FC}: types must be an array`), []);
  const kinds = Array.isArray(cards && cards.statKinds) ? cards.statKinds : [];
  const typeShelf = (cards && cards.typeShelf) || {};
  const animals = Array.isArray(cards && cards.animals) ? cards.animals : (err(`${FC}: animals must be an array`), []);
  const entIds = new Set((entities || []).map((e) => e.id));

  for (const s of shelves) { needKey(`shelf ${s}`, 'home.' + s); needKey(`shelf ${s}`, 'ui.shelf.' + s); needKey(`shelf ${s}`, 'card.went.' + s); range(`shelf ${s}`, 'card.went.' + s, 2, 4); }
  for (const t of types) { needKey(`type ${t}`, 'type.' + t); if (!shelves.includes(typeShelf[t])) err(`${FC}: typeShelf["${t}"] must name a shelf`); if (!iconById.has('type.' + t)) err(`${FC}: type "${t}" has no icon "type.${t}"`); }
  for (const s of shelves) if (!iconById.has('home.' + s) ) err(`${FC}: shelf "${s}" has no icon "home.${s}"`);

  const ids = new Set();
  const usedKinds = new Set();
  for (const [i, a] of animals.entries()) {
    const id = a && a.id;
    const who = `${FC}: animal #${i} (${id ?? '?'})`;
    if (!id) { err(`${who} has no id`); continue; }
    if (ids.has(id)) err(`${who}: duplicate id`);
    ids.add(id);
    if (!entIds.has(id)) err(`${who}: no entity "${id}" in src/data/entities.json (no sprite or sound)`);
    for (const f of ['name', 'type', 'shelf', 'food', 'home', 'stats', 'action', 'ability']) if (a[f] === undefined || a[f] === '') err(`${who}: missing "${f}"`);
    if (a.type && !types.includes(a.type)) err(`${who}: type "${a.type}" is not one of ${types.join('/')}`);
    if (a.shelf && !shelves.includes(a.shelf)) err(`${who}: shelf "${a.shelf}" is not one of ${shelves.join('/')}`);
    if (a.type && a.shelf && typeShelf[a.type] !== a.shelf) err(`${who}: type "${a.type}" belongs on shelf "${typeShelf[a.type]}", not "${a.shelf}"`);
    if (a.food && !iconById.has('food.' + a.food)) err(`${who}: food icon "food.${a.food}" does not exist in ${FI}`);
    if (a.home && !iconById.has('home.' + a.home)) err(`${who}: home icon "home.${a.home}" does not exist in ${FI}`);
    if (a.action && opts.actions && !opts.actions.includes(a.action)) err(`${who}: action "${a.action}" is not in src/game/reactions.ts`);
    const st = a.stats && typeof a.stats === 'object' ? Object.entries(a.stats) : [];
    if (st.length !== 2) err(`${who}: needs exactly 2 stats, has ${st.length}`);
    for (const [k, v] of st) {
      if (!kinds.includes(k)) err(`${who}: stat "${k}" is not one of ${kinds.join('/')}`);
      else { usedKinds.add(k); needKey(`stat ${k}`, 'stat.' + k); }
      if (!Number.isInteger(v) || v < 1 || v > 10) err(`${who}: stat "${k}" must be a whole number 1 to 10`);
    }
    // carnivores: neutral meal icon only, and flagged for review
    if (a.food === 'meal') {
      if (!a.review) err(`${who}: food "meal" (carnivore) must carry review: true`);
      const m = iconById.get('food.meal');
      if (m && m.emoji) err(`${FI}: "food.meal" must be a plain canvas-drawn covered bowl, not an emoji (no drumstick, prey or blood)`);
    }
    if (a.review && !a.reviewNote) err(`${who}: review: true needs a reviewNote`);
    for (const k of ['card.name.', 'card.say.', 'card.food.', 'card.home.']) needKey(`animal ${id}`, k + id);
    if (a.food) needKey(`animal ${id}`, 'food.' + a.food);
    if (a.home) needKey(`animal ${id}`, 'home.' + a.home);
    if (a.type) needKey(`animal ${id}`, 'type.' + a.type);
    if (a.ability) { needKey(`animal ${id}`, 'ability.' + a.ability); range(`animal ${id}`, 'ability.' + a.ability, 2, 4); }
    range(`animal ${id}`, 'card.say.' + id, 2, 6);
    range(`animal ${id}`, 'card.food.' + id, 3, 6);
    range(`animal ${id}`, 'card.home.' + id, 3, 6);
  }
  for (const k of ['card.star', 'home.soon', 'card.locked', 'card.hear', 'ui.shelves', 'ui.back', 'ui.skip', 'ui.truck', 'stat.of']) needKey('card game UI', k);
  range('spoken', 'card.star', 2, 4); range('spoken', 'home.soon', 2, 4);
  void usedKinds;
  return { errors };
}
