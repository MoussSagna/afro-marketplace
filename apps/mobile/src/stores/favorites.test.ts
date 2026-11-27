import AsyncStorage from '@react-native-async-storage/async-storage';
import { FAVORITES_STORAGE_KEY, useFavoritesStore } from './favorites';

afterEach(() => useFavoritesStore.getState().clear());

describe('favoris (téléphone)', () => {
  it('ajoute en tête, puis retire au second toucher', () => {
    const { toggle } = useFavoritesStore.getState();
    toggle('a');
    toggle('b');
    expect(useFavoritesStore.getState().ids).toEqual(['b', 'a']);
    toggle('a');
    expect(useFavoritesStore.getState().ids).toEqual(['b']);
  });

  it('les garde sur le téléphone et les retrouve au redémarrage', async () => {
    useFavoritesStore.getState().toggle('p1');
    await new Promise((resolve) => setTimeout(resolve, 0));
    const saved = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
    expect(saved).toContain('p1');

    // L'app redémarre : le store repart vide, puis relit ce qui est sur le téléphone.
    useFavoritesStore.setState({ ids: [] });
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, saved!);
    await useFavoritesStore.persist.rehydrate();
    expect(useFavoritesStore.getState().ids).toEqual(['p1']);
  });
});
