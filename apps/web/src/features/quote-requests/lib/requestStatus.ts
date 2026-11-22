import type { QuoteRequest, QuoteRequestStatus, Side } from '@afro/common';

/** Les couleurs des pastilles de statut (tokens de la maquette). */
export type StatusTone = 'warning' | 'neutral' | 'brand' | 'success' | 'closed';

export interface StatusDisplay {
  label: string;
  tone: StatusTone;
}

const ONE_DAY_MS = 86_400_000;

/**
 * Le libellé et la couleur d'une demande, selon le côté qui la regarde.
 * « Devis reçu » pour le client devient « Devis envoyé » pour le prestataire.
 */
export function requestStatusDisplay(
  request: Pick<QuoteRequest, 'status' | 'expiresAt'>,
  side: Side,
  now: Date = new Date(),
): StatusDisplay {
  switch (request.status) {
    case 'pending': {
      const expiresInMs = new Date(request.expiresAt).getTime() - now.getTime();
      if (expiresInMs > 0 && expiresInMs <= ONE_DAY_MS) {
        return { label: 'Expire bientôt', tone: 'warning' };
      }
      return side === 'provider'
        ? { label: 'À traiter', tone: 'warning' }
        : { label: 'En attente de réponse', tone: 'neutral' };
    }
    case 'quoted':
      return { label: side === 'provider' ? 'Devis envoyé' : 'Devis reçu', tone: 'brand' };
    case 'accepted':
      return { label: 'Réservée', tone: 'success' };
    case 'declined':
      return { label: 'Déclinée', tone: 'closed' };
    case 'expired':
      return { label: 'Expirée', tone: 'closed' };
    case 'cancelled':
      return { label: 'Annulée', tone: 'closed' };
  }
}

/** Les onglets de « Mes demandes » (C2) et « Demandes reçues » (S3). */
export type RequestTab = 'open' | 'booked' | 'closed';

export function requestTab(status: QuoteRequestStatus): RequestTab {
  if (status === 'pending' || status === 'quoted') return 'open';
  if (status === 'accepted') return 'booked';
  return 'closed';
}
