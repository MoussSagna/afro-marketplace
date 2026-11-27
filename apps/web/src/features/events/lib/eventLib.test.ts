import { describe, expect, it } from 'vitest';
import { emptyDraft, toEventInput } from './eventDraft';
import { formatEventDay, missingGroups, plural, providerGroupId } from './eventDisplay';
import { validateStep } from './eventSteps';

const today = '2026-11-27';
const filled = {
  ...emptyDraft(),
  type: 'wedding',
  name: 'Mariage de Aïssatou',
  date: '2027-02-10',
  city: 'Paris',
  postalCode: '75011',
  guestCount: '150',
};

describe('validateStep', () => {
  it('étape 1 : un type est obligatoire', () => {
    expect(validateStep(1, emptyDraft(), today)).toEqual({ type: 'Choisis un type d’événement' });
    expect(validateStep(1, filled, today)).toEqual({});
  });

  it('étape 2 : un message par champ, avec les messages du schéma partagé', () => {
    expect(
      validateStep(2, { ...filled, name: 'A', guestCount: '', postalCode: '750' }, today),
    ).toEqual({
      name: 'Donne un nom à ton événement (3 caractères minimum)',
      guestCount: 'Entre 1 et 5 000 invités',
      postalCode: 'Code postal à 5 chiffres',
    });
    expect(validateStep(2, { ...filled, guestCount: '6000' }, today).guestCount).toBe(
      'Entre 1 et 5 000 invités',
    );
    expect(validateStep(2, { ...filled, date: '' }, today).date).toBe(
      'Choisis la date de l’événement',
    );
    expect(validateStep(2, filled, today)).toEqual({});
  });

  it('date passée refusée, sauf la date d’origine d’un événement modifié', () => {
    const past = { ...filled, date: '2026-11-01' };
    expect(validateStep(2, past, today).date).toBe('Choisis une date à venir');
    expect(validateStep(2, past, today, '2026-11-01')).toEqual({});
    expect(validateStep(2, { ...filled, date: today }, today)).toEqual({});
  });

  it('étape 3 : tout est facultatif', () => {
    expect(validateStep(3, filled, today)).toEqual({});
  });
});

describe('toEventInput', () => {
  it('convertit le nombre d’invités et retire le budget vide', () => {
    expect(toEventInput({ ...filled, name: '  Mariage  ', description: ' x ' })).toEqual({
      type: 'wedding',
      name: 'Mariage',
      date: '2027-02-10',
      city: 'Paris',
      postalCode: '75011',
      guestCount: 150,
      description: 'x',
    });
    expect(toEventInput({ ...filled, budget: 'over_20000' }).budget).toBe('over_20000');
  });
});

describe('affichage', () => {
  it('le jour de la semaine est calculé', () => {
    expect(formatEventDay('2027-02-10')).toBe('Mer. 10 févr. 2027');
    expect(formatEventDay('2027-02-13')).toBe('Sam. 13 févr. 2027');
  });

  it('familles conseillées qui manquent, 3 au plus', () => {
    expect(missingGroups('wedding', ['cat-food', 'cat-show', 'cat-deco', 'cat-media'])).toEqual([
      'cat-beauty',
      'cat-fashion',
      'cat-planning',
    ]);
    expect(missingGroups('party', ['cat-show', 'cat-food', 'cat-deco', 'cat-media'])).toEqual([]);
  });

  it('famille d’un prestataire (via sa première catégorie)', () => {
    const categories = [
      { id: 'cat-food', parentId: undefined },
      { id: 'cat-caterer', parentId: 'cat-food' },
    ] as Parameters<typeof providerGroupId>[1];
    expect(providerGroupId(['cat-caterer'], categories)).toBe('cat-food');
    expect(providerGroupId(['cat-food'], categories)).toBe('cat-food');
    expect(providerGroupId(['inconnue'], categories)).toBeUndefined();
  });

  it('pluriel', () => {
    expect(plural(1, 'invité')).toBe('1 invité');
    expect(plural(150, 'invité')).toBe('150 invités');
  });
});
