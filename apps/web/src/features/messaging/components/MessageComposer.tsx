import { ApiError, useSendMessage } from '@afro/common';
import { SendHorizontal } from 'lucide-react';
import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/**
 * La zone d'écriture : Entrée envoie, Maj + Entrée passe à la ligne.
 * Le champ fait une ligne et grandit avec le texte (`field-sizing: content`, jusqu'à ~5 lignes) ;
 * le bouton rond reste toujours visible. Marge basse : la zone de sécurité de l'écran (iPhone).
 */
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
    <form
      onSubmit={submit}
      className="flex shrink-0 flex-col gap-2 border-t bg-background px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5"
    >
      {send.isError && (
        <p role="alert" className="text-sm text-destructive">
          {send.error instanceof ApiError ? send.error.message : 'Le message n’est pas parti.'}
        </p>
      )}
      <div className="flex items-end gap-2 sm:gap-3">
        <Textarea
          aria-label="Ton message"
          placeholder="Écris ton message…"
          rows={1}
          maxLength={2000}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          className="field-sizing-content max-h-36 min-h-12 min-w-0 flex-1 resize-none rounded-3xl bg-card px-5 py-3 text-base leading-snug md:text-base"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Envoyer"
          disabled={!body.trim() || send.isPending}
          className="size-12 shrink-0 rounded-full"
        >
          <SendHorizontal aria-hidden className="size-5" />
        </Button>
      </div>
    </form>
  );
}
