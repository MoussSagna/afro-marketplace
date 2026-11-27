import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface FavoritesState {
  /** Identifiants des prestataires mis en favori, du plus récent au plus ancien. */
  ids: string[];
  toggle(providerId: string): void;
  clear(): void;
}

export const FAVORITES_STORAGE_KEY = 'wenzee:favorites';

/**
 * Les prestataires mis en favori (le cœur des cartes de la Recherche), comme sur le site
 * (`apps/web/src/stores/favorites.ts`).
 *
 * Pas d'API « favoris » pour l'instant : on les garde sur le téléphone (AsyncStorage).
 * Quand le back-end en aura une, ce store sera remplacé par un hook TanStack Query,
 * sans toucher aux cartes (elles n'utilisent que `useIsFavorite` et `toggle`). Voir questions-ouvertes n° 23.
 */
export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (providerId) =>
        set(({ ids }) => ({
          ids: ids.includes(providerId)
            ? ids.filter((id) => id !== providerId)
            : [providerId, ...ids],
        })),
      clear: () => set({ ids: [] }),
    }),
    {
      name: FAVORITES_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
    },
  ),
);

/** Vrai si ce prestataire est en favori (le composant se met à jour quand ça change). */
export function useIsFavorite(providerId: string) {
  return useFavoritesStore((state) => state.ids.includes(providerId));
}
