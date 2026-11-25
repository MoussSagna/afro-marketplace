import type { Language } from '@afro/common/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { i18n, phoneLanguage } from './index';

/** Le choix de la personne : la langue du téléphone, ou une langue forcée. */
export type LanguagePreference = 'system' | Language;

interface LanguageState {
  preference: LanguagePreference;
  setPreference(preference: LanguagePreference): void;
}

export const LANGUAGE_STORAGE_KEY = 'wenzee:language';

/** Applique un choix : « system » reprend la langue du téléphone. */
export function applyLanguage(preference: LanguagePreference) {
  void i18n.changeLanguage(preference === 'system' ? phoneLanguage() : preference);
}

/**
 * La langue choisie dans Compte → Langue (lot M12b), gardée dans AsyncStorage.
 * Au démarrage, prepareDemoData la recharge puis l'applique.
 */
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => {
        set({ preference });
        applyLanguage(preference);
      },
    }),
    {
      name: LANGUAGE_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state) applyLanguage(state.preference);
      },
    },
  ),
);
