/** Les formats déjà créés, par langue (« fr-FR », « en-GB ») : Intl coûte cher à créer. */
const formatters = new Map<string, { whole: Intl.NumberFormat; cents: Intl.NumberFormat }>();

function formattersFor(locale: string) {
  let found = formatters.get(locale);
  if (!found) {
    found = {
      whole: new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }),
      cents: new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
      }),
    };
    formatters.set(locale, found);
  }
  return found;
}

/**
 * Formate un montant en centimes pour l'affichage.
 * formatPrice(90000) → « 900 € » ; formatPrice(1250) → « 12,50 € ».
 * Attention : Intl sépare les milliers et le symbole € par des espaces insécables.
 * En anglais (app mobile) : formatPrice(1250, 'en-GB') → « €12.50 ».
 */
export function formatPrice(amountInCents: number, locale = 'fr-FR'): string {
  const { whole, cents } = formattersFor(locale);
  const formatter = amountInCents % 100 === 0 ? whole : cents;
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
