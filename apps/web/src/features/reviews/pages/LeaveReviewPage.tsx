import {
  ApiError,
  canReviewBooking,
  formatEventDate,
  useBookings,
  useCreateReview,
  type BookingSummary,
} from '@afro/common';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { NotFoundPage } from '@/app/NotFoundPage';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useSessionStore } from '@/stores/session';
import { StarRatingInput } from '../components/StarRatingInput';
import {
  initialReviewForm,
  reviewFormSchema,
  toCreateReviewInput,
  type ReviewFormValues,
} from '../lib/reviewForm';

const SUB_RATINGS = [
  { name: 'quality', label: 'Qualité de la prestation' },
  { name: 'punctuality', label: 'Ponctualité' },
  { name: 'value', label: 'Rapport qualité-prix' },
] as const;

/** C6 : laisser un avis sur une réservation terminée (règle n° 6). */
export function LeaveReviewPage() {
  const { bookingId = '' } = useParams();
  const bookings = useBookings('client');
  const userId = useSessionStore((state) => state.user?.id ?? '');
  usePageMeta('Laisser un avis');

  if (bookings.isPending)
    return <Skeleton className="h-96 rounded-xl" role="status" aria-label="Chargement" />;
  if (bookings.isError) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 p-4 text-destructive">
        Impossible de charger cette réservation.
      </p>
    );
  }
  const summary = bookings.data.find((s) => s.booking.id === bookingId);
  if (!summary) return <NotFoundPage />;

  // La même règle que côté serveur : si elle refuse, on explique pourquoi au lieu du formulaire.
  const verdict = canReviewBooking({
    booking: summary.booking,
    userId,
    existingReviews: summary.review ? [summary.review] : [],
  });

  return (
    <section aria-labelledby="review-title" className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link
        to="/espace/reservations"
        className="flex w-fit items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Mes réservations
      </Link>
      <header>
        <h1 id="review-title" className="text-3xl font-semibold">
          Ton avis sur {summary.provider.displayName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Prestation du {formatEventDate(summary.booking.eventDate)}
        </p>
      </header>
      {verdict.allowed ? (
        <ReviewForm summary={summary} />
      ) : (
        <p role="status" className="rounded-lg bg-secondary p-4">
          {verdict.message}
        </p>
      )}
    </section>
  );
}

function ReviewForm({ summary }: { summary: BookingSummary }) {
  const navigate = useNavigate();
  const createReview = useCreateReview();
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: initialReviewForm,
  });

  const onSubmit = form.handleSubmit((values) => {
    createReview.mutate(toCreateReviewInput(summary.booking.id, values), {
      // Direction le profil : l'avis y apparaît, avec la nouvelle note moyenne.
      onSuccess: () =>
        navigate(`/prestataires/${summary.provider.slug}#reviews-title`, {
          state: { reviewPublished: true },
        }),
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-6 rounded-xl border bg-card p-5">
        <FormField
          control={form.control}
          name="rating"
          render={({ field, fieldState }) => (
            <FormItem>
              <p className="text-sm font-medium">Note générale</p>
              <StarRatingInput
                label="Note générale"
                value={field.value}
                onChange={field.onChange}
                invalid={fieldState.invalid}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium">En détail (facultatif)</legend>
          {SUB_RATINGS.map(({ name, label }) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field, fieldState }) => (
                <FormItem className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm">{label}</p>
                  <StarRatingInput
                    label={label}
                    size="sm"
                    value={field.value}
                    onChange={field.onChange}
                    invalid={fieldState.invalid}
                  />
                  <FormMessage className="basis-full" />
                </FormItem>
              )}
            />
          ))}
        </fieldset>

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ton commentaire (facultatif)</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="Qu’as-tu apprécié ? Qu’est-ce qui pourrait être amélioré ?"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Ton avis sera public, avec ton prénom et l’initiale de ton nom.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {createReview.isError && (
          <p role="alert" className="text-sm text-destructive">
            {createReview.error instanceof ApiError
              ? createReview.error.message
              : 'L’envoi a échoué, réessaie.'}
          </p>
        )}
        <Button type="submit" variant="cta" className="self-end" disabled={createReview.isPending}>
          Publier mon avis
        </Button>
      </form>
    </Form>
  );
}
