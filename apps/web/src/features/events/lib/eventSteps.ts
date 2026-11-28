import {
  validateEventStep,
  type EventDraft,
  type EventErrors,
  type EventField,
} from '@afro/common';

/** Les 3 étapes du formulaire et leurs champs (la validation est partagée : @afro/common). */
export const EVENT_STEPS = [
  { label: 'Type', fields: ['type'] },
  { label: 'Informations', fields: ['name', 'date', 'city', 'postalCode', 'guestCount'] },
  { label: 'Détails', fields: ['budget', 'description'] },
] as const;

export type { EventErrors, EventField };

/** Valide une étape (voir `validateEventStep` dans @afro/common). */
export const validateStep = (step: number, draft: EventDraft, today: string, keepDate?: string) =>
  validateEventStep(step, draft, today, keepDate);
