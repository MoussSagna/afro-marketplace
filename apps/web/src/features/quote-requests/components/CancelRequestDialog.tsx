import { ApiError, useCancelQuoteRequest } from '@afro/common';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/** C3 : le client annule sa demande, après confirmation. */
export function CancelRequestDialog({ requestId }: { requestId: string }) {
  const [open, setOpen] = useState(false);
  const cancel = useCancelQuoteRequest(requestId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-destructive">
          Annuler la demande
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Annuler cette demande ?</DialogTitle>
          <DialogDescription>
            Le prestataire sera prévenu et la conversation sera fermée. Tu pourras toujours lui
            envoyer une nouvelle demande plus tard.
          </DialogDescription>
        </DialogHeader>
        {cancel.isError && (
          <p role="alert" className="text-sm text-destructive">
            {cancel.error instanceof ApiError ? cancel.error.message : 'L’annulation a échoué.'}
          </p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Garder ma demande</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={cancel.isPending}
            onClick={() => cancel.mutate(undefined, { onSuccess: () => setOpen(false) })}
          >
            Oui, annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
