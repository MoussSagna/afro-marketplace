import type { RouteObject } from 'react-router';
import { PublicLayout } from './layouts/PublicLayout';

/**
 * La liste des routes. Chaque page est chargée à la demande (lazy) :
 * le code d'une page n'est téléchargé que quand on la visite.
 * Les autres routes (recherche, profil, espace pro, admin…) arrivent lot après lot.
 */
export const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    // Affiché pendant le tout premier chargement d'une page « lazy ».
    HydrateFallback: () => null,
    children: [
      {
        index: true,
        lazy: async () => ({
          Component: (await import('@/features/search/pages/HomePage')).HomePage,
        }),
      },
      {
        path: '*',
        lazy: async () => ({
          Component: (await import('./NotFoundPage')).NotFoundPage,
        }),
      },
    ],
  },
];
