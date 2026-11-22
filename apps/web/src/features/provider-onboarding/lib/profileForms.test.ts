import { describe, expect, it } from 'vitest';
import {
  areaFormSchema,
  identityFormSchema,
  offeringDefaults,
  offeringFormSchema,
  toIdentityInput,
  toOfferingInput,
} from './profileForms';

const messages = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? [] : result.error!.issues.map((i) => i.message);

describe('formulaires du profil prestataire', () => {
  it('identité : SIRET facultatif, 14 chiffres sinon (espaces tolérés)', () => {
    const base = { displayName: 'Awa Traiteur', legalType: 'individual' as const };
    expect(identityFormSchema.safeParse({ ...base, siret: '' }).success).toBe(true);
    expect(messages(identityFormSchema.safeParse({ ...base, siret: '123' }))).toEqual([
      'Le SIRET contient 14 chiffres',
    ]);
    expect(toIdentityInput({ ...base, siret: '123 456 789 00012' })).toEqual({
      ...base,
      siret: '12345678900012',
    });
    expect(toIdentityInput({ ...base, siret: '' })).not.toHaveProperty('siret');
  });

  it('zone : code postal à 5 chiffres et rayon entre 0 et 1 000 km', () => {
    expect(
      messages(areaFormSchema.safeParse({ city: '', postalCode: '931', travelRadiusKm: '2000' })),
    ).toEqual(['Indique ta ville', 'Code postal à 5 chiffres', 'Entre 0 et 1 000 km']);
  });

  it('formule : prix exigé sauf « sur devis », en euros à la française', () => {
    const values = { ...offeringDefaults('cat-traiteur'), title: 'Buffet mariage' };
    expect(messages(offeringFormSchema.safeParse(values))).toEqual([
      'Indique un prix (ou choisis « sur devis »)',
    ]);
    expect(offeringFormSchema.safeParse({ ...values, pricingType: 'on_quote' }).success).toBe(true);

    const input = toOfferingInput({ ...values, price: '28,50', minGuests: '50', maxGuests: '' });
    expect(input).toMatchObject({ price: 2850, minGuests: 50, pricingType: 'per_person' });
    expect(input).not.toHaveProperty('maxGuests');
  });

  it('formule : le maximum d’invités ne peut pas être sous le minimum', () => {
    const values = {
      ...offeringDefaults('cat-traiteur'),
      title: 'Buffet',
      price: '10',
      minGuests: '50',
      maxGuests: '20',
    };
    expect(messages(offeringFormSchema.safeParse(values))).toEqual([
      'Le maximum doit être supérieur ou égal au minimum',
    ]);
  });
});
