import {
  ApiError,
  cancelBookingInputSchema,
  computeCancellationRefund,
  formatPrice,
  toIsoDate,
  useCancelBooking,
  type Booking,
  type Side,
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
import { Textarea } from '@/components/ui/textarea';

/** Annuler une réservation, en montrant AVANT ce que prévoit la politique (règle n° 9). */
export function CancelBookingDialog({ booking, side }: { booking: Booking; side: Side }) {
  const [open, setOpen] = useState(false);
  const cancel = useCancelBooking(booking.id);
  const form = useForm({
    resolver: zodResolver(cancelBookingInputSchema),
    defaultValues: { reason: '' },
  });
  const refund = computeCancellationRefund({
    policy: booking.cancellationPolicy,
    amountPaid: booking.depositAmount,
    eventDate: booking.eventDate,
    cancelledOn: toIsoDate(new Date()),
    cancelledBy: side,
  });

  async function onSubmit(values: { reason: string }) {
    try {
      await cancel.mutateAsync(values);
      setOpen(false);
    } catch (error) {
      form.setError('root', {
        message: error instanceof ApiError ? error.message : 'L’annulation a échoué.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-destructive">
          Annuler la réservation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Annuler la réservation ?</DialogTitle>
          <DialogDescription>
            {side === 'provider'
              ? 'Si tu annules, le client doit être remboursé en totalité de son acompte.'
              : `L’événement est dans ${refund.daysBeforeEvent} jours : selon les conditions, ${refund.refundPercent} % de l’acompte te sera remboursé (${formatPrice(refund.refundAmount)} sur ${formatPrice(booking.depositAmount)}).`}{' '}
            Le paiement se fait hors de la plateforme : le remboursement se règle directement entre
            vous.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
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
                Confirmer l’annulation
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
