import type { Side } from '@afro/common';
import type { Href } from 'expo-router';

/**
 * L'adresse du détail d'une demande, ouvert par-dessus les onglets :
 * « /demande/qr-12 » côté client, « /pro/demande/qr-12 » côté prestataire.
 */
export function requestHref(requestId: string, side: Side = 'client'): Href {
  return side === 'provider'
    ? { pathname: '/pro/demande/[id]', params: { id: requestId } }
    : { pathname: '/demande/[id]', params: { id: requestId } };
}
