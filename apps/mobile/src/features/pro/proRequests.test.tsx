import { DEMO_PROVIDER_ID, type MockDb } from '@afro/common/mocks';
import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import ProConversationRoute from '../../../app/pro/conversations/[id]';
import ProRequestRoute from '../../../app/pro/demande/[id]';
import ProRequestsTab from '../../../app/pro/(tabs)/demandes';
import DashboardTab from '../../../app/pro/(tabs)/index';
import ProMessagesTab from '../../../app/pro/(tabs)/messages';
import { useModeStore } from '@/stores/mode';
import { useSessionStore } from '@/stores/session';
import { demoApi, testProviders } from '@/test/demoApi';
import { useTabBarStore } from '../navigation/tabBarStore';
import { clientName } from './clientName';
import { ProTabsLayout } from './ProTabsLayout';
import { requestsToHandle } from './requestUrgency';

const Empty = () => null;
const routes = {
  'pro/(tabs)/_layout': ProTabsLayout,
  'pro/(tabs)/index': DashboardTab,
  'pro/(tabs)/demandes': ProRequestsTab,
  'pro/(tabs)/messages': ProMessagesTab,
  'pro/(tabs)/agenda': Empty,
  'pro/(tabs)/profil': Empty,
  'pro/demande/[id]': ProRequestRoute,
  'pro/conversations/[id]': ProConversationRoute,
};

/** Ouvre une adresse du mode pro, connecté comme le prestataire de démo (Saveurs de Dakar). */
async function open(initialUrl: string, prepare?: (db: MockDb) => void) {
  const ctx = demoApi();
  prepare?.(ctx.db);
  const user = ctx.db.data.users.find((u) => u.id === DEMO_PROVIDER_ID)!;
  await act(() => useSessionStore.getState().signIn({ user, token: `demo:${user.id}` }));
  await renderRouter(routes, { initialUrl, wrapper: testProviders(ctx.api) });
  return ctx;
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));

/** Les demandes reçues par le prestataire de démo, et la plus urgente à traiter. */
function received(db: MockDb) {
  const provider = db.data.providers.find((p) => p.userId === DEMO_PROVIDER_ID)!;
  const requests = db.data.quoteRequests.filter((r) => r.providerId === provider.id);
  const pending = requestsToHandle(requests.map((request) => ({ request })))[0]!.request;
  const nameOf = (clientId: string) => {
    const user = db.data.users.find((u) => u.id === clientId)!;
    return clientName({ firstName: user.firstName, lastNameInitial: `${user.lastName[0]}.` });
  };
  return { provider, requests, pending, nameOf };
}

afterEach(() => {
  useTabBarStore.setState({ collapsed: false });
  useModeStore.setState({ mode: 'client' });
  useSessionStore.setState({ user: null, token: null });
  jest.useRealTimers();
});

describe('Demandes reçues et messagerie pro (lot M14a)', () => {
  it('liste les demandes reçues au nom des clients, puis ouvre le détail', async () => {
    const { db } = await open('/pro/demandes');
    const { requests, pending, nameOf } = received(db);
    expect(await screen.findByText('Demandes reçues')).toBeOnTheScreen();

    const inProgress = requests.filter((r) => ['pending', 'quoted'].includes(r.status));
    expect(
      await screen.findAllByRole('button', { name: /, (Nouveau|Expire .+|Devis envoyé), / }),
    ).toHaveLength(inProgress.length);

    await fireEvent.press(
      screen.getAllByRole('button', { name: new RegExp(`^${nameOf(pending.clientId)}, `) })[0]!,
    );
    expect(screen).toHavePathname(`/pro/demande/${pending.id}`);
    expect(await screen.findByText('Son message')).toBeOnTheScreen();
    expect(screen.getByText(pending.message)).toBeOnTheScreen();
    expect(screen.getByText(/^Sans réponse, la demande expire le /)).toBeOnTheScreen();
    expect(await screen.findByText(/^Tu es libre ce jour-là/)).toBeOnTheScreen();
  });

  it('une demande du tableau de bord ouvre son détail', async () => {
    const { db } = await open('/pro');
    const { pending, nameOf } = received(db);
    await fireEvent.press(
      await screen.findByRole('button', { name: new RegExp(`^${nameOf(pending.clientId)} · `) }),
    );
    expect(screen).toHavePathname(`/pro/demande/${pending.id}`);
  });

  it('prévient quand le jour est déjà pris', async () => {
    const { pending } = received(demoApi().db);
    await open(`/pro/demande/${pending.id}`, (db) => {
      db.data.unavailabilities.push({
        id: 'unav-test',
        providerId: pending.providerId,
        date: pending.eventDate,
        reason: 'manual',
        createdAt: '2026-11-20T10:00:00.000Z',
        updatedAt: '2026-11-20T10:00:00.000Z',
      });
    });
    expect(await screen.findByText(/^Tu n’es pas libre ce jour-là/)).toBeOnTheScreen();
  });

  it('décline une demande : motif obligatoire, puis le client le lit dans la conversation', async () => {
    const { pending } = received(demoApi().db);
    const { db } = await open(`/pro/demande/${pending.id}`);

    await fireEvent.press(await screen.findByRole('button', { name: 'Décliner' }));
    await press('Décliner la demande');
    expect(screen.getByText('Indique un motif')).toBeOnTheScreen();

    await press('Le budget est trop éloigné de mes tarifs.');
    await press('Décliner la demande');
    expect(
      await screen.findByText('Demande déclinée. Le client a reçu ton motif.'),
    ).toBeOnTheScreen();
    expect(db.data.quoteRequests.find((r) => r.id === pending.id)).toMatchObject({
      status: 'declined',
      declineReason: 'Le budget est trop éloigné de mes tarifs.',
    });
    expect(
      screen.getByText('Motif du refus : Le budget est trop éloigné de mes tarifs.'),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Décliner' })).toBeNull();
  });

  it('messagerie côté pro : la liste au nom des clients, puis répondre', async () => {
    const { db: seed } = demoApi();
    const { pending, nameOf } = received(seed);
    const conversation = seed.data.conversations.find((c) => c.quoteRequestId === pending.id)!;
    const name = nameOf(pending.clientId);

    const { db } = await open('/pro/messages');
    await fireEvent.press(
      (await screen.findAllByRole('button', { name: new RegExp(`^${name}, `) }))[0]!,
    );
    expect(screen).toHavePathname(`/pro/conversations/${conversation.id}`);
    expect(await screen.findByLabelText(`Conversation avec ${name}`)).toBeOnTheScreen();

    await fireEvent.changeText(await screen.findByLabelText('Ton message'), 'Avec plaisir !');
    await press('Envoyer');
    expect(await screen.findByLabelText(/^Avec plaisir !/)).toBeOnTheScreen();
    expect(db.data.messages.at(-1)).toMatchObject({
      conversationId: conversation.id,
      senderId: DEMO_PROVIDER_ID,
      body: 'Avec plaisir !',
    });
  });

  it('un devis envoyé s’affiche dans le fil, sans les boutons du client', async () => {
    const { db: seed } = demoApi();
    const { requests } = received(seed);
    const quoted = requests.find((r) => r.status === 'quoted')!;
    const conversation = seed.data.conversations.find((c) => c.quoteRequestId === quoted.id)!;
    await open(`/pro/conversations/${conversation.id}`);
    expect(await screen.findByText(/^Devis v\d/)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Accepter le devis' })).toBeNull();
  });
});
