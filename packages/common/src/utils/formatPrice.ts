const wholeEuros = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const eurosAndCents = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

/**
 * Formate un montant en centimes pour l'affichage.
 * formatPrice(90000) → « 900 € » ; formatPrice(1250) → « 12,50 € ».
 * Attention : Intl sépare les milliers et le symbole € par des espaces insécables.
 */
export function formatPrice(amountInCents: number): string {
  const formatter = amountInCents % 100 === 0 ? wholeEuros : eurosAndCents;
  return formatter.format(amountInCents / 100);
}
