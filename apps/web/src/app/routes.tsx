import type { Side } from '@afro/common';
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
 * Les pages « demandes » et « messages », communes aux espaces client et pro :
 * le même composant, avec le côté (`side`) en paramètre.
 */
const spacePages = (side: Side): RouteObject[] => [
  {
    path: 'demandes',
    lazy: async () => {
      const { RequestsPage } = await import('@/features/quote-requests/pages/RequestsPage');
      return { element: <RequestsPage side={side} /> };
    },
  },
  {
    path: 'demandes/:id',
    lazy: async () => {
      const { RequestDetailPage } =
        await import('@/features/quote-requests/pages/RequestDetailPage');
      return { element: <RequestDetailPage side={side} /> };
    },
  },
  ...['messages', 'messages/:conversationId'].map((path) => ({
    path,
    lazy: async () => {
      const { MessagesPage } = await import('@/features/messaging/pages/MessagesPage');
      return { element: <MessagesPage side={side} /> };
    },
  })),
];

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
          {
            path: 'recherche',
            lazy: async () => ({
              Component: (await import('@/features/search/pages/SearchPage')).SearchPage,
            }),
          },
          {
            path: 'categories/:slug',
            lazy: async () => ({
              Component: (await import('@/features/search/pages/CategoryPage')).CategoryPage,
            }),
          },
          {
            path: 'prestataires/:slug',
            lazy: async () => ({
              Component: (await import('@/features/provider-profile/pages/ProviderProfilePage'))
                .ProviderProfilePage,
            }),
          },
          {
            // C1 : il faut être connecté pour demander un devis (retour ici après la connexion).
            element: <RequireAuth />,
            children: [
              {
                path: 'prestataires/:slug/demande',
                lazy: async () => ({
                  Component: (await import('@/features/quote-requests/pages/QuoteRequestPage'))
                    .QuoteRequestPage,
                }),
              },
            ],
          },
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
              ...spacePages('client'),
              {
                path: 'reservations',
                lazy: async () => ({
                  Component: (await import('@/features/bookings/pages/BookingsPage')).BookingsPage,
                }),
              },
              {
                path: 'avis/:bookingId',
                lazy: async () => ({
                  Component: (await import('@/features/reviews/pages/LeaveReviewPage'))
                    .LeaveReviewPage,
                }),
              },
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
              {
                index: true,
                lazy: async () => ({
                  Component: (await import('@/features/dashboard/pages/DashboardPage'))
                    .DashboardPage,
                }),
              },
              ...spacePages('provider'),
              {
                path: 'demandes/:id/devis',
                lazy: async () => ({
                  Component: (await import('@/features/quotes/pages/CreateQuotePage'))
                    .CreateQuotePage,
                }),
              },
              {
                path: 'agenda',
                lazy: async () => ({
                  Component: (await import('@/features/agenda/pages/AgendaPage')).AgendaPage,
                }),
              },
              {
                path: 'avis',
                lazy: async () => ({
                  Component: (await import('@/features/reviews/pages/ReceivedReviewsPage'))
                    .ReceivedReviewsPage,
                }),
              },
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
