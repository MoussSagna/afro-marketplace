import { mockDb } from '@afro/common/mocks';
import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { AppProviders } from '@/app/AppProviders';
import { routes } from '@/app/routes';
import { useSessionStore } from '@/stores/session';

interface RenderRouteOptions {
  /** Ouvre une session avec ce compte avant d'afficher la page (ex. « user-aissatou »). */
  as?: string;
}

/**
 * Affiche l'application à une URL donnée, avec le vrai routeur, TanStack Query
 * et MSW : on teste ce que voit l'utilisateur, comme dans un vrai navigateur.
 * Renvoie aussi le routeur, pour vérifier l'adresse après une redirection.
 */
export function renderRoute(path: string, { as }: RenderRouteOptions = {}) {
  if (as) signInForTest(as);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  // Pas de nouvelle tentative en test : une erreur doit s'afficher tout de suite.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const result = render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...result, router };
}

/** Ouvre directement une session de démo (sans passer par la page de connexion). */
export function signInForTest(userId: string) {
  const user = mockDb.data.users.find((u) => u.id === userId);
  if (!user) throw new Error(`Compte inconnu : ${userId}`);
  useSessionStore.getState().signIn({ user, token: `demo:${user.id}` });
}
