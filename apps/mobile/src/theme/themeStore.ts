import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Le choix de la personne : suivre le téléphone, ou forcer clair / sombre. */
export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeState {
  preference: ThemePreference;
  setPreference(preference: ThemePreference): void;
}

export const THEME_STORAGE_KEY = 'wenzee:theme';

/**
 * Le thème choisi dans Compte → Apparence (lot M12b). Par défaut, on suit le réglage du téléphone.
 * Gardé dans AsyncStorage, rechargé au démarrage avec la session (voir prepareDemoData).
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
    },
  ),
);
