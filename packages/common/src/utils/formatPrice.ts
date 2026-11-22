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

/**
 * Le prix d'une formule tel qu'on l'affiche, selon sa façon d'être tarifée.
 * formatOfferingPrice({ pricingType: 'per_person', price: 2800 }) → « 28 € / personne ».
 */
export function formatOfferingPrice(offering: {
  pricingType: 'from' | 'fixed' | 'per_person' | 'on_quote';
  price?: number;
}): string {
  if (offering.pricingType === 'on_quote' || offering.price === undefined) return 'Sur devis';
  const price = formatPrice(offering.price);
  if (offering.pricingType === 'from') return `À partir de ${price}`;
  if (offering.pricingType === 'per_person') return `${price} / personne`;
  return price;
}
