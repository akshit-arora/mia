export interface ValidateResult { errors: string[]; warnings: string[] }
export interface ValidateOpts {
  files?: Record<string, string>;
  sourceFiles?: { file: string; text: string }[];
}
export const LEVEL_KEYS: { required: string[]; optional: string[] };
export function validatePack(pack: unknown, locales: Record<string, unknown>, opts?: ValidateOpts): ValidateResult;
