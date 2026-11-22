import type {
  ProviderCard,
  ProviderProfile,
  PublicUser,
  Quote,
  QuoteRequest,
  QuoteRequestDetails,
  QuoteRequestSummary,
  User,
} from '../types';
import type { MockData } from './data';

/*
 * Transformations « base → réponse de l'API ».
 * Le vrai back-end fera la même chose : il ne renvoie jamais une ligne de
 * table telle quelle, il choisit ce qu'on a le droit de voir.
 */

export function toProviderCard(profile: ProviderProfile): ProviderCard {
  return {
    id: profile.id,
    slug: profile.slug,
    displayName: profile.displayName,
    coverUrl: profile.coverUrl,
    city: profile.city,
    categoryIds: profile.categoryIds,
    culturalOriginIds: profile.culturalOriginIds,
    priceFrom: profile.priceFrom,
    ratingAverage: profile.ratingAverage,
    ratingCount: profile.ratingCount,
    isProVerified: profile.isProVerified,
  };
}

/** Ce qu'on montre d'un utilisateur aux autres : prénom et initiale du nom. */
export function toPublicUser(
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl' | 'status'>,
): PublicUser {
  // Compte supprimé (RGPD) : on garde l'historique mais plus aucune information personnelle.
  if (user.status === 'deleted') {
    return { id: user.id, firstName: 'Compte supprimé', lastNameInitial: '' };
  }
  return {
    id: user.id,
    firstName: user.firstName,
    lastNameInitial: `${user.lastName.charAt(0)}.`,
    avatarUrl: user.avatarUrl,
  };
}

/**
 * Une demande de devis « prête à afficher » : le prestataire, le client,
 * le dernier devis et la conversation liée.
 */
export function toQuoteRequestSummary(data: MockData, request: QuoteRequest): QuoteRequestSummary {
  const provider = data.providers.find((p) => p.id === request.providerId)!;
  const client = data.users.find((u) => u.id === request.clientId)!;
  const quotes = data.quotes.filter((q) => q.quoteRequestId === request.id);
  const latestQuote = quotes.reduce<Quote | undefined>(
    (latest, quote) => (!latest || quote.version > latest.version ? quote : latest),
    undefined,
  );
  const conversation = data.conversations.find((c) => c.quoteRequestId === request.id)!;
  return {
    request,
    provider: toProviderCard(provider),
    client: toPublicUser(client),
    latestQuote,
    conversationId: conversation.id,
  };
}

/** Le détail d'une demande (C3 / S3) : en plus du résumé, tous les devis et la réservation. */
export function toQuoteRequestDetails(data: MockData, request: QuoteRequest): QuoteRequestDetails {
  return {
    ...toQuoteRequestSummary(data, request),
    quotes: data.quotes
      .filter((q) => q.quoteRequestId === request.id)
      .sort((a, b) => a.version - b.version),
    booking: data.bookings.find((b) => b.quoteRequestId === request.id),
  };
}
