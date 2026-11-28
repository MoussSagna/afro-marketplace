import { DEMO_CLIENT_ID, DEMO_PROVIDER_ID } from '@afro/common/mocks';
import { useSessionStore } from '@/stores/session';
import { demoApi } from '@/test/demoApi';
import {
  buildConversationEntries,
  conversationCounts,
  matchesQuery,
  searchable,
  visibleConversations,
  type ConversationEntry,
} from './conversationList';

const labels = {
  category: (ids: string[]) => `catégorie ${ids[0]}`,
  eventType: (type: string) => `événement ${type}`,
};

/** Les conversations et les demandes de démo, telles que l'API les renvoie à un compte. */
async function load(userId: string, side: 'client' | 'provider') {
  const { db, api } = demoApi();
  const user = db.data.users.find((u) => u.id === userId)!;
  useSessionStore.setState({ user, token: `demo:${user.id}` });
  const [conversations, requests] = await Promise.all([
    api.listConversations(side),
    api.listQuoteRequests(side),
  ]);
  return { db, conversations, requests };
}

afterEach(() => useSessionStore.setState({ user: null, token: null }));

describe('liste des conversations : données', () => {
  it('côté client : photo, catégorie, badge vérifié et devis viennent de la demande', async () => {
    const { conversations, requests } = await load(DEMO_CLIENT_ID, 'client');
    const entries = buildConversationEntries(conversations, requests, 'client', labels);

    expect(entries.map((e) => e.summary.conversation.id)).toEqual(
      conversations.map((c) => c.conversation.id),
    );
    for (const entry of entries) {
      const request = requests.find((r) => r.conversationId === entry.summary.conversation.id)!;
      expect(entry.name).toBe(entry.summary.providerName);
      expect(entry.subtitle).toBe(`catégorie ${request.provider.categoryIds[0]}`);
      expect(entry.avatarUrl).toBe(request.provider.coverUrl);
      expect(entry.verified).toBe(request.provider.isProVerified);
      expect(entry.hasQuote).toBe(Boolean(request.latestQuote));
    }
  });

  it('côté prestataire : le nom du client, le type d’événement, jamais de badge', async () => {
    const { conversations, requests } = await load(DEMO_PROVIDER_ID, 'provider');
    const entries = buildConversationEntries(conversations, requests, 'provider', labels);
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      const { firstName, lastNameInitial } = entry.summary.otherParticipant;
      expect(entry.name).toBe(`${firstName} ${lastNameInitial}`.trim());
      expect(entry.subtitle).toMatch(/^événement /);
      expect(entry.verified).toBe(false);
    }
  });

  it('sans les demandes (pas encore chargées ou en erreur) : la liste reste affichable', async () => {
    const { conversations } = await load(DEMO_CLIENT_ID, 'client');
    const entries = buildConversationEntries(conversations, undefined, 'client', labels);
    expect(entries).toHaveLength(conversations.length);
    expect(entries.every((e) => e.subtitle === undefined && !e.verified && !e.hasQuote)).toBe(true);
  });
});

describe('liste des conversations : filtres et recherche', () => {
  const entry = (
    name: string,
    {
      unread = 0,
      hasQuote = false,
      subtitle,
    }: { unread?: number; hasQuote?: boolean; subtitle?: string },
  ) =>
    ({
      name,
      subtitle,
      hasQuote,
      verified: false,
      summary: { conversation: { id: name }, unreadCount: unread },
    }) as unknown as ConversationEntry;

  const entries = [
    entry('Saveurs de Dakar', { unread: 2, subtitle: 'Traiteur & boissons' }),
    entry('Compagnie Akwaba', { hasQuote: true, subtitle: 'Danse & spectacles' }),
    entry('Douceurs Créoles', { hasQuote: true, unread: 1, subtitle: 'Pâtisserie & desserts' }),
    entry('Fatou Gâteaux', {}),
  ];
  const names = (list: ConversationEntry[]) => list.map((e) => e.name);

  it('compte les conversations derrière chaque pastille', () => {
    expect(conversationCounts(entries)).toEqual({ all: 4, unread: 2, quotes: 2 });
    expect(conversationCounts([])).toEqual({ all: 0, unread: 0, quotes: 0 });
  });

  it('Tous / Non lus / Devis', () => {
    expect(names(visibleConversations(entries, 'all', ''))).toHaveLength(4);
    expect(names(visibleConversations(entries, 'unread', ''))).toEqual([
      'Saveurs de Dakar',
      'Douceurs Créoles',
    ]);
    expect(names(visibleConversations(entries, 'quotes', ''))).toEqual([
      'Compagnie Akwaba',
      'Douceurs Créoles',
    ]);
  });

  it('cherche sans tenir compte des accents ni des majuscules, sur le nom et la catégorie', () => {
    expect(searchable('  Douceurs CRÉOLES ')).toBe('douceurs creoles');
    expect(names(visibleConversations(entries, 'all', 'creoles'))).toEqual(['Douceurs Créoles']);
    expect(names(visibleConversations(entries, 'all', 'GATEAU'))).toEqual(['Fatou Gâteaux']);
    expect(names(visibleConversations(entries, 'all', 'traiteur'))).toEqual(['Saveurs de Dakar']);
    expect(matchesQuery(entries[0]!, '   ')).toBe(true);
    expect(visibleConversations(entries, 'all', 'zzz')).toEqual([]);
  });

  it('combine la pastille et la recherche', () => {
    expect(names(visibleConversations(entries, 'quotes', 'akwaba'))).toEqual(['Compagnie Akwaba']);
    expect(visibleConversations(entries, 'unread', 'akwaba')).toEqual([]);
  });
});
