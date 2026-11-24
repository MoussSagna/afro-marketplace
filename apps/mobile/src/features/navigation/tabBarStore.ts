import { create } from 'zustand';

interface TabBarState {
  /** true : la barre est rétractée en un rond (on a fait défiler vers le bas). */
  collapsed: boolean;
  collapse(): void;
  expand(): void;
}

/**
 * L'état de la barre d'onglets, partagé entre la barre et les écrans qui défilent.
 * Un petit store Zustand (comme la session) : l'écran dit « on descend », la barre se rétracte.
 */
export const useTabBarStore = create<TabBarState>()((set) => ({
  collapsed: false,
  collapse: () => set({ collapsed: true }),
  expand: () => set({ collapsed: false }),
}));
