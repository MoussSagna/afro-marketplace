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
        'flex max-w-[85%] flex-col gap-1 sm:max-w-[70%]',
        isMine ? 'self-end items-end' : 'self-start items-start',
      )}
    >
      <div
        className={cn(
          'rounded-2xl px-4 py-2 whitespace-pre-line',
          isMine
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm border bg-card',
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
