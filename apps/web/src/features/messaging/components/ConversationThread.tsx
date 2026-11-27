import {
  EVENT_TYPE_LABELS,
  isQuoteRequestOpen,
  useConversations,
  useMarkConversationRead,
  useMessages,
  useQuoteRequest,
  type Side,
} from '@afro/common';
import { ArrowLeft, BadgeCheck, CheckCircle2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { RequestStatusBadge } from '@/features/quote-requests/components/RequestStatusBadge';
import { SPACE_PATHS } from '@/features/quote-requests/lib/spacePaths';
import { useSessionStore } from '@/stores/session';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';

/** « mer. 10 févr. 2027 » : la date de l'événement, courte pour tenir dans l'en-tête sur téléphone. */
const shortDate = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * Le fil d'une conversation : en-tête (demande liée), messages, zone d'écriture.
 * Mise en page en colonne flexible : en-tête et zone d'écriture à hauteur fixe, la liste des messages
 * prend le reste et est la SEULE zone qui défile (verticalement).
 */
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
  const listRef = useRef<HTMLDivElement>(null);
  const paths = SPACE_PATHS[side];

  // À l'ouverture, et dès qu'un nouveau message arrive : la conversation est lue.
  const unreadCount = summary?.unreadCount ?? 0;
  const { mutate: markAsRead } = markRead;
  useEffect(() => {
    if (unreadCount > 0) markAsRead(conversationId);
  }, [conversationId, unreadCount, markAsRead]);

  // On descend en bas du fil quand un message arrive. On fait défiler la liste elle-même
  // (et non `scrollIntoView`, qui ferait aussi défiler toute la page sur téléphone).
  const messageCount = messages.data?.length ?? 0;
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
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
  // Côté client : la photo et le badge du prestataire ; côté prestataire : l'avatar du client.
  const avatarUrl =
    side === 'client' ? request.data?.provider.coverUrl : summary?.otherParticipant.avatarUrl;
  const verified = side === 'client' && request.data?.provider.isProVerified;
  const isClosed =
    quoteRequest !== undefined &&
    !isQuoteRequestOpen(quoteRequest.status) &&
    quoteRequest.status !== 'accepted';

  return (
    <section
      aria-label={name ? `Conversation avec ${name}` : 'Conversation'}
      className="flex h-full min-h-0 flex-col"
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-3 py-3 sm:flex-nowrap sm:px-5">
        <Link
          to={paths.messages}
          className="-ml-1 flex size-10 shrink-0 items-center justify-center rounded-full text-primary outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring md:hidden"
          aria-label="Retour aux conversations"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <Avatar className="size-10 shrink-0 sm:size-12">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" className="object-cover" />}
          <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="flex min-w-0 items-center gap-1.5 font-sans text-base font-semibold sm:text-lg">
            {name ? <span className="truncate">{name}</span> : <Skeleton className="h-5 w-40" />}
            {verified && (
              <span title="Pro vérifié" className="inline-flex shrink-0">
                <BadgeCheck
                  aria-hidden
                  className="size-5 fill-ochre text-white"
                  strokeWidth={2.2}
                />
                <span className="sr-only">Pro vérifié</span>
              </span>
            )}
          </h2>
          {quoteRequest && (
            <p className="truncate text-sm text-muted-foreground first-letter:uppercase">
              {EVENT_TYPE_LABELS[quoteRequest.eventType]} ·{' '}
              {shortDate.format(new Date(`${quoteRequest.eventDate}T00:00:00Z`))}
            </p>
          )}
        </div>
        {quoteRequest && (
          // Téléphone : sur une 2ᵉ ligne, sous l'en-tête ; grand écran : à droite.
          <div className="flex basis-full flex-wrap items-center gap-x-3 gap-y-1 sm:basis-auto sm:flex-col sm:flex-nowrap sm:items-end sm:gap-1">
            <RequestStatusBadge request={quoteRequest} side={side} />
            <Link
              to={`${paths.requests}/${quoteRequest.id}`}
              className="rounded-sm text-sm font-medium whitespace-nowrap text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              Voir la demande
            </Link>
          </div>
        )}
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

      <div ref={listRef} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-5">
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
