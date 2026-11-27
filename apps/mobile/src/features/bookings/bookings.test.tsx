import { DEMO_CLIENT_ID, type MockDb } from '@afro/common/mocks';
import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import ReviewRoute from '../../../app/avis/[id]';
import ConversationRoute from '../../../app/conversations/[id]';
import RequestRoute from '../../../app/demande/[id]';
import BookingsRoute from '../../../app/reservations';
import { useSessionStore } from '@/stores/session';
import { demoApi, testProviders } from '@/test/demoApi';
import { ClientTabsLayout } from '../navigation/ClientTabsLayout';
import { useTabBarStore } from '../navigation/tabBarStore';

const Empty = () => null;
const routes = {
  '(tabs)/_layout': ClientTabsLayout,
  '(tabs)/index': Empty,
  '(tabs)/demandes': Empty,
  '(tabs)/messages': Empty,
  '(tabs)/compte': Empty,
  'demande/[id]': RequestRoute,
  'conversations/[id]': ConversationRoute,
  reservations: BookingsRoute,
  'avis/[id]': ReviewRoute,
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
const providerName = (db: MockDb, providerId: string) =>
  db.data.providers.find((p) => p.id === providerId)!.displayName;

/** La demande de la cliente de démo qui attend une réponse à son devis. */
function quotedRequest(db: MockDb) {
  const request = db.data.quoteRequests.find(
    (r) => r.clientId === DEMO_CLIENT_ID && r.status === 'quoted',
  )!;
  const quote = db.data.quotes.find((q) => q.quoteRequestId === request.id && q.status === 'sent')!;
  return { request, quote };
}

afterEach(() => {
  useTabBarStore.setState({ collapsed: false });
  useSessionStore.setState({ user: null, token: null });
  jest.useRealTimers();
});

describe('Devis et réservations (lot M11)', () => {
  it('accepter un devis : adresse et case obligatoires, puis la réservation est créée', async () => {
    const { request, quote } = quotedRequest(demoApi().db);
    const { db } = await open(`/demande/${request.id}`);

    await fireEvent.press(await screen.findByRole('button', { name: 'Accepter le devis' }));
    expect(await screen.findByText(/^Annulation : /)).toBeOnTheScreen();

    // Rien de rempli : deux erreurs, rien n'est envoyé.
    await press('Accepter et réserver');
    expect(screen.getByText('Indique l’adresse de l’événement')).toBeOnTheScreen();
    expect(screen.getByText('Coche la case pour accepter les conditions.')).toBeOnTheScreen();
    expect(db.data.bookings.some((b) => b.quoteId === quote.id)).toBe(false);

    await fireEvent.changeText(
      screen.getByLabelText('Adresse de l’événement'),
      '12 rue de la Paix, 93200 Saint-Denis',
    );
    await fireEvent.press(
      screen.getByRole('checkbox', { name: 'J’accepte le devis et les conditions d’annulation.' }),
    );
    await press('Accepter et réserver');

    expect(
      await screen.findByText('Réservation confirmée ! Les coordonnées sont désormais visibles.'),
    ).toBeOnTheScreen();
    const booking = db.data.bookings.find((b) => b.quoteId === quote.id)!;
    expect(booking).toMatchObject({
      status: 'confirmed',
      eventAddress: '12 rue de la Paix, 93200 Saint-Denis',
    });
    expect(db.data.quoteRequests.find((r) => r.id === request.id)!.status).toBe('accepted');
    expect(screen.getByText('Ma réservation')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Adresse : 12 rue de la Paix, 93200 Saint-Denis'),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Accepter le devis' })).toBeNull();
  });

  it('refuser un devis après confirmation : la demande reste ouverte', async () => {
    const { request, quote } = quotedRequest(demoApi().db);
    const { db } = await open(`/demande/${request.id}`);

    await fireEvent.press(await screen.findByRole('button', { name: 'Refuser' }));
    expect(screen.getByText('Refuser ce devis ?')).toBeOnTheScreen();
    await press('Garder le devis');
    expect(screen.queryByText('Refuser ce devis ?')).toBeNull();

    await press('Refuser');
    await press('Oui, refuser');
    expect(
      await screen.findByText('Devis refusé. Le prestataire peut t’en envoyer un nouveau.'),
    ).toBeOnTheScreen();
    expect(db.data.quotes.find((q) => q.id === quote.id)!.status).toBe('declined');
    expect(screen.queryByRole('button', { name: 'Accepter le devis' })).toBeNull();
  });

  it('les boutons du devis sont aussi dans la conversation', async () => {
    const { db: seed } = demoApi();
    const { request } = quotedRequest(seed);
    const conversation = seed.data.conversations.find((c) => c.quoteRequestId === request.id)!;
    await open(`/conversations/${conversation.id}`);
    expect(await screen.findByRole('button', { name: 'Accepter le devis' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Refuser' })).toBeOnTheScreen();
  });

  it('liste les réservations à venir et passées, avec « Laisser un avis » après l’événement', async () => {
    const { db } = await open('/reservations');
    const mine = db.data.bookings.filter((b) => b.clientId === DEMO_CLIENT_ID);
    const upcoming = mine.find((b) => b.status === 'confirmed')!;
    const past = mine.find((b) => b.status === 'completed')!;

    const upcomingName = providerName(db, upcoming.providerId);
    expect(
      await screen.findByRole('button', { name: new RegExp(`^${upcomingName}, Confirmée, `) }),
    ).toBeOnTheScreen();
    expect(screen.getByText(upcoming.eventAddress)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: `Annuler ${upcomingName}` })).toBeOnTheScreen();

    const pastName = providerName(db, past.providerId);
    await fireEvent.press(screen.getByRole('tab', { name: /^Passées/ }));
    expect(
      screen.getByRole('button', { name: new RegExp(`^${pastName}, Passée`) }),
    ).toBeOnTheScreen();
    await press(`Laisser un avis ${pastName}`);
    expect(screen).toHavePathname(`/avis/${past.id}`);
    expect(await screen.findByText('Ta note générale')).toBeOnTheScreen();
  });

  it('pas de « Laisser un avis » quand l’avis est déjà donné', async () => {
    await open('/reservations', (db) => {
      const past = db.data.bookings.find(
        (b) => b.clientId === DEMO_CLIENT_ID && b.eventDate < '2026-11-23',
      )!;
      const template = db.data.reviews[0]!;
      db.data.reviews.push({
        ...template,
        id: 'rev-test',
        bookingId: past.id,
        providerId: past.providerId,
        authorId: DEMO_CLIENT_ID,
        rating: 4,
      });
    });
    await fireEvent.press(await screen.findByRole('tab', { name: /^Passées/ }));
    expect(await screen.findByText('Avis laissé : 4/5')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^Laisser un avis/ })).toBeNull();
  });

  it('annule une réservation : remboursement prévu, motif obligatoire', async () => {
    const { db: seed } = demoApi();
    const booking = seed.data.bookings.find(
      (b) => b.clientId === DEMO_CLIENT_ID && b.status === 'confirmed',
    )!;
    const { db } = await open(`/demande/${booking.quoteRequestId}`);

    await fireEvent.press(await screen.findByRole('button', { name: 'Annuler la réservation' }));
    expect(screen.getByText(/de l’acompte te sera remboursé/)).toBeOnTheScreen();
    await press('Confirmer l’annulation');
    expect(screen.getByText('Indique un motif d’annulation')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Motif'), 'Événement reporté');
    await press('Confirmer l’annulation');
    expect(await screen.findByText('Ta réservation est annulée.')).toBeOnTheScreen();
    expect(db.data.bookings.find((b) => b.id === booking.id)).toMatchObject({
      status: 'cancelled',
      cancelledBy: 'client',
      cancelReason: 'Événement reporté',
    });
    expect(screen.queryByRole('button', { name: 'Annuler la réservation' })).toBeNull();
  });

  it('sans réservation : un état vide qui renvoie vers les demandes', async () => {
    await open('/reservations', (db) => {
      db.data.bookings = db.data.bookings.filter((b) => b.clientId !== DEMO_CLIENT_ID);
    });
    expect(await screen.findByText('Aucune réservation à venir')).toBeOnTheScreen();
    await press('Voir mes demandes');
    expect(screen).toHavePathname('/demandes');
  });
});
