import { maskContactDetails, shouldMaskContactDetails } from '../rules/contactMasking';
import { computeQuoteRequestExpiresAt, shouldExpireQuoteRequest } from '../rules/quoteRequest';
import type { Conversation, Message, MessageKind, QuoteRequest } from '../types';
import type { MockDb } from './db';

/*
 * Les opérations de la base mockée autour des demandes et des conversations.
 * Elles sont partagées par les handlers « demandes » et « messagerie » :
 * c'est ici que vivent les effets de bord (compteurs de non-lus, masquage…).
 */

/** De quel côté de la conversation est cet utilisateur ? (undefined : il n'en fait pas partie) */
export function conversationSide(
  conversation: Conversation,
  userId: string,
): 'client' | 'provider' | undefined {
  if (conversation.clientId === userId) return 'client';
  if (conversation.providerUserId === userId) return 'provider';
  return undefined;
}

/**
 * Ajoute un message dans une conversation.
 * - Règle n° 7 : les téléphones et emails sont masqués tant qu'il n'y a pas
 *   de réservation confirmée.
 * - Le compteur de non-lus de l'AUTRE personne augmente (pas pour les messages système,
 *   qui ne sont écrits par personne).
 */
export function postMessage(
  db: MockDb,
  conversation: Conversation,
  senderId: string,
  body: string,
  kind: MessageKind = 'text',
): Message {
  const now = db.now().toISOString();
  const booking = db.data.bookings.find((b) => b.quoteRequestId === conversation.quoteRequestId);
  const masked =
    kind === 'text' && shouldMaskContactDetails(booking?.status)
      ? maskContactDetails(body)
      : { text: body, hasMaskedContent: false };

  const message: Message = {
    id: db.newId('msg'),
    conversationId: conversation.id,
    senderId,
    kind,
    body: masked.text,
    hasMaskedContent: masked.hasMaskedContent,
    createdAt: now,
    updatedAt: now,
  };
  db.data.messages.push(message);

  conversation.lastMessageAt = now;
  conversation.updatedAt = now;
  if (kind !== 'system') {
    if (senderId === conversation.clientId) conversation.unreadCountProvider += 1;
    else conversation.unreadCountClient += 1;
  } else {
    // Un message système concerne les deux : chacun le verra comme nouveau.
    conversation.unreadCountClient += 1;
    conversation.unreadCountProvider += 1;
  }
  return message;
}

/**
 * Expiration automatique des demandes sans réponse (7 jours).
 * Le vrai back-end le fera avec une tâche planifiée ; ici, on vérifie
 * à chaque lecture des demandes, ce qui revient au même pour l'utilisateur.
 */
export function expireStaleQuoteRequests(db: MockDb): void {
  const now = db.now();
  let changed = false;
  for (const request of db.data.quoteRequests) {
    if (!shouldExpireQuoteRequest(request, now)) continue;
    request.status = 'expired';
    request.updatedAt = now.toISOString();
    const conversation = db.data.conversations.find((c) => c.quoteRequestId === request.id);
    if (conversation) {
      postMessage(
        db,
        conversation,
        conversation.providerUserId,
        'Demande expirée : le prestataire n’a pas répondu sous 7 jours.',
        'system',
      );
    }
    changed = true;
  }
  if (changed) db.save();
}

/**
 * Quand le prestataire répond à une demande encore « pending » (une question,
 * par exemple), le délai de 7 jours repart de zéro : il est actif, la demande
 * ne doit pas expirer pendant qu'il échange avec le client.
 */
export function extendQuoteRequestOnProviderReply(request: QuoteRequest, now: Date): void {
  if (request.status === 'pending') {
    request.expiresAt = computeQuoteRequestExpiresAt(now);
  }
}

/** Les demandes terminées ferment la conversation : on ne peut plus écrire. */
export function isConversationClosed(request: QuoteRequest): boolean {
  return ['declined', 'expired', 'cancelled'].includes(request.status);
}
