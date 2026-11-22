import { ApiError, declineQuoteRequestInputSchema, useDeclineQuoteRequest } from '@afro/common';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

const SUGGESTED_REASONS = [
  'Je ne suis pas disponible à cette date.',
  'Cette demande ne correspond pas à mes prestations.',
  'Le budget est trop éloigné de mes tarifs.',
];

/** S3 : décliner une demande, avec un motif (le client le verra dans la conversation). */
export function DeclineDialog({ requestId }: { requestId: string }) {
  const [open, setOpen] = useState(false);
  const decline = useDeclineQuoteRequest(requestId);
  const form = useForm({
    resolver: zodResolver(declineQuoteRequestInputSchema),
    defaultValues: { reason: '' },
  });

  async function onSubmit(values: { reason: string }) {
    try {
      await decline.mutateAsync(values);
      setOpen(false);
    } catch (error) {
      form.setError('root', {
        message: error instanceof ApiError ? error.message : 'Le refus n’a pas pu être envoyé.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Décliner</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Décliner la demande</DialogTitle>
          <DialogDescription>
            Le client verra ton motif dans la conversation. Un refus poli et rapide vaut mieux
            qu’une demande sans réponse.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => form.setValue('reason', reason, { shouldValidate: true })}
                  className="rounded-full border bg-card px-3 py-1 text-left text-xs hover:bg-muted"
                >
                  {reason}
                </button>
              ))}
            </div>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motif</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" variant="destructive" disabled={form.formState.isSubmitting}>
                Décliner la demande
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
