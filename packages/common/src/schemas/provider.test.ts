import { describe, expect, it } from 'vitest';
import { seedProviders } from '../mocks/seed';
import { providerCardSchema } from './provider';

describe('providerCardSchema', () => {
  it('accepte toutes les données mockées', () => {
    for (const provider of seedProviders) {
      expect(() => providerCardSchema.parse(provider)).not.toThrow();
    }
  });

  it('refuse une note supérieure à 5', () => {
    const [first] = seedProviders;
    const result = providerCardSchema.safeParse({ ...first, ratingAverage: 6 });
    expect(result.success).toBe(false);
  });

  it('refuse un prix à virgule (les montants sont en centimes entiers)', () => {
    const [first] = seedProviders;
    const result = providerCardSchema.safeParse({ ...first, priceFrom: 99.5 });
    expect(result.success).toBe(false);
  });
});
