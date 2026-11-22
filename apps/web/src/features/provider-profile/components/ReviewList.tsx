import { useProviderReviews } from '@afro/common';
import { MessageSquareQuote } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { Rating } from '@/components/Rating';
import { Skeleton } from '@/components/ui/skeleton';

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

interface ReviewListProps {
  providerId: string;
  ratingAverage: number;
  ratingCount: number;
}

/** Les avis publiés sur le profil (P5). La réponse du prestataire s'affiche sous l'avis. */
export function ReviewList({ providerId, ratingAverage, ratingCount }: ReviewListProps) {
  const reviews = useProviderReviews(providerId);

  return (
    <section aria-labelledby="reviews-title">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 id="reviews-title" className="font-display text-2xl font-semibold">
          Avis
        </h2>
        <Rating value={ratingAverage} count={ratingCount} size="md" />
      </div>

      {reviews.isPending && <Skeleton className="h-32 rounded-xl" />}
      {reviews.isError && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-destructive">
          Impossible de charger les avis.
        </p>
      )}
      {reviews.isSuccess && reviews.data.length === 0 && (
        <EmptyState
          icon={MessageSquareQuote}
          title="Pas encore d’avis"
          description="Ce prestataire vient d’arriver : soyez parmi les premiers à faire appel à lui."
        />
      )}
      {reviews.isSuccess && reviews.data.length > 0 && (
        <ul className="flex flex-col gap-4">
          {reviews.data.map((review) => (
            <li key={review.id} className="rounded-xl border bg-card p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {review.author.firstName} {review.author.lastNameInitial}
                </p>
                <Rating value={review.rating} />
              </div>
              {review.comment && <p>{review.comment}</p>}
              <p className="mt-2 text-xs text-muted-foreground">
                {dateFormatter.format(new Date(review.createdAt))}
              </p>
              {review.providerReply && (
                <blockquote className="mt-3 border-l-2 border-ochre pl-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Réponse du prestataire</p>
                  {review.providerReply}
                </blockquote>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
