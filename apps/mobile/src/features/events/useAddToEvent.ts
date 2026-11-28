import { useAddEventProvider, useEvents, type EventSummary } from '@afro/common';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useErrorText } from '@/i18n/useErrorText';

/** Le message affiché en haut du panneau après un ajout (réussi ou non). */
export type AddToEventFeedback =
  | { tone: 'success'; eventId: string; message: string }
  | { tone: 'error'; eventId: string; title: string; message?: string };

/** Où en est un événement de la liste pour ce prestataire. */
export type AddToEventState = 'available' | 'adding' | 'added';

type UseAddToEventOptions = {
  providerId: string;
  providerName: string;
  /** Un événement tout juste créé depuis la fiche (le prestataire y est déjà) : on le signale. */
  createdEventId?: string;
  /** false sans compte : rien n'est chargé. */
  enabled?: boolean;
};

/**
 * La logique de « Ajouter à un événement », à part de l'affichage (AddToEventSheet).
 * Rien de nouveau côté métier : les événements viennent de `useEvents`, l'ajout passe par
 * `useAddEventProvider` (mêmes règles et mêmes erreurs que le site et l'écran « Ajouter un prestataire »).
 * - `stateOf(summary)` : « Ajouter », « en cours » ou « Ajouté » pour chaque événement ;
 * - `addTo(summary)` : ajoute, puis donne un message de réussite ou l'erreur de l'API.
 */
export function useAddToEvent({
  providerId,
  providerName,
  createdEventId,
  enabled = true,
}: UseAddToEventOptions) {
  const { t } = useTranslation();
  const { apiError } = useErrorText();
  const events = useEvents({ enabled });
  const add = useAddEventProvider();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AddToEventFeedback | null>(null);

  // Seulement si le prestataire y est bien (le formulaire l'ajoute, mais cet ajout peut avoir échoué).
  const created = createdEventId
    ? events.data?.find((s) => s.event.id === createdEventId && s.providerIds.includes(providerId))
    : undefined;
  // L'événement créé depuis la fiche : le message de réussite, tant qu'aucun autre ajout ne l'a remplacé.
  const shownFeedback: AddToEventFeedback | null =
    feedback ??
    (created
      ? {
          tone: 'success',
          eventId: created.event.id,
          message: t('events.sheet.createdBanner', {
            event: created.event.name,
            provider: providerName,
          }),
        }
      : null);

  /** Déjà dans l'événement, ou ajouté à l'instant (avant même le rechargement de la liste). */
  function stateOf({ event, providerIds }: EventSummary): AddToEventState {
    if (addingId === event.id) return 'adding';
    if (providerIds.includes(providerId)) return 'added';
    if (feedback?.tone === 'success' && feedback.eventId === event.id) return 'added';
    return 'available';
  }

  function addTo({ event }: EventSummary) {
    if (addingId) return; // un ajout à la fois
    setAddingId(event.id);
    setFeedback(null);
    add.mutate(
      { eventId: event.id, providerId },
      {
        onSuccess: () =>
          setFeedback({
            tone: 'success',
            eventId: event.id,
            message: t('events.sheet.addedBanner', { provider: providerName, event: event.name }),
          }),
        onError: (error) =>
          setFeedback({
            tone: 'error',
            eventId: event.id,
            title: t('events.add.addFailed'),
            message: apiError(error),
          }),
        onSettled: () => setAddingId(null),
      },
    );
  }

  return { events, stateOf, addTo, feedback: shownFeedback, busy: addingId !== null };
}
