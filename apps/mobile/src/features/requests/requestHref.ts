import type { Href } from 'expo-router';

/** L'adresse du détail d'une demande (« /demande/qr-12 »), ouvert par-dessus les onglets. */
export function requestHref(requestId: string): Href {
  return { pathname: '/demande/[id]', params: { id: requestId } };
}
