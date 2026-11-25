import { DEMO_PROVIDER_ID, type MockDb } from '@afro/common/mocks';
import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import ConversationRoute from '../../../app/conversations/[id]';
import ProQuoteRoute from '../../../app/pro/devis/[id]';
import ProRequestRoute from '../../../app/pro/demande/[id]';
import { useSessionStore } from '@/stores/session';
import { demoApi, testProviders } from '@/test/demoApi';
import { useTabBarStore } from '../navigation/tabBarStore';

const routes = {
  'pro/demande/[id]': ProRequestRoute,
  'pro/devis/[id]': ProQuoteRoute,
  'conversations/[id]': ConversationRoute,
};

/** Se connecter (prestataire de démo par défaut), puis ouvrir une adresse sur la même base. */
async function open(initialUrl: string, ctx = demoApi(), userId: string = DEMO_PROVIDER_ID) {
  const user = ctx.db.data.users.find((u) => u.id === userId)!;
  await act(() => useSessionStore.getState().signIn({ user, token: `demo:${user.id}` }));
  await renderRouter(routes, { initialUrl, wrapper: testProviders(ctx.api) });
  return ctx;
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const type = (label: string, text: string) =>
  fireEvent.changeText(screen.getByLabelText(label), text);

/** Une demande reçue par le prestataire de démo, dans l'état voulu. */
function requestOf(db: MockDb, status: 'pending' | 'quoted') {
  const provider = db.data.providers.find((p) => p.userId === DEMO_PROVIDER_ID)!;
  return db.data.quoteRequests.find((r) => r.providerId === provider.id && r.status === status)!;
}

/** Les montants formatés par Intl ont des espaces insécables : on les remet en espaces simples. */
const plain = (text: string) => text.replace(/\s/g, ' ');

afterEach(() => {
  useTabBarStore.setState({ collapsed: false });
  useSessionStore.setState({ user: null, token: null });
  jest.useRealTimers();
});

describe('Envoyer un devis (lot M14b)', () => {
  it('lignes une à une, total et acompte en direct, puis le client le voit', async () => {
    const ctx = demoApi();
    const request = requestOf(ctx.db, 'pending');
    await open(`/pro/demande/${request.id}`, ctx);

    await fireEvent.press(await screen.findByRole('button', { name: 'Envoyer un devis' }));
    expect(screen).toHavePathname(`/pro/devis/${request.id}`);
    expect(await screen.findByText('Nouveau devis')).toBeOnTheScreen();

    // Rien de rempli : les erreurs de la ligne, rien n'est envoyé.
    await press('Envoyer');
    expect(screen.getByText('Décris la ligne')).toBeOnTheScreen();
    expect(screen.getByText('Prix invalide (ex. : 28,50)')).toBeOnTheScreen();
    expect(ctx.db.data.quotes.some((q) => q.quoteRequestId === request.id)).toBe(false);

    await type('Libellé de la ligne 1', 'Buffet tieb & yassa');
    await type('Quantité de la ligne 1', '120');
    await type('Prix unitaire de la ligne 1, en euros', '25');
    await press('Ajouter une ligne');
    await type('Libellé de la ligne 2', 'Service et vaisselle');
    await type('Prix unitaire de la ligne 2, en euros', '150');

    // 120 × 25 € + 150 € = 3 150 € ; acompte 30 % = 945 €, comme la maquette.
    const totals = screen.getByLabelText(/^Total \d/);
    expect(plain(totals.props.accessibilityLabel)).toBe('Total 3 150 €, acompte 945 €');

    await press('Envoyer');
    expect(
      await screen.findByText('Devis envoyé ! Le client le voit dans la conversation.'),
    ).toBeOnTheScreen();
    expect(screen).toHavePathname(`/pro/demande/${request.id}`);
    const quote = ctx.db.data.quotes.find((q) => q.quoteRequestId === request.id)!;
    expect(quote).toMatchObject({
      version: 1,
      status: 'sent',
      totalAmount: 315000,
      depositRate: 30,
    });
    expect(quote.lines.map((l) => l.label)).toEqual([
      'Buffet tieb & yassa',
      'Service et vaisselle',
    ]);
    expect(screen.getByRole('button', { name: 'Nouvelle version du devis' })).toBeOnTheScreen();

    // Côté client : le devis est dans la conversation, avec « Accepter le devis ».
    const conversation = ctx.db.data.conversations.find((c) => c.quoteRequestId === request.id)!;
    await open(`/conversations/${conversation.id}`, ctx, request.clientId);
    expect(await screen.findByText('Devis v1')).toBeOnTheScreen();
    expect(screen.getByText('Buffet tieb & yassa')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Accepter le devis' })).toBeOnTheScreen();
  });

  it('négocier : la nouvelle version reprend la précédente et la remplace', async () => {
    const ctx = demoApi();
    const request = requestOf(ctx.db, 'quoted');
    const previous = ctx.db.data.quotes
      .filter((q) => q.quoteRequestId === request.id)
      .sort((a, b) => b.version - a.version)[0]!;
    await open(`/pro/devis/${request.id}`, ctx);

    expect(
      await screen.findByText(`Nouvelle version du devis (n° ${previous.version + 1})`),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('Libellé de la ligne 1')).toHaveDisplayValue(
      previous.lines[0]!.label,
    );

    // Une ligne en moins, puis envoi.
    if (previous.lines.length > 1) {
      await press(`Supprimer la ligne ${previous.lines.length}`);
    }
    await press('Envoyer');
    expect(
      await screen.findByText('Devis envoyé ! Le client le voit dans la conversation.'),
    ).toBeOnTheScreen();
    const versions = ctx.db.data.quotes.filter((q) => q.quoteRequestId === request.id);
    expect(versions.find((q) => q.id === previous.id)!.status).toBe('superseded');
    expect(versions.find((q) => q.version === previous.version + 1)).toMatchObject({
      status: 'sent',
      lines: expect.any(Array),
    });
  });

  it('une demande close n’accepte plus de devis', async () => {
    const ctx = demoApi();
    const request = requestOf(ctx.db, 'pending');
    request.status = 'declined';
    await open(`/pro/devis/${request.id}`, ctx);
    expect(await screen.findByText('Cette demande n’accepte plus de devis.')).toBeOnTheScreen();
  });
});
