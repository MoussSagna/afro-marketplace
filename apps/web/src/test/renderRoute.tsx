import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { AppProviders } from '@/app/AppProviders';
import { routes } from '@/app/routes';

/**
 * Affiche l'application à une URL donnée, avec le vrai routeur, TanStack Query
 * et MSW : on teste ce que voit l'utilisateur, comme dans un vrai navigateur.
 */
export function renderRoute(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  // Pas de nouvelle tentative en test : une erreur doit s'afficher tout de suite.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
}
