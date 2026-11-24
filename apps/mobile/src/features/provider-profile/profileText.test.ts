import { i18n } from '@/i18n';
import {
  cancellationLines,
  durationLabel,
  guestsLabel,
  languageName,
  offeringPrice,
  responseTimeLabel,
} from './profileText';

afterEach(async () => {
  await i18n.changeLanguage('fr');
});

describe('Textes du profil (lot M8)', () => {
  it('donne le prix d’une formule selon sa tarification', () => {
    expect(offeringPrice({ pricingType: 'from', price: 90000 })).toMatch(/^À partir de 900\s€$/);
    expect(offeringPrice({ pricingType: 'per_person', price: 2500 })).toMatch(/^25\s€ \/ pers\.$/);
    expect(offeringPrice({ pricingType: 'fixed', price: 45000 })).toMatch(/^450\s€$/);
    expect(offeringPrice({ pricingType: 'on_quote' })).toBe('Sur devis');
  });

  it('décrit les invités et la durée', () => {
    expect(guestsLabel({ minGuests: 30, maxGuests: 200 })).toBe('De 30 à 200 invités');
    expect(guestsLabel({ maxGuests: 80 })).toBe('Jusqu’à 80 invités');
    expect(guestsLabel({ minGuests: 10 })).toBe('À partir de 10 invités');
    expect(guestsLabel({})).toBeUndefined();
    expect(durationLabel(180)).toBe('3 h');
    expect(durationLabel(90)).toBe('1 h 30');
    expect(durationLabel(45)).toBe('45 min');
    expect(durationLabel(undefined)).toBeUndefined();
  });

  it('nomme les langues, même inconnues', () => {
    expect(languageName('wolof')).toBe('Wolof');
    expect(languageName('en')).toBe('Anglais');
    expect(languageName('swahili')).toBe('Swahili');
  });

  it('donne le temps de réponse en heures, puis en jours', () => {
    expect(responseTimeLabel(3.4)).toBe('environ 3 h');
    expect(responseTimeLabel(0.2)).toBe('environ 1 h');
    expect(responseTimeLabel(48)).toBe('environ 2 jours');
  });

  it('décrit la politique d’annulation, comme le site', () => {
    expect(cancellationLines('flexible')).toEqual([
      'Remboursement intégral jusqu’à 7 jours avant l’événement',
      '50 % remboursés jusqu’à 2 jours avant l’événement',
      'Aucun remboursement à moins de 2 jours',
    ]);
  });

  it('parle anglais quand l’app est en anglais', async () => {
    await i18n.changeLanguage('en');
    expect(offeringPrice({ pricingType: 'per_person', price: 2500 })).toBe('€25 / person');
    expect(languageName('en')).toBe('English');
    expect(cancellationLines('strict')[0]).toBe('Full refund up to 60 days before the event');
  });
});
