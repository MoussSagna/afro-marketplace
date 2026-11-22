import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createHttpApiClient } from '../../api';
import { MASKED_CONTACT_PLACEHOLDER } from '../../rules';
import { handlers, mockDb } from '..';

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => mockDb.reset());
afterAll(() => server.close());

const as = (userId: string) => createHttpApiClient({ getToken: () => `demo:${userId}` });
const client = as('user-aissatou');
const pro = as('user-saveurs-de-dakar');

/** La conversation de démo entre Aïssatou et Saveurs de Dakar (demande en attente). */
async function demoConversation() {
  const list = await client.listConversations('client');
  return list.find((c) => c.providerName === 'Saveurs de Dakar')!;
}

describe('API de la messagerie (mockée)', () => {
  it('liste les conversations, la plus récente d’abord', async () => {
    const list = await client.listConversations('client');
    expect(list.length).toBeGreaterThan(1);
    const dates = list.map((c) => c.conversation.lastMessageAt);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(list[0]!.otherParticipant.lastNameInitial).toMatch(/\.$|^$/);
  });

  it('règle n° 7 : masque le téléphone et l’email avant la réservation', async () => {
    const { conversation } = await demoConversation();
    const sent = await pro.sendMessage(conversation.id, {
      body: 'Appelez-moi au 06 11 22 33 44 ou écrivez à contact@saveurs.fr',
    });
    expect(sent.hasMaskedContent).toBe(true);
    expect(sent.body).toBe(
      `Appelez-moi au ${MASKED_CONTACT_PLACEHOLDER} ou écrivez à ${MASKED_CONTACT_PLACEHOLDER}`,
    );
  });

  it('compte les non-lus de l’autre côté, puis les remet à zéro à la lecture', async () => {
    const { conversation } = await demoConversation();
    const before = (await pro.listConversations('provider')).find(
      (c) => c.conversation.id === conversation.id,
    )!.unreadCount;

    await client.sendMessage(conversation.id, { body: 'Avez-vous pu regarder ?' });
    const after = (await pro.listConversations('provider')).find(
      (c) => c.conversation.id === conversation.id,
    )!;
    expect(after.unreadCount).toBe(before + 1);
    expect(after.lastMessage?.body).toBe('Avez-vous pu regarder ?');

    await pro.markConversationRead(conversation.id);
    const read = (await pro.listConversations('provider')).find(
      (c) => c.conversation.id === conversation.id,
    )!;
    expect(read.unreadCount).toBe(0);
  });

  it('une réponse du prestataire repousse l’expiration de la demande', async () => {
    const { conversation } = await demoConversation();
    const request = mockDb.data.quoteRequests.find((r) => r.id === conversation.quoteRequestId)!;
    const before = request.expiresAt;
    await pro.sendMessage(conversation.id, { body: 'Combien de plats souhaitez-vous ?' });
    expect(request.expiresAt > before).toBe(true);
  });

  it('refuse un message vide et une conversation qui n’est pas la sienne', async () => {
    const { conversation } = await demoConversation();
    await expect(client.sendMessage(conversation.id, { body: '' })).rejects.toMatchObject({
      status: 400,
    });
    await expect(as('user-admin').listMessages(conversation.id)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('enregistre un signalement', async () => {
    const { lastMessage } = await demoConversation();
    const report = await client.createReport({
      targetType: 'message',
      targetId: lastMessage!.id,
      reason: 'spam',
    });
    expect(report.status).toBe('open');
    expect(mockDb.data.reports.some((r) => r.id === report.id)).toBe(true);
  });
});
