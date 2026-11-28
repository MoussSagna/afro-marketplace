import type { ConversationSummary, QuoteRequestSummary, Side } from '@afro/common';
import { clientName } from '../pro/clientName';

/** Les trois pastilles au-dessus de la liste. */
export const CONVERSATION_FILTERS = ['all', 'unread', 'quotes'] as const;
export type ConversationFilter = (typeof CONVERSATION_FILTERS)[number];

/**
 * Une ligne de la liste, prête à afficher : la conversation (inchangée) et ce qu'on sait
 * en plus grâce à sa demande de devis (photo, catégorie, badge « vérifié », devis reçu).
 */
export type ConversationEntry = {
  summary: ConversationSummary;
  /** Le prestataire (côté client) ou le client (côté prestataire). */
  name: string;
  /** Sous le nom : la catégorie du prestataire (client) ou le type d'événement (prestataire). */
  subtitle?: string;
  /** La photo de la personne, sinon celle du prestataire ; absente → initiales. */
  avatarUrl?: string;
  /** Badge « vérifié » : seulement pour un prestataire vérifié, vu côté client. */
  verified: boolean;
  /** Un devis a été envoyé dans cette conversation (pastille « Devis »). */
  hasQuote: boolean;
};

type Labels = {
  /** « Traiteur & boissons » à partir des catégories du prestataire. */
  category(categoryIds: string[]): string | undefined;
  /** « Mariage » à partir du type d'événement de la demande. */
  eventType(eventType: QuoteRequestSummary['request']['eventType']): string;
};

/**
 * Croise les conversations avec les demandes de devis (une conversation par demande) :
 * aucune nouvelle requête, seulement les deux listes que l'app charge déjà.
 * L'ordre reste celui des conversations (la plus récente d'abord).
 */
export function buildConversationEntries(
  conversations: readonly ConversationSummary[],
  requests: readonly QuoteRequestSummary[] | undefined,
  side: Side,
  labels: Labels,
): ConversationEntry[] {
  const byConversation = new Map(requests?.map((r) => [r.conversationId, r]));
  return conversations.map((summary) => {
    const request = byConversation.get(summary.conversation.id);
    const isClient = side === 'client';
    return {
      summary,
      name: isClient ? summary.providerName : clientName(summary.otherParticipant),
      subtitle: request
        ? isClient
          ? labels.category(request.provider.categoryIds)
          : labels.eventType(request.request.eventType)
        : undefined,
      avatarUrl:
        summary.otherParticipant.avatarUrl ?? (isClient ? request?.provider.coverUrl : undefined),
      verified: isClient && (request?.provider.isProVerified ?? false),
      hasQuote: Boolean(request?.latestQuote),
    };
  });
}

/** Le texte sans accents ni majuscules : « Créoles » se trouve en tapant « creoles ». */
export function searchable(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** La pastille choisie : toutes, celles qui ont des non-lus, ou celles où un devis a été envoyé. */
export function matchesFilter(entry: ConversationEntry, filter: ConversationFilter): boolean {
  if (filter === 'unread') return entry.summary.unreadCount > 0;
  if (filter === 'quotes') return entry.hasQuote;
  return true;
}

/** La recherche : sur le nom, et sur la catégorie (« traiteur » trouve Saveurs de Dakar). */
export function matchesQuery(entry: ConversationEntry, query: string): boolean {
  const wanted = searchable(query);
  if (!wanted) return true;
  return searchable(`${entry.name} ${entry.subtitle ?? ''}`).includes(wanted);
}

/** Les conversations à montrer, pour une pastille et une recherche. */
export function visibleConversations(
  entries: readonly ConversationEntry[],
  filter: ConversationFilter,
  query: string,
): ConversationEntry[] {
  return entries.filter((e) => matchesFilter(e, filter) && matchesQuery(e, query));
}

/** Le nombre de conversations derrière chaque pastille (« Non lus (2) »). */
export function conversationCounts(
  entries: readonly ConversationEntry[],
): Record<ConversationFilter, number> {
  return {
    all: entries.length,
    unread: entries.filter((e) => matchesFilter(e, 'unread')).length,
    quotes: entries.filter((e) => matchesFilter(e, 'quotes')).length,
  };
}
