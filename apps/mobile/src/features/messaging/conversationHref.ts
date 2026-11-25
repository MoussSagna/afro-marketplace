import type { Side } from '@afro/common';
import type { Href } from 'expo-router';

/**
 * L'adresse d'une conversation, ouverte par-dessus les onglets :
 * « /conversations/conv-12 » côté client, « /pro/conversations/conv-12 » côté prestataire.
 */
export function conversationHref(conversationId: string, side: Side = 'client'): Href {
  return side === 'provider'
    ? { pathname: '/pro/conversations/[id]', params: { id: conversationId } }
    : { pathname: '/conversations/[id]', params: { id: conversationId } };
}
