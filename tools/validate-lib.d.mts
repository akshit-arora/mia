export interface ValidateResult { errors: string[]; warnings: string[] }
export interface ValidateOpts {
  files?: Record<string, string>;
  sourceFiles?: { file: string; text: string }[];
}
export const LEVEL_KEYS: { required: string[]; optional: string[] };
export function validatePack(pack: unknown, locales: Record<string, unknown>, opts?: ValidateOpts): ValidateResult;
export interface CardOpts { actions?: string[]; drawn?: string[]; atlas?: string[] }
export function validateCards(cards: unknown, icons: unknown, entities: unknown, locales: Record<string, unknown>, opts?: CardOpts): { errors: string[] };
