import { describe, expect, it } from 'vitest';
import {
  emptyQuoteRequestForm,
  quoteRequestFormSchema,
  toCreateQuoteRequestInput,
  type QuoteRequestFormValues,
} from './requestForm';

const filled: QuoteRequestFormValues = {
  ...emptyQuoteRequestForm,
  eventType: 'wedding',
  eventDate: '2027-06-12',
  eventCity: ' Créteil ',
  eventPostalCode: '94000',
  guestCount: '150',
  budgetMin: '3000',
  budgetMax: '4500',
  message: 'Bonjour, nous cherchons un traiteur pour notre mariage.',
};

const errorsOf = (values: QuoteRequestFormValues) => {
  const result = quoteRequestFormSchema.safeParse(values);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]));
};

describe('formulaire de demande de devis', () => {
  it('donne un message clair pour chaque champ obligatoire vide', () => {
    expect(errorsOf(emptyQuoteRequestForm)).toEqual({
      eventType: 'Choisis le type d’événement',
      eventDate: 'Choisis la date de l’événement',
      eventCity: 'Indique la ville de l’événement',
      eventPostalCode: 'Code postal à 5 chiffres',
      message: 'Décris ton besoin en quelques phrases (20 caractères minimum)',
    });
  });

  it('refuse un budget maximum inférieur au minimum', () => {
    expect(errorsOf({ ...filled, budgetMin: '5000', budgetMax: '4000' })).toEqual({
      budgetMax: 'Le budget maximum doit être supérieur au minimum',
    });
  });

  it('refuse un nombre d’invités qui n’est pas un entier', () => {
    expect(errorsOf({ ...filled, guestCount: '12,5' })).toEqual({
      guestCount: 'Indique un nombre entier',
    });
  });

  it('convertit la saisie : nombres, euros → centimes, champs vides ignorés', () => {
    expect(errorsOf(filled)).toEqual({});
    expect(toCreateQuoteRequestInput(filled, { providerId: 'prov-1' })).toEqual({
      providerId: 'prov-1',
      clientType: 'individual',
      eventType: 'wedding',
      eventDate: '2027-06-12',
      eventCity: 'Créteil',
      eventPostalCode: '94000',
      guestCount: 150,
      budgetMin: 300000,
      budgetMax: 450000,
      message: 'Bonjour, nous cherchons un traiteur pour notre mariage.',
    });
    const minimal = toCreateQuoteRequestInput(
      { ...filled, guestCount: '', budgetMin: '', budgetMax: '' },
      { providerId: 'prov-1' },
    );
    expect(minimal.guestCount).toBeUndefined();
    expect(minimal.budgetMax).toBeUndefined();
  });
});
