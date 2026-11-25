import type { z } from 'zod';

/**
 * Les erreurs d'un schéma Zod, rangées par champ (« city », « lines.0.label »…) :
 * le premier message de chaque champ, à afficher sous le champ (traduit par `fieldError`).
 */
export function errorsOf(schema: z.ZodType, values: unknown): Record<string, string> {
  const result = schema.safeParse(values);
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    errors[issue.path.join('.')] ??= issue.message;
  }
  return errors;
}
