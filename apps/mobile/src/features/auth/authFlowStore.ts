import { create } from 'zustand';

/** Où revenir par défaut, une fois connecté : l'Accueil. */
export const HOME = '/';

/**
 * N'accepte qu'une adresse interne de l'app (« /demandes »), jamais une adresse
 * externe ou bizarre (« https://… », « //… ») : sinon on revient à l'Accueil.
 */
export function safeRedirect(value: unknown, fallback: string = HOME): string {
  if (typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  return value;
}

interface AuthFlowState {
  /** L'écran à rouvrir après la connexion (ex. « /demandes »), ou null. */
  redirectTo: string | null;
  /** Démarre le parcours de connexion en retenant où revenir. */
  startAuth(redirectTo?: string | null): void;
  /** Lit l'écran où revenir (l'Accueil à défaut) et l'oublie. */
  takeRedirect(): string;
}

/**
 * Le parcours de connexion passe par plusieurs écrans (Bienvenue → Inscription → Code → …).
 * Plutôt que de faire suivre « où revenir » d'écran en écran, on le garde ici, le temps du parcours.
 * Pas besoin de le sauvegarder : si l'app est fermée en cours de route, on revient à l'Accueil.
 */
export const useAuthFlowStore = create<AuthFlowState>()((set, get) => ({
  redirectTo: null,
  startAuth: (redirectTo) => set({ redirectTo: redirectTo ? safeRedirect(redirectTo) : null }),
  takeRedirect: () => {
    const target = get().redirectTo ?? HOME;
    set({ redirectTo: null });
    return target;
  },
}));
