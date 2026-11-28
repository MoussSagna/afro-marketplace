import { emptyEventDraft, type EventDraft } from '@afro/common';

// Le brouillon, sa conversion et sa validation sont partagés avec l'app mobile (@afro/common).
export { draftFromEvent, toEventInput, type EventDraft } from '@afro/common';
export const emptyDraft = emptyEventDraft;

const KEY = 'wenzee:event-draft';

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
