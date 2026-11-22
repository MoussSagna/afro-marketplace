import {
  ApiError,
  PRICING_TYPE_LABELS,
  formatPrice,
  pricingTypeSchema,
  useCategories,
  useDeleteOffering,
  useSaveOffering,
  type MyProviderDetails,
  type Offering,
} from '@afro/common';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import {
  offeringDefaults,
  offeringFormSchema,
  toOfferingInput,
  type OfferingFormValues,
} from '../lib/profileForms';

function describePrice(offering: Offering): string {
  if (offering.pricingType === 'on_quote' || offering.price === undefined) return 'Sur devis';
  const price = formatPrice(offering.price);
  if (offering.pricingType === 'per_person') return `${price} par personne`;
  if (offering.pricingType === 'from') return `À partir de ${price}`;
  return price;
}

/** Les formules du prestataire (S1 étape 5 et S7) : liste, ajout, modification, suppression. */
export function OfferingsEditor({ details }: { details: MyProviderDetails }) {
  // null = fenêtre fermée ; 'new' = nouvelle formule ; sinon la formule modifiée.
  const [editing, setEditing] = useState<Offering | 'new' | null>(null);
  const deleteOffering = useDeleteOffering();
  const categories = useCategories();
  const categoryName = (id: string) => categories.data?.find((c) => c.id === id)?.name ?? '';

  return (
    <section aria-labelledby="offerings-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="offerings-title" className="font-sans text-base font-semibold">
          Tes formules ({details.offerings.length})
        </h3>
        <Button type="button" variant="outline" size="sm" onClick={() => setEditing('new')}>
          <Plus aria-hidden />
          Ajouter une formule
        </Button>
      </div>
      {details.offerings.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-muted-foreground">
          Une formule, c’est une prestation type avec son prix : « Buffet mariage », « Coiffure de
          la mariée »… Il en faut au moins une active.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {details.offerings.map((offering) => (
            <li
              key={offering.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-3"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {offering.title}
                  {!offering.isActive && (
                    <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                      Inactive
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {categoryName(offering.categoryId)} · {describePrice(offering)}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Modifier la formule « ${offering.title} »`}
                  onClick={() => setEditing(offering)}
                >
                  <Pencil aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Supprimer la formule « ${offering.title} »`}
                  disabled={deleteOffering.isPending}
                  onClick={() => deleteOffering.mutate(offering.id)}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing === 'new' ? 'Nouvelle formule' : 'Modifier la formule'}
            </DialogTitle>
            <DialogDescription>Les prix sont en euros, TTC.</DialogDescription>
          </DialogHeader>
          {editing !== null && (
            <OfferingForm
              key={editing === 'new' ? 'new' : editing.id}
              details={details}
              offering={editing === 'new' ? undefined : editing}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function OfferingForm({
  details,
  offering,
  onDone,
}: {
  details: MyProviderDetails;
  offering?: Offering;
  onDone: () => void;
}) {
  const save = useSaveOffering();
  const categories = useCategories();
  // On propose d'abord les catégories du profil ; toutes si le profil n'en a pas encore.
  const mine = (categories.data ?? []).filter((c) => details.profile.categoryIds.includes(c.id));
  const options = mine.length > 0 ? mine : (categories.data ?? []);
  const form = useForm<OfferingFormValues>({
    resolver: zodResolver(offeringFormSchema),
    defaultValues: offeringDefaults(options[0]?.id ?? '', offering),
  });
  const pricingType = useWatch({ control: form.control, name: 'pricingType' });

  const onSubmit = form.handleSubmit((values) =>
    save.mutate({ id: offering?.id, input: toOfferingInput(values) }, { onSuccess: onDone }),
  );

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre de la formule</FormLabel>
              <FormControl>
                <Input placeholder="Ex. : Buffet mariage sénégalais" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catégorie</FormLabel>
              <FormControl>
                <NativeSelect {...field}>
                  {options.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (facultatif)</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="pricingType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de prix</FormLabel>
                <FormControl>
                  <NativeSelect {...field}>
                    {pricingTypeSchema.options.map((type) => (
                      <option key={type} value={type}>
                        {PRICING_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </NativeSelect>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {pricingType !== 'on_quote' && (
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prix (€)</FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" placeholder="25,50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="minGuests"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invités minimum</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxGuests"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invités maximum</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                />
              </FormControl>
              <FormLabel className="font-normal">Formule visible sur mon profil</FormLabel>
            </FormItem>
          )}
        />
        {save.isError && (
          <p role="alert" className="text-sm text-destructive">
            {save.error instanceof ApiError ? save.error.message : 'L’enregistrement a échoué.'}
          </p>
        )}
        <DialogFooter>
          <Button type="submit" disabled={save.isPending}>
            Enregistrer la formule
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
