import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface FavoritesState {
  /** Identifiants des prestataires mis en favori, du plus récent au plus ancien. */
  ids: string[];
  toggle(providerId: string): void;
  clear(): void;
}

/**
 * Les prestataires mis en favori (le cœur des cartes de résultats).
 *
 * Pas d'API « favoris » au MVP : on les garde dans le navigateur (localStorage), comme la session.
 * Quand le back-end en aura une, ce store sera remplacé par un hook TanStack Query,
 * sans toucher aux cartes (elles n'utilisent que `useIsFavorite` et `toggle`).
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
      name: 'afro-marketplace:favorites',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** Vrai si ce prestataire est en favori (le composant se met à jour quand ça change). */
export function useIsFavorite(providerId: string) {
  return useFavoritesStore((state) => state.ids.includes(providerId));
}
