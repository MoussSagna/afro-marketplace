import { DEMO_CLIENT_ID, type MockDb } from '@afro/common/mocks';
import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import ReviewRoute from '../../../app/avis/[id]';
import { useSessionStore } from '@/stores/session';
import { demoApi, testProviders } from '@/test/demoApi';

const Empty = () => null;
const routes = {
  index: Empty,
  'avis/[id]': ReviewRoute,
  'prestataires/[slug]/index': Empty,
};

async function open(initialUrl: string, prepare?: (db: MockDb) => void) {
  const ctx = demoApi();
  prepare?.(ctx.db);
  const user = ctx.db.data.users.find((u) => u.id === DEMO_CLIENT_ID)!;
  await act(() => useSessionStore.getState().signIn({ user, token: `demo:${user.id}` }));
  await renderRouter(routes, { initialUrl, wrapper: testProviders(ctx.api) });
  return ctx;
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const star = (group: string, count: number) =>
  fireEvent.press(
    screen.getByRole('radio', { name: `${group}, ${count} étoile${count > 1 ? 's' : ''}` }),
  );

/** La réservation passée, sans avis, de la cliente de démo (et son prestataire). */
function pastBooking(db: MockDb) {
  const booking = db.data.bookings.find(
    (b) => b.clientId === DEMO_CLIENT_ID && b.eventDate < '2026-11-23' && b.status !== 'cancelled',
  )!;
  return { booking, provider: db.data.providers.find((p) => p.id === booking.providerId)! };
}

afterEach(() => {
  useSessionStore.setState({ user: null, token: null });
  jest.useRealTimers();
});

describe('Laisser un avis (lot M12)', () => {
  it('note obligatoire, sous-notes « les trois ou aucune », puis l’avis est publié', async () => {
    const { booking, provider } = pastBooking(demoApi().db);
    const before = { average: provider.ratingAverage, count: provider.ratingCount };
    const { db } = await open(`/avis/${booking.id}`);

    expect(await screen.findByText(provider.displayName)).toBeOnTheScreen();
    await press('Publier mon avis');
    expect(screen.getByText('Choisis une note de 1 à 5 étoiles')).toBeOnTheScreen();

    await star('Ta note générale', 5);
    expect(screen.getByText('Excellent')).toBeOnTheScreen();
    await star('Ponctualité', 4);
    await press('Publier mon avis');
    expect(screen.getByText('Note les trois critères, ou aucun')).toBeOnTheScreen();

    await star('Qualité de la prestation', 5);
    await star('Rapport qualité-prix', 4);
    await fireEvent.changeText(
      screen.getByLabelText('Ton commentaire (facultatif)'),
      'Ambiance de folie, les invités ont adoré !',
    );
    await press('Publier mon avis');

    expect(await screen.findByText('Merci ! Ton avis est publié.')).toBeOnTheScreen();
    const review = db.data.reviews.find((r) => r.bookingId === booking.id)!;
    expect(review).toMatchObject({
      authorId: DEMO_CLIENT_ID,
      rating: 5,
      subRatings: { quality: 5, punctuality: 4, value: 4 },
      comment: 'Ambiance de folie, les invités ont adoré !',
    });
    // Règle n° 8 : la note du prestataire est recalculée.
    const after = db.data.providers.find((p) => p.id === provider.id)!;
    expect(after.ratingCount).toBe(before.count + 1);
    expect(after.ratingAverage).not.toBeNaN();

    await press(`Voir le profil de ${provider.displayName}`);
    expect(screen).toHavePathname(`/prestataires/${provider.slug}`);
  });

  it('pas de formulaire avant l’événement (règle n° 6)', async () => {
    const { db: seed } = demoApi();
    const upcoming = seed.data.bookings.find(
      (b) => b.clientId === DEMO_CLIENT_ID && b.status === 'confirmed',
    )!;
    await open(`/avis/${upcoming.id}`);
    expect(
      await screen.findByText('Tu pourras laisser un avis après l’événement.'),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Publier mon avis' })).toBeNull();
  });

  it('une réservation inconnue', async () => {
    await open('/avis/book-inconnu');
    expect(await screen.findByText('Cette réservation est introuvable.')).toBeOnTheScreen();
  });
});
