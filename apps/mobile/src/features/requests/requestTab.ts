import type { QuoteRequestStatus } from '@afro/common';

/** Les onglets de « Mes demandes » (C2), comme sur le site. */
export const REQUEST_TABS = ['open', 'booked', 'closed'] as const;
export type RequestTab = (typeof REQUEST_TABS)[number];

/** L'onglet d'une demande : en cours (en attente, devis reçu), réservée, ou terminée. */
export function requestTab(status: QuoteRequestStatus): RequestTab {
  if (status === 'pending' || status === 'quoted') return 'open';
  if (status === 'accepted') return 'booked';
  return 'closed';
}
