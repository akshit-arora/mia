// Generic data model. Nothing here is animal-specific: an "entity" can be an
// animal today and a plant, food or family member later (PLAN.md section 5).

export interface WonderDef {
  /** locale key of Chiku's visual question, e.g. wonder.q.elephant (text only) */
  questionKey: string;
  /** name of the action animation implemented in src/game/reactions.ts */
  action: string;
  /** locale + audio key of the spoken fact, e.g. fact.elephant.trunk */
  factKey: string;
}

export interface Entity {
  id: string;
  nameKey: string; // name.lion (also the audio key of the spoken name)
  emoji: string; // hex codepoint, e.g. "1f981"
  tags: string[];
  relations: { livesAt: string[]; eats?: string[]; home?: string[] };
  /** zones where a drop is accepted (strict list). The cow is farm only (D6). */
  accepts: string[];
  /** extra zones accepted from later levels (double-yes, Milestone 2) */
  acceptsAlso?: string[];
  sound: string; // audio id of the animal sound (animal.lion)
  captionKey: string; // cc.animal.lion
  poke: string; // reaction name in src/game/reactions.ts
  wonder?: WonderDef;
  /** the gentle wrong-drop reaction may be skipped for some entities (cow: no gag) */
  noGag?: boolean;
}

export interface Zone {
  id: string;
  nameKey: string; // zone.jungle
  /** palette slot names, resolved by the renderer */
  theme: string;
}

export type RevealMode = 'full' | 'silhouette' | 'sound-only';
export type AcceptMode = 'strict' | 'primary-plus-also';

export interface LevelConfig {
  id: string;
  mechanic: 'deliver';
  order: number;
  prereq: string | null;
  lens: string; // "lives-at"
  targets: string[]; // zone ids
  itemQuery: { pool: string[]; guests?: string[] };
  count: number;
  distractors: number;
  accept: AcceptMode;
  reveal: RevealMode;
  hintProfile: 'intro' | 'standard';
  pace: number; // truck speed multiplier
  introEntities: string[]; // entities presented one-by-one in intro levels
  surpriseSlot: boolean;
  teaches: string[];
  estDuration: number; // seconds
  unlockRule: { cleanRuns: number };
  reward: string;
  promptId: string; // audio/locale key of the prompt
  /** replay pools only come back for review, never as a new level */
  replayOnly?: boolean;
  intro?: boolean;
}

export interface Pack {
  entities: Entity[];
  zones: Zone[];
  levels: LevelConfig[];
}

export type CaptionMode = 'off' | 'on' | 'auto';
export type CaptionSize = 'small' | 'medium' | 'large';

export interface Progress {
  v: 1;
  introDone: boolean;
  sessions: number;
  cleanRuns: Record<string, number>;
  seenLevels: string[];
  confidence: Record<string, number>; // entityId -> 0..1, never shown to the child
  park: string[]; // residents (entity ids, may repeat)
  stickers: string[];
  settings: {
    captions: CaptionMode;
    captionSize: CaptionSize;
    muted: boolean;
    highContrast: boolean;
    vibration: boolean;
    reducedMotion: 'auto' | 'on' | 'off';
    locale: string;
  };
}
