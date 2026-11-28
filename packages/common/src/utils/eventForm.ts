import { eventInputSchema, eventMessages } from '../schemas/event';
import type { EventInput, PlannedEvent } from '../types';

/*
 * Le formulaire du planificateur d'événements (création ET modification, 3 étapes), partagé
 * par le site et l'app. Les champs sont du texte (comme dans un champ de saisie) ; `toEventInput`
 * les convertit pour l'API. Les messages sont ceux du schéma (traduits dans l'app via errorKeyOf).
 */

/** Les champs du formulaire, en texte. */
export interface EventDraft {
  type: string;
  name: string;
  date: string;
  city: string;
  postalCode: string;
  guestCount: string;
  budget: string;
  description: string;
}

export const emptyEventDraft = (): EventDraft => ({
  type: '',
  name: '',
  date: '',
  city: '',
  postalCode: '',
  guestCount: '',
  budget: '',
  description: '',
});

/** Un événement existant, prêt à être modifié. */
export function draftFromEvent(event: PlannedEvent): EventDraft {
  return {
    type: event.type,
    name: event.name,
    date: event.date,
    city: event.city,
    postalCode: event.postalCode,
    guestCount: String(event.guestCount),
    budget: event.budget ?? '',
    description: event.description,
  };
}

/** Le brouillon converti pour l'API (nombre d'invités en nombre, champs vides retirés). */
export function toEventInput(draft: EventDraft): EventInput {
  return {
    type: draft.type as EventInput['type'],
    name: draft.name.trim(),
    date: draft.date,
    city: draft.city.trim(),
    postalCode: draft.postalCode.trim(),
    guestCount: draft.guestCount.trim() === '' ? Number.NaN : Number(draft.guestCount),
    ...(draft.budget && { budget: draft.budget as EventInput['budget'] }),
    description: draft.description.trim(),
  };
}

/** Les champs de chacune des 3 étapes : Type, Informations, Détails. */
export const EVENT_STEP_FIELDS = [
  ['type'],
  ['name', 'date', 'city', 'postalCode', 'guestCount'],
  ['budget', 'description'],
] as const;

export type EventField = (typeof EVENT_STEP_FIELDS)[number][number];
export type EventErrors = Partial<Record<EventField, string>>;

/**
 * Valide une étape (1 à 3) avec le schéma partagé (mêmes messages que l'API) ; `today` pour refuser
 * une date passée (sauf `keepDate` : la date d'origine d'un événement modifié, comme l'API).
 * Renvoie le premier message de chaque champ en erreur.
 */
export function validateEventStep(
  step: number,
  draft: EventDraft,
  today: string,
  keepDate?: string,
): EventErrors {
  const fields = EVENT_STEP_FIELDS[step - 1] ?? [];
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
