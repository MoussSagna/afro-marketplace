import { DEFAULT_STORAGE_KEY, mockDb } from '@afro/common/mocks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SESSION_STORAGE_KEY, useSessionStore } from '@/stores/session';
import { prepareDemoData } from './demoData';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(async () => {
  await AsyncStorage.clear();
  mockDb.reset();
  useSessionStore.setState({ user: null, token: null });
});

describe('prepareDemoData : les données de démo survivent à la fermeture de l’app', () => {
  it('part du jeu de démo quand rien n’est sauvegardé', async () => {
    await prepareDemoData();
    expect(mockDb.data.categories.length).toBeGreaterThan(0);
  });

  it('recharge la base sauvegardée sur le téléphone', async () => {
    // Une base « modifiée pendant un essai précédent » : une catégorie renommée.
    const saved = structuredClone(mockDb.data);
    saved.categories[0]!.name = 'Catégorie modifiée';
    await AsyncStorage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(saved));

    await prepareDemoData();
    expect(mockDb.data.categories[0]!.name).toBe('Catégorie modifiée');
  });

  it('sauvegarde chaque modification de la base dans AsyncStorage', async () => {
    await prepareDemoData();
    mockDb.update((data) => {
      data.categories[0]!.name = 'Après modification';
    });
    await flush();

    const raw = await AsyncStorage.getItem(DEFAULT_STORAGE_KEY);
    expect(JSON.parse(raw!).categories[0].name).toBe('Après modification');
  });

  it('ignore une sauvegarde illisible et repart du jeu de démo', async () => {
    await AsyncStorage.setItem(DEFAULT_STORAGE_KEY, '{pas du json');
    await prepareDemoData();
    expect(mockDb.data.categories.length).toBeGreaterThan(0);
  });

  it('recharge la session (qui était connecté)', async () => {
    const user = mockDb.data.users[0]!;
    await AsyncStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ state: { user, token: `demo:${user.id}` }, version: 0 }),
    );

    await prepareDemoData();
    expect(useSessionStore.getState().token).toBe(`demo:${user.id}`);
    expect(useSessionStore.getState().user?.id).toBe(user.id);
  });
});
