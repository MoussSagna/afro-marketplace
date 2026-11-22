import {
  EVENT_TYPE_LABELS,
  formatEventDate,
  isQuoteRequestOpen,
  useConversations,
  useMarkConversationRead,
  useMessages,
  useQuoteRequest,
  type Side,
} from '@afro/common';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { RequestStatusBadge } from '@/features/quote-requests/components/RequestStatusBadge';
import { SPACE_PATHS } from '@/features/quote-requests/lib/spacePaths';
import { useSessionStore } from '@/stores/session';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';

/** Le fil d'une conversation, avec l'en-tête de la demande et la zone d'écriture. */
export function ConversationThread({
  side,
  conversationId,
}: {
  side: Side;
  conversationId: string;
}) {
  const userId = useSessionStore((state) => state.user?.id);
  const [searchParams] = useSearchParams();
  const conversations = useConversations(side);
  const summary = conversations.data?.find((c) => c.conversation.id === conversationId);
  const messages = useMessages(conversationId);
  const request = useQuoteRequest(summary?.conversation.quoteRequestId ?? '');
  const markRead = useMarkConversationRead();
  const endRef = useRef<HTMLDivElement>(null);
  const paths = SPACE_PATHS[side];

  // À l'ouverture, et dès qu'un nouveau message arrive : la conversation est lue.
  const unreadCount = summary?.unreadCount ?? 0;
  const { mutate: markAsRead } = markRead;
  useEffect(() => {
    if (unreadCount > 0) markAsRead(conversationId);
  }, [conversationId, unreadCount, markAsRead]);

  // On descend en bas du fil quand un message arrive.
  const messageCount = messages.data?.length ?? 0;
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messageCount]);

  if (conversations.isSuccess && !summary) {
    return (
      <p role="alert" className="p-6 text-muted-foreground">
        Cette conversation est introuvable.
      </p>
    );
  }

  const name =
    summary &&
    (side === 'client'
      ? summary.providerName
      : `${summary.otherParticipant.firstName} ${summary.otherParticipant.lastNameInitial}`);
  const quoteRequest = request.data?.request;
  const isClosed =
    quoteRequest !== undefined &&
    !isQuoteRequestOpen(quoteRequest.status) &&
    quoteRequest.status !== 'accepted';

  return (
    <section
      aria-label={name ? `Conversation avec ${name}` : 'Conversation'}
      className="flex h-full min-h-0 flex-col"
    >
      <header className="flex items-center gap-3 border-b p-3">
        <Link
          to={paths.messages}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted md:hidden"
          aria-label="Retour aux conversations"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-sans text-base font-semibold">
            {name ?? <Skeleton className="h-5 w-40" />}
          </h2>
          {quoteRequest && (
            <p className="truncate text-sm text-muted-foreground">
              {EVENT_TYPE_LABELS[quoteRequest.eventType]} ·{' '}
              {formatEventDate(quoteRequest.eventDate)} ·{' '}
              <Link
                to={`${paths.requests}/${quoteRequest.id}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                Voir la demande
              </Link>
            </p>
          )}
        </div>
        {quoteRequest && <RequestStatusBadge request={quoteRequest} side={side} />}
      </header>

      {searchParams.get('envoyee') === '1' && (
        <p
          role="status"
          className="m-3 flex items-center gap-2 rounded-lg bg-success-muted p-3 text-sm text-success"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          Ta demande est envoyée ! Le prestataire te répondra ici. Tu retrouveras aussi cette
          demande dans « Mes demandes ».
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {messages.isPending && <Skeleton className="h-24 rounded-xl" />}
        {messages.isError && (
          <p role="alert" className="text-sm text-destructive">
            Impossible de charger les messages.
          </p>
        )}
        {messages.isSuccess && (
          <ol className="flex flex-col gap-3" aria-label="Messages">
            {messages.data.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isMine={message.senderId === userId}
              />
            ))}
          </ol>
        )}
        <div ref={endRef} />
      </div>

      {isClosed ? (
        <p className="border-t bg-muted p-4 text-center text-sm text-muted-foreground">
          Cette demande est close : la conversation est fermée.
        </p>
      ) : (
        <MessageComposer conversationId={conversationId} />
      )}
    </section>
  );
}
