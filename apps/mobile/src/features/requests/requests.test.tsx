import { DEMO_CLIENT_ID, type MockDb } from '@afro/common/mocks';
import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import RequestRoute from '../../../app/demande/[id]';
import RequestsTab from '../../../app/(tabs)/demandes';
import { useSessionStore } from '@/stores/session';
import { demoApi, testProviders } from '@/test/demoApi';
import { ClientTabsLayout } from '../navigation/ClientTabsLayout';
import { useTabBarStore } from '../navigation/tabBarStore';
import { requestTab } from './requestTab';

const Empty = () => null;
const routes = {
  '(tabs)/_layout': ClientTabsLayout,
  '(tabs)/index': Empty,
  '(tabs)/demandes': RequestsTab,
  '(tabs)/messages': Empty,
  '(tabs)/compte': Empty,
  'demande/[id]': RequestRoute,
  'conversations/[id]': Empty,
};

/** Les demandes de la cliente de démo, avec le nom du prestataire. */
function clientRequests(db: MockDb) {
  return db.data.quoteRequests
    .filter((r) => r.clientId === DEMO_CLIENT_ID)
    .map((request) => ({
      request,
      providerName: db.data.providers.find((p) => p.id === request.providerId)!.displayName,
    }));
}

async function open(initialUrl: string, prepare?: (db: MockDb) => void) {
  const ctx = demoApi();
  prepare?.(ctx.db);
  const user = ctx.db.data.users.find((u) => u.id === DEMO_CLIENT_ID)!;
  await act(() => useSessionStore.getState().signIn({ user, token: `demo:${user.id}` }));
  await renderRouter(routes, { initialUrl, wrapper: testProviders(ctx.api) });
  return ctx;
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));

afterEach(() => {
  useTabBarStore.setState({ collapsed: false });
  useSessionStore.setState({ user: null, token: null });
  jest.useRealTimers();
});

describe('Mes demandes (lot M10)', () => {
  it('range les demandes en 3 onglets, avec leur badge', async () => {
    const { db } = await open('/demandes');
    const all = clientRequests(db);
    const open1 = all.filter((r) => requestTab(r.request.status) === 'open');
    const booked = all.filter((r) => requestTab(r.request.status) === 'booked');
    const closed = all.filter((r) => requestTab(r.request.status) === 'closed');

    expect(
      await screen.findByRole('tab', { name: `En cours · ${open1.length}`, selected: true }),
    ).toBeOnTheScreen();
    for (const { providerName } of open1) {
      expect(
        screen.getAllByRole('button', { name: new RegExp(`^${providerName}, `) }).length,
      ).toBeGreaterThan(0);
    }
    const quoted = open1.find((r) => r.request.status === 'quoted')!;
    expect(
      screen.getByRole('button', { name: new RegExp(`^${quoted.providerName}, Devis reçu, `) }),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('tab', { name: `Réservées · ${booked.length}` }));
    expect(
      screen.getAllByRole('button', { name: new RegExp(`^${booked[0]!.providerName}, Réservée, `) })
        .length,
    ).toBeGreaterThan(0);

    await fireEvent.press(screen.getByRole('tab', { name: `Terminées · ${closed.length}` }));
    expect(screen.getAllByRole('button', { name: /, (Déclinée|Expirée|Annulée), / })).toHaveLength(
      closed.length,
    );
  });

  it('ouvre le détail : événement, message, devis, et « Poser une question »', async () => {
    const ctx = demoApi();
    const target = clientRequests(ctx.db).find((r) => r.request.status === 'quoted')!;
    const { db } = await open(`/demande/${target.request.id}`);

    expect(await screen.findByText(target.providerName)).toBeOnTheScreen();
    expect(screen.getByText('Devis reçu')).toBeOnTheScreen();
    expect(screen.getByText(target.request.message)).toBeOnTheScreen();
    const latest = db.data.quotes
      .filter((q) => q.quoteRequestId === target.request.id)
      .sort((a, b) => b.version - a.version)[0]!;
    expect(screen.getByText(`Devis v${latest.version}`)).toBeOnTheScreen();

    await press('Poser une question');
    const conversation = db.data.conversations.find((c) => c.quoteRequestId === target.request.id)!;
    expect(screen).toHavePathname(`/conversations/${conversation.id}`);
  });

  it('annule une demande après confirmation', async () => {
    const ctx = demoApi();
    const target = clientRequests(ctx.db).find((r) => r.request.status === 'pending')!;
    const { db } = await open(`/demande/${target.request.id}`);

    await fireEvent.press(await screen.findByRole('button', { name: 'Annuler la demande' }));
    expect(screen.getByText('Annuler cette demande ?')).toBeOnTheScreen();
    await press('Garder ma demande');
    expect(screen.queryByText('Annuler cette demande ?')).toBeNull();

    await press('Annuler la demande');
    await press('Oui, annuler');
    expect(await screen.findByText('Ta demande est annulée.')).toBeOnTheScreen();
    expect(screen.getByText('Annulée')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Annuler la demande' })).toBeNull();
    expect(db.data.quoteRequests.find((r) => r.id === target.request.id)!.status).toBe('cancelled');
  });

  it('sans demande : un état vide qui renvoie vers la recherche', async () => {
    await open('/demandes', (db) => {
      db.data.quoteRequests = db.data.quoteRequests.filter((r) => r.clientId !== DEMO_CLIENT_ID);
    });
    expect(await screen.findByText('Aucune demande en cours')).toBeOnTheScreen();
    await press('Trouver un prestataire');
    expect(screen).toHavePathname('/');
  });
});
