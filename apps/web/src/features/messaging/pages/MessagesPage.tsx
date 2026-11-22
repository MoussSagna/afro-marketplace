import { useConversations, type Side } from '@afro/common';
import { MessageCircle } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { usePageMeta } from '@/hooks/usePageMeta';
import { cn } from '@/lib/utils';
import { ConversationList } from '../components/ConversationList';
import { ConversationThread } from '../components/ConversationThread';

/**
 * C4 / S5 : la messagerie, partagée par les deux espaces.
 * Sur ordinateur : la liste à gauche, le fil à droite.
 * Sur téléphone : la liste OU le fil, selon l'adresse.
 */
export function MessagesPage({ side }: { side: Side }) {
  const { conversationId } = useParams();
  const conversations = useConversations(side);
  usePageMeta('Messages');

  if (conversations.isSuccess && conversations.data.length === 0) {
    return (
      <>
        <h1 className="mb-6 text-3xl font-semibold">Messages</h1>
        <EmptyState
          icon={MessageCircle}
          title="Aucune conversation"
          description={
            side === 'client'
              ? 'Une conversation s’ouvre dès que tu envoies une demande de devis à un prestataire.'
              : 'Une conversation s’ouvre dès qu’un client t’envoie une demande de devis.'
          }
          action={
            side === 'client' && (
              <Button asChild>
                <Link to="/recherche">Trouver un prestataire</Link>
              </Button>
            )
          }
        />
      </>
    );
  }

  return (
    <>
      <h1 className={cn('mb-6 text-3xl font-semibold', conversationId && 'sr-only md:not-sr-only')}>
        Messages
      </h1>
      <div className="grid h-[calc(100dvh-14rem)] min-h-[28rem] overflow-hidden rounded-xl border bg-card grid-cols-1 md:grid-cols-[18rem_minmax(0,1fr)]">
        <div
          className={cn('min-h-0 overflow-y-auto border-r', conversationId && 'hidden md:block')}
        >
          <ConversationList side={side} activeId={conversationId} />
        </div>
        <div className={cn('min-h-0 min-w-0', !conversationId && 'hidden md:block')}>
          {conversationId ? (
            <ConversationThread key={conversationId} side={side} conversationId={conversationId} />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-muted-foreground">
              Choisis une conversation.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
