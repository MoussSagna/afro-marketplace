import type { Quote, QuoteLine } from '../types';

/** Total d'un devis en centimes : somme de quantité × prix unitaire. */
export function computeQuoteTotal(
  lines: ReadonlyArray<Pick<QuoteLine, 'quantity' | 'unitPrice'>>,
): number {
  return lines.reduce((total, line) => total + line.quantity * line.unitPrice, 0);
}

/**
 * Montant de l'acompte en centimes, arrondi au centime le plus proche.
 * computeDepositAmount(100000, 30) → 30000 (300 € sur 1 000 €).
 */
export function computeDepositAmount(totalAmount: number, depositRate: number): number {
  return Math.round((totalAmount * depositRate) / 100);
}

/** Un devis envoyé dont la date de validité est passée ne peut plus être accepté. */
export function isQuoteExpired(
  quote: Pick<Quote, 'status' | 'validUntil'>,
  today: string,
): boolean {
  return quote.status === 'sent' && quote.validUntil < today;
}

/** Le numéro de la prochaine version de devis pour une demande (1 si c'est le premier). */
export function nextQuoteVersion(existing: ReadonlyArray<Pick<Quote, 'version'>>): number {
  return existing.reduce((max, q) => Math.max(max, q.version), 0) + 1;
}
