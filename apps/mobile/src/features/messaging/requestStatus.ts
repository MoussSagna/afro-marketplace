import type { QuoteRequest, Side } from '@afro/common';
import i18n from 'i18next';

/** La couleur du badge : les variantes de <Badge>. */
export type StatusTone = 'warning' | 'muted' | 'sun' | 'success';

const ONE_DAY_MS = 86_400_000;

/**
 * Le badge d'une demande (mêmes règles que le site) : son libellé, traduit, et sa couleur.
 * « Devis reçu » pour le client devient « Devis envoyé » pour le prestataire.
 */
export function requestStatus(
  request: Pick<QuoteRequest, 'status' | 'expiresAt'>,
  side: Side,
  now: Date = new Date(),
): { label: string; tone: StatusTone } {
  switch (request.status) {
    case 'pending': {
      const left = new Date(request.expiresAt).getTime() - now.getTime();
      if (left > 0 && left <= ONE_DAY_MS)
        return { label: i18n.t('requestStatus.expiringSoon'), tone: 'warning' };
      return side === 'provider'
        ? { label: i18n.t('requestStatus.toHandle'), tone: 'warning' }
        : { label: i18n.t('requestStatus.waiting'), tone: 'muted' };
    }
    case 'quoted':
      return {
        label: i18n.t(
          side === 'provider' ? 'requestStatus.quoteSent' : 'requestStatus.quoteReceived',
        ),
        tone: 'sun',
      };
    case 'accepted':
      return { label: i18n.t('requestStatus.accepted'), tone: 'success' };
    case 'declined':
      return { label: i18n.t('requestStatus.declined'), tone: 'muted' };
    case 'expired':
      return { label: i18n.t('requestStatus.expired'), tone: 'muted' };
    case 'cancelled':
      return { label: i18n.t('requestStatus.cancelled'), tone: 'muted' };
  }
}
