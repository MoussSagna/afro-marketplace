import { describe, expect, it } from 'vitest';
import { samePrefs } from './accountForm';
import { accountSectionFrom, accountSectionHref, initialsOf, memberSince } from './accountSections';

const channels = (email: boolean) => ({ email, push: false, sms: false });
const prefs = {
  quotes: channels(true),
  messages: channels(true),
  bookings: channels(true),
  marketing: channels(false),
};

describe('rubriques de « Mon compte »', () => {
  it('lit la rubrique de l’adresse, et revient à la première si elle est inconnue ou absente', () => {
    expect(accountSectionFrom('securite').id).toBe('securite');
    expect(accountSectionFrom(null).id).toBe('informations');
    expect(accountSectionFrom('SECURITE').id).toBe('informations');
  });

  it('construit l’adresse d’une rubrique (la première sans paramètre)', () => {
    expect(accountSectionHref('informations')).toBe('/espace/compte');
    expect(accountSectionHref('notifications')).toBe('/espace/compte?rubrique=notifications');
  });

  it('écrit « Membre depuis » en UTC, et les initiales en majuscules', () => {
    expect(memberSince('2025-03-01T00:30:00.000Z')).toBe('Membre depuis mars 2025');
    expect(memberSince('2025-02-28T23:30:00.000Z')).toBe('Membre depuis février 2025');
    expect(initialsOf('aïssatou', 'ndiaye')).toBe('AN');
  });
});

describe('samePrefs', () => {
  it('compare les préférences canal par canal', () => {
    expect(samePrefs(prefs, structuredClone(prefs))).toBe(true);
    expect(samePrefs(prefs, { ...prefs, marketing: { ...prefs.marketing, sms: true } })).toBe(
      false,
    );
  });
});
