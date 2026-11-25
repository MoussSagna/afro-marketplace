import { DEMO_PROVIDER_ID, type MockDb } from '@afro/common/mocks';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import ProRequestRoute from '../../../app/pro/demande/[id]';
import ProAgendaTab from '../../../app/pro/(tabs)/agenda';
import { useSessionStore } from '@/stores/session';
import { demoApi, testProviders } from '@/test/demoApi';
import { isoDay, longDay, todayIso } from '@/lib/dates';
import { useTabBarStore } from '../navigation/tabBarStore';
import { ProTabsLayout } from './ProTabsLayout';

const Empty = () => null;
const routes = {
  'pro/(tabs)/_layout': ProTabsLayout,
  'pro/(tabs)/index': Empty,
  'pro/(tabs)/demandes': Empty,
  'pro/(tabs)/messages': Empty,
  'pro/(tabs)/agenda': ProAgendaTab,
  'pro/(tabs)/profil': Empty,
  'pro/demande/[id]': ProRequestRoute,
};

async function open(prepare?: (db: MockDb) => void) {
  const ctx = demoApi();
  prepare?.(ctx.db);
  const user = ctx.db.data.users.find((u) => u.id === DEMO_PROVIDER_ID)!;
  await act(() => useSessionStore.getState().signIn({ user, token: `demo:${user.id}` }));
  await renderRouter(routes, { initialUrl: '/pro/agenda', wrapper: testProviders(ctx.api) });
  return ctx;
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const day = (iso: string) => longDay(iso, 'fr-FR');
const providerOf = (db: MockDb) => db.data.providers.find((p) => p.userId === DEMO_PROVIDER_ID)!;

/** Le mois suivant : tous ses jours sont à venir, quel que soit le jour où le test tourne. */
function nextMonth() {
  const today = todayIso();
  const next = new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 1));
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
}

afterEach(() => {
  useTabBarStore.setState({ collapsed: false });
  useSessionStore.setState({ user: null, token: null });
  jest.useRealTimers();
});

describe('Agenda pro (lot M15a)', () => {
  it('bloque un jour libre, puis le libère', async () => {
    const { year, month } = nextMonth();
    const target = isoDay(year, month, 15);
    const { db } = await open((mock) => {
      // Le 15 du mois prochain est libre pour ce test.
      const id = providerOf(mock).id;
      mock.data.unavailabilities = mock.data.unavailabilities.filter(
        (u) => !(u.providerId === id && u.date === target),
      );
      mock.data.bookings = mock.data.bookings.filter(
        (b) => !(b.providerId === id && b.eventDate === target),
      );
    });
    const providerId = providerOf(db).id;
    const manual = () =>
      db.data.unavailabilities.filter(
        (u) => u.providerId === providerId && u.date === target && u.reason === 'manual',
      );

    await fireEvent.press(await screen.findByRole('button', { name: 'Mois suivant' }));
    await fireEvent.press(
      await screen.findByRole('button', { name: `${day(target)}, libre, toucher pour bloquer` }),
    );
    expect(
      await screen.findByRole('button', { name: `${day(target)}, bloqué, toucher pour libérer` }),
    ).toBeOnTheScreen();
    expect(manual()).toHaveLength(1);

    await press(`${day(target)}, bloqué, toucher pour libérer`);
    expect(
      await screen.findByRole('button', { name: `${day(target)}, libre, toucher pour bloquer` }),
    ).toBeOnTheScreen();
    expect(manual()).toHaveLength(0);
  });

  it('un jour réservé ouvre la demande, avec la réservation', async () => {
    const { year, month } = nextMonth();
    const target = isoDay(year, month, 20);
    const { db } = await open((mock) => {
      // Une réservation confirmée du prestataire, déplacée au 20 du mois prochain.
      const id = providerOf(mock).id;
      const booking = mock.data.bookings.find(
        (b) => b.providerId === id && b.status === 'confirmed',
      )!;
      booking.eventDate = target;
      booking.eventAddress = '5 avenue des Fêtes, 93100 Montreuil';
      booking.id = 'book-test';
    });
    const request = db.data.bookings.find((b) => b.id === 'book-test')!;

    await fireEvent.press(await screen.findByRole('button', { name: 'Mois suivant' }));
    expect(
      await screen.findByRole('button', { name: /, 5 avenue des Fêtes, 93100 Montreuil, / }),
    ).toBeOnTheScreen();
    await press(`${day(target)}, réservé, voir la réservation`);
    expect(screen).toHavePathname(`/pro/demande/${request.quoteRequestId}`);
    expect(await screen.findByText('La réservation')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Adresse : 5 avenue des Fêtes, 93100 Montreuil'),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Annuler la réservation' })).toBeNull();
  });

  it('règle le nombre de réservations max par jour (de 1 à 20)', async () => {
    const { db } = await open();
    const input = await screen.findByLabelText('Réservations max par jour');
    await waitFor(() => expect(input).toHaveDisplayValue(String(providerOf(db).maxBookingsPerDay)));

    await fireEvent.changeText(input, '0');
    expect(screen.getByText('Un nombre entre 1 et 20')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();

    await fireEvent.changeText(input, '3');
    await press('Enregistrer');
    expect(await screen.findByText('Réglage enregistré.')).toBeOnTheScreen();
    expect(providerOf(db).maxBookingsPerDay).toBe(3);
  });
});
