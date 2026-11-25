import { ApiError, type ApiClient } from '@afro/common';
import { DEMO_CLIENT_ID, DEMO_PROVIDER_ID } from '@afro/common/mocks';
import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { longDay } from '@/lib/dates';
import { useSessionStore } from '@/stores/session';
import { demoApi, testProviders } from '@/test/demoApi';
import { useAuthFlowStore } from '../auth/authFlowStore';
import { QuoteRequestScreen } from './QuoteRequestScreen';

const Empty = () => null;
const routes = {
  index: Empty,
  messages: Empty,
  'conversations/[id]': Empty,
  'prestataires/[slug]/index': Empty,
  'prestataires/[slug]/demande': QuoteRequestScreen,
  '(auth)/bienvenue': Empty,
};

const SLUG = 'saveurs-de-dakar';
const PROVIDER_ID = 'prov-saveurs-de-dakar';
const MESSAGE = 'Bonjour, nous cherchons un traiteur sénégalais pour notre mariage.';

/** Le 14 et le 15 du mois prochain : toujours dans le futur. */
function nextMonthDays() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const day = (d: number) =>
    `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return { busy: day(14), free: day(15) };
}

type Ctx = ReturnType<typeof demoApi>;

/** Ouvre la demande de devis, connecté avec `userId` (ou sans compte). */
async function open(
  options: { userId?: string; api?: (ctx: Ctx) => ApiClient; url?: string } = {},
) {
  const ctx = demoApi();
  const { busy, free } = nextMonthDays();
  // Le 14 est pris, le 15 est libre (quoi que dise la base de démo).
  ctx.db.data.unavailabilities = ctx.db.data.unavailabilities.filter(
    (u) => !(u.providerId === PROVIDER_ID && (u.date === busy || u.date === free)),
  );
  ctx.db.data.unavailabilities.push({
    id: 'unav-test',
    providerId: PROVIDER_ID,
    date: busy,
    reason: 'manual',
    createdAt: '2026-11-23T10:00:00Z',
    updatedAt: '2026-11-23T10:00:00Z',
  });
  if (options.userId) {
    const user = ctx.db.data.users.find((u) => u.id === options.userId)!;
    await act(() => useSessionStore.getState().signIn({ user, token: `demo:${user.id}` }));
  }
  const details = await ctx.api.getProviderBySlug(SLUG); // avant renderRouter (faux minuteurs)
  await renderRouter(routes, {
    initialUrl: options.url ?? `/prestataires/${SLUG}/demande`,
    wrapper: testProviders(options.api?.(ctx) ?? ctx.api),
  });
  return { ...ctx, details, busy, free };
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const type = (label: string, value: string) =>
  fireEvent.changeText(screen.getByLabelText(label), value);

/** Remplit l'étape 2 avec un jour donné (dans le mois prochain). */
async function fillEvent(date: string) {
  await fireEvent.press(screen.getByRole('button', { name: 'Mariage' }));
  await press('Mois suivant');
  await fireEvent.press(
    screen.getByRole('button', { name: new RegExp(`^${longDay(date, 'fr-FR')}`) }),
  );
  await type('Invités (facultatif)', '120');
  await type('Budget min, en € (facultatif)', '2000');
  await type('Budget max, en € (facultatif)', '3000');
  await type('Ville', 'Saint-Denis');
  await type('Code postal', '93200');
}

afterEach(() => {
  useAuthFlowStore.setState({ redirectTo: null });
  useSessionStore.setState({ user: null, token: null });
  jest.useRealTimers();
});

describe('Demande de devis (lot M9)', () => {
  it('sans compte : demande de se connecter, puis revient ici', async () => {
    await open();
    expect(screen.getByText('Connecte-toi pour demander un devis.')).toBeOnTheScreen();
    await press('Se connecter');
    expect(screen).toHavePathname('/bienvenue');
    expect(useAuthFlowStore.getState().redirectTo).toBe(`/prestataires/${SLUG}/demande`);
  });

  it('envoie une demande en 3 étapes, puis affiche « Demande envoyée »', async () => {
    const { db, details, free } = await open({ userId: DEMO_CLIENT_ID });
    const offering = details.offerings.find((o) => o.isActive)!;
    const before = db.data.quoteRequests.length;

    // Étape 1 · Formule
    expect(await screen.findByRole('progressbar', { name: 'Étape 1 sur 3' })).toBeOnTheScreen();
    expect(
      screen.getByRole('radio', { name: /^Je ne sais pas encore/, checked: true }),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('radio', { name: new RegExp(`^${offering.title}`) }));
    await press('Continuer');

    // Étape 2 · Événement : rien de rempli → les erreurs, et on reste sur l'étape.
    expect(screen.getByRole('progressbar', { name: 'Étape 2 sur 3' })).toBeOnTheScreen();
    await press('Continuer');
    expect(await screen.findByText('Choisis le type d’événement')).toBeOnTheScreen();
    expect(screen.getByText('Choisis la date de l’événement')).toBeOnTheScreen();
    expect(screen.getByText('Indique la ville de l’événement')).toBeOnTheScreen();
    expect(screen.getByText('Code postal à 5 chiffres')).toBeOnTheScreen();
    await fillEvent(free);
    await press('Continuer');

    // Étape 3 · Message : trop court, puis complet.
    expect(await screen.findByRole('progressbar', { name: 'Étape 3 sur 3' })).toBeOnTheScreen();
    await type('Ton message', 'Bonjour');
    await press('Envoyer ma demande');
    expect(
      await screen.findByText('Décris ton besoin en quelques phrases (20 caractères minimum)'),
    ).toBeOnTheScreen();
    await type('Ton message', MESSAGE);
    await press('Envoyer ma demande');

    expect(await screen.findByText('Demande envoyée !')).toBeOnTheScreen();
    expect(screen.getByText(/^Saveurs de Dakar a 7 jours pour te répondre/)).toBeOnTheScreen();
    expect(screen.getByText(/^Mariage · .+ · 120 invités$/)).toBeOnTheScreen();
    expect(screen.getByText(/^Saint-Denis · budget 2\s000\s€ à 3\s000\s€$/)).toBeOnTheScreen();

    expect(db.data.quoteRequests).toHaveLength(before + 1);
    expect(db.data.quoteRequests.at(-1)).toMatchObject({
      clientId: DEMO_CLIENT_ID,
      providerId: PROVIDER_ID,
      offeringId: offering.id,
      eventType: 'wedding',
      eventDate: free,
      eventCity: 'Saint-Denis',
      eventPostalCode: '93200',
      guestCount: 120,
      budgetMin: 200000,
      budgetMax: 300000,
      message: MESSAGE,
      status: 'pending',
    });

    // « Ouvrir la conversation » mène au fil créé avec la demande.
    const conversation = db.data.conversations.find(
      (c) => c.quoteRequestId === db.data.quoteRequests.at(-1)!.id,
    )!;
    await press('Ouvrir la conversation');
    expect(screen).toHavePathname(`/conversations/${conversation.id}`);
  });

  it('refuse un jour où le prestataire est déjà pris (règle n° 3)', async () => {
    const { busy } = await open({ userId: DEMO_CLIENT_ID });
    await fireEvent.press(await screen.findByRole('button', { name: 'Continuer' }));
    await fillEvent(busy);
    // Le jour pris est annoncé « indisponible » dans le calendrier.
    expect(
      await screen.findByRole('button', { name: `${longDay(busy, 'fr-FR')}, indisponible` }),
    ).toBeOnTheScreen();
    await press('Continuer');
    expect(
      await screen.findByText(
        'Ce prestataire n’est pas disponible ce jour-là. Choisis une autre date.',
      ),
    ).toBeOnTheScreen();
    expect(screen.getByRole('progressbar', { name: 'Étape 2 sur 3' })).toBeOnTheScreen();
  });

  it('affiche l’erreur du serveur, traduite', async () => {
    const { free } = await open({
      userId: DEMO_CLIENT_ID,
      api: ({ api }) => ({
        ...api,
        createQuoteRequest: () =>
          Promise.reject(
            new ApiError(
              409,
              'Ce prestataire n’est pas disponible à cette date.',
              'provider_unavailable',
            ),
          ),
      }),
    });
    await fireEvent.press(await screen.findByRole('button', { name: 'Continuer' }));
    await fillEvent(free);
    await press('Continuer');
    await fireEvent.changeText(await screen.findByLabelText('Ton message'), MESSAGE);
    await press('Envoyer ma demande');
    expect(
      await screen.findByText('Ce prestataire n’est pas disponible à cette date.'),
    ).toBeOnTheScreen();
    expect(screen.queryByText('Demande envoyée !')).toBeNull();
  });

  it('part de la formule choisie sur le profil (?formule=)', async () => {
    const ctx = demoApi();
    const details = await ctx.api.getProviderBySlug(SLUG);
    const offering = details.offerings.filter((o) => o.isActive).at(-1)!;
    await open({
      userId: DEMO_CLIENT_ID,
      url: `/prestataires/${SLUG}/demande?formule=${offering.id}`,
    });
    expect(
      await screen.findByRole('radio', { name: new RegExp(`^${offering.title}`), checked: true }),
    ).toBeOnTheScreen();
  });

  it('empêche un prestataire de s’envoyer une demande à lui-même', async () => {
    await open({ userId: DEMO_PROVIDER_ID });
    expect(
      await screen.findByText(
        'C’est ton propre profil : tu ne peux pas t’envoyer une demande à toi-même.',
      ),
    ).toBeOnTheScreen();
  });
});
