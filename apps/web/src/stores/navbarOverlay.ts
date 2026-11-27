import { useEffect } from 'react';
import { create } from 'zustand';

interface NavbarOverlayState {
  /** Nombre de composants affichés qui demandent une navbar posée sur leur photo. */
  requests: number;
  request(): void;
  release(): void;
}

/**
 * La navbar transparente, posée sur une photo plein écran, hors de l'accueil.
 *
 * Sur l'accueil, c'est l'adresse (`/`) qui l'active. Ailleurs, c'est la page qui la demande, seulement
 * quand sa photo est réellement affichée (ex. la couverture de la fiche prestataire) : une page en erreur
 * ou une 404 gardent la navbar brune, lisible sur fond clair.
 */
export const useNavbarOverlayStore = create<NavbarOverlayState>()((set) => ({
  requests: 0,
  request: () => set(({ requests }) => ({ requests: requests + 1 })),
  release: () => set(({ requests }) => ({ requests: Math.max(0, requests - 1) })),
}));

/** À appeler dans le composant de la photo : la navbar est transparente tant qu'il est affiché. */
export function useOverlayNavbar() {
  useEffect(() => {
    const { request, release } = useNavbarOverlayStore.getState();
    request();
    return release;
  }, []);
}
