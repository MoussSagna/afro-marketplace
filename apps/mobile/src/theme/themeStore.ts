import { create } from 'zustand';

/** Le choix de la personne : suivre le téléphone, ou forcer clair / sombre. */
export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeState {
  preference: ThemePreference;
  setPreference(preference: ThemePreference): void;
}

/**
 * Le thème choisi. Par défaut, on suit le réglage du téléphone.
 * Le choix « Clair / Sombre / Automatique » arrivera dans Compte (lot M12), et sera alors
 * gardé dans AsyncStorage ; pour l'instant, on ne s'en sert que dans les tests.
 */
export const useThemeStore = create<ThemeState>()((set) => ({
  preference: 'system',
  setPreference: (preference) => set({ preference }),
}));
