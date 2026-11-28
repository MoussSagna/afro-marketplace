import { DEMO_CLIENT_ID, type MockDb } from '@afro/common/mocks';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
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
  demandes: Empty,
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
    expect(await screen.findByText('Pas encore de messages')).toBeOnTheScreen();
    // Sans conversation, pas de pastilles de filtre.
    expect(screen.queryByRole('tab', { name: 'Tous' })).toBeNull();
    await press('Trouver un prestataire');
    expect(screen).toHavePathname('/');
  });
});

describe('Messagerie : liste des conversations (refonte)', () => {
  /** Les noms des conversations affichées, dans l'ordre. */
  const shownNames = (db: MockDb) =>
    clientConversations(db)
      .map((c) => c.providerName)
      .filter((name) => screen.queryByRole('button', { name: new RegExp(`^${escape(name)}, `) }));
  const row = (name: string) =>
    screen.getByRole('button', { name: new RegExp(`^${escape(name)}, `) });

  it('affiche la catégorie, le badge vérifié, « Toi : » et les non-lus de chaque conversation', async () => {
    const { db } = await open('/messages');
    const all = clientConversations(db);
    await screen.findByRole('button', { name: new RegExp(`^${escape(all[0]!.providerName)}, `) });

    const verified = all.find(
      (c) => db.data.providers.find((p) => p.id === c.request.providerId)!.isProVerified,
    )!;
    expect(row(verified.providerName).props.accessibilityLabel).toContain('Vérifié');
    const unverified = all.find(
      (c) => !db.data.providers.find((p) => p.id === c.request.providerId)!.isProVerified,
    )!;
    expect(row(unverified.providerName).props.accessibilityLabel).not.toContain('Vérifié');

    // Saveurs de Dakar est traiteur dans le jeu de démo.
    expect(row('Saveurs de Dakar').props.accessibilityLabel).toMatch(/Traiteur/);
    // Le dernier message envoyé par la cliente commence par « Toi : ».
    const mine = all.find((c) => {
      const last = db.data.messages.filter((m) => m.conversationId === c.conversation.id).at(-1);
      return last?.senderId === DEMO_CLIENT_ID && last.kind !== 'system';
    })!;
    expect(row(mine.providerName).props.accessibilityLabel).toContain('Toi : ');
  });

  it('filtre Tous / Non lus / Devis avec le compteur des non-lus', async () => {
    const { db } = await open('/messages');
    const all = clientConversations(db);
    const unread = all
      .filter((c) => c.conversation.unreadCountClient > 0)
      .map((c) => c.providerName);
    const quoted = all
      .filter((c) => db.data.quotes.some((q) => q.quoteRequestId === c.request.id))
      .map((c) => c.providerName);
    await screen.findByRole('button', { name: new RegExp(`^${escape(all[0]!.providerName)}, `) });
    expect(screen.getByRole('tab', { name: 'Tous' })).toBeSelected();

    await fireEvent.press(screen.getByRole('tab', { name: `Non lus (${unread.length})` }));
    expect(screen.getByRole('tab', { name: `Non lus (${unread.length})` })).toBeSelected();
    expect(shownNames(db)).toEqual(unread);

    await fireEvent.press(screen.getByRole('tab', { name: 'Devis' }));
    expect(shownNames(db)).toEqual(quoted);

    await fireEvent.press(screen.getByRole('tab', { name: 'Tous' }));
    expect(shownNames(db)).toEqual(all.map((c) => c.providerName));
  });

  it('Non lus sans message non lu : un état vide qui ramène à toutes les conversations', async () => {
    await open('/messages', {
      prepare: (db) => {
        for (const c of db.data.conversations) c.unreadCountClient = 0;
      },
    });
    await fireEvent.press(await screen.findByRole('tab', { name: 'Non lus' }));
    expect(screen.getByText('Tout est lu')).toBeOnTheScreen();
    await press('Voir toutes les conversations');
    expect(screen.getByRole('tab', { name: 'Tous' })).toBeSelected();
    expect(screen.queryByText('Tout est lu')).toBeNull();
  });

  it('recherche en temps réel, sans accents, avec un état « aucun résultat »', async () => {
    const { db } = await open('/messages');
    const all = clientConversations(db);
    await screen.findByRole('button', { name: new RegExp(`^${escape(all[0]!.providerName)}, `) });

    await press('Rechercher une conversation');
    const field = screen.getByLabelText('Rechercher un prestataire');
    await fireEvent.changeText(field, 'creoles');
    expect(shownNames(db)).toEqual(['Douceurs Créoles']);

    await fireEvent.changeText(field, 'zzz');
    expect(screen.getByText('Aucune conversation trouvée')).toBeOnTheScreen();
    await fireEvent.press(screen.getAllByRole('button', { name: 'Effacer la recherche' }).at(-1)!);
    expect(shownNames(db)).toHaveLength(all.length);

    // Fermer la loupe vide aussi la recherche.
    await fireEvent.changeText(field, 'akwaba');
    expect(shownNames(db)).toEqual(['Compagnie Akwaba']);
    await press('Fermer la recherche');
    expect(screen.queryByLabelText('Rechercher un prestataire')).toBeNull();
    expect(shownNames(db)).toHaveLength(all.length);
  });

  it('toucher une conversation non lue l’ouvre et la marque comme lue', async () => {
    const { db } = await open('/messages');
    const target = clientConversations(db).find((c) => c.conversation.unreadCountClient > 0)!;
    await fireEvent.press(
      await screen.findByRole('button', { name: new RegExp(`^${escape(target.providerName)}, `) }),
    );
    expect(screen).toHavePathname(`/conversations/${target.conversation.id}`);
    expect(await screen.findByRole('header', { name: target.providerName })).toBeOnTheScreen();
    await waitFor(() =>
      expect(
        db.data.conversations.find((c) => c.id === target.conversation.id)!.unreadCountClient,
      ).toBe(0),
    );
  });

  it('« Nouvelle conversation » reprend le parcours existant : la Recherche', async () => {
    await open('/messages');
    await press('Nouvelle conversation');
    expect(screen).toHavePathname('/');
  });

  it('en cas d’erreur : un message clair et « Réessayer »', async () => {
    const ctx = demoApi();
    const user = ctx.db.data.users.find((u) => u.id === DEMO_CLIENT_ID)!;
    await act(() => useSessionStore.getState().signIn({ user, token: `demo:${user.id}` }));
    const original = ctx.api.listConversations.bind(ctx.api);
    let fail = true;
    ctx.api.listConversations = (side) =>
      fail ? Promise.reject(new Error('réseau')) : original(side);
    await renderRouter(routes, { initialUrl: '/messages', wrapper: testProviders(ctx.api) });

    expect(await screen.findByText('Impossible de charger tes messages')).toBeOnTheScreen();
    fail = false;
    await press('Réessayer');
    expect(
      await screen.findByRole('button', {
        name: new RegExp(`^${escape(clientConversations(ctx.db)[0]!.providerName)}, `),
      }),
    ).toBeOnTheScreen();
  });
});

/** Échappe un texte pour l'utiliser dans une expression régulière. */
function escape(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
