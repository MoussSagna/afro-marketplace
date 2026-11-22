import { describe, expect, it } from 'vitest';
import { computePriceFrom, minimumOfferingPrice } from './offering';

describe('minimumOfferingPrice', () => {
  it('renvoie le prix d’une formule fixe ou « à partir de »', () => {
    expect(minimumOfferingPrice({ isActive: true, pricingType: 'fixed', price: 50000 })).toBe(
      50000,
    );
    expect(minimumOfferingPrice({ isActive: true, pricingType: 'from', price: 30000 })).toBe(30000);
  });

  it('multiplie un prix par personne par le minimum d’invités', () => {
    expect(
      minimumOfferingPrice({
        isActive: true,
        pricingType: 'per_person',
        price: 1800,
        minGuests: 30,
      }),
    ).toBe(54000);
  });

  it('prend 1 invité si aucun minimum n’est précisé', () => {
    expect(minimumOfferingPrice({ isActive: true, pricingType: 'per_person', price: 1800 })).toBe(
      1800,
    );
  });

  it('n’a pas de prix pour une formule sur devis', () => {
    expect(minimumOfferingPrice({ isActive: true, pricingType: 'on_quote' })).toBeUndefined();
  });
});

describe('computePriceFrom', () => {
  it('prend le plus petit prix des formules actives', () => {
    expect(
      computePriceFrom([
        { isActive: true, pricingType: 'from', price: 90000 },
        { isActive: true, pricingType: 'fixed', price: 45000 },
        { isActive: false, pricingType: 'fixed', price: 1000 },
      ]),
    ).toBe(45000);
  });

  it('est vide si tout est sur devis', () => {
    expect(computePriceFrom([{ isActive: true, pricingType: 'on_quote' }])).toBeUndefined();
  });

  it('est vide sans formule', () => {
    expect(computePriceFrom([])).toBeUndefined();
  });
});
