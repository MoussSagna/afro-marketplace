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
import { Clock, Globe2, Languages, MapPin, PackageOpen, ShieldCheck, Users } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useLocation, useParams } from 'react-router';
import { NotFoundPage } from '@/app/NotFoundPage';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { buildProviderJsonLd } from '@/lib/seo';
import { AboutSection, type AboutFact, type AboutTag } from '../components/AboutSection';
import { AvailabilityCalendar } from '../components/AvailabilityCalendar';
import { ContactPanel } from '../components/ContactPanel';
import { Gallery } from '../components/Gallery';
import { OfferingList } from '../components/OfferingList';
import { PhotoLightbox } from '../components/PhotoLightbox';
import { ProfileCover } from '../components/ProfileCover';
import { ProfileTabs } from '../components/ProfileTabs';
import { ProviderIdentity } from '../components/ProviderIdentity';
import { ReviewList } from '../components/ReviewList';
import { categoryIcon } from '../lib/categoryIcon';
import { formatResponseTime, maxGuestsOf } from '../lib/profileDisplay';
import type { ProfileTab } from '../lib/profileTabs';

/**
 * P5 : la page publique d'un prestataire, pensée comme une vitrine.
 *
 * De haut en bas : la couverture sur toute la largeur de l'écran (sous la navbar transparente), avec
 * l'identité du prestataire posée dessus ; puis 4 onglets (Présentation, Prestations, Galerie, Avis)
 * dont le contenu se remplace sur place, et le panneau de contact, à droite sur ordinateur, présent
 * quel que soit l'onglet.
 */
export function ProviderProfilePage() {
  const { slug = '' } = useParams();
  const provider = useProvider(slug);
  const categories = useCategories();
  const origins = useCulturalOrigins();
  // Après « Publier mon avis » (C6), on arrive sur l'onglet Avis.
  const reviewPublished = (useLocation().state as { reviewPublished?: boolean } | null)
    ?.reviewPublished;
  const [tab, setTab] = useState<ProfileTab>(reviewPublished ? 'avis' : 'presentation');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const profile = provider.data?.profile;

  usePageMeta(profile && `${profile.displayName}, ${profile.city}`, profile?.bio.slice(0, 160));

  if (provider.isPending) {
    return (
      <div className="flex flex-col gap-6 pb-12" role="status" aria-label="Chargement">
        <Skeleton className="h-[420px] w-full rounded-none sm:h-[500px]" />
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 lg:px-6">
          <Skeleton className="h-14 w-full max-w-[820px] rounded-full" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
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
  const images = media.filter((m) => m.type === 'image');
  const providerCategories = p.categoryIds
    .map((id) => categories.data?.find((c) => c.id === id))
    .filter((c) => c !== undefined);
  const group = categories.data?.find((c) => c.id === providerCategories[0]?.parentId);
  const originNames = p.culturalOriginIds
    .map((id) => origins.data?.find((o) => o.id === id)?.name)
    .filter((name) => name !== undefined);
  const requestUrl = `/prestataires/${p.slug}/demande`;
  const jsonLd = buildProviderJsonLd(window.location.origin, {
    ...p,
    categoryNames: providerCategories.map((c) => c.name),
  });
  const cancellationLabel = CANCELLATION_POLICIES[p.cancellationPolicy].label;
  const responseTime =
    p.responseTimeHours === undefined ? undefined : formatResponseTime(p.responseTimeHours);
  const CategoryIcon = categoryIcon(providerCategories[0]);

  // Présentation : seulement ce que le profil renseigne (rien d'inventé).
  const maxGuests = maxGuestsOf(offerings);
  const tags: AboutTag[] = [
    ...providerCategories.map((category) => ({ icon: CategoryIcon, label: category.name })),
    ...originNames.map((name) => ({ icon: Globe2, label: name })),
    ...(p.languages.length > 0
      ? [{ icon: Languages, label: p.languages.map(languageLabel).join(', ') }]
      : []),
  ];
  const facts: AboutFact[] = [
    ...(maxGuests
      ? [{ icon: Users, title: 'Capacité', value: `Jusqu’à ${maxGuests} invités` }]
      : []),
    {
      icon: MapPin,
      title: 'Localisation',
      value: `${p.city} · jusqu’à ${p.travelRadiusKm} km`,
    },
    ...(responseTime
      ? [{ icon: Clock, title: 'Réponse', value: `En ${responseTime} en moyenne` }]
      : []),
    { icon: ShieldCheck, title: 'Annulation', value: cancellationLabel },
  ];

  const panels: Record<ProfileTab, ReactNode> = {
    presentation: (
      <AboutSection
        providerName={p.displayName}
        bio={p.bio}
        legalTypeLabel={LEGAL_TYPE_LABELS[p.legalType]}
        tags={tags}
        facts={facts}
      >
        {/* Informations pratiques : disponibilités et conditions d'annulation. */}
        <div className="grid items-start gap-4 @2xl:grid-cols-2">
          <AvailabilityCalendar providerId={p.id} />
          <section aria-labelledby="cancellation-title" className="rounded-xl border bg-card p-5">
            <h2 id="cancellation-title" className="mb-2 font-display text-xl font-semibold">
              Annulation : {cancellationLabel.toLowerCase()}
            </h2>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {describeCancellationPolicy(p.cancellationPolicy).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        </div>
      </AboutSection>
    ),
    prestations:
      offerings.length > 0 ? (
        <OfferingList offerings={offerings} icon={CategoryIcon} />
      ) : (
        <EmptyState
          icon={PackageOpen}
          title="Pas encore de prestation"
          description="Envoyez une demande : le prestataire vous répond avec une offre adaptée."
        />
      ),
    galerie: <Gallery images={images} providerName={p.displayName} onOpen={setLightboxIndex} />,
    avis: (
      <ReviewList providerId={p.id} ratingAverage={p.ratingAverage} ratingCount={p.ratingCount} />
    ),
  };

  return (
    <article className="pb-16 lg:pb-24">
      {/* Données structurées pour Google (note, ville, prix). « < » échappé : pas d'injection. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll('<', '\\u003c') }}
      />

      <ProfileCover
        imageUrl={p.coverUrl ?? images[0]?.url}
        providerName={p.displayName}
        photoCount={images.length}
        onOpenGallery={() => setLightboxIndex(0)}
      >
        <ProviderIdentity
          profile={p}
          categories={providerCategories}
          groupName={group?.name}
          requestUrl={requestUrl}
        />
      </ProfileCover>

      <div className="mx-auto mt-6 max-w-[1200px] px-4 sm:mt-8 lg:mt-10 lg:px-6">
        <ProfileTabs
          value={tab}
          onValueChange={setTab}
          panels={panels}
          aside={
            <aside aria-label="Contacter le prestataire" data-testid="profile-contact">
              <ContactPanel
                requestUrl={requestUrl}
                responseTime={responseTime}
                highlights={[
                  'Devis gratuit et sans engagement',
                  `Se déplace jusqu’à ${p.travelRadiusKm} km autour de ${p.city}`,
                  `Annulation ${cancellationLabel.toLowerCase()}`,
                ]}
              />
            </aside>
          }
        />
      </div>

      <PhotoLightbox
        images={images}
        providerName={p.displayName}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
      />
    </article>
  );
}
