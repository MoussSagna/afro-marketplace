import type { ProviderDetails, ReviewWithAuthor } from '@afro/common';
import { seedDemoAccounts } from '@afro/common/mocks';
import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { isoDay, longDay } from '@/lib/dates';
import { useFavoritesStore } from '@/stores/favorites';
import { useSessionStore } from '@/stores/session';
import { demoApi, testProviders } from '@/test/demoApi';
import { useAuthFlowStore } from '../auth/authFlowStore';
import { ClientTabsLayout } from '../navigation/ClientTabsLayout';
import { useTabBarStore } from '../navigation/tabBarStore';
import { SearchScreen } from '../search/SearchScreen';
import { ProviderProfileScreen } from './ProviderProfileScreen';
import { QuoteRequestScreen } from '../quote-request/QuoteRequestScreen';

const Empty = () => null;
const routes = {
  '(tabs)/_layout': ClientTabsLayout,
  '(tabs)/index': SearchScreen,
  demandes: Empty,
  '(tabs)/messages': Empty,
  '(tabs)/compte': Empty,
  'prestataires/[slug]/index': ProviderProfileScreen,
  'prestataires/[slug]/demande': QuoteRequestScreen,
  '(auth)/bienvenue': Empty,
};

const SLUG = 'saveurs-de-dakar';
const PROVIDER_ID = 'prov-saveurs-de-dakar';

/** Ouvre un profil sur une base de démo neuve. `prepare` s'exécute avant l'affichage (faux minuteurs). */
async function open(slug = SLUG, prepare?: (ctx: ReturnType<typeof demoApi>) => Promise<unknown>) {
  const ctx = demoApi();
  const prepared = await prepare?.(ctx);
  await renderRouter(routes, {
    initialUrl: `/prestataires/${slug}`,
    wrapper: testProviders(ctx.api),
  });
  return { ...ctx, prepared };
}

async function signInAsClient() {
  const account = seedDemoAccounts.find((a) => a.roles.length === 1 && a.roles[0] === 'client')!;
  const { db } = demoApi();
  const user = db.data.users.find((u) => u.id === account.userId)!;
  await act(() => useSessionStore.getState().signIn({ user, token: `demo:${user.id}` }));
}

afterEach(() => {
  useFavoritesStore.setState({ ids: [] });
  useTabBarStore.setState({ collapsed: false });
  useAuthFlowStore.setState({ redirectTo: null });
  useSessionStore.setState({ user: null, token: null });
  jest.useRealTimers();
});

describe('Profil prestataire (lot M8)', () => {
  it('charge avec le loader, puis montre le nom, la note et les formules', async () => {
    const { prepared: details } = await open(SLUG, ({ api }) => api.getProviderBySlug(SLUG));
    const { profile, offerings } = details as ProviderDetails;
    expect(screen.getByRole('progressbar', { name: 'Chargement du profil' })).toBeOnTheScreen();

    expect(await screen.findByRole('header', { name: profile.displayName })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Formules', selected: true })).toBeOnTheScreen();
    for (const offering of offerings.filter((o) => o.isActive)) {
      expect(screen.getByText(offering.title)).toBeOnTheScreen();
    }
    expect(screen.getByText('À propos')).toBeOnTheScreen();
    expect(screen.getByText(profile.bio)).toBeOnTheScreen();
    // Le bouton du bas est toujours là.
    expect(screen.getByRole('button', { name: 'Demander un devis' })).toBeOnTheScreen();
    expect(screen.getByText(/^1 \/ \d+ photos?$/)).toBeOnTheScreen();
  });

  it('ouvre une photo en grand, puis la referme', async () => {
    await open();
    await fireEvent.press(
      await screen.findByRole('imagebutton', { name: /^Agrandir la photo 1 sur/ }),
    );
    expect(screen.getByRole('button', { name: 'Fermer les photos' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Fermer les photos' }));
    expect(screen.queryByRole('button', { name: 'Fermer les photos' })).toBeNull();
  });

  it('onglet Avis : les avis publiés et la réponse du prestataire', async () => {
    const { prepared } = await open(SLUG, ({ api }) => api.listProviderReviews(PROVIDER_ID));
    const reviews = prepared as ReviewWithAuthor[];
    expect(reviews.length).toBeGreaterThan(0);
    await fireEvent.press(await screen.findByRole('tab', { name: 'Avis' }));

    const first = reviews[0]!;
    expect(
      await screen.findByText(`${first.author.firstName} ${first.author.lastNameInitial}`),
    ).toBeOnTheScreen();
    if (first.comment) expect(screen.getAllByText(first.comment).length).toBeGreaterThan(0);
    if (reviews.some((r) => r.providerReply)) {
      expect(screen.getAllByText('Réponse du prestataire').length).toBeGreaterThan(0);
    }
  });

  it('onglet Dispos : les jours déjà pris sont annoncés « indisponible »', async () => {
    // Un jour pris, le 14 du mois prochain (toujours dans le futur).
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const busy = isoDay(next.getFullYear(), next.getMonth(), 14);
    const free = isoDay(next.getFullYear(), next.getMonth(), 15);
    await open(SLUG, async ({ db }) => {
      db.data.unavailabilities = db.data.unavailabilities.filter(
        (u) => !(u.providerId === PROVIDER_ID && u.date === free),
      );
      db.data.unavailabilities.push({
        id: 'unav-test',
        providerId: PROVIDER_ID,
        date: busy,
        reason: 'manual',
        createdAt: '2026-11-23T10:00:00Z',
        updatedAt: '2026-11-23T10:00:00Z',
      });
    });
    await fireEvent.press(await screen.findByRole('tab', { name: 'Dispos' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Mois suivant' }));

    expect(
      await screen.findByLabelText(`${longDay(busy, 'fr-FR')}, indisponible`),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText(`${longDay(free, 'fr-FR')}, disponible`)).toBeOnTheScreen();
  });

  it('onglet Infos : zone, langues, statut et politique d’annulation', async () => {
    const { prepared } = await open(SLUG, ({ api }) => api.getProviderBySlug(SLUG));
    const { profile } = prepared as ProviderDetails;
    await fireEvent.press(await screen.findByRole('tab', { name: 'Infos' }));

    expect(
      screen.getByLabelText(
        `Zone : ${profile.city}, se déplace jusqu’à ${profile.travelRadiusKm} km`,
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText(/^Annulation : (souple|modérée|stricte)$/)).toBeOnTheScreen();
    expect(screen.getByText(/^• Aucun remboursement à moins de \d+ jours$/)).toBeOnTheScreen();
  });

  it('« Demander un devis » sans compte ouvre la connexion et retient le profil', async () => {
    await open();
    await fireEvent.press(await screen.findByRole('button', { name: 'Demander un devis' }));
    expect(screen).toHavePathname('/bienvenue');
    expect(useAuthFlowStore.getState().redirectTo).toBe(`/prestataires/${SLUG}`);
  });

  it('« Demander un devis » une fois connecté ouvre la demande de devis', async () => {
    await signInAsClient();
    await open();
    await fireEvent.press(await screen.findByRole('button', { name: 'Demander un devis' }));
    expect(screen).toHavePathname(`/prestataires/${SLUG}/demande`);
    expect(await screen.findByRole('progressbar', { name: 'Étape 1 sur 3' })).toBeOnTheScreen();
  });

  it('signale le profil : motif, détails, envoi, puis confirmation', async () => {
    await signInAsClient();
    const { db } = await open();
    const before = db.data.reports.length;
    await fireEvent.press(await screen.findByRole('tab', { name: 'Infos' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Signaler ce profil' }));

    const send = screen.getByRole('button', { name: 'Envoyer le signalement' });
    expect(send).toBeDisabled();
    await fireEvent.press(screen.getByRole('radio', { name: 'Spam ou publicité' }));
    await fireEvent.changeText(
      screen.getByLabelText('Détails (facultatif)'),
      'Pub pour un autre site',
    );
    await fireEvent.press(send);

    expect(await screen.findByText('Merci, ton signalement a bien été envoyé.')).toBeOnTheScreen();
    expect(db.data.reports).toHaveLength(before + 1);
    expect(db.data.reports.at(-1)).toMatchObject({
      targetType: 'provider',
      targetId: PROVIDER_ID,
      reason: 'spam',
      details: 'Pub pour un autre site',
    });
  });

  it('signaler sans compte ouvre la connexion', async () => {
    await open();
    await fireEvent.press(await screen.findByRole('tab', { name: 'Infos' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Signaler ce profil' }));
    expect(screen).toHavePathname('/bienvenue');
  });

  it('affiche « Profil introuvable » pour une adresse inconnue', async () => {
    await open('nexiste-pas');
    expect(await screen.findByText('Profil introuvable')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Retour à la recherche' }));
    expect(screen).toHavePathname('/');
  });

  it('toucher une carte de la Recherche ouvre le profil', async () => {
    const { api } = demoApi();
    const { items } = await api.searchProviders({});
    await renderRouter(routes, { initialUrl: '/?vue=resultats', wrapper: testProviders(api) });
    const first = items[0]!;
    await fireEvent.press(
      await screen.findByRole('link', { name: new RegExp(`^${first.displayName}, `) }),
    );
    expect(screen).toHavePathname(`/prestataires/${first.slug}`);
    expect(await screen.findByRole('header', { name: first.displayName })).toBeOnTheScreen();
  });
});

describe('Profil prestataire : header dynamique', () => {
  it('Retour (dans le header) ramène à la recherche', async () => {
    const { api } = demoApi();
    const { items } = await api.searchProviders({});
    await renderRouter(routes, { initialUrl: '/?vue=resultats', wrapper: testProviders(api) });
    await fireEvent.press(
      await screen.findByRole('link', { name: new RegExp(`^${items[0]!.displayName}, `) }),
    );
    await screen.findByRole('header', { name: items[0]!.displayName });
    await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));
    expect(screen).toHavePathname('/');
  });

  it('le cœur du header utilise les mêmes favoris que les cartes', async () => {
    const { prepared } = await open(SLUG, ({ api }) => api.getProviderBySlug(SLUG));
    const name = (prepared as ProviderDetails).profile.displayName;
    await fireEvent.press(
      await screen.findByRole('button', { name: `Ajouter ${name} aux favoris` }),
    );
    expect(useFavoritesStore.getState().ids).toEqual([PROVIDER_ID]);
    const heart = screen.getByRole('button', { name: `Retirer ${name} des favoris` });
    expect(heart).toBeSelected();
    await fireEvent.press(heart);
    expect(useFavoritesStore.getState().ids).toEqual([]);
  });

  it('le défilement ne re-rend pas la fiche et garde les boutons en place', async () => {
    const { prepared } = await open(SLUG, ({ api }) => api.getProviderBySlug(SLUG));
    const name = (prepared as ProviderDetails).profile.displayName;
    const heading = await screen.findByRole('header', { name });
    const back = screen.getByRole('button', { name: 'Retour' });
    await fireEvent.scroll(screen.getByTestId('profile-scroll'), {
      nativeEvent: { contentOffset: { x: 0, y: 900 } },
    });
    // Mêmes éléments (pas de nouveau rendu) : le header ne dépend du scroll que via Reanimated.
    expect(screen.getByRole('header', { name })).toBe(heading);
    expect(screen.getByRole('button', { name: 'Retour' })).toBe(back);
    expect(screen.getByRole('button', { name: `Ajouter ${name} aux favoris` })).toBeOnTheScreen();
  });
});
