import { useProviderReviews } from '@afro/common';
import { ArrowRight, CheckCircle2, MessageSquareQuote, Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { EmptyState } from '@/components/EmptyState';
import { Rating } from '@/components/Rating';
import { Skeleton } from '@/components/ui/skeleton';
import { ratingDistribution, timeAgo } from '../lib/profileDisplay';

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
const averageFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Le nombre d'avis montrés avant « Voir tous les avis ». */
export const REVIEWS_PREVIEW_COUNT = 2;

interface ReviewListProps {
  providerId: string;
  ratingAverage: number;
  ratingCount: number;
}

/**
 * Onglet « Avis » (P5) : « Avis des clients » : la note moyenne et la répartition des notes, puis les avis
 * (les 2 plus récents, les autres avec « Voir tous les avis »).
 * La réponse du prestataire s'affiche sous l'avis.
 */
export function ReviewList({ providerId, ratingAverage, ratingCount }: ReviewListProps) {
  const reviews = useProviderReviews(providerId);
  const [showAll, setShowAll] = useState(false);
  // Après « Publier mon avis » (C6), on arrive ici : message de confirmation et défilement.
  const justPublished = (useLocation().state as { reviewPublished?: boolean } | null)
    ?.reviewPublished;
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (justPublished && reviews.isSuccess) sectionRef.current?.scrollIntoView?.();
  }, [justPublished, reviews.isSuccess]);

  const all = reviews.data ?? [];
  const visible = showAll ? all : all.slice(0, REVIEWS_PREVIEW_COUNT);
  const hasMore = all.length > REVIEWS_PREVIEW_COUNT;

  return (
    <section ref={sectionRef} aria-labelledby="reviews-title" className="@container scroll-mt-24">
      {justPublished && (
        <p
          role="status"
          className="mb-4 flex items-center gap-2 rounded-lg bg-success-muted p-4 text-success"
        >
          <CheckCircle2 className="size-5" aria-hidden />
          Merci ! Ton avis est publié.
        </p>
      )}
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 id="reviews-title" className="font-display text-[26px] font-semibold md:text-[32px]">
          Avis des clients
        </h2>
        {hasMore && (
          <button
            type="button"
            aria-expanded={showAll}
            aria-controls="reviews-items"
            onClick={() => setShowAll((value) => !value)}
            className="inline-flex items-center gap-1.5 rounded-sm font-semibold text-primary underline underline-offset-4 outline-none hover:text-primary-hover focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            {showAll ? 'Voir moins d’avis' : `Voir tous les avis (${all.length})`}
            <ArrowRight
              className={`size-4 transition-transform ${showAll ? '-rotate-90' : ''}`}
              aria-hidden
            />
          </button>
        )}
      </div>

      {reviews.isPending && <Skeleton className="h-44 rounded-xl" />}
      {reviews.isError && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-destructive">
          Impossible de charger les avis.
        </p>
      )}
      {reviews.isSuccess && all.length === 0 && (
        <EmptyState
          icon={MessageSquareQuote}
          title="Pas encore d’avis"
          description="Ce prestataire vient d’arriver : soyez parmi les premiers à faire appel à lui."
        />
      )}
      {reviews.isSuccess && all.length > 0 && (
        <div className="grid items-start gap-4 @2xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <RatingSummary
            average={ratingAverage}
            count={ratingCount}
            ratings={all.map((review) => review.rating)}
          />
          <ul id="reviews-items" aria-label="Avis" className="flex flex-col gap-4">
            {visible.map((review) => (
              <li key={review.id} className="rounded-xl border bg-card p-5 shadow-card">
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-lg font-semibold text-primary"
                  >
                    {review.author.firstName.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {review.author.firstName} {review.author.lastNameInitial}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                      <Rating value={review.rating} showValue={false} />
                      <span aria-hidden>·</span>
                      <time
                        dateTime={review.createdAt}
                        title={dateFormatter.format(new Date(review.createdAt))}
                      >
                        {timeAgo(review.createdAt, new Date())}
                      </time>
                    </p>
                  </div>
                </div>
                {review.comment && <p className="mt-3 leading-relaxed">{review.comment}</p>}
                {review.providerReply && (
                  <blockquote className="mt-3 border-l-2 border-ochre pl-3 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Réponse du prestataire</p>
                    {review.providerReply}
                  </blockquote>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** La note moyenne en grand et la répartition des notes (barres de 5 à 1 étoile). */
function RatingSummary({
  average,
  count,
  ratings,
}: {
  average: number;
  count: number;
  ratings: number[];
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-6 rounded-xl border bg-card p-6 shadow-card">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="font-display text-6xl leading-none font-semibold">
          {averageFormatter.format(average)}
        </p>
        <Rating value={average} size="md" showValue={false} />
        <p className="text-sm text-muted-foreground">({count} avis)</p>
      </div>
      <ul aria-label="Répartition des notes" className="flex flex-col gap-1.5 text-sm">
        {ratingDistribution(ratings).map(({ stars, count: n, percent }) => (
          <li key={stars} className="flex items-center gap-2">
            <span className="flex w-7 shrink-0 items-center gap-0.5 tabular-nums" aria-hidden>
              {stars}
              <Star className="size-3.5 fill-ochre text-ochre" />
            </span>
            <span aria-hidden className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-ochre"
                style={{ width: `${percent}%` }}
              />
            </span>
            <span
              className="w-10 shrink-0 text-right text-muted-foreground tabular-nums"
              aria-hidden
            >
              {percent} %
            </span>
            <span className="sr-only">
              {stars} étoile{stars > 1 ? 's' : ''} : {n} avis ({percent} %)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
