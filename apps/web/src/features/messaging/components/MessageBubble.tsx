import { formatDateTime, formatMessageTime, type Message } from '@afro/common';
import { ShieldAlert } from 'lucide-react';
import { ReportDialog } from '@/components/ReportDialog';
import { cn } from '@/lib/utils';

/** Un message du fil : à droite si c'est le mien, à gauche sinon, centré si c'est un message système. */
export function MessageBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  if (message.kind === 'system') {
    return (
      <li className="my-2 self-center rounded-full bg-muted px-3 py-1 text-center text-xs text-muted-foreground">
        {message.body} · {formatMessageTime(message.createdAt)}
      </li>
    );
  }

  return (
    <li
      className={cn(
        // min-w-0 + max-w : la bulle suit son contenu, sans jamais dépasser 85 % du fil (70 % sur grand écran).
        'flex max-w-[85%] min-w-0 flex-col gap-1 sm:max-w-[70%]',
        isMine ? 'items-end self-end' : 'items-start self-start',
      )}
    >
      <div
        className={cn(
          // pre-wrap : garde les retours à la ligne du message ; overflow-wrap:anywhere coupe un mot
          // ou une URL trop longs au lieu de les laisser sortir de la bulle.
          'max-w-full rounded-2xl px-4 py-2.5 leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] sm:px-5 sm:py-3',
          isMine
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm bg-secondary text-secondary-foreground',
        )}
      >
        {message.body}
      </div>
      {isMine && message.hasMaskedContent && (
        <p className="flex items-center gap-1 text-xs text-warning">
          <ShieldAlert className="size-3.5" aria-hidden />
          Coordonnées masquées : elles seront visibles une fois la réservation confirmée.
        </p>
      )}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <time dateTime={message.createdAt} title={formatDateTime(message.createdAt)}>
          {formatMessageTime(message.createdAt)}
        </time>
        {!isMine && (
          <ReportDialog targetType="message" targetId={message.id} label="Signaler ce message" />
        )}
      </div>
    </li>
  );
}
