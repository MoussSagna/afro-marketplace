import type { RouteObject } from 'react-router';
import { RequireAuth } from '@/features/auth/components/RequireAuth';
import { AdminLayout } from './layouts/AdminLayout';
import { ClientLayout } from './layouts/ClientLayout';
import { ProLayout } from './layouts/ProLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { PlaceholderPage } from './PlaceholderPage';

/** Une page pas encore construite : son adresse existe déjà, son contenu arrive avec son lot. */
const soon = (path: string, title: string, lot: number): RouteObject => ({
  path,
  element: <PlaceholderPage title={title} lot={lot} />,
});

/**
 * Toutes les routes de l'application.
 *
 * - Les vraies pages sont chargées à la demande (lazy) : leur code n'est
 *   téléchargé que quand on les visite.
 * - Les espaces client, pro et admin sont protégés par <RequireAuth>,
 *   placé AU-DESSUS de leur gabarit : la garde s'applique à toutes leurs pages.
 */
export const routes: RouteObject[] = [
  {
    // Affiché pendant le tout premier chargement d'une page « lazy ».
    HydrateFallback: () => null,
    children: [
      {
        element: <PublicLayout />,
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import('@/features/search/pages/HomePage')).HomePage,
            }),
          },
          {
            path: 'connexion',
            lazy: async () => ({
              Component: (await import('@/features/auth/pages/LoginPage')).LoginPage,
            }),
          },
          {
            path: 'deconnexion',
            lazy: async () => ({
              Component: (await import('@/features/auth/pages/LogoutPage')).LogoutPage,
            }),
          },
          soon('recherche', 'Rechercher un prestataire', 3),
          soon('categories/:slug', 'Catégorie', 3),
          soon('prestataires/:slug', 'Profil du prestataire', 3),
          soon('prestataires/:slug/demande', 'Demander un devis', 4),
          soon('devenir-prestataire', 'Devenir prestataire', 7),
          soon('comment-ca-marche', 'Comment ça marche', 9),
          {
            path: '*',
            lazy: async () => ({
              Component: (await import('./NotFoundPage')).NotFoundPage,
            }),
          },
        ],
      },
      {
        // Espace client (C2 à C8) : il suffit d'être connecté.
        path: 'espace',
        element: <RequireAuth />,
        children: [
          {
            element: <ClientLayout />,
            children: [
              soon('demandes', 'Mes demandes', 4),
              soon('demandes/:id', 'Détail de la demande', 4),
              soon('reservations', 'Mes réservations', 5),
              soon('messages', 'Messages', 4),
              soon('messages/:conversationId', 'Conversation', 4),
              soon('avis/:bookingId', 'Laisser un avis', 6),
              soon('compte', 'Mon compte', 9),
            ],
          },
        ],
      },
      {
        // Espace prestataire (S1 à S8) : rôle « provider » exigé.
        path: 'pro',
        element: <RequireAuth role="provider" />,
        children: [
          {
            element: <ProLayout />,
            children: [
              { index: true, element: <PlaceholderPage title="Tableau de bord" lot={5} /> },
              soon('demandes', 'Demandes reçues', 4),
              soon('demandes/:id', 'Détail de la demande', 4),
              soon('demandes/:id/devis', 'Créer un devis', 5),
              soon('messages', 'Messages', 4),
              soon('messages/:conversationId', 'Conversation', 4),
              soon('agenda', 'Agenda', 5),
              soon('avis', 'Avis reçus', 6),
              soon('profil', 'Mon profil', 7),
              soon('onboarding', 'Créer mon profil', 7),
            ],
          },
        ],
      },
      {
        // Administration (A1 à A4) : rôle « admin » exigé.
        path: 'admin',
        element: <RequireAuth role="admin" />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <PlaceholderPage title="Vue d’ensemble" lot={8} /> },
              soon('prestataires', 'Profils à valider', 8),
              soon('signalements', 'Signalements', 8),
              soon('utilisateurs', 'Utilisateurs', 8),
            ],
          },
        ],
      },
    ],
  },
];
