import { mockDb } from '@afro/common/mocks';
import { describe, expect, it } from 'vitest';
import {
  formatShortDate,
  nextStep,
  normalize,
  quickDates,
  searchUrl,
  suggestCategories,
  suggestCities,
  upcomingSaturday,
} from './searchDraft';

const empty = { category: '', whatText: '', city: '', date: '' };

describe('searchUrl', () => {
  it('sans critère : toutes les annonces', () => {
    expect(searchUrl(empty)).toBe('/recherche');
  });

  it('catégorie, ville et date passent dans l’adresse', () => {
    expect(
      searchUrl({ ...empty, category: 'traiteurs', city: ' Paris ', date: '2027-06-12' }),
    ).toBe('/recherche?categorie=traiteurs&ville=Paris&date=2027-06-12');
  });

  it('un texte tapé sans choisir de catégorie devient une recherche libre', () => {
    expect(searchUrl({ ...empty, whatText: 'mafé' })).toBe('/recherche?q=maf%C3%A9');
    // Une catégorie choisie l'emporte sur le texte.
    expect(searchUrl({ ...empty, category: 'dj', whatText: 'mafé' })).toBe(
      '/recherche?categorie=dj',
    );
  });
});

describe('suggestCategories', () => {
  const categories = mockDb.data.categories;

  it('sans texte : les 8 grandes catégories', () => {
    const suggestions = suggestCategories(categories, '');
    expect(suggestions).toHaveLength(8);
    expect(suggestions.every((s) => s.groupName === '')).toBe(true);
  });

  it('avec un texte : les noms qui commencent par ce texte d’abord, accents ignorés', () => {
    const suggestions = suggestCategories(categories, 'trait');
    expect(suggestions[0]?.name.toLowerCase().startsWith('trait')).toBe(true);
    expect(suggestCategories(categories, 'beaute').map((s) => s.slug)).toContain('beaute-soins');
  });

  it('une sous-catégorie donne le nom de sa grande catégorie', () => {
    const coiffure = suggestCategories(categories, 'coiffure').find((s) => s.slug === 'coiffure');
    expect(coiffure).toMatchObject({ groupName: 'Beauté & soins', groupSlug: 'beaute-soins' });
  });

  it('rien ne correspond : liste vide', () => {
    expect(suggestCategories(categories, 'zzzz')).toEqual([]);
  });
});

describe('suggestCities', () => {
  it('sans texte : les villes populaires ; avec un texte : filtrées, accents ignorés', () => {
    expect(suggestCities('')[0]?.name).toBe('Paris');
    expect(suggestCities('evry').map((c) => c.name)).toEqual(['Évry-Courcouronnes']);
  });
});

describe('dates rapides', () => {
  it('le samedi qui vient (le jour même si on est samedi)', () => {
    expect(upcomingSaturday(new Date(2026, 10, 26))).toBe('2026-11-28'); // jeudi → samedi
    expect(upcomingSaturday(new Date(2026, 10, 28))).toBe('2026-11-28'); // samedi
    expect(upcomingSaturday(new Date(2026, 10, 26), 1)).toBe('2026-12-05');
  });

  it('propose ce samedi, samedi prochain et dans un mois', () => {
    expect(quickDates(new Date(2026, 10, 26))).toEqual([
      { label: 'Ce samedi', date: '2026-11-28' },
      { label: 'Samedi prochain', date: '2026-12-05' },
      { label: 'Dans un mois', date: '2026-12-26' },
    ]);
  });

  it('affiche une date courte en français', () => {
    expect(formatShortDate('2027-06-12')).toBe('sam. 12 juin');
  });
});

describe('outils', () => {
  it('nextStep : Quoi → Où → Quand → fin', () => {
    expect(nextStep('what')).toBe('where');
    expect(nextStep('where')).toBe('when');
    expect(nextStep('when')).toBeNull();
  });

  it('normalize : minuscules sans accents', () => {
    expect(normalize('  Évry ')).toBe('evry');
  });
});
