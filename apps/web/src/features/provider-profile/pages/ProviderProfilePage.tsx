import {
  ApiError,
  describeCancellationPolicy,
  CANCELLATION_POLICIES,
  LEGAL_TYPE_LABELS,
  languageLabel,
  useCategories,
  useCulturalOrigins,
  useProvider,
} from '@afro/common';
import { BadgeCheck, Clock, Languages, MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { NotFoundPage } from '@/app/NotFoundPage';
import { Rating } from '@/components/Rating';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { AvailabilityCalendar } from '../components/AvailabilityCalendar';
import { Gallery } from '../components/Gallery';
import { OfferingList } from '../components/OfferingList';
import { ReviewList } from '../components/ReviewList';

/** P5 : la page publique d'un prestataire. */
export function ProviderProfilePage() {
  const { slug = '' } = useParams();
  const provider = useProvider(slug);
  const categories = useCategories();
  const origins = useCulturalOrigins();
  const profile = provider.data?.profile;

  usePageMeta(profile && `${profile.displayName}, ${profile.city}`, profile?.bio.slice(0, 160));

  if (provider.isPending) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8" aria-label="Chargement">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }
  if (provider.isError) {
    if (provider.error instanceof ApiError && provider.error.status === 404)
      return <NotFoundPage />;
    return (
      <p role="alert" className="mx-auto my-12 max-w-xl rounded-lg bg-red-50 p-4 text-destructive">
        Impossible de charger ce profil. Réessaie dans un instant.
      </p>
    );
  }

  const { offerings, media } = provider.data;
  const p = provider.data.profile;
  const categoryNames = p.categoryIds
    .map((id) => categories.data?.find((c) => c.id === id))
    .filter((c) => c !== undefined);
  const originNames = p.culturalOriginIds
    .map((id) => origins.data?.find((o) => o.id === id)?.name)
    .filter(Boolean);
  const requestUrl = `/prestataires/${p.slug}/demande`;

  return (
    <article>
      <div className="relative h-48 bg-linear-to-br from-brand-400 via-brand-600 to-gold-500 md:h-72">
        {p.coverUrl && <img src={p.coverUrl} alt="" className="size-full object-cover" />}
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-10">
          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {categoryNames.map((category) => (
                <Link key={category.id} to={`/categories/${category.slug}`}>
                  <Badge variant="secondary">{category.name}</Badge>
                </Link>
              ))}
              {p.isProVerified && (
                <Badge variant="outline" className="text-forest-700">
                  <BadgeCheck aria-hidden /> Pro vérifié
                </Badge>
              )}
            </div>
            <h1 className="font-display text-3xl font-semibold md:text-4xl">{p.displayName}</h1>
            <Rating value={p.ratingAverage} count={p.ratingCount} size="md" />
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-1">
                <MapPin className="size-4" aria-hidden />
                {p.city} · se déplace jusqu’à {p.travelRadiusKm} km
              </li>
              {p.languages.length > 0 && (
                <li className="flex items-center gap-1">
                  <Languages className="size-4" aria-hidden />
                  {p.languages.map(languageLabel).join(', ')}
                </li>
              )}
              {p.responseTimeHours !== undefined && (
                <li className="flex items-center gap-1">
                  <Clock className="size-4" aria-hidden />
                  Répond en{' '}
                  {p.responseTimeHours < 24
                    ? `${Math.round(p.responseTimeHours)} h`
                    : `${Math.round(p.responseTimeHours / 24)} j`}{' '}
                  en moyenne
                </li>
              )}
            </ul>
            {originNames.length > 0 && (
              <p className="text-sm">
                <span className="font-medium">Origines : </span>
                {originNames.join(', ')}
              </p>
            )}
          </header>

          <section aria-labelledby="about-title">
            <h2 id="about-title" className="mb-3 font-display text-2xl font-semibold">
              Présentation
            </h2>
            <p className="whitespace-pre-line">{p.bio}</p>
            <p className="mt-2 text-sm text-muted-foreground">{LEGAL_TYPE_LABELS[p.legalType]}</p>
          </section>

          {offerings.length > 0 && <OfferingList offerings={offerings} />}
          <Gallery media={media} providerName={p.displayName} />
          <ReviewList
            providerId={p.id}
            ratingAverage={p.ratingAverage}
            ratingCount={p.ratingCount}
          />
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl border bg-card p-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Gratuit et sans engagement : le prestataire vous répond avec un devis.
            </p>
            <Button asChild size="lg" className="w-full">
              <Link to={requestUrl}>Demander un devis</Link>
            </Button>
          </div>
          <AvailabilityCalendar providerId={p.id} />
          <section aria-labelledby="cancellation-title" className="rounded-xl border bg-card p-4">
            <h2 id="cancellation-title" className="mb-2 font-semibold">
              Annulation : {CANCELLATION_POLICIES[p.cancellationPolicy].label.toLowerCase()}
            </h2>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {describeCancellationPolicy(p.cancellationPolicy).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {/* Sur téléphone, le bouton reste visible en bas de l'écran. */}
      <div className="sticky bottom-0 border-t bg-background/95 p-3 backdrop-blur lg:hidden">
        <Button asChild size="lg" className="w-full">
          <Link to={requestUrl}>Demander un devis</Link>
        </Button>
      </div>
    </article>
  );
}
