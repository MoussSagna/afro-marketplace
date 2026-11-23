import { mockDb } from '@afro/common/mocks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SESSION_STORAGE_KEY, useSessionStore } from './session';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(async () => {
  useSessionStore.getState().signOut();
  await AsyncStorage.clear();
});

describe('useSessionStore', () => {
  const user = mockDb.data.users[0]!;

  it('connecte puis déconnecte', () => {
    useSessionStore.getState().signIn({ user, token: `demo:${user.id}` });
    expect(useSessionStore.getState()).toMatchObject({ user, token: `demo:${user.id}` });

    useSessionStore.getState().signOut();
    expect(useSessionStore.getState()).toMatchObject({ user: null, token: null });
  });

  it('garde la session dans AsyncStorage', async () => {
    useSessionStore.getState().signIn({ user, token: `demo:${user.id}` });
    await flush();

    const saved = JSON.parse((await AsyncStorage.getItem(SESSION_STORAGE_KEY))!);
    expect(saved.state.token).toBe(`demo:${user.id}`);
  });

  it("met à jour l'utilisateur connecté", () => {
    useSessionStore.getState().signIn({ user, token: `demo:${user.id}` });
    useSessionStore.getState().setUser({ ...user, firstName: 'Nouveau' });
    expect(useSessionStore.getState().user?.firstName).toBe('Nouveau');
  });
});
