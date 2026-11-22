import type { Offering } from '../types';

type PricedOffering = Pick<Offering, 'isActive' | 'pricingType' | 'price' | 'minGuests'>;

/**
 * Le prix minimum à payer pour une formule, en centimes.
 * - « sur devis » : pas de prix ;
 * - « par personne » : prix × nombre minimum d'invités (1 si non précisé) ;
 * - « fixe » ou « à partir de » : le prix tel quel.
 */
export function minimumOfferingPrice(offering: PricedOffering): number | undefined {
  if (offering.pricingType === 'on_quote' || offering.price === undefined) return undefined;
  if (offering.pricingType === 'per_person') return offering.price * (offering.minGuests ?? 1);
  return offering.price;
}

/**
 * Le prix « à partir de » d'un prestataire : le plus petit prix minimum parmi
 * ses formules ACTIVES. `undefined` si tout est « sur devis ».
 * Recalculé à chaque modification des formules ; sert au filtre budget.
 */
export function computePriceFrom(offerings: ReadonlyArray<PricedOffering>): number | undefined {
  const prices = offerings
    .filter((o) => o.isActive)
    .map(minimumOfferingPrice)
    .filter((price): price is number => price !== undefined);
  return prices.length > 0 ? Math.min(...prices) : undefined;
}
