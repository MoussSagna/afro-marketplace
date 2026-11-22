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
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useId, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { NotFoundPage } from '@/app/NotFoundPage';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { StatusPill } from '../components/AdminTable';
import { ReasonDialog } from '../components/ReasonDialog';

/** A2 : la fiche d'un profil à valider, et les trois décisions possibles. */
export function ProviderReviewPage() {
  const { id = '' } = useParams();
  const details = useAdminProvider(id);
  usePageMeta('Fiche prestataire');

  if (details.isPending)
    return <Skeleton className="h-96 rounded-xl" role="status" aria-label="Chargement" />;
  if (details.isError) {
    if (details.error instanceof ApiError && details.error.status === 404) return <NotFoundPage />;
    return (
      <p role="alert" className="rounded-lg bg-red-50 p-4 text-destructive">
        Impossible de charger ce profil.
      </p>
    );
  }
  return <ProviderSheet details={details.data} />;
}

function ProviderSheet({ details }: { details: AdminProviderDetails }) {
  const { profile, owner, media, offerings, history } = details;
  const categories = useCategories();
  const moderate = useModerateProvider(profile.id);
  const navigate = useNavigate();
  const [verified, setVerified] = useState(profile.siret !== undefined);
  const verifiedId = useId();
  const missing = getMissingProfileRequirements(profile, media, offerings);
  const canDecide = profile.status === 'pending_review';
  const backToList = () => navigate('/admin/prestataires');

  return (
    <section aria-labelledby="sheet-title" className="flex flex-col gap-6">
      <Link
        to="/admin/prestataires"
        className="flex w-fit items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Profils à valider
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 id="sheet-title" className="text-3xl font-semibold">
            {profile.displayName}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {owner.firstName} {owner.lastName} · {owner.email}
          </p>
        </div>
        <StatusPill tone={profile.status === 'published' ? 'success' : 'warning'}>
          {PROVIDER_STATUS_LABELS[profile.status]}
        </StatusPill>
      </header>

      {missing.length > 0 && (
        <p role="note" className="rounded-lg bg-warning-muted p-4 text-sm">
          Profil incomplet : {missing.map((m) => m.message).join(' · ')}
        </p>
      )}

      <dl className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted-foreground">Statut juridique</dt>
          <dd>{LEGAL_TYPE_LABELS[profile.legalType]}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">SIRET</dt>
          <dd>{profile.siret ?? 'Non renseigné'}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Catégories</dt>
          <dd>
            {profile.categoryIds
              .map((id) => categories.data?.find((c) => c.id === id)?.name)
              .filter(Boolean)
              .join(', ') || '—'}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Zone</dt>
          <dd>
            {profile.city || '—'} {profile.postalCode} · {profile.travelRadiusKm} km
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Langues</dt>
          <dd>{profile.languages.map(languageLabel).join(', ')}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Annulation</dt>
          <dd>{describeCancellationPolicy(profile.cancellationPolicy).join(' ')}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm text-muted-foreground">Présentation</dt>
          <dd className="whitespace-pre-line">{profile.bio || '—'}</dd>
        </div>
      </dl>

      <section aria-labelledby="sheet-photos">
        <h2 id="sheet-photos" className="mb-3 text-xl font-semibold">
          Photos ({media.length})
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {media.map((m, index) => (
            <li key={m.id}>
              <img
                src={m.url}
                alt={m.caption ?? `Photo ${index + 1}`}
                className="aspect-[3/2] w-full rounded-lg border object-cover"
              />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="sheet-offerings">
        <h2 id="sheet-offerings" className="mb-3 text-xl font-semibold">
          Formules ({offerings.length})
        </h2>
        <ul className="flex flex-col gap-2">
          {offerings.map((o) => (
            <li key={o.id} className="rounded-lg border bg-card p-3">
              <span className="font-medium">{o.title}</span>
              <span className="text-muted-foreground">
                {' '}
                · {o.price === undefined ? 'Sur devis' : formatPrice(o.price)}
                {!o.isActive && ' · inactive'}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {history.length > 0 && (
        <section aria-labelledby="sheet-history">
          <h2 id="sheet-history" className="mb-3 text-xl font-semibold">
            Historique
          </h2>
          <ul className="flex flex-col gap-1 text-sm">
            {history.map((action) => (
              <li key={action.id}>
                {formatDateTime(action.createdAt)} : {MODERATION_ACTION_LABELS[action.action]}
                {action.note && <span className="text-muted-foreground"> ({action.note})</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {canDecide && (
        <section
          aria-labelledby="sheet-decision"
          className="flex flex-col gap-4 rounded-xl border bg-card p-5"
        >
          <h2 id="sheet-decision" className="text-xl font-semibold">
            Décision
          </h2>
          <label htmlFor={verifiedId} className="flex items-center gap-2 text-sm">
            <input
              id={verifiedId}
              type="checkbox"
              className="size-4 accent-primary"
              checked={verified}
              disabled={!profile.siret}
              onChange={(event) => setVerified(event.target.checked)}
            />
            SIRET vérifié : afficher le badge « Pro vérifié »
          </label>
          {moderate.isError && (
            <p role="alert" className="text-sm text-destructive">
              {moderate.error instanceof ApiError ? moderate.error.message : 'L’action a échoué.'}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="cta"
              disabled={moderate.isPending}
              onClick={() =>
                moderate.mutate(
                  { decision: 'validate', isProVerified: verified },
                  { onSuccess: backToList },
                )
              }
            >
              <CheckCircle2 aria-hidden />
              Valider et publier
            </Button>
            <ReasonDialog
              trigger={<Button variant="outline">Demander des corrections</Button>}
              title="Demander des corrections"
              description="Le prestataire verra ce message et pourra renvoyer son profil."
              confirmLabel="Envoyer la demande"
              minLength={10}
              onConfirm={(reason) =>
                moderate.mutateAsync({ decision: 'request_changes', reason }).then(backToList)
              }
            />
            <ReasonDialog
              trigger={<Button variant="ghost">Refuser</Button>}
              title="Refuser ce profil"
              description="Le refus est définitif : le prestataire ne pourra pas renvoyer ce profil."
              confirmLabel="Refuser le profil"
              minLength={10}
              destructive
              onConfirm={(reason) =>
                moderate.mutateAsync({ decision: 'reject', reason }).then(backToList)
              }
            />
          </div>
        </section>
      )}
    </section>
  );
}
