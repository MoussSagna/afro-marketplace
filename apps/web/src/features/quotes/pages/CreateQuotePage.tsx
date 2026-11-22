import {
  ApiError,
  EVENT_TYPE_LABELS,
  formatEventDate,
  formatPrice,
  toIsoDate,
  useCreateQuote,
  useQuoteRequest,
} from '@afro/common';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Plus, Send, Trash2 } from 'lucide-react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { NotFoundPage } from '@/app/NotFoundPage';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { usePageMeta } from '@/hooks/usePageMeta';
import {
  emptyLine,
  initialQuoteForm,
  liveTotals,
  quoteFormSchema,
  toCreateQuoteInput,
  type QuoteFormValues,
} from '../lib/quoteForm';

/** S4 : le prestataire envoie un devis (ou une nouvelle version, en reprenant la précédente). */
export function CreateQuotePage() {
  const { id = '' } = useParams();
  const details = useQuoteRequest(id);
  usePageMeta('Envoyer un devis');

  if (details.isPending) {
    return <Skeleton className="h-96 rounded-xl" aria-label="Chargement" />;
  }
  if (details.isError) {
    if (details.error instanceof ApiError && details.error.status === 404) return <NotFoundPage />;
    return (
      <p role="alert" className="rounded-lg bg-red-50 p-4 text-destructive">
        Impossible de charger cette demande.
      </p>
    );
  }
  // Le formulaire n'est monté qu'une fois la demande chargée : ses valeurs de départ en dépendent.
  return <QuoteForm details={details.data} />;
}

function QuoteForm({
  details,
}: {
  details: NonNullable<ReturnType<typeof useQuoteRequest>['data']>;
}) {
  const navigate = useNavigate();
  const createQuote = useCreateQuote();
  const { request, client, latestQuote } = details;
  const nextVersion = (latestQuote?.version ?? 0) + 1;
  const canQuote = request.status === 'pending' || request.status === 'quoted';
  const detailUrl = `/pro/demandes/${request.id}`;

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: initialQuoteForm(toIsoDate(new Date()), latestQuote),
  });
  const lines = useFieldArray({ control: form.control, name: 'lines' });
  const watched = useWatch({ control: form.control });
  const totals = liveTotals({
    lines: (watched.lines ?? []).map((l) => ({
      label: l?.label ?? '',
      quantity: l?.quantity ?? '',
      unitPrice: l?.unitPrice ?? '',
    })),
    depositRate: watched.depositRate ?? '',
  });

  async function onSubmit(values: QuoteFormValues) {
    try {
      await createQuote.mutateAsync(toCreateQuoteInput(values, request.id));
      navigate(detailUrl, { replace: true });
    } catch (error) {
      form.setError('root', {
        message: error instanceof ApiError ? error.message : 'Le devis n’a pas pu être envoyé.',
      });
    }
  }

  return (
    <article className="flex flex-col gap-6">
      <Link
        to={detailUrl}
        className="inline-flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Retour à la demande
      </Link>
      <header>
        <h1 className="text-3xl font-semibold">
          {nextVersion === 1 ? 'Envoyer un devis' : `Nouvelle version du devis (n° ${nextVersion})`}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Pour {client.firstName} {client.lastNameInitial} · {EVENT_TYPE_LABELS[request.eventType]}{' '}
          le {formatEventDate(request.eventDate)} à {request.eventCity}
          {request.guestCount ? ` · ${request.guestCount} invités` : ''}
        </p>
        {nextVersion > 1 && (
          <p className="mt-2 text-sm text-muted-foreground">
            La version précédente sera remplacée : le client ne pourra accepter que la nouvelle.
          </p>
        )}
      </header>

      {!canQuote ? (
        <p role="alert" className="rounded-lg bg-muted p-4">
          Cette demande n’accepte plus de devis.
        </p>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
            <fieldset className="flex flex-col gap-3 rounded-xl border bg-card p-4">
              <legend className="px-1 font-display text-xl font-semibold">Lignes du devis</legend>
              <div className="hidden grid-cols-[1fr_6rem_8rem_7rem_2.5rem] gap-2 text-sm text-muted-foreground md:grid">
                <span>Libellé</span>
                <span>Quantité</span>
                <span>Prix unitaire (€)</span>
                <span className="text-right">Total</span>
              </div>
              {lines.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-2 gap-2 border-b pb-3 last:border-0 md:grid-cols-[1fr_6rem_8rem_7rem_2.5rem] md:border-0 md:pb-0"
                >
                  <FormField
                    control={form.control}
                    name={`lines.${index}.label`}
                    render={({ field: input }) => (
                      <FormItem className="col-span-2 md:col-span-1">
                        <FormLabel className="md:sr-only">
                          Libellé de la ligne {index + 1}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Ex. : Buffet thiéboudienne" {...input} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`lines.${index}.quantity`}
                    render={({ field: input }) => (
                      <FormItem>
                        <FormLabel className="md:sr-only">Quantité ligne {index + 1}</FormLabel>
                        <FormControl>
                          <Input inputMode="numeric" {...input} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`lines.${index}.unitPrice`}
                    render={({ field: input }) => (
                      <FormItem>
                        <FormLabel className="md:sr-only">
                          Prix unitaire ligne {index + 1}
                        </FormLabel>
                        <FormControl>
                          <Input inputMode="decimal" placeholder="28,50" {...input} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <p className="self-center text-right font-medium tabular-nums">
                    {formatPrice(totals.lineTotals[index] ?? 0)}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Supprimer la ligne ${index + 1}`}
                    disabled={lines.fields.length === 1}
                    onClick={() => lines.remove(index)}
                    className="justify-self-end"
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => lines.append({ ...emptyLine })}
                disabled={lines.fields.length >= 30}
              >
                <Plus aria-hidden /> Ajouter une ligne
              </Button>
              <p className="flex justify-between border-t pt-3 text-lg font-semibold">
                <span>Total</span>
                <span aria-live="polite" className="tabular-nums">
                  {formatPrice(totals.total)}
                </span>
              </p>
            </fieldset>

            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="depositRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Acompte (%)</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" {...field} />
                    </FormControl>
                    <FormDescription>
                      Soit {formatPrice(totals.deposit)} à la réservation.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valable jusqu’au</FormLabel>
                    <FormControl>
                      <Input type="date" min={toIsoDate(new Date())} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conditions (facultatif)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Ex. : vaisselle fournie, installation 2 h avant"
                      {...field}
                    />
                  </FormControl>
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
              disabled={form.formState.isSubmitting}
            >
              <Send aria-hidden /> Envoyer le devis
            </Button>
          </form>
        </Form>
      )}
    </article>
  );
}
