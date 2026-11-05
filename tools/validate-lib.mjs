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
