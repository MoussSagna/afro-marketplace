import { describe, expect, it } from 'vitest';
import { draftFromEvent, emptyEventDraft, toEventInput, validateEventStep } from './eventForm';
import { missingGroups, providerGroupId } from './eventPlanning';

const today = '2026-11-27';
const filled = {
  ...emptyEventDraft(),
  type: 'wedding',
  name: 'Mariage de Aïssatou',
  date: '2027-02-10',
  city: 'Paris',
  postalCode: '75011',
  guestCount: '150',
};

describe('formulaire du planificateur (partagé site + app)', () => {
  it('étape 1 : un type est obligatoire', () => {
    expect(validateEventStep(1, emptyEventDraft(), today)).toEqual({
      type: 'Choisis un type d’événement',
    });
    expect(validateEventStep(1, filled, today)).toEqual({});
  });

  it('étape 2 : un message par champ ; date passée refusée sauf la date d’origine', () => {
    expect(
      validateEventStep(2, { ...filled, name: 'A', guestCount: '', postalCode: '750' }, today),
    ).toEqual({
      name: 'Donne un nom à ton événement (3 caractères minimum)',
      guestCount: 'Entre 1 et 5 000 invités',
      postalCode: 'Code postal à 5 chiffres',
    });
    expect(validateEventStep(2, { ...filled, date: '2026-01-01' }, today).date).toBe(
      'Choisis une date à venir',
    );
    expect(validateEventStep(2, { ...filled, date: '2026-01-01' }, today, '2026-01-01')).toEqual(
      {},
    );
  });

  it('étape 3 : budget et description facultatifs', () => {
    expect(validateEventStep(3, filled, today)).toEqual({});
  });

  it('convertit le brouillon pour l’API, et un événement en brouillon', () => {
    const input = toEventInput({ ...filled, guestCount: '80', budget: '', description: ' ' });
    expect(input).toMatchObject({ guestCount: 80, description: '' });
    expect(input).not.toHaveProperty('budget');
    const event = {
      id: 'evt-1',
      clientId: 'user-1',
      ...input,
      type: 'wedding' as const,
      description: '',
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-01T00:00:00.000Z',
    };
    expect(draftFromEvent(event)).toMatchObject({ guestCount: '80', budget: '' });
  });
});

describe('familles conseillées (« Complète ton événement »)', () => {
  const categories = [
    { id: 'cat-food', name: 'Traiteur', slug: 'traiteur', order: 1 },
    { id: 'sub-traiteur', name: 'Traiteurs', slug: 'traiteurs', parentId: 'cat-food', order: 1 },
  ];

  it('la famille d’un prestataire est celle de sa première catégorie', () => {
    expect(providerGroupId(['sub-traiteur'], categories)).toBe('cat-food');
    expect(providerGroupId(['inconnue'], categories)).toBeUndefined();
  });

  it('propose au plus 3 familles absentes, dans l’ordre d’importance', () => {
    expect(missingGroups('wedding', [])).toEqual(['cat-food', 'cat-show', 'cat-deco']);
    expect(missingGroups('wedding', ['cat-food'])).toEqual(['cat-show', 'cat-deco', 'cat-media']);
  });
});
