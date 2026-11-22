import { formatMessageTime, useConversations, type Side } from '@afro/common';
import { Link } from 'react-router';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { SPACE_PATHS } from '@/features/quote-requests/lib/spacePaths';

/** La liste des conversations (C4 / S5), la plus récente en haut. */
export function ConversationList({ side, activeId }: { side: Side; activeId?: string }) {
  const conversations = useConversations(side);

  if (conversations.isPending) {
    return (
      <div className="flex flex-col gap-2 p-2" aria-label="Chargement">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }
  if (conversations.isError) {
    return (
      <p role="alert" className="p-4 text-sm text-destructive">
        Impossible de charger les conversations.
      </p>
    );
  }

  return (
    <ul className="flex flex-col" aria-label="Conversations">
      {conversations.data.map(
        ({ conversation, otherParticipant, providerName, lastMessage, unreadCount }) => {
          // Le client pense « Saveurs de Dakar » ; le prestataire pense « Aïssatou D. ».
          const name =
            side === 'client'
              ? providerName
              : `${otherParticipant.firstName} ${otherParticipant.lastNameInitial}`;
          const isActive = conversation.id === activeId;
          return (
            <li key={conversation.id}>
              <Link
                to={`${SPACE_PATHS[side].messages}/${conversation.id}`}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 border-b px-3 py-3 transition-colors hover:bg-muted',
                  isActive && 'bg-muted',
                )}
              >
                <Avatar className="size-10">
                  {otherParticipant.avatarUrl && (
                    <AvatarImage src={otherParticipant.avatarUrl} alt="" />
                  )}
                  <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={cn('truncate', unreadCount > 0 ? 'font-semibold' : 'font-medium')}
                    >
                      {name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatMessageTime(conversation.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        'truncate text-sm',
                        unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground',
                        lastMessage?.kind === 'system' && 'italic',
                      )}
                    >
                      {lastMessage?.body ?? 'Pas encore de message'}
                    </p>
                    {unreadCount > 0 && (
                      <span className="relative flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground">
                        {unreadCount}
                        <span className="sr-only"> non lu{unreadCount > 1 ? 's' : ''}</span>
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        },
      )}
    </ul>
  );
}
