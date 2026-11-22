import {
  acceptQuoteInputSchema,
  ApiError,
  computeDepositAmount,
  describeCancellationPolicy,
  formatPrice,
  useAcceptQuote,
  type CancellationPolicy,
  type Quote,
} from '@afro/common';
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
import { Input } from '@/components/ui/input';

/**
 * C3 : accepter un devis. Le client donne l'adresse précise de l'événement
 * (elle n'est révélée au prestataire qu'à ce moment) et voit les conditions
 * d'annulation avant de s'engager.
 */
export function AcceptQuoteDialog({
  quote,
  cancellationPolicy,
}: {
  quote: Quote;
  cancellationPolicy: CancellationPolicy;
}) {
  const [open, setOpen] = useState(false);
  const accept = useAcceptQuote(quote.id);
  const form = useForm({
    resolver: zodResolver(acceptQuoteInputSchema),
    defaultValues: { eventAddress: '' },
  });

  async function onSubmit(values: { eventAddress: string }) {
    try {
      await accept.mutateAsync(values);
      setOpen(false);
    } catch (error) {
      form.setError('root', {
        message: error instanceof ApiError ? error.message : 'L’acceptation a échoué.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="cta">Accepter le devis</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Accepter le devis n° {quote.version}</DialogTitle>
          <DialogDescription>
            Total {formatPrice(quote.totalAmount)}, dont un acompte de{' '}
            {formatPrice(computeDepositAmount(quote.totalAmount, quote.depositRate))} à régler
            directement au prestataire.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="eventAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse de l’événement</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="street-address"
                      placeholder="Ex. : 12 rue des Fêtes, 94000 Créteil"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">Conditions d’annulation</p>
              <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                {describeCancellationPolicy(cancellationPolicy).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            {form.formState.errors.root && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Confirmer la réservation
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
