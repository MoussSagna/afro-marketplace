import { describe, expect, it } from 'vitest';
import { useFavoritesStore } from './favorites';

describe('favoris', () => {
  it('ajoute puis retire un prestataire', () => {
    const { toggle } = useFavoritesStore.getState();

    toggle('prov-a');
    toggle('prov-b');
    expect(useFavoritesStore.getState().ids).toEqual(['prov-b', 'prov-a']);

    toggle('prov-a');
    expect(useFavoritesStore.getState().ids).toEqual(['prov-b']);
  });

  it('garde les favoris dans le navigateur', () => {
    useFavoritesStore.getState().toggle('prov-a');

    const saved = JSON.parse(localStorage.getItem('afro-marketplace:favorites') ?? '{}');
    expect(saved.state.ids).toEqual(['prov-a']);
  });
});
