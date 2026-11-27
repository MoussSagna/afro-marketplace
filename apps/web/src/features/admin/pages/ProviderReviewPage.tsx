import {
  ApiError,
  LEGAL_TYPE_LABELS,
  MODERATION_ACTION_LABELS,
  PROVIDER_STATUS_LABELS,
  describeCancellationPolicy,
  formatDateTime,
  formatPrice,
  getMissingProfileRequirements,
  languageLabel,
  useAdminProvider,
  useCategories,
  useModerateProvider,
  type AdminProviderDetails,
} from '@afro/common';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  History,
  Images,
  Info,
  Mail,
  Package,
  ShieldCheck,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { NotFoundPage } from '@/app/NotFoundPage';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PhotoLightbox } from '@/features/provider-profile/components/PhotoLightbox';
import { usePageMeta } from '@/hooks/usePageMeta';
import { StatusPill } from '../components/AdminTable';
import { ProviderThumbnail } from '../components/ProviderThumbnail';
import { ReasonDialog } from '../components/ReasonDialog';
import type { AdminFlashState } from './ProvidersToReviewPage';

/** A2 : la fiche d'un profil à valider, et les trois décisions possibles. */
export function ProviderReviewPage() {
  const { id = '' } = useParams();
  const details = useAdminProvider(id);
  usePageMeta('Fiche prestataire');

  if (details.isPending)
    return <Skeleton className="h-96 rounded-2xl" role="status" aria-label="Chargement" />;
  if (details.isError) {
    if (details.error instanceof ApiError && details.error.status === 404) return <NotFoundPage />;
    return (
      <p role="alert" className="rounded-xl bg-red-50 p-4 text-destructive">
        Impossible de charger ce profil.
      </p>
    );
  }
  return <ProviderSheet details={details.data} />;
}

/** Une carte de la fiche, avec son titre. */
function SheetCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className={`flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-card sm:p-6 ${className ?? ''}`}
    >
      <h2 id={titleId} className="flex items-center gap-2.5 text-xl font-bold sm:text-[22px]">
        <Icon className="size-5 text-primary" strokeWidth={1.8} aria-hidden />
        {title}
      </h2>
      {children}
    </section>
  );
}

function ProviderSheet({ details }: { details: AdminProviderDetails }) {
  const { profile, owner, media, offerings, history } = details;
  const categories = useCategories();
  const moderate = useModerateProvider(profile.id);
  const navigate = useNavigate();
  const [verified, setVerified] = useState(profile.siret !== undefined);
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const verifiedId = useId();
  const missing = getMissingProfileRequirements(profile, media, offerings);
  const canDecide = profile.status === 'pending_review';
  // Retour à la liste avec un message de confirmation (affiché en haut de la liste).
  const backToList = (flash: string) =>
    navigate('/admin/prestataires', { state: { flash } satisfies AdminFlashState });
  const name = profile.displayName;

  return (
    <section aria-labelledby="sheet-title" className="flex flex-col gap-6">
      <Link
        to="/admin/prestataires"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Profils à valider
      </Link>

      <header className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-card sm:flex-row sm:items-center sm:p-6">
        <ProviderThumbnail
          name={name}
          src={profile.coverUrl}
          className="size-16 rounded-2xl text-2xl sm:size-20"
        />
        <div className="min-w-0 flex-1">
          <h1 id="sheet-title" className="text-[28px] leading-tight font-bold sm:text-4xl">
            {name}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
            <span>
              {owner.firstName} {owner.lastName}
            </span>
            <span aria-hidden>·</span>
            <span className="flex items-center gap-1 break-all">
              <Mail className="size-4 shrink-0" aria-hidden />
              {owner.email}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
          <StatusPill tone={profile.status === 'published' ? 'success' : 'warning'}>
            {PROVIDER_STATUS_LABELS[profile.status]}
          </StatusPill>
          <span className="text-sm text-muted-foreground">
            Mis à jour le {formatDateTime(profile.updatedAt)}
          </span>
        </div>
      </header>

      {missing.length > 0 && (
        <p
          role="note"
          className="flex items-start gap-2 rounded-xl border border-warning/20 bg-warning-muted p-4 text-sm"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <span>Profil incomplet : {missing.map((m) => m.message).join(' · ')}</span>
        </p>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <SheetCard icon={Info} title="Informations professionnelles">
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Field label="Statut juridique">{LEGAL_TYPE_LABELS[profile.legalType]}</Field>
              <Field label="SIRET">{profile.siret ?? 'Non renseigné'}</Field>
              <Field label="Catégories">
                {profile.categoryIds
                  .map((id) => categories.data?.find((c) => c.id === id)?.name)
                  .filter(Boolean)
                  .join(', ') || '—'}
              </Field>
              <Field label="Zone">
                {profile.city || '—'} {profile.postalCode} · {profile.travelRadiusKm} km
              </Field>
              <Field label="Langues">{profile.languages.map(languageLabel).join(', ')}</Field>
              <Field label="Annulation">
                {describeCancellationPolicy(profile.cancellationPolicy).map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </Field>
            </dl>
          </SheetCard>

          <SheetCard icon={FileText} title="Présentation">
            <p className="whitespace-pre-line">{profile.bio || '—'}</p>
          </SheetCard>

          <SheetCard icon={Images} title={`Photos (${media.length})`}>
            {media.length === 0 ? (
              <p className="text-muted-foreground">Aucune photo.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
                {media.map((m, index) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setPhotoIndex(index)}
                      aria-label={`Agrandir la photo ${index + 1}`}
                      className="block w-full overflow-hidden rounded-xl border outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                    >
                      <img
                        src={m.thumbnailUrl ?? m.url}
                        alt={m.caption ?? `Photo ${index + 1}`}
                        className="aspect-[3/2] w-full object-cover transition-transform duration-300 hover:scale-105 motion-reduce:transition-none"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <PhotoLightbox
              images={media}
              providerName={name}
              index={photoIndex}
              onIndexChange={setPhotoIndex}
            />
          </SheetCard>

          <SheetCard icon={Package} title={`Formules (${offerings.length})`}>
            <ul className="flex flex-col divide-y rounded-xl border">
              {offerings.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 p-3.5">
                  <span className="font-medium">{o.title}</span>
                  <span className="text-muted-foreground">
                    {o.price === undefined ? 'Sur devis' : formatPrice(o.price)}
                    {!o.isActive && ' · inactive'}
                  </span>
                </li>
              ))}
            </ul>
          </SheetCard>
        </div>

        <aside className="flex flex-col gap-6 xl:sticky xl:top-[96px]">
          {canDecide ? (
            <section
              aria-labelledby="sheet-decision"
              className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-card sm:p-6"
            >
              <h2
                id="sheet-decision"
                className="flex items-center gap-2.5 text-xl font-bold sm:text-[22px]"
              >
                <ShieldCheck className="size-5 text-primary" strokeWidth={1.8} aria-hidden />
                Décision
              </h2>
              <label
                htmlFor={verifiedId}
                className="flex items-start gap-2.5 rounded-xl bg-muted p-3 text-sm"
              >
                <input
                  id={verifiedId}
                  type="checkbox"
                  className="mt-0.5 size-4 accent-primary"
                  checked={verified}
                  disabled={!profile.siret}
                  onChange={(event) => setVerified(event.target.checked)}
                />
                SIRET vérifié : afficher le badge « Pro vérifié »
              </label>
              {moderate.isError && (
                <p role="alert" className="text-sm text-destructive">
                  {moderate.error instanceof ApiError
                    ? moderate.error.message
                    : 'L’action a échoué.'}
                </p>
              )}
              <div className="flex flex-col gap-2.5">
                <Button
                  variant="cta"
                  className="h-11 w-full"
                  disabled={moderate.isPending}
                  onClick={() =>
                    moderate.mutate(
                      { decision: 'validate', isProVerified: verified },
                      { onSuccess: () => backToList(`« ${name} » est validé et publié.`) },
                    )
                  }
                >
                  <CheckCircle2 aria-hidden />
                  Valider et publier
                </Button>
                <ReasonDialog
                  trigger={
                    <Button variant="outline" className="h-11 w-full">
                      Demander des corrections
                    </Button>
                  }
                  title="Demander des corrections"
                  description="Le prestataire verra ce message et pourra renvoyer son profil."
                  confirmLabel="Envoyer la demande"
                  minLength={10}
                  onConfirm={(reason) =>
                    moderate
                      .mutateAsync({ decision: 'request_changes', reason })
                      .then(() => backToList(`Demande de corrections envoyée à « ${name} ».`))
                  }
                />
                <ReasonDialog
                  trigger={
                    <Button
                      variant="ghost"
                      className="h-11 w-full text-destructive hover:bg-red-50 hover:text-destructive"
                    >
                      Refuser
                    </Button>
                  }
                  title="Refuser ce profil"
                  description="Le refus est définitif : le prestataire ne pourra pas renvoyer ce profil."
                  confirmLabel="Refuser le profil"
                  minLength={10}
                  destructive
                  onConfirm={(reason) =>
                    moderate
                      .mutateAsync({ decision: 'reject', reason })
                      .then(() => backToList(`« ${name} » est refusé.`))
                  }
                />
              </div>
            </section>
          ) : (
            <p className="flex items-start gap-2 rounded-2xl border bg-card p-5 text-sm text-muted-foreground shadow-card">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              Ce profil n’est pas en attente de validation : aucune décision à prendre.
            </p>
          )}

          {history.length > 0 && (
            <SheetCard icon={History} title="Historique">
              <ol className="flex flex-col gap-3 text-sm">
                {history.map((action) => (
                  <li key={action.id} className="border-l-2 border-ochre pl-3">
                    <span className="font-semibold">{MODERATION_ACTION_LABELS[action.action]}</span>
                    <span className="block text-muted-foreground">
                      {formatDateTime(action.createdAt)}
                    </span>
                    {action.note && <span className="block">« {action.note} »</span>}
                  </li>
                ))}
              </ol>
            </SheetCard>
          )}
        </aside>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}
