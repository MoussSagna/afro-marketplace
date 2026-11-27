import { eventInputSchema, eventMessages } from '@afro/common';
import { toEventInput, type EventDraft } from './eventDraft';

/** Les 3 étapes du formulaire et leurs champs. */
export const EVENT_STEPS = [
  { label: 'Type', fields: ['type'] },
  { label: 'Informations', fields: ['name', 'date', 'city', 'postalCode', 'guestCount'] },
  { label: 'Détails', fields: ['budget', 'description'] },
] as const;

export type EventField = (typeof EVENT_STEPS)[number]['fields'][number];
export type EventErrors = Partial<Record<EventField, string>>;

/**
 * Valide une étape avec le schéma partagé (mêmes messages que l'API) ; `today` pour refuser
 * une date passée (sauf `keepDate` : la date d'origine d'un événement modifié, comme l'API).
 * Renvoie le premier message de chaque champ en erreur.
 */
export function validateStep(
  step: number,
  draft: EventDraft,
  today: string,
  keepDate?: string,
): EventErrors {
  const fields = EVENT_STEPS[step - 1]?.fields ?? [];
  const mask = Object.fromEntries(fields.map((f) => [f, true])) as Record<EventField, true>;
  const result = eventInputSchema.pick(mask).safeParse(toEventInput(draft));
  const errors: EventErrors = {};
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0] as EventField;
      errors[field] ??= issue.message;
    }
  }
  if (step === 2 && !errors.date && draft.date && draft.date < today && draft.date !== keepDate) {
    errors.date = eventMessages.dateInPast;
  }
  return errors;
}
