import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { offeringInputSchema } from './catalogue';
import { moderateProviderInputSchema, updateProviderProfileInputSchema } from './provider';
import { createQuoteInputSchema } from './quote';
import { createQuoteRequestInputSchema } from './quoteRequest';
import { sendMessageInputSchema } from './messaging';
import { createReviewInputSchema } from './review';
import { updateMeInputSchema } from './user';

/** Les messages d'erreur rangés par champ, comme un formulaire les afficherait. */
function errorsOf(result: z.ZodSafeParseResult<unknown>): Record<string, string> {
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
}

describe('formulaire de demande de devis', () => {
  const valid = {
    providerId: 'prov-saveurs-de-dakar',
    clientType: 'individual',
    eventType: 'wedding',
    eventDate: '2027-06-12',
    eventCity: 'Saint-Denis',
    eventPostalCode: '93200',
    guestCount: 120,
    budgetMin: 200000,
    budgetMax: 350000,
    message: 'Bonjour, nous cherchons un traiteur sénégalais pour notre mariage.',
  };

  it('accepte une demande complète', () => {
    expect(createQuoteRequestInputSchema.safeParse(valid).success).toBe(true);
  });

  it('accepte une demande sans budget ni nombre d’invités', () => {
    const { budgetMin: _min, budgetMax: _max, guestCount: _guests, ...minimal } = valid;
    expect(createQuoteRequestInputSchema.safeParse(minimal).success).toBe(true);
  });

  it('refuse une demande sans date, avec un message clair', () => {
    const { eventDate: _date, ...withoutDate } = valid;
    expect(errorsOf(createQuoteRequestInputSchema.safeParse(withoutDate))).toEqual({
      eventDate: 'Choisis la date de l’événement',
    });
    expect(
      errorsOf(createQuoteRequestInputSchema.safeParse({ ...valid, eventDate: '' })).eventDate,
    ).toBe('Choisis la date de l’événement');
  });

  it('refuse un budget maximum inférieur au minimum', () => {
    const result = createQuoteRequestInputSchema.safeParse({ ...valid, budgetMax: 100000 });
    expect(errorsOf(result)).toEqual({
      budgetMax: 'Le budget maximum doit être supérieur au minimum',
    });
  });

  it('accepte un budget fixe (minimum = maximum)', () => {
    const result = createQuoteRequestInputSchema.safeParse({ ...valid, budgetMax: 200000 });
    expect(result.success).toBe(true);
  });

  it('refuse un message trop court, même rempli d’espaces', () => {
    const result = createQuoteRequestInputSchema.safeParse({
      ...valid,
      message: '   Bonjour           ',
    });
    expect(errorsOf(result).message).toMatch(/20 caractères minimum/);
  });

  it('refuse un code postal invalide et 0 invité', () => {
    const result = createQuoteRequestInputSchema.safeParse({
      ...valid,
      eventPostalCode: '932',
      guestCount: 0,
    });
    expect(Object.keys(errorsOf(result)).sort()).toEqual(['eventPostalCode', 'guestCount']);
  });

  it('refuse un type d’événement inconnu', () => {
    expect(createQuoteRequestInputSchema.safeParse({ ...valid, eventType: 'party' }).success).toBe(
      false,
    );
  });
});

describe('formulaire de devis', () => {
  const valid = {
    quoteRequestId: 'qr-1',
    lines: [{ label: 'Buffet 120 personnes', quantity: 120, unitPrice: 2500 }],
    depositRate: 30,
    validUntil: '2026-12-15',
  };

  it('accepte un devis avec une ligne', () => {
    expect(createQuoteInputSchema.safeParse(valid).success).toBe(true);
  });

  it('refuse un devis sans ligne', () => {
    expect(errorsOf(createQuoteInputSchema.safeParse({ ...valid, lines: [] }))).toEqual({
      lines: 'Ajoute au moins une ligne',
    });
  });

  it('refuse une quantité nulle et un prix à virgule', () => {
    const result = createQuoteInputSchema.safeParse({
      ...valid,
      lines: [{ label: 'Boissons', quantity: 0, unitPrice: 2.5 }],
    });
    expect(Object.keys(errorsOf(result)).sort()).toEqual(['lines.0.quantity', 'lines.0.unitPrice']);
  });

  it('refuse un acompte de plus de 100 %', () => {
    expect(createQuoteInputSchema.safeParse({ ...valid, depositRate: 120 }).success).toBe(false);
  });
});

describe('formulaire de formule (offre)', () => {
  const valid = {
    categoryId: 'cat-caterer',
    title: 'Buffet mariage',
    description: '',
    pricingType: 'per_person',
    price: 2500,
    minGuests: 50,
    maxGuests: 300,
    isActive: true,
  };

  it('accepte une formule par personne', () => {
    expect(offeringInputSchema.safeParse(valid).success).toBe(true);
  });

  it('exige un prix sauf « sur devis »', () => {
    const { price: _price, ...withoutPrice } = valid;
    expect(errorsOf(offeringInputSchema.safeParse(withoutPrice))).toEqual({
      price: 'Indique un prix (ou choisis « sur devis »)',
    });
    expect(
      offeringInputSchema.safeParse({ ...withoutPrice, pricingType: 'on_quote' }).success,
    ).toBe(true);
  });

  it('refuse un maximum d’invités inférieur au minimum', () => {
    expect(errorsOf(offeringInputSchema.safeParse({ ...valid, maxGuests: 20 }))).toEqual({
      maxGuests: 'Le maximum doit être supérieur ou égal au minimum',
    });
  });
});

describe('formulaire de profil prestataire', () => {
  it('accepte une sauvegarde partielle (onboarding étape par étape)', () => {
    expect(updateProviderProfileInputSchema.safeParse({ city: 'Montreuil' }).success).toBe(true);
  });

  it('nettoie les espaces du SIRET', () => {
    const result = updateProviderProfileInputSchema.parse({ siret: '123 456 789 00012' });
    expect(result.siret).toBe('12345678900012');
  });

  it('refuse un SIRET qui n’a pas 14 chiffres', () => {
    expect(errorsOf(updateProviderProfileInputSchema.safeParse({ siret: '123 456' }))).toEqual({
      siret: 'Le SIRET contient 14 chiffres',
    });
  });

  it('limite à 5 catégories', () => {
    const result = updateProviderProfileInputSchema.safeParse({
      categoryIds: ['a', 'b', 'c', 'd', 'e', 'f'],
    });
    expect(errorsOf(result).categoryIds).toBe('5 catégories maximum');
  });
});

describe('décision de modération', () => {
  it('exige un motif pour demander des corrections', () => {
    expect(
      moderateProviderInputSchema.safeParse({ decision: 'request_changes', reason: 'non' }).success,
    ).toBe(false);
    expect(
      moderateProviderInputSchema.safeParse({
        decision: 'request_changes',
        reason: 'Ajoute des photos de tes plats, s’il te plaît.',
      }).success,
    ).toBe(true);
  });

  it('valide sans motif', () => {
    expect(
      moderateProviderInputSchema.safeParse({ decision: 'validate', isProVerified: false }).success,
    ).toBe(true);
  });
});

describe('autres formulaires', () => {
  it('refuse un message vide ou fait d’espaces', () => {
    expect(sendMessageInputSchema.safeParse({ body: '   ' }).success).toBe(false);
  });

  it('refuse un avis sans note ou à 6 étoiles', () => {
    expect(createReviewInputSchema.safeParse({ bookingId: 'b', rating: 0 }).success).toBe(false);
    expect(createReviewInputSchema.safeParse({ bookingId: 'b', rating: 6 }).success).toBe(false);
    expect(createReviewInputSchema.safeParse({ bookingId: 'b', rating: 4 }).success).toBe(true);
  });

  it.each(['06 12 34 56 78', '0612345678', '+33 6 12 34 56 78', '01.23.45.67.89'])(
    'accepte le téléphone « %s »',
    (phone) => {
      const channels = { email: true, push: false, sms: false };
      const result = updateMeInputSchema.safeParse({
        firstName: 'Aïssatou',
        lastName: 'Ndiaye',
        phone,
        notificationPrefs: {
          quotes: channels,
          messages: channels,
          bookings: channels,
          marketing: channels,
        },
      });
      expect(result.success).toBe(true);
    },
  );
});
