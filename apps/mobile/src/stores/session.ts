import type { Session, User } from '@afro/common';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SessionState {
  user: User | null;
  token: string | null;
  signIn(session: Session): void;
  signOut(): void;
  /** Met à jour l'utilisateur connecté (ex. : son compte modifié). */
  setUser(user: User): void;
}

export const SESSION_STORAGE_KEY = 'wenzee:session';

/**
 * La session (« qui est connecté ? »), dans un petit store Zustand, comme sur le site.
 * Différence : elle est gardée dans AsyncStorage au lieu du localStorage, pour
 * survivre à la fermeture de l'app. La lecture est asynchrone : au démarrage,
 * on attend `useSessionStore.persist.rehydrate()` (voir prepareDemoData).
 * Les écrans de connexion arrivent au lot M5.
 */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      signIn: ({ user, token }) => set({ user, token }),
      signOut: () => set({ user: null, token: null }),
      setUser: (user) => set({ user }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      // On recharge nous-mêmes au démarrage, une fois, pour savoir quand c'est fini.
      skipHydration: true,
    },
  ),
);
