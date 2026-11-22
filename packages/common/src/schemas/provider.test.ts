import { describe, expect, it } from 'vitest';
import { toProviderCard } from '../mocks/mappers';
import { buildSeed } from '../mocks/seed';
import { providerCardSchema, publicProviderProfileSchema } from './provider';

const { providers } = buildSeed(new Date('2026-11-22T12:00:00Z'));
const published = providers.filter((p) => p.status === 'published');
const [first] = published.map(toProviderCard);

describe('providerCardSchema', () => {
  it('accepte toutes les cartes des prestataires publiés', () => {
    for (const provider of published) {
      expect(() => providerCardSchema.parse(toProviderCard(provider))).not.toThrow();
    }
  });

  it('refuse une note supérieure à 5', () => {
    const result = providerCardSchema.safeParse({ ...first, ratingAverage: 6 });
    expect(result.success).toBe(false);
  });

  it('refuse un prix à virgule (les montants sont en centimes entiers)', () => {
    const result = providerCardSchema.safeParse({ ...first, priceFrom: 99.5 });
    expect(result.success).toBe(false);
  });
});

describe('publicProviderProfileSchema', () => {
  it('retire les champs internes (SIRET, motif de refus…)', () => {
    const withSiret = providers.find((p) => p.siret)!;
    const publicProfile = publicProviderProfileSchema.parse(withSiret);
    expect(publicProfile).not.toHaveProperty('siret');
    expect(publicProfile).not.toHaveProperty('onboardingStep');
  });
});
