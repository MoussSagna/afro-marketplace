import {
  addDays,
  ApiError,
  EVENT_TYPE_LABELS,
  formatOfferingPrice,
  toIsoDate,
  useApiClient,
  useCreateQuoteRequest,
  useProvider,
  useUnavailableDates,
  type EventType,
} from '@afro/common';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { NotFoundPage } from '@/app/NotFoundPage';
import { Rating } from '@/components/Rating';
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
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useSessionStore } from '@/stores/session';
import {
  emptyQuoteRequestForm,
  quoteRequestFormSchema,
  toCreateQuoteRequestInput,
  type QuoteRequestFormValues,
} from '../lib/requestForm';

/**
 * C1 : le formulaire de demande de devis.
 *
 * La page est protégée : un visiteur passe d'abord par la connexion de démo,
 * puis revient ici grâce à `?retour=`. Une fois la demande envoyée, on ouvre
 * directement la conversation avec le prestataire.
 */
export function QuoteRequestPage() {
  const { slug = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const api = useApiClient();
  const user = useSessionStore((state) => state.user);
  const provider = useProvider(slug);
  const createRequest = useCreateQuoteRequest();

  // Les jours déjà pris, pour prévenir AVANT l'envoi (le serveur revérifie de toute façon).
  const tomorrow = addDays(toIsoDate(new Date()), 1);
  const unavailable = useUnavailableDates(provider.data?.profile.id, {
    from: tomorrow,
    to: addDays(tomorrow, 365),
  });

  const form = useForm<QuoteRequestFormValues>({
    resolver: zodResolver(quoteRequestFormSchema),
    defaultValues: { ...emptyQuoteRequestForm, eventDate: searchParams.get('date') ?? '' },
  });

  const profile = provider.data?.profile;
  usePageMeta(profile && `Demander un devis à ${profile.displayName}`);

  if (provider.isPending) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8" aria-label="Chargement">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }
  if (provider.isError) {
    if (provider.error instanceof ApiError && provider.error.status === 404)
      return <NotFoundPage />;
    return (
      <p role="alert" className="mx-auto my-12 max-w-xl rounded-lg bg-red-50 p-4 text-destructive">
        Impossible de charger ce prestataire. Réessaie dans un instant.
      </p>
    );
  }

  const p = provider.data.profile;
  const offerings = provider.data.offerings;
  const offeringId = searchParams.get('formule') ?? undefined;
  const offering = offerings.find((o) => o.id === offeringId);
  const isOwnProfile = user?.id === p.userId;

  async function onSubmit(values: QuoteRequestFormValues) {
    if (unavailable.data?.includes(values.eventDate)) {
      form.setError('eventDate', { message: 'Ce prestataire n’est pas disponible à cette date.' });
      return;
    }
    try {
      const created = await createRequest.mutateAsync(
        toCreateQuoteRequestInput(values, { providerId: p.id, offeringId: offering?.id }),
      );
      // La conversation a été ouverte par le serveur : on va la voir.
      const details = await api.getQuoteRequest(created.id);
      navigate(`/espace/messages/${details.conversationId}?envoyee=1`, { replace: true });
    } catch (error) {
      // Les erreurs « métier » (date prise, etc.) viennent du serveur avec un message lisible.
      form.setError('root', {
        message:
          error instanceof ApiError
            ? error.message
            : 'L’envoi a échoué. Vérifie ta connexion et réessaie.',
      });
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 lg:grid-cols-[1fr_300px]">
      <section aria-labelledby="request-title" className="min-w-0">
        <Link
          to={`/prestataires/${p.slug}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> Retour au profil
        </Link>
        <h1 id="request-title" className="text-3xl font-semibold">
          Demander un devis
        </h1>
        <p className="mt-2 text-muted-foreground">
          Décris ton événement : {p.displayName} te répondra dans la messagerie, en général sous{' '}
          {p.responseTimeHours ?? 48} h. C’est gratuit et sans engagement.
        </p>

        {isOwnProfile && (
          <p role="alert" className="mt-6 rounded-lg bg-warning-muted p-4 text-warning">
            C’est ton propre profil : tu ne peux pas t’envoyer une demande à toi-même.
          </p>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="mt-8 flex flex-col gap-6"
            aria-label="Demande de devis"
          >
            <FormField
              control={form.control}
              name="clientType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel asChild>
                    <legend>Tu organises cet événement…</legend>
                  </FormLabel>
                  <div role="radiogroup" className="flex flex-wrap gap-2">
                    {(
                      [
                        ['individual', 'À titre personnel'],
                        ['business', 'Pour une entreprise ou une association'],
                      ] as const
                    ).map(([value, label]) => (
                      <label
                        key={value}
                        className="flex cursor-pointer items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm has-checked:border-primary has-checked:bg-muted"
                      >
                        <input
                          type="radio"
                          name={field.name}
                          value={value}
                          checked={field.value === value}
                          onChange={() => field.onChange(value)}
                          className="accent-primary"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </FormItem>
              )}
            />

            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="eventType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type d’événement</FormLabel>
                    <FormControl>
                      <NativeSelect {...field}>
                        <option value="">Choisir…</option>
                        {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((type) => (
                          <option key={type} value={type}>
                            {EVENT_TYPE_LABELS[type]}
                          </option>
                        ))}
                      </NativeSelect>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="eventDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" min={tomorrow} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="eventCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville</FormLabel>
                    <FormControl>
                      <Input autoComplete="address-level2" placeholder="Ex. : Créteil" {...field} />
                    </FormControl>
                    <FormDescription>
                      L’adresse précise ne sera donnée qu’à la réservation.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="eventPostalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code postal</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        autoComplete="postal-code"
                        placeholder="Ex. : 94000"
                        maxLength={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="guestCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre d’invités (facultatif)</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" placeholder="Ex. : 120" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="budgetMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget min (€)</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" placeholder="Ex. : 1500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="budgetMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget max (€)</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" placeholder="Ex. : 2500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ton message</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={6}
                      placeholder="Bonjour, nous organisons… Nous aimerions…"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Pour ta sécurité, les numéros de téléphone et les emails sont masqués jusqu’à la
                    réservation.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <p role="alert" className="rounded-lg bg-red-50 p-4 text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}

            <Button
              variant="cta"
              type="submit"
              size="lg"
              className="self-start"
              disabled={form.formState.isSubmitting || isOwnProfile}
            >
              <Send aria-hidden />
              {form.formState.isSubmitting ? 'Envoi…' : 'Envoyer ma demande'}
            </Button>
          </form>
        </Form>
      </section>

      <aside aria-label="Prestataire" className="lg:pt-24">
        <div className="sticky top-24 flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-card">
          {p.coverUrl && (
            <img src={p.coverUrl} alt="" className="h-32 w-full rounded-lg object-cover" />
          )}
          <p className="font-display text-lg font-semibold">{p.displayName}</p>
          <p className="text-sm text-muted-foreground">{p.city}</p>
          <Rating value={p.ratingAverage} count={p.ratingCount} />
          {offering && (
            <p className="rounded-md bg-muted p-3 text-sm">
              Formule choisie : <strong>{offering.title}</strong>
              <br />
              {formatOfferingPrice(offering)}
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
