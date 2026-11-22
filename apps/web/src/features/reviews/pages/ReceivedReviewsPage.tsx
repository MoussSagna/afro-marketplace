import { computeProviderRating, useMyReviews, type ReviewWithAuthor } from '@afro/common';
import { MessageSquareQuote } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { Rating } from '@/components/Rating';
import { ReportDialog } from '@/components/ReportDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { ReplyForm } from '../components/ReplyForm';

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Paris',
});

const SUB_RATING_LABELS = {
  quality: 'Qualité',
  punctuality: 'Ponctualité',
  value: 'Rapport qualité-prix',
} as const;

/** S8 : les avis reçus par le prestataire, avec réponse publique et signalement. */
export function ReceivedReviewsPage() {
  const reviews = useMyReviews();
  usePageMeta('Avis reçus');

  if (reviews.isPending) return <Skeleton className="h-64 rounded-xl" aria-label="Chargement" />;
  if (reviews.isError) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 p-4 text-destructive">
        Impossible de charger tes avis.
      </p>
    );
  }

  // Règle n° 8, la même que pour le profil public : les avis masqués ne comptent pas.
  const { ratingAverage, ratingCount } = computeProviderRating(reviews.data);
  const toAnswer = reviews.data.filter((r) => !r.providerReply).length;

  return (
    <section aria-labelledby="reviews-page-title" className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 id="reviews-page-title" className="text-3xl font-semibold">
            Avis reçus
          </h1>
          {reviews.data.length > 0 && (
            <p className="mt-1 text-muted-foreground">
              {toAnswer === 0 ? 'Tu as répondu à tous les avis.' : `${toAnswer} avis sans réponse.`}
            </p>
          )}
        </div>
        <Rating value={ratingAverage} count={ratingCount} size="md" />
      </header>

      {reviews.data.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title="Pas encore d’avis"
          description="Tes clients pourront laisser un avis une fois la prestation terminée."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {reviews.data.map((review) => (
            <li key={review.id}>
              <ReviewItem review={review} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ReviewItem({ review }: { review: ReviewWithAuthor }) {
  const authorName = `${review.author.firstName} ${review.author.lastNameInitial}`;
  return (
    <article aria-label={`Avis de ${authorName}`} className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{authorName}</p>
          {review.status === 'hidden' && (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              Masqué par la modération
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Rating value={review.rating} />
          <ReportDialog
            targetType="review"
            targetId={review.id}
            label={`Signaler l’avis de ${authorName}`}
            reasons={['fake_review', 'inappropriate', 'other']}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {dateFormatter.format(new Date(review.createdAt))}
      </p>
      {review.subRatings && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {(Object.keys(SUB_RATING_LABELS) as Array<keyof typeof SUB_RATING_LABELS>).map((key) => (
            <li key={key}>
              {SUB_RATING_LABELS[key]} :{' '}
              <span className="font-medium text-foreground">{review.subRatings![key]}/5</span>
            </li>
          ))}
        </ul>
      )}
      {review.comment && <p className="mt-3">{review.comment}</p>}
      {review.providerReply ? (
        <blockquote className="mt-3 border-l-2 border-ochre pl-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Ta réponse</p>
          {review.providerReply}
        </blockquote>
      ) : (
        review.status === 'published' && <ReplyForm reviewId={review.id} authorName={authorName} />
      )}
    </article>
  );
}
