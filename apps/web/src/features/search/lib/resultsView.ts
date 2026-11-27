import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Les deux présentations des résultats : grille de cartes verticales, ou liste de cartes horizontales. */
export type ResultsView = 'grid' | 'list';

interface ResultsViewState {
  view: ResultsView;
  setView(view: ResultsView): void;
}

/**
 * Le mode d'affichage choisi (Grille par défaut). Gardé dans le navigateur : on le retrouve
 * en revenant sur la recherche. Il n'est PAS dans l'adresse, car ce n'est pas un filtre :
 * changer de mode ne relance pas la recherche et ne touche pas aux filtres.
 */
export const useResultsView = create<ResultsViewState>()(
  persist(
    (set) => ({
      view: 'grid',
      setView: (view) => set({ view }),
    }),
    {
      name: 'afro-marketplace:results-view',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
