import { DEMO_CLIENT_ID, DEMO_PROVIDER_ID, type MockDb } from '@afro/common/mocks';
import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import AccountTab from '../../../app/(tabs)/compte';
import HomeTab from '../../../app/(tabs)/index';
import ProAgendaTab from '../../../app/pro/(tabs)/agenda';
import ProRequestsTab from '../../../app/pro/(tabs)/demandes';
import DashboardTab from '../../../app/pro/(tabs)/index';
import ProMessagesTab from '../../../app/pro/(tabs)/messages';
import ProProfileTab from '../../../app/pro/(tabs)/profil';
import { useModeStore } from '@/stores/mode';
import { useSessionStore } from '@/stores/session';
import { demoApi, testProviders } from '@/test/demoApi';
import { ClientTabsLayout } from '../navigation/ClientTabsLayout';
import { useTabBarStore } from '../navigation/tabBarStore';
import { ProTabsLayout } from './ProTabsLayout';
import { requestsToHandle } from './requestUrgency';

const Empty = () => null;
const routes = {
  '(tabs)/_layout': ClientTabsLayout,
  '(tabs)/index': HomeTab,
  '(tabs)/recherche': Empty,
  '(tabs)/demandes': Empty,
  '(tabs)/messages': Empty,
  '(tabs)/compte': AccountTab,
  'pro/(tabs)/_layout': ProTabsLayout,
  'pro/(tabs)/index': DashboardTab,
  'pro/(tabs)/demandes': ProRequestsTab,
  'pro/(tabs)/messages': ProMessagesTab,
  'pro/(tabs)/agenda': ProAgendaTab,
  'pro/(tabs)/profil': ProProfileTab,
};

async function open(initialUrl: string, userId: string, prepare?: (db: MockDb) => void) {
  const ctx = demoApi();
  prepare?.(ctx.db);
  const user = ctx.db.data.users.find((u) => u.id === userId)!;
  await act(() => useSessionStore.getState().signIn({ user, token: `demo:${user.id}` }));
  await renderRouter(routes, { initialUrl, wrapper: testProviders(ctx.api) });
  return ctx;
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));

/** Ce que le tableau de bord doit montrer pour le prestataire de démo (Saveurs de Dakar). */
function expected(db: MockDb) {
  const provider = db.data.providers.find((p) => p.userId === DEMO_PROVIDER_ID)!;
  const requests = db.data.quoteRequests.filter((r) => r.providerId === provider.id);
  const upcoming = db.data.bookings.filter(
    (b) => b.providerId === provider.id && b.status === 'confirmed' && b.eventDate >= '2026-11-23',
  );
  return { provider, pending: requests.filter((r) => r.status === 'pending'), upcoming };
}

afterEach(() => {
  useTabBarStore.setState({ collapsed: false });
  useModeStore.setState({ mode: 'client' });
  useSessionStore.setState({ user: null, token: null });
  jest.useRealTimers();
});

describe('Mode prestataire (lot M13)', () => {
  it('un prestataire passe en mode pro depuis Compte : barre brune et tableau de bord', async () => {
    const { db } = await open('/compte', DEMO_PROVIDER_ID);
    const { provider, pending, upcoming } = expected(db);

    await fireEvent.press(await screen.findByRole('button', { name: 'Passer en mode pro' }));
    expect(useModeStore.getState().mode).toBe('pro');
    expect(screen).toHavePathname('/pro');
    expect(screen.getByTestId('glass-tab-bar-pro')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Tableau', selected: true })).toBeOnTheScreen();

    expect(await screen.findByText(provider.displayName)).toBeOnTheScreen();
    expect(screen.getByText('En ligne')).toBeOnTheScreen();
    const label = pending.length > 1 ? 'demandes à traiter' : 'demande à traiter';
    expect(screen.getByLabelText(`${pending.length} ${label}`)).toBeOnTheScreen();
    const bookings = upcoming.length > 1 ? 'réservations à venir' : 'réservation à venir';
    expect(screen.getByLabelText(`${upcoming.length} ${bookings}`)).toBeOnTheScreen();
    expect(
      screen.getByLabelText(new RegExp(`note \\(${provider.ratingCount} avis\\)$`)),
    ).toBeOnTheScreen();
  });

  it('liste les demandes à traiter (la plus urgente d’abord) et les prochaines dates', async () => {
    const { db } = await open('/pro', DEMO_PROVIDER_ID);
    const { pending, upcoming } = expected(db);
    await screen.findByText('À traiter');

    const rows = screen.getAllByLabelText(/, (Nouveau|Expire .+)$/);
    expect(rows).toHaveLength(Math.min(pending.length, 5));
    const first = requestsToHandle(pending.map((request) => ({ request })))[0]!;
    const client = db.data.users.find((u) => u.id === first.request.clientId)!;
    expect(rows[0]).toHaveAccessibleName(new RegExp(`^${client.firstName} `));

    for (const booking of upcoming.slice(0, 5)) {
      expect(screen.getByText(booking.eventAddress)).toBeOnTheScreen();
    }
  });

  it('les onglets pro encore vides annoncent leur lot, et Profil ramène au mode client', async () => {
    await act(() => useModeStore.setState({ mode: 'pro' }));
    await open('/pro', DEMO_PROVIDER_ID);
    await fireEvent.press(await screen.findByRole('tab', { name: 'Profil' }));
    expect(screen.getByText('Lot M15')).toBeOnTheScreen();

    await press('Revenir en mode client');
    expect(useModeStore.getState().mode).toBe('client');
    expect(screen).toHavePathname('/compte');
    expect(screen.getByTestId('glass-tab-bar')).toBeOnTheScreen();
  });

  it('rouvre l’app sur le tableau de bord si on était en mode pro', async () => {
    await act(() => useModeStore.setState({ mode: 'pro' }));
    await open('/', DEMO_PROVIDER_ID);
    expect(screen).toHavePathname('/pro');
  });

  it('le mode pro est réservé aux prestataires', async () => {
    await open('/compte', DEMO_CLIENT_ID);
    expect(await screen.findByRole('button', { name: 'Devenir pro' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Passer en mode pro' })).toBeNull();
  });

  it('une cliente qui ouvre /pro voit que c’est réservé', async () => {
    await act(() => useModeStore.setState({ mode: 'pro' }));
    await open('/pro', DEMO_CLIENT_ID);
    expect(
      await screen.findByText(
        'Le mode pro est réservé aux prestataires. Crée ton profil sur le site pour y accéder.',
      ),
    ).toBeOnTheScreen();
    // Et l'accueil ne la redirige pas.
    await open('/', DEMO_CLIENT_ID);
    expect(screen).toHavePathname('/');
  });
});
