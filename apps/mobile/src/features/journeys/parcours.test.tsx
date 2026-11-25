import { DEMO_CLIENT_ID, DEMO_PROVIDER_ID } from '@afro/common/mocks';
import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import ConversationRoute from '../../../app/conversations/[id]';
import RequestRoute from '../../../app/demande/[id]';
import ProRequestRoute from '../../../app/pro/demande/[id]';
import ProQuoteRoute from '../../../app/pro/devis/[id]';
import ProLayout from '../../../app/pro/_layout';
import { isoDay, todayIso } from '@/lib/dates';
import { useSessionStore } from '@/stores/session';
import { demoApi, testProviders } from '@/test/demoApi';
import { useTabBarStore } from '../navigation/tabBarStore';

/*
 * Le parcours clé du MVP, de bout en bout, sur UNE même base de démo (lot M16) :
 * la cliente demande un devis → le prestataire envoie son devis → la cliente l'accepte
 * → le prestataire voit la réservation. Chaque écran est testé en détail dans son lot ;
 * ici on vérifie qu'ils s'enchaînent, en passant d'un compte à l'autre comme deux téléphones.
 */

const routes = {
  'demande/[id]': RequestRoute,
  'conversations/[id]': ConversationRoute,
  'pro/_layout': ProLayout,
  'pro/demande/[id]': ProRequestRoute,
  'pro/devis/[id]': ProQuoteRoute,
};

type Ctx = ReturnType<typeof demoApi>;

async function signIn(ctx: Ctx, userId: string) {
  const user = ctx.db.data.users.find((u) => u.id === userId)!;
  await act(() => useSessionStore.getState().signIn({ user, token: `demo:${user.id}` }));
}

/** « Ouvre l'app » d'un compte sur une adresse, avec la même base que les autres comptes. */
let rendered = false;
async function openAs(ctx: Ctx, userId: string, initialUrl: string) {
  // On ferme « l'app » précédente : un seul routeur à la fois.
  if (rendered) await act(() => screen.unmount());
  rendered = true;
  await signIn(ctx, userId);
  await renderRouter(routes, { initialUrl, wrapper: testProviders(ctx.api) });
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const type = (label: string, text: string) =>
  fireEvent.changeText(screen.getByLabelText(label), text);

/** Le 12 du mois prochain, libéré dans l'agenda du prestataire : la date reste valable. */
function freeDate(ctx: Ctx, providerId: string) {
  const today = todayIso();
  const next = new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 1));
  const date = isoDay(next.getUTCFullYear(), next.getUTCMonth(), 12);
  ctx.db.data.unavailabilities = ctx.db.data.unavailabilities.filter(
    (u) => !(u.providerId === providerId && u.date === date),
  );
  ctx.db.data.bookings = ctx.db.data.bookings.filter(
    (b) => !(b.providerId === providerId && b.eventDate === date),
  );
  return date;
}

afterEach(() => {
  useTabBarStore.setState({ collapsed: false });
  useSessionStore.setState({ user: null, token: null });
});

describe('Parcours clé (lot M16)', () => {
  it('demande → devis → acceptation → réservation, entre la cliente et le prestataire', async () => {
    const ctx = demoApi();
    const provider = ctx.db.data.providers.find((p) => p.userId === DEMO_PROVIDER_ID)!;
    const eventDate = freeDate(ctx, provider.id);

    // 1. La cliente envoie sa demande (l'écran en 3 étapes est testé au lot M9).
    await signIn(ctx, DEMO_CLIENT_ID);
    const request = await ctx.api.createQuoteRequest({
      providerId: provider.id,
      clientType: 'individual',
      eventType: 'wedding',
      eventDate,
      eventCity: 'Saint-Denis',
      eventPostalCode: '93200',
      guestCount: 80,
      message: 'Bonjour, un buffet sénégalais pour notre mariage, 80 invités.',
    });

    // 2. Le prestataire la reçoit et envoie un devis.
    await openAs(ctx, DEMO_PROVIDER_ID, `/pro/demande/${request.id}`);
    expect(await screen.findByText(/Bonjour, un buffet sénégalais/)).toBeOnTheScreen();
    await press('Envoyer un devis');
    await screen.findByText('Nouveau devis');
    await type('Libellé de la ligne 1', 'Buffet mariage');
    await type('Quantité de la ligne 1', '80');
    await type('Prix unitaire de la ligne 1, en euros', '30');
    await press('Envoyer');
    expect(
      await screen.findByText('Devis envoyé ! Le client le voit dans la conversation.'),
    ).toBeOnTheScreen();

    // 3. La cliente accepte le devis.
    await openAs(ctx, DEMO_CLIENT_ID, `/demande/${request.id}`);
    await fireEvent.press(await screen.findByRole('button', { name: 'Accepter le devis' }));
    await type('Adresse de l’événement', '12 rue de la Paix, 93200 Saint-Denis');
    await fireEvent.press(
      screen.getByRole('checkbox', { name: 'J’accepte le devis et les conditions d’annulation.' }),
    );
    await press('Accepter et réserver');
    expect(
      await screen.findByText('Réservation confirmée ! Les coordonnées sont désormais visibles.'),
    ).toBeOnTheScreen();

    // 4. Le prestataire voit la réservation, avec l'adresse.
    await openAs(ctx, DEMO_PROVIDER_ID, `/pro/demande/${request.id}`);
    expect(await screen.findByText('La réservation')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Adresse : 12 rue de la Paix, 93200 Saint-Denis'),
    ).toBeOnTheScreen();
    expect(ctx.db.data.bookings.find((b) => b.quoteRequestId === request.id)).toMatchObject({
      status: 'confirmed',
      eventDate,
      totalAmount: 240000,
    });
  });
});
