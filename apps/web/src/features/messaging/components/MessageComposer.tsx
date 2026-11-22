import { ApiError, useSendMessage } from '@afro/common';
import { SendHorizontal } from 'lucide-react';
import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/** La zone d'écriture : Entrée envoie, Maj + Entrée passe à la ligne. */
export function MessageComposer({ conversationId }: { conversationId: string }) {
  const [body, setBody] = useState('');
  const send = useSendMessage(conversationId);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!body.trim() || send.isPending) return;
    send.mutate({ body: body.trim() }, { onSuccess: () => setBody('') });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 border-t bg-background p-3">
      {send.isError && (
        <p role="alert" className="text-sm text-destructive">
          {send.error instanceof ApiError ? send.error.message : 'Le message n’est pas parti.'}
        </p>
      )}
      <div className="flex items-end gap-2">
        <Textarea
          aria-label="Ton message"
          placeholder="Écris ton message…"
          rows={2}
          maxLength={2000}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-11 resize-none"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Envoyer"
          disabled={!body.trim() || send.isPending}
        >
          <SendHorizontal aria-hidden />
        </Button>
      </div>
    </form>
  );
}
