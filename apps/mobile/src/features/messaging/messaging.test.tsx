import { DEMO_CLIENT_ID, type MockDb } from '@afro/common/mocks';
import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import ConversationRoute from '../../../app/conversations/[id]';
import MessagesTab from '../../../app/(tabs)/messages';
import { useSessionStore } from '@/stores/session';
import { demoApi, testProviders } from '@/test/demoApi';
import { useAuthFlowStore } from '../auth/authFlowStore';
import { ClientTabsLayout } from '../navigation/ClientTabsLayout';
import { useTabBarStore } from '../navigation/tabBarStore';

const Empty = () => null;
const routes = {
  '(tabs)/_layout': ClientTabsLayout,
  '(tabs)/index': Empty,
  '(tabs)/recherche': Empty,
  '(tabs)/demandes': Empty,
  '(tabs)/messages': MessagesTab,
  '(tabs)/compte': Empty,
  'conversations/[id]': ConversationRoute,
  '(auth)/bienvenue': Empty,
};

/** Les conversations de la cliente de démo, comme la liste les montre (la plus récente d'abord). */
function clientConversations(db: MockDb) {
  return db.data.conversations
    .filter((c) => c.clientId === DEMO_CLIENT_ID)
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
    .map((conversation) => {
      const request = db.data.quoteRequests.find((r) => r.id === conversation.quoteRequestId)!;
      const provider = db.data.providers.find((p) => p.id === request.providerId)!;
      return { conversation, request, providerName: provider.displayName };
    });
}

/** Ouvre une adresse, connecté comme la cliente de démo (ou sans compte). */
async function open(
  initialUrl: string,
  { signedIn = true, prepare }: { signedIn?: boolean; prepare?: (db: MockDb) => void } = {},
) {
  const ctx = demoApi();
  prepare?.(ctx.db);
  if (signedIn) {
    const user = ctx.db.data.users.find((u) => u.id === DEMO_CLIENT_ID)!;
    await act(() => useSessionStore.getState().signIn({ user, token: `demo:${user.id}` }));
  }
  await renderRouter(routes, { initialUrl, wrapper: testProviders(ctx.api) });
  return ctx;
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));

afterEach(() => {
  useTabBarStore.setState({ collapsed: false });
  useAuthFlowStore.setState({ redirectTo: null });
  useSessionStore.setState({ user: null, token: null });
  jest.useRealTimers();
});

describe('Messagerie (lot M10)', () => {
  it('sans compte : demande de se connecter', async () => {
    await open('/messages', { signedIn: false });
    expect(screen.getByText('Connecte-toi pour discuter avec les prestataires.')).toBeOnTheScreen();
  });

  it('liste les conversations, avec la pastille des non-lus', async () => {
    const { db } = await open('/messages');
    const conversations = clientConversations(db);
    expect(conversations.length).toBeGreaterThan(0);
    for (const { providerName } of conversations) {
      expect(
        await screen.findByRole('button', { name: new RegExp(`^${providerName}, `) }),
      ).toBeOnTheScreen();
    }
    const unread = conversations.find((c) => c.conversation.unreadCountClient > 0)!;
    expect(
      screen.getByRole('button', {
        name: new RegExp(
          `^${unread.providerName}, ${unread.conversation.unreadCountClient} non lus?, `,
        ),
      }),
    ).toBeOnTheScreen();
  });

  it('ouvre le fil, le marque comme lu, et montre le devis dans le fil', async () => {
    const ctx = demoApi();
    // Le jeu de démo a une conversation non lue avec un devis.
    const target = clientConversations(ctx.db).find(
      (c) =>
        c.conversation.unreadCountClient > 0 &&
        ctx.db.data.quotes.some((q) => q.quoteRequestId === c.request.id),
    )!;
    const { db } = await open(`/conversations/${target.conversation.id}`);

    expect(await screen.findByRole('header', { name: target.providerName })).toBeOnTheScreen();
    const lastText = db.data.messages
      .filter((m) => m.conversationId === target.conversation.id && m.kind === 'text')
      .at(-1)!;
    expect(
      await screen.findByLabelText(new RegExp(`^${escape(lastText.body.slice(0, 20))}`)),
    ).toBeOnTheScreen();

    const quote = db.data.quotes.find((q) => q.quoteRequestId === target.request.id)!;
    expect(await screen.findByText(`Devis v${quote.version}`)).toBeOnTheScreen();
    // Lue : le compteur de la conversation retombe à zéro.
    await screen.findByText(target.providerName);
    expect(
      db.data.conversations.find((c) => c.id === target.conversation.id)!.unreadCountClient,
    ).toBe(0);
  });

  it('envoie un message, et masque un numéro de téléphone (règle n° 7)', async () => {
    const ctx = demoApi();
    const open1 = clientConversations(ctx.db).find((c) =>
      ['pending', 'quoted', 'accepted'].includes(c.request.status),
    )!;
    const { db } = await open(`/conversations/${open1.conversation.id}`);
    const input = await screen.findByLabelText('Ton message');
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeDisabled();

    await fireEvent.changeText(input, 'Merci ! Appelez-moi au 06 12 34 56 78 demain.');
    await press('Envoyer');

    expect(
      await screen.findByLabelText(/^Merci ! Appelez-moi au coordonnées masquées demain\./),
    ).toBeOnTheScreen();
    expect(
      screen.getAllByText('Les coordonnées s’affichent après la réservation.').length,
    ).toBeGreaterThan(0);
    expect(screen.getByLabelText('Ton message')).toHaveDisplayValue('');
    const sent = db.data.messages.at(-1)!;
    expect(sent).toMatchObject({ senderId: DEMO_CLIENT_ID, hasMaskedContent: true });
    expect(sent.body).not.toContain('06 12');
  });

  it('ferme la conversation d’une demande close', async () => {
    const ctx = demoApi();
    const target = clientConversations(ctx.db)[0]!;
    await open(`/conversations/${target.conversation.id}`, {
      prepare: (db) => {
        db.data.quoteRequests.find((r) => r.id === target.request.id)!.status = 'cancelled';
      },
    });
    expect(
      await screen.findByText('Cette demande est close : la conversation est fermée.'),
    ).toBeOnTheScreen();
    expect(screen.queryByLabelText('Ton message')).toBeNull();
    expect(screen.getByText('Annulée')).toBeOnTheScreen();
  });

  it('sans conversation : un état vide qui renvoie vers la recherche', async () => {
    await open('/messages', {
      prepare: (db) => {
        db.data.conversations = db.data.conversations.filter((c) => c.clientId !== DEMO_CLIENT_ID);
      },
    });
    expect(await screen.findByText('Aucune conversation')).toBeOnTheScreen();
    await press('Trouver un prestataire');
    expect(screen).toHavePathname('/recherche');
  });
});

/** Échappe un texte pour l'utiliser dans une expression régulière. */
function escape(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
