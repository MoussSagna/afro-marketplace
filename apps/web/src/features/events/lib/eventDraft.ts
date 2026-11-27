import type { EventInput, PlannedEvent } from '@afro/common';

/** Les champs du formulaire, en texte (comme dans les champs HTML). */
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

const KEY = 'wenzee:event-draft';

export const emptyDraft = (): EventDraft => ({
  type: '',
  name: '',
  date: '',
  city: '',
  postalCode: '',
  guestCount: '',
  budget: '',
  description: '',
});

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

/**
 * Le brouillon garde les valeurs d'une étape à l'autre (et après un rechargement) :
 * « Précédent » ne fait rien perdre. Une clé par formulaire (création, ou modification d'un événement).
 */
export function loadDraft(scope: string): EventDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    const saved = raw ? (JSON.parse(raw) as { scope: string; draft: EventDraft }) : null;
    return saved?.scope === scope ? { ...emptyDraft(), ...saved.draft } : null;
  } catch {
    return null;
  }
}

export function saveDraft(scope: string, draft: EventDraft) {
  sessionStorage.setItem(KEY, JSON.stringify({ scope, draft }));
}

export function clearDraft() {
  sessionStorage.removeItem(KEY);
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
