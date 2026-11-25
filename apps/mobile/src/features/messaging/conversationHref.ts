import type { Href } from 'expo-router';

/** L'adresse d'une conversation (« /conversations/conv-12 »), ouverte par-dessus les onglets. */
export function conversationHref(conversationId: string): Href {
  return { pathname: '/conversations/[id]', params: { id: conversationId } };
}
