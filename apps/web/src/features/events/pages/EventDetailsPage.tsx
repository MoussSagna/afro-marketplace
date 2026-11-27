import {
  ApiError,
  EVENT_BUDGET_LABELS,
  PLANNED_EVENT_TYPE_LABELS,
  canRequestEventQuote,
  useCategories,
  useDeleteEvent,
  useEvent,
  useRemoveEventProvider,
  useRestoreEvent,
  useSetEventProviderRetained,
  type Category,
  type EventDetails,
} from '@afro/common';
import {
  Award,
  CalendarDays,
  Check,
  ChevronRight,
  FileText,
  MapPin,
  Pencil,
  Plus,
  Send,
  Trash2,
  TriangleAlert,
  Undo2,
  UserRound,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { NotFoundPage } from '@/app/NotFoundPage';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Rating } from '@/components/Rating';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { categoryIcon } from '@/features/provider-profile/lib/categoryIcon';
import { usePageMeta } from '@/hooks/usePageMeta';
import { toast } from '@/stores/toasts';
import { EventProviderStatusBadge, EventStatusBadge } from '../components/EventBadges';
import { VerifiedIcon } from '../components/VerifiedIcon';
import {
  EVENT_TYPE_ICONS,
  EVENT_TYPE_PHOTOS,
  formatEventDay,
  missingGroups,
  plural,
  providerGroupId,
} from '../lib/eventDisplay';

/** Le détail d'un événement : ses prestataires, leurs statuts, les actions. */
export function EventDetailsPage() {
  const { eventId = '' } = useParams();
  const details = useEvent(eventId);
  usePageMeta(details.data?.event.name ?? 'Mon événement');

  if (details.isPending) {
    return (
      <div role="status" aria-label="Chargement" className="flex flex-col gap-5">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }
  if (details.isError) {
    if (details.error instanceof ApiError && details.error.status === 404) return <NotFoundPage />;
    return (
      <p role="alert" className="rounded-xl bg-red-50 p-4 text-destructive">
        Impossible de charger cet événement.
      </p>
    );
  }
  return <EventDetailsView details={details.data} />;
}

type ProviderEntry = EventDetails['providers'][number];

function EventDetailsView({ details }: { details: EventDetails }) {
  const { event, status, counts, providers } = details;
  const categories = useCategories().data ?? [];
  const navigate = useNavigate();
  const [removing, setRemoving] = useState<ProviderEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const remove = useRemoveEventProvider(event.id);
  const del = useDeleteEvent();
  const restore = useRestoreEvent();
  const retain = useSetEventProviderRetained(event.id);
  const TypeIcon = EVENT_TYPE_ICONS[event.type];

  // Les prestataires groupés par famille (Traiteur & boissons, Musique & animation…).
  const groups = new Map<string, ProviderEntry[]>();
  for (const entry of providers) {
    const group = providerGroupId(entry.provider.categoryIds, categories) ?? 'autre';
    groups.set(group, [...(groups.get(group) ?? []), entry]);
  }
  const missing = missingGroups(event.type, groups.keys()).flatMap((id) => {
    const group = categories.find((c) => c.id === id);
    return group ? [group] : [];
  });
  const canRequest = providers.some((p) => canRequestEventQuote(p.status));

  function confirmRemove() {
    if (!removing) return;
    const name = removing.provider.displayName;
    remove.mutate(removing.provider.id, {
      onSuccess: () => {
        setRemoving(null);
        toast({
          title: 'Prestataire retiré',
          description: `« ${name} » a été retiré de l’événement.`,
        });
      },
    });
  }

  function confirmDelete() {
    del.mutate(event.id, {
      onSuccess: () => {
        setDeleting(false);
        navigate('/evenements');
        toast({
          title: 'Événement supprimé',
          description: 'L’événement a bien été supprimé.',
          action: {
            label: 'Annuler',
            // La page du détail n'est plus affichée quand on clique : `mutateAsync` (et non un
            // `onSuccess` de `mutate`, ignoré une fois le composant retiré).
            onClick: () =>
              void restore
                .mutateAsync(event.id)
                .then(() =>
                  toast({
                    title: 'Événement restauré',
                    description: `« ${event.name} » et ses prestataires sont de retour.`,
                  }),
                )
                .catch(() =>
                  toast({
                    tone: 'info',
                    title: 'Restauration impossible',
                    description: 'Réessayez dans un instant.',
                  }),
                ),
          },
        });
      },
    });
  }

  function toggleRetained(entry: ProviderEntry, retained: boolean) {
    retain.mutate(
      { providerId: entry.provider.id, retained },
      {
        onSuccess: () =>
          toast(
            retained
              ? {
                  title: 'Prestataire retenu',
                  description: `« ${entry.provider.displayName} » fait partie de vos choix. Ce n’est pas une réservation.`,
                }
              : {
                  title: 'Choix retiré',
                  description: `« ${entry.provider.displayName} » n’est plus retenu.`,
                },
          ),
        onError: (error) =>
          toast({
            tone: 'info',
            title: 'Action impossible',
            description: error instanceof ApiError ? error.message : undefined,
          }),
      },
    );
  }

  const requestButton = (className = '') =>
    canRequest ? (
      <Button
        asChild
        variant="cta"
        size="lg"
        className={`h-12 text-base has-[>svg]:px-5 ${className}`}
      >
        <Link to={`/evenements/${event.id}/devis`}>
          <Send aria-hidden />
          Demander les devis
        </Link>
      </Button>
    ) : (
      <Button
        variant="cta"
        size="lg"
        disabled
        className={`h-12 text-base has-[>svg]:px-5 ${className}`}
        title="Ajoutez d’abord un prestataire"
      >
        <Send aria-hidden />
        Demander les devis
      </Button>
    );
  const addUrl = `/evenements/${event.id}/ajouter`;

  return (
    <section aria-labelledby="event-title" className="flex flex-col gap-5 sm:gap-6">
      <Link
        to="/evenements"
        className="flex w-fit items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronRight className="size-4 rotate-180" aria-hidden />
        Mes événements
      </Link>

      <header className="flex flex-col gap-4 rounded-2xl border bg-card p-3.5 shadow-card sm:flex-row sm:gap-6 sm:p-5">
        <img
          src={EVENT_TYPE_PHOTOS[event.type]}
          alt=""
          className="h-36 w-full shrink-0 rounded-xl object-cover sm:h-[150px] sm:w-[220px]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3.5">
              <h1 id="event-title" className="text-2xl leading-tight font-bold sm:text-[32px]">
                {event.name}
              </h1>
              <EventStatusBadge status={status} />
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button
                asChild
                variant="outline"
                className="h-10 flex-1 sm:flex-none has-[>svg]:px-4"
              >
                <Link to={`/evenements/${event.id}/modifier`}>
                  <Pencil aria-hidden />
                  Modifier
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-10 flex-1 border-destructive/40 text-destructive hover:bg-red-50 hover:text-destructive sm:flex-none has-[>svg]:px-4"
                onClick={() => setDeleting(true)}
              >
                <Trash2 aria-hidden />
                Supprimer
              </Button>
            </div>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-[15px]">
            <Meta icon={TypeIcon}>{PLANNED_EVENT_TYPE_LABELS[event.type]}</Meta>
            <Meta icon={CalendarDays}>{formatEventDay(event.date)}</Meta>
            <Meta icon={MapPin}>
              {event.city} ({event.postalCode})
            </Meta>
            <Meta icon={Users}>{plural(event.guestCount, 'invité')}</Meta>
            {event.budget && <Meta icon={Wallet}>{EVENT_BUDGET_LABELS[event.budget]}</Meta>}
          </ul>
          {event.description && (
            <p className="max-w-[70ch] whitespace-pre-line text-muted-foreground">
              {event.description}
            </p>
          )}
        </div>
      </header>

      <ul aria-label="Indicateurs" className="grid grid-cols-4 gap-2 sm:gap-4">
        <Stat
          icon={UserRound}
          value={counts.providers}
          label={counts.providers > 1 ? 'prestataires ajoutés' : 'prestataire ajouté'}
        />
        <Stat
          icon={Send}
          value={counts.requested}
          label={counts.requested > 1 ? 'devis demandés' : 'devis demandé'}
        />
        <Stat
          icon={FileText}
          value={counts.received}
          label={counts.received > 1 ? 'devis reçus' : 'devis reçu'}
        />
        <Stat
          icon={Award}
          value={counts.retained}
          label={counts.retained > 1 ? 'retenus' : 'retenu'}
        />
      </ul>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="providers-title" className="flex min-w-0 flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="providers-title" className="text-xl font-bold sm:text-2xl">
              Prestataires de l’événement ({counts.providers})
            </h2>
            <Button
              asChild
              variant="outline"
              className="hidden h-10 sm:inline-flex has-[>svg]:px-4"
            >
              <Link to={addUrl}>
                <Plus aria-hidden />
                Ajouter un prestataire
              </Link>
            </Button>
          </div>
          {providers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-6 py-10 text-center shadow-card">
              <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-primary">
                <UserRound className="size-6" aria-hidden />
              </span>
              <h3 className="text-lg font-bold">Aucun prestataire pour l’instant</h3>
              <p className="max-w-md text-muted-foreground">
                Ajoutez les prestataires qui vous intéressent, puis envoyez-leur une demande de
                devis en une fois.
              </p>
              <Button asChild variant="cta" size="lg" className="h-11 has-[>svg]:px-5">
                <Link to={addUrl}>
                  <Plus aria-hidden />
                  Ajouter un prestataire
                </Link>
              </Button>
            </div>
          ) : (
            [...groups].map(([groupId, entries]) => {
              const group = categories.find((c) => c.id === groupId);
              const GroupIcon = categoryIcon(group);
              return (
                <div
                  key={groupId}
                  className="overflow-hidden rounded-2xl border bg-card shadow-card"
                >
                  <h3 className="flex items-center gap-2 px-4 pt-3.5 pb-2.5 font-sans text-[15px] font-bold sm:px-5">
                    <GroupIcon className="size-[18px] text-primary" aria-hidden />
                    {group?.name ?? 'Autres'} ({entries.length})
                  </h3>
                  <ul>
                    {entries.map((entry) => (
                      <ProviderRow
                        key={entry.link.id}
                        entry={entry}
                        categories={categories}
                        onRemove={() => setRemoving(entry)}
                        onRetain={(retained) => toggleRetained(entry, retained)}
                        busy={retain.isPending}
                      />
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </section>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
          {missing.length > 0 && (
            <section
              aria-labelledby="complete-title"
              className="rounded-2xl border bg-card p-5 shadow-card"
            >
              <h2 id="complete-title" className="text-xl font-bold">
                Complétez votre événement
              </h2>
              <p className="mt-1 mb-3 text-sm text-muted-foreground">
                Les prestataires souvent choisis pour un{' '}
                {PLANNED_EVENT_TYPE_LABELS[event.type].toLowerCase()}.
              </p>
              <ul>
                {missing.map((group) => {
                  const Icon = categoryIcon(group);
                  return (
                    <li key={group.id} className="flex items-center gap-3 border-t py-2.5">
                      <span
                        aria-hidden
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary"
                      >
                        <Icon className="size-5" />
                      </span>
                      <span className="flex-1 text-[15px] font-semibold">{group.name}</span>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="font-semibold text-primary"
                      >
                        <Link
                          to={`${addUrl}?categorie=${group.slug}`}
                          aria-label={`Découvrir : ${group.name}`}
                        >
                          Découvrir
                        </Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          <div className="hidden flex-col gap-3 rounded-2xl border bg-card p-5 shadow-card sm:flex">
            {requestButton('w-full')}
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 w-full text-base has-[>svg]:px-5"
            >
              <Link to={addUrl}>
                <Plus aria-hidden />
                Ajouter un prestataire
              </Link>
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Wenzee ne prend ni réservation ni paiement ici : comparez les devis et retenez vos
              prestataires.
            </p>
          </div>
        </aside>
      </div>

      {/* Téléphone : les deux actions restent sous le pouce. */}
      <div className="sticky bottom-0 z-20 -mx-4 flex gap-2.5 border-t bg-card px-4 py-3 sm:hidden">
        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-12 has-[>svg]:px-3.5"
          aria-label="Ajouter un prestataire"
        >
          <Link to={addUrl}>
            <Plus aria-hidden />
          </Link>
        </Button>
        {requestButton('flex-1')}
      </div>

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
        icon={Trash2}
        title="Retirer le prestataire ?"
        description={
          <>
            Souhaitez-vous vraiment retirer{' '}
            <strong className="text-foreground">« {removing?.provider.displayName} »</strong> de cet
            événement ?
          </>
        }
        note={
          removing && removing.status !== 'added'
            ? 'Sa demande de devis reste dans « Mes demandes » et dans la messagerie, mais n’est plus suivie ici.'
            : undefined
        }
        confirmLabel="Retirer"
        onConfirm={confirmRemove}
        pending={remove.isPending}
        error={
          remove.error instanceof ApiError
            ? remove.error.message
            : remove.isError
              ? 'Le retrait a échoué.'
              : null
        }
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        icon={TriangleAlert}
        title="Supprimer l’événement ?"
        description={
          <>
            Cette action supprimera <strong className="text-foreground">« {event.name} »</strong> et
            ses associations avec les prestataires. Les comptes des prestataires ne sont pas
            supprimés.
          </>
        }
        confirmLabel="Supprimer"
        onConfirm={confirmDelete}
        pending={del.isPending}
        error={del.isError ? 'La suppression a échoué.' : null}
      />
    </section>
  );
}

function Meta({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-1.5">
      <Icon className="size-[18px] text-primary" aria-hidden />
      {children}
    </li>
  );
}

function Stat({ icon: Icon, value, label }: { icon: LucideIcon; value: number; label: string }) {
  return (
    <li className="flex flex-col items-center justify-center gap-1 rounded-2xl border bg-card px-1.5 py-2.5 text-center shadow-card sm:flex-row sm:justify-start sm:gap-3.5 sm:px-4 sm:py-4 sm:text-left">
      <span
        aria-hidden
        className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-primary sm:flex"
      >
        <Icon className="size-5" />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="font-sans text-[22px] leading-none font-extrabold tabular-nums sm:text-[26px]">
          {value}
        </span>
        <span className="text-[11.5px] leading-tight text-muted-foreground sm:text-sm">
          {label}
        </span>
      </span>
    </li>
  );
}

function ProviderRow({
  entry,
  categories,
  onRemove,
  onRetain,
  busy,
}: {
  entry: ProviderEntry;
  categories: Category[];
  onRemove(): void;
  onRetain(retained: boolean): void;
  busy: boolean;
}) {
  const { provider, status, link } = entry;
  const category = categories.find((c) => c.id === provider.categoryIds[0]);
  return (
    <li className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 border-t px-4 py-3 sm:flex-nowrap sm:px-5">
      <img
        src={provider.coverUrl}
        alt=""
        loading="lazy"
        className="size-12 shrink-0 rounded-xl bg-muted object-cover sm:size-14"
      />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 font-bold">
          <Link
            to={`/prestataires/${provider.slug}`}
            className="truncate hover:text-primary hover:underline"
          >
            {provider.displayName}
          </Link>
          {provider.isProVerified && <VerifiedIcon />}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-[13.5px] text-muted-foreground">
          {category && <span>{category.name}</span>}
          {provider.ratingCount > 0 && (
            <Rating value={provider.ratingAverage} count={provider.ratingCount} variant="compact" />
          )}
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden />
            {provider.city}
          </span>
        </p>
      </div>
      <div className="ml-[62px] flex w-full items-center justify-between gap-2 sm:ml-0 sm:w-auto sm:justify-end">
        <EventProviderStatusBadge status={status} />
        <div className="flex items-center gap-1">
          {status === 'received' && (
            <Button
              variant="ghost"
              size="sm"
              className="font-semibold"
              disabled={busy}
              onClick={() => onRetain(true)}
            >
              <Check aria-hidden />
              Retenir
            </Button>
          )}
          {status === 'retained' && (
            <Button
              variant="ghost"
              size="sm"
              className="font-semibold"
              disabled={busy}
              onClick={() => onRetain(false)}
            >
              <Undo2 aria-hidden />
              Ne plus retenir
            </Button>
          )}
          {link.quoteRequestId && (
            <Button asChild variant="ghost" size="sm" className="font-semibold text-primary">
              <Link
                to={`/espace/demandes/${link.quoteRequestId}`}
                aria-label={`Voir la demande à ${provider.displayName}`}
              >
                <FileText aria-hidden />
                <span className="hidden md:inline">Demande</span>
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-red-50 hover:text-destructive"
            aria-label={`Retirer ${provider.displayName}`}
            onClick={onRemove}
          >
            <X aria-hidden />
          </Button>
        </div>
      </div>
    </li>
  );
}
