import type { Session, User, UserRole } from '@afro/common';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Les trois « espaces » de l'application, chacun avec son gabarit. */
export type Space = 'client' | 'provider' | 'admin';

interface SessionState {
  user: User | null;
  token: string | null;
  /** Le dernier espace utilisé, pour y revenir depuis le menu (compte à deux rôles). */
  lastSpace: Space;
  signIn(session: Session): void;
  signOut(): void;
  setLastSpace(space: Space): void;
}

/**
 * La session de l'utilisateur, dans un petit store Zustand.
 *
 * Pourquoi Zustand et pas TanStack Query ? La session n'est pas une donnée
 * du serveur qu'on met en cache : c'est un état de l'application (« qui est
 * connecté ? »), lu par beaucoup de composants. Elle est gardée dans le
 * localStorage pour survivre au rechargement de la page.
 */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      lastSpace: 'client',
      signIn: ({ user, token }) => set({ user, token, lastSpace: defaultSpaceFor(user.roles) }),
      signOut: () => set({ user: null, token: null, lastSpace: 'client' }),
      setLastSpace: (lastSpace) => set({ lastSpace }),
    }),
    {
      name: 'afro-marketplace:session',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** L'espace où l'on arrive après la connexion : admin > prestataire > client. */
export function defaultSpaceFor(roles: readonly UserRole[]): Space {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('provider')) return 'provider';
  return 'client';
}

/** L'adresse d'accueil de chaque espace. */
export const SPACE_HOME: Record<Space, string> = {
  client: '/espace/demandes',
  provider: '/pro',
  admin: '/admin',
};
