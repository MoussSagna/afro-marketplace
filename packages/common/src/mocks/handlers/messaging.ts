import { delay, http, HttpResponse } from 'msw';
import { createReportInputSchema, sendMessageInputSchema } from '../../schemas';
import type { ConversationSummary, Report } from '../../types';
import {
  conversationSide,
  extendQuoteRequestOnProviderReply,
  isConversationClosed,
  postMessage,
} from '../conversations';
import type { MockDb } from '../db';
import { toPublicUser } from '../mappers';
import { apiError, currentUser, invalidInput } from './http';

/** Messagerie (C4 / S5) et signalements. Lot 4. */
export function messagingHandlers(db: MockDb) {
  /** La conversation et le côté de l'utilisateur connecté (404 s'il n'en fait pas partie). */
  function findForUser(conversationId: string, userId: string) {
    const conversation = db.data.conversations.find((c) => c.id === conversationId);
    const side = conversation && conversationSide(conversation, userId);
    return conversation && side ? { conversation, side } : undefined;
  }

  return [
    http.get('*/api/conversations', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return apiError(401, 'unauthenticated', 'Connecte-toi pour continuer.');

      const side = new URL(request.url).searchParams.get('side') ?? 'client';
      const summaries: ConversationSummary[] = db.data.conversations
        .filter((c) => (side === 'provider' ? c.providerUserId : c.clientId) === user.id)
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
        .map((conversation) => {
          const otherId = side === 'provider' ? conversation.clientId : conversation.providerUserId;
          const other = db.data.users.find((u) => u.id === otherId)!;
          const quoteRequest = db.data.quoteRequests.find(
            (r) => r.id === conversation.quoteRequestId,
          )!;
          const provider = db.data.providers.find((p) => p.id === quoteRequest.providerId)!;
          const messages = db.data.messages.filter((m) => m.conversationId === conversation.id);
          return {
            conversation,
            otherParticipant: toPublicUser(other),
            providerName: provider.displayName,
            lastMessage: messages.at(-1),
            unreadCount:
              side === 'provider'
                ? conversation.unreadCountProvider
                : conversation.unreadCountClient,
          };
        });
      return HttpResponse.json(summaries);
    }),

    http.get('*/api/conversations/:conversationId/messages', async ({ params, request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return apiError(401, 'unauthenticated', 'Connecte-toi pour continuer.');

      const found = findForUser(String(params.conversationId), user.id);
      if (!found) return apiError(404, 'conversation_not_found', 'Conversation introuvable.');
      const messages = db.data.messages
        .filter((m) => m.conversationId === found.conversation.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return HttpResponse.json(messages);
    }),

    http.post('*/api/conversations/:conversationId/messages', async ({ params, request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return apiError(401, 'unauthenticated', 'Connecte-toi pour continuer.');

      const found = findForUser(String(params.conversationId), user.id);
      if (!found) return apiError(404, 'conversation_not_found', 'Conversation introuvable.');
      const parsed = sendMessageInputSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return invalidInput(parsed.error);

      const quoteRequest = db.data.quoteRequests.find(
        (r) => r.id === found.conversation.quoteRequestId,
      )!;
      if (isConversationClosed(quoteRequest)) {
        return apiError(
          409,
          'conversation_closed',
          'Cette demande est close : la conversation est fermée.',
        );
      }

      const message = db.update(() => {
        if (found.side === 'provider') extendQuoteRequestOnProviderReply(quoteRequest, db.now());
        return postMessage(db, found.conversation, user.id, parsed.data.body);
      });
      return HttpResponse.json(message, { status: 201 });
    }),

    http.post('*/api/conversations/:conversationId/read', async ({ params, request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return apiError(401, 'unauthenticated', 'Connecte-toi pour continuer.');

      const found = findForUser(String(params.conversationId), user.id);
      if (!found) return apiError(404, 'conversation_not_found', 'Conversation introuvable.');

      db.update(() => {
        const now = db.now().toISOString();
        for (const message of db.data.messages) {
          if (
            message.conversationId === found.conversation.id &&
            message.senderId !== user.id &&
            !message.readAt
          ) {
            message.readAt = now;
          }
        }
        if (found.side === 'client') found.conversation.unreadCountClient = 0;
        else found.conversation.unreadCountProvider = 0;
      });
      return new HttpResponse(null, { status: 204 });
    }),

    http.post('*/api/reports', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return apiError(401, 'unauthenticated', 'Connecte-toi pour continuer.');

      const parsed = createReportInputSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return invalidInput(parsed.error);

      const report = db.update(() => {
        const now = db.now().toISOString();
        const created: Report = {
          id: db.newId('report'),
          reporterId: user.id,
          ...parsed.data,
          status: 'open',
          createdAt: now,
          updatedAt: now,
        };
        db.data.reports.push(created);
        return created;
      });
      return HttpResponse.json(report, { status: 201 });
    }),
  ];
}
