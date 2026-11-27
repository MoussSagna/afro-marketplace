import {
  ApiError,
  EVENT_BUDGET_LABELS,
  canRequestEventQuote,
  useCategories,
  useEvent,
  useRequestEventQuotes,
  type EventDetails,
} from '@afro/common';
import { ArrowLeft, Check, Plus, Send } from 'lucide-react';
import { useId, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { NotFoundPage } from '@/app/NotFoundPage';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { usePageMeta } from '@/hooks/usePageMeta';
import { cn } from '@/lib/utils';
import { toast } from '@/stores/toasts';
import { EventProviderStatusBadge } from '../components/EventBadges';
import { VerifiedIcon } from '../components/VerifiedIcon';
import { formatEventDay, plural } from '../lib/eventDisplay';

/**
 * Demander les devis en une fois : une vraie demande par prestataire coché (mêmes règles qu'une
 * demande classique), puis retour au détail avec les statuts « Devis demandé ».
 */
export function RequestQuotesPage() {
  const { eventId = '' } = useParams();
  const details = useEvent(eventId);
  usePageMeta('Demander les devis');

  if (details.isPending)
    return <Skeleton className="h-96 rounded-2xl" role="status" aria-label="Chargement" />;
  if (details.isError) {
    if (details.error instanceof ApiError && details.error.status === 404) return <NotFoundPage />;
    return (
      <p role="alert" className="rounded-xl bg-red-50 p-4 text-destructive">
        Impossible de charger cet événement.
      </p>
    );
  }
  return <RequestQuotesForm details={details.data} />;
}

function RequestQuotesForm({ details }: { details: EventDetails }) {
  const { event, providers } = details;
  const eligible = providers
    .filter((p) => canRequestEventQuote(p.status))
    .map((p) => p.provider.id);
  // Prestataires à contacter en premier, déjà contactés ensuite.
  const ordered = [...providers].sort(
    (a, b) => Number(!canRequestEventQuote(a.status)) - Number(!canRequestEventQuote(b.status)),
  );
  const [selected, setSelected] = useState(() => new Set(eligible));
  const [message, setMessage] = useState('');
  const send = useRequestEventQuotes(event.id);
  const categories = useCategories().data ?? [];
  const navigate = useNavigate();
  const messageId = useId();
  const count = selected.size;
  const nameOf = (id: string) =>
    providers.find((p) => p.provider.id === id)?.provider.displayName ?? '';

  const toggle = (id: string, on: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!count) return;
    send.mutate(
      { providerIds: [...selected], ...(message.trim() && { message: message.trim() }) },
      {
        onSuccess: (result) => {
          navigate(`/evenements/${event.id}`);
          if (result.sent.length) {
            toast({
              title:
                result.sent.length > 1 ? 'Demandes de devis envoyées' : 'Demande de devis envoyée',
              description:
                result.failed.length === 0
                  ? `${plural(result.sent.length, 'prestataire va', 'prestataires vont')} recevoir votre demande.`
                  : `Envoyée à ${result.sent.map((s) => nameOf(s.providerId)).join(', ')}. Pas envoyée à ${result.failed.map((f) => `${nameOf(f.providerId)} (${f.message.replace(/\.$/, '').toLowerCase()})`).join(', ')}.`,
            });
          } else {
            toast({
              tone: 'info',
              title: 'Aucune demande envoyée',
              description: result.failed
                .map((f) => `${nameOf(f.providerId)} : ${f.message}`)
                .join(' '),
            });
          }
        },
      },
    );
  }

  const submitButton = (className = '') => (
    <Button
      type="submit"
      variant="cta"
      size="lg"
      disabled={!count || send.isPending}
      className={cn('h-12 text-base has-[>svg]:px-5', className)}
    >
      <Send aria-hidden />
      Envoyer les demandes de devis
    </Button>
  );

  return (
    <section aria-labelledby="quotes-title" className="flex flex-col gap-5">
      <Link
        to={`/evenements/${event.id}`}
        className="flex w-fit items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour à l’événement
      </Link>
      <header>
        <h1 id="quotes-title" className="text-[26px] leading-tight font-bold sm:text-4xl">
          Demander les devis
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Sélectionnez les prestataires à qui vous souhaitez envoyer une demande de devis.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6"
      >
        <div className="flex min-w-0 flex-col gap-5">
          <fieldset className="overflow-hidden rounded-2xl border bg-card shadow-card">
            <legend className="sr-only">Prestataires</legend>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3.5 text-sm sm:px-5">
              <strong aria-live="polite">
                {eligible.length === 0
                  ? 'Toutes les demandes ont déjà été envoyées'
                  : plural(count, 'prestataire sélectionné', 'prestataires sélectionnés')}
              </strong>
              {eligible.length > 1 && (
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline"
                  onClick={() =>
                    setSelected(count === eligible.length ? new Set() : new Set(eligible))
                  }
                >
                  {count === eligible.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              )}
            </div>
            {providers.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                <p className="text-muted-foreground">Aucun prestataire dans cet événement.</p>
                <Button asChild variant="outline">
                  <Link to={`/evenements/${event.id}/ajouter`}>
                    <Plus aria-hidden />
                    Ajouter un prestataire
                  </Link>
                </Button>
              </div>
            ) : (
              <ul>
                {ordered.map(({ provider, status }) => {
                  const can = canRequestEventQuote(status);
                  const checked = selected.has(provider.id);
                  const sub = categories.find((c) => c.id === provider.categoryIds[0]);
                  return (
                    <li
                      key={provider.id}
                      className={cn('border-t first:border-t-0', checked && 'bg-cta/8')}
                    >
                      <label
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 sm:gap-3.5 sm:px-5',
                          can ? 'cursor-pointer' : 'cursor-default',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!can}
                          onChange={(e) => toggle(provider.id, e.target.checked)}
                          className="size-5 shrink-0 accent-primary disabled:opacity-40"
                        />
                        <img
                          src={provider.coverUrl}
                          alt=""
                          className="size-12 shrink-0 rounded-xl bg-muted object-cover"
                        />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="flex items-center gap-1.5 font-bold">
                            <span className="truncate">{provider.displayName}</span>
                            {provider.isProVerified && <VerifiedIcon className="size-[18px]" />}
                          </span>
                          <span className="truncate text-[13.5px] text-muted-foreground">
                            {sub?.name}
                            {!can && ' · déjà contacté'}
                          </span>
                          {/* Téléphone : le statut passe sous le nom (les noms ne se coupent plus). */}
                          <EventProviderStatusBadge
                            status={status}
                            className="mt-1.5 w-fit sm:hidden"
                          />
                        </span>
                        <EventProviderStatusBadge
                          status={status}
                          className="hidden sm:inline-flex"
                        />
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </fieldset>

          <div className="flex flex-col gap-2 rounded-2xl border bg-card p-4 shadow-card sm:p-5">
            <Label htmlFor={messageId} className="text-sm font-semibold">
              Message aux prestataires{' '}
              <span className="font-normal text-muted-foreground">(facultatif)</span>
            </Label>
            <Textarea
              id={messageId}
              rows={4}
              maxLength={2000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Bonjour, nous organisons « ${event.name} » et aimerions recevoir votre devis…`}
              className="text-[15px]"
            />
            <p className="text-sm text-muted-foreground">
              Sans message (ou s’il est très court), Wenzee présente votre événement à votre place.
              Chaque prestataire reçoit sa propre demande ; vous suivez les réponses dans « Mes
              demandes ».
            </p>
          </div>
        </div>

        <aside
          aria-labelledby="recap-title"
          className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-card lg:sticky lg:top-24"
        >
          <h2 id="recap-title" className="text-xl font-bold">
            Récapitulatif
          </h2>
          <dl className="flex flex-col gap-2.5 text-[15px]">
            <RecapRow label="Événement" value={event.name} />
            <RecapRow label="Date" value={formatEventDay(event.date)} />
            <RecapRow label="Ville" value={`${event.city} (${event.postalCode})`} />
            <RecapRow label="Invités" value={String(event.guestCount)} />
            {event.budget && (
              <RecapRow label="Budget indicatif" value={EVENT_BUDGET_LABELS[event.budget]} />
            )}
          </dl>
          <ul
            aria-label="Prestataires choisis"
            className="flex flex-col gap-1.5 border-t pt-3.5 text-[15px]"
          >
            {count === 0 ? (
              <li className="text-muted-foreground">Aucun prestataire sélectionné</li>
            ) : (
              [...selected].map((id) => (
                <li key={id} className="flex items-center gap-2">
                  <Check className="size-4 text-success" aria-hidden />
                  {nameOf(id)}
                </li>
              ))
            )}
          </ul>
          {send.isError && (
            <p role="alert" className="text-sm text-destructive">
              {send.error instanceof ApiError ? send.error.message : 'L’envoi a échoué. Réessayez.'}
            </p>
          )}
          {submitButton('hidden w-full sm:inline-flex')}
        </aside>

        <div className="sticky bottom-0 z-20 -mx-4 border-t bg-card px-4 py-3 sm:hidden">
          {submitButton('w-full')}
        </div>
      </form>
    </section>
  );
}

function RecapRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
