import type { Side } from '@afro/common';
import type { RouteObject } from 'react-router';
import { RequireAuth } from '@/features/auth/components/RequireAuth';
import { AdminLayout } from './layouts/AdminLayout';
import { ClientLayout } from './layouts/ClientLayout';
import { ProLayout } from './layouts/ProLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { RootRoute } from './RootRoute';

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
    // Défilement entre les pages : en haut pour une nouvelle page, gardé pour un filtre.
    Component: RootRoute,
    children: [
      {
        // Connexion, inscription, mot de passe oublié : écran partagé photo | formulaire,
        // sans navbar ni pied de page (le logo ramène à l'accueil).
        lazy: async () => ({
          Component: (await import('@/features/auth/components/AuthLayout')).AuthLayout,
        }),
        children: [
          {
            path: 'connexion',
            lazy: async () => ({
              Component: (await import('@/features/auth/pages/LoginPage')).LoginPage,
            }),
          },
          {
            path: 'inscription',
            lazy: async () => ({
              Component: (await import('@/features/auth/pages/SignUpPage')).SignUpPage,
            }),
          },
          {
            path: 'mot-de-passe-oublie',
            lazy: async () => ({
              Component: (await import('@/features/auth/pages/ForgotPasswordPage'))
                .ForgotPasswordPage,
            }),
          },
        ],
      },
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
          {
            path: 'devenir-prestataire',
            lazy: async () => ({
              Component: (await import('@/features/provider-onboarding/pages/BecomeProviderPage'))
                .BecomeProviderPage,
            }),
          },
          {
            path: 'comment-ca-marche',
            lazy: async () => ({
              Component: (await import('@/features/static/pages/HowItWorksPage')).HowItWorksPage,
            }),
          },
          {
            // Liens de la navbar de l'accueil : pages « bientôt disponible » (hors MVP).
            path: 'evenements',
            lazy: async () => ({
              Component: (await import('@/features/static/pages/ComingSoonPages')).EventsPage,
            }),
          },
          {
            path: 'offres',
            lazy: async () => ({
              Component: (await import('@/features/static/pages/ComingSoonPages')).DealsPage,
            }),
          },
          {
            path: 'contact',
            lazy: async () => ({
              Component: (await import('@/features/static/pages/ComingSoonPages')).ContactPage,
            }),
          },
          {
            path: 'favoris',
            lazy: async () => ({
              Component: (await import('@/features/static/pages/ComingSoonPages')).FavoritesPage,
            }),
          },
          {
            path: 'faq',
            lazy: async () => ({
              Component: (await import('@/features/static/pages/FaqPage')).FaqPage,
            }),
          },
          {
            path: 'cgu',
            lazy: async () => ({
              Component: (await import('@/features/static/pages/LegalPages')).TermsPage,
            }),
          },
          {
            path: 'mentions-legales',
            lazy: async () => ({
              Component: (await import('@/features/static/pages/LegalPages')).LegalNoticePage,
            }),
          },
          {
            path: 'confidentialite',
            lazy: async () => ({
              Component: (await import('@/features/static/pages/LegalPages')).PrivacyPage,
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
              {
                path: 'compte',
                lazy: async () => ({
                  Component: (await import('@/features/account/pages/AccountPage')).AccountPage,
                }),
              },
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
              {
                path: 'profil',
                lazy: async () => ({
                  Component: (await import('@/features/provider-onboarding/pages/MyProfilePage'))
                    .MyProfilePage,
                }),
              },
              {
                path: 'onboarding',
                lazy: async () => ({
                  Component: (await import('@/features/provider-onboarding/pages/OnboardingPage'))
                    .OnboardingPage,
                }),
              },
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
              {
                index: true,
                lazy: async () => ({
                  Component: (await import('@/features/admin/pages/AdminOverviewPage'))
                    .AdminOverviewPage,
                }),
              },
              {
                path: 'prestataires',
                lazy: async () => ({
                  Component: (await import('@/features/admin/pages/ProvidersToReviewPage'))
                    .ProvidersToReviewPage,
                }),
              },
              {
                path: 'prestataires/:id',
                lazy: async () => ({
                  Component: (await import('@/features/admin/pages/ProviderReviewPage'))
                    .ProviderReviewPage,
                }),
              },
              {
                path: 'signalements',
                lazy: async () => ({
                  Component: (await import('@/features/admin/pages/ReportsPage')).ReportsPage,
                }),
              },
              {
                path: 'utilisateurs',
                lazy: async () => ({
                  Component: (await import('@/features/admin/pages/UsersPage')).UsersPage,
                }),
              },
            ],
          },
        ],
      },
    ],
  },
];
