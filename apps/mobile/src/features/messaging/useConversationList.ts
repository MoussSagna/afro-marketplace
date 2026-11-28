import { useCategories, useConversations, useQuoteRequests, type Side } from '@afro/common';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCategoryName } from '@/i18n/useCategoryName';
import { mainCategoryOf } from '../search/providerLabels';
import { buildConversationEntries } from './conversationList';

/**
 * Les conversations de l'onglet Messages, enrichies pour la liste (photo, catégorie, badge, devis).
 * Rien de nouveau côté données : les conversations (rafraîchies toutes les 7 s), les demandes de devis
 * et les catégories, trois requêtes que l'app utilise déjà ailleurs (même cache TanStack Query).
 */
export function useConversationList(side: Side) {
  const { t } = useTranslation();
  const conversations = useConversations(side);
  const requests = useQuoteRequests(side);
  const categories = useCategories();
  const categoryName = useCategoryName();

  const entries = useMemo(
    () =>
      buildConversationEntries(conversations.data ?? [], requests.data, side, {
        category: (ids) => {
          const category = mainCategoryOf(ids, categories.data);
          return category ? categoryName(category) : undefined;
        },
        eventType: (type) => t(`eventTypes.${type}`),
      }),
    [conversations.data, requests.data, categories.data, side, categoryName, t],
  );

  return {
    entries,
    // On attend aussi les demandes (sauf si elles échouent) : la liste s'affiche d'un coup, sans sauter.
    isPending: conversations.isPending || (requests.isPending && !requests.isError),
    // Sans les demandes, la liste reste utilisable (sans photo ni catégorie) : seule l'erreur
    // des conversations bloque l'écran.
    isError: conversations.isError,
    isRefetching: conversations.isRefetching,
    refetch: () => Promise.all([conversations.refetch(), requests.refetch()]),
  };
}
