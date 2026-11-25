import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Le mode de l'app : client (par défaut) ou prestataire. */
export type AppMode = 'client' | 'pro';

interface ModeState {
  mode: AppMode;
  setMode(mode: AppMode): void;
}

export const MODE_STORAGE_KEY = 'wenzee:mode';

/**
 * Le mode choisi (lot M13) : on passe en mode pro depuis Compte, et on revient en mode client
 * depuis l'onglet Profil du mode pro. Gardé sur le téléphone : l'app rouvre dans le même mode.
 */
export const useModeStore = create<ModeState>()(
  persist(
    (set) => ({
      mode: 'client',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: MODE_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
    },
  ),
);
