import {
  ApiError,
  CANCELLATION_POLICIES,
  LANGUAGE_LABELS,
  LEGAL_TYPE_LABELS,
  cancellationPolicySchema,
  describeCancellationPolicy,
  legalTypeSchema,
  useCategories,
  useCulturalOrigins,
  type MyProviderDetails,
  type UpdateProviderProfileInput,
} from '@afro/common';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Resolver,
  type UseFormReturn,
} from 'react-hook-form';
import type { z } from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  areaDefaults,
  areaFormSchema,
  availabilityFormSchema,
  categoriesDefaults,
  categoriesFormSchema,
  identityDefaults,
  identityFormSchema,
  policyFormSchema,
  presentationFormSchema,
  toAreaInput,
  toIdentityInput,
} from '../lib/profileForms';
import { ChipGroup } from './ChipGroup';
import { GalleryEditor } from './GalleryEditor';
import { OfferingsEditor } from './OfferingsEditor';

/**
 * Chaque section du profil sert deux fois : comme étape de l'onboarding (S1)
 * et comme onglet de « Modifier mon profil » (S7). Seuls les boutons changent :
 * le parent les fournit (`actions`) et décide quoi faire après l'enregistrement (`onSave`).
 */
export interface SectionProps {
  details: MyProviderDetails;
  onSave: (input: UpdateProviderProfileInput) => Promise<unknown>;
  actions: ReactNode;
}

/** Le formulaire RHF d'une section, avec l'erreur du serveur affichée en bas. */
function useSectionForm<Schema extends z.ZodType<FieldValues, FieldValues>>(
  schema: Schema,
  defaultValues: z.input<Schema>,
) {
  return useForm<z.input<Schema>, unknown, z.output<Schema>>({
    resolver: zodResolver(schema) as Resolver<z.input<Schema>, unknown, z.output<Schema>>,
    defaultValues: defaultValues as DefaultValues<z.input<Schema>>,
  });
}

function SectionForm<Values extends FieldValues, Output extends FieldValues>({
  form,
  onValid,
  actions,
  children,
}: {
  form: UseFormReturn<Values, unknown, Output>;
  onValid: (values: Output) => Promise<unknown>;
  actions: ReactNode;
  children: ReactNode;
}) {
  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await onValid(values);
    } catch (error) {
      form.setError('root', {
        message: error instanceof ApiError ? error.message : 'L’enregistrement a échoué.',
      });
    }
  });
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        {children}
        {form.formState.errors.root && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}
        <SectionActions>{actions}</SectionActions>
      </form>
    </Form>
  );
}

export function SectionActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-end gap-3 pt-2">{children}</div>;
}

// ------------------------------------------------------------------ Identité

export function IdentitySection({ details, onSave, actions }: SectionProps) {
  const form = useSectionForm(identityFormSchema, identityDefaults(details.profile));
  return (
    <SectionForm
      form={form}
      actions={actions}
      onValid={(values) => onSave(toIdentityInput(values))}
    >
      <FormField
        control={form.control}
        name="displayName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nom commercial</FormLabel>
            <FormControl>
              <Input autoComplete="organization" {...field} />
            </FormControl>
            <FormDescription>C’est le nom que verront les clients.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="legalType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tu exerces en tant que</FormLabel>
            <FormControl>
              <NativeSelect {...field}>
                {legalTypeSchema.options.map((type) => (
                  <option key={type} value={type}>
                    {LEGAL_TYPE_LABELS[type]}
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
        name="siret"
        render={({ field }) => (
          <FormItem>
            <FormLabel>SIRET (facultatif)</FormLabel>
            <FormControl>
              <Input inputMode="numeric" placeholder="123 456 789 00012" {...field} />
            </FormControl>
            <FormDescription>
              Avec un SIRET vérifié, ton profil affiche le badge « Pro vérifié ».
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </SectionForm>
  );
}

// ------------------------------------------------------ Catégories et origines

export function CategoriesSection({ details, onSave, actions }: SectionProps) {
  const categories = useCategories();
  const origins = useCulturalOrigins();
  const form = useSectionForm(categoriesFormSchema, categoriesDefaults(details.profile));
  const languageOptions = Object.entries(LANGUAGE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <SectionForm form={form} actions={actions} onValid={onSave}>
      <FormField
        control={form.control}
        name="categoryIds"
        render={({ field, fieldState }) => (
          <FormItem>
            <p className="text-sm font-medium">Ce que tu proposes (5 maximum)</p>
            <ChipGroup
              label="Catégories"
              max={5}
              invalid={fieldState.invalid}
              options={(categories.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
              value={field.value}
              onChange={field.onChange}
            />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="culturalOriginIds"
        render={({ field, fieldState }) => (
          <FormItem>
            <p className="text-sm font-medium">Tes cultures et spécialités (facultatif)</p>
            <ChipGroup
              label="Origines culturelles"
              max={5}
              invalid={fieldState.invalid}
              options={(origins.data ?? []).map((o) => ({ value: o.id, label: o.name }))}
              value={field.value}
              onChange={field.onChange}
            />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="languages"
        render={({ field, fieldState }) => (
          <FormItem>
            <p className="text-sm font-medium">Langues parlées</p>
            <ChipGroup
              label="Langues parlées"
              invalid={fieldState.invalid}
              options={languageOptions}
              value={field.value}
              onChange={field.onChange}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </SectionForm>
  );
}

// ------------------------------------------------------------------- Zone

export function AreaSection({ details, onSave, actions }: SectionProps) {
  const form = useSectionForm(areaFormSchema, areaDefaults(details.profile));
  return (
    <SectionForm form={form} actions={actions} onValid={(values) => onSave(toAreaInput(values))}>
      <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ville</FormLabel>
              <FormControl>
                <Input autoComplete="address-level2" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code postal</FormLabel>
              <FormControl>
                <Input inputMode="numeric" autoComplete="postal-code" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="travelRadiusKm"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Jusqu’où te déplaces-tu ? (en km)</FormLabel>
            <FormControl>
              <Input inputMode="numeric" className="max-w-32" {...field} />
            </FormControl>
            <FormDescription>0 si les clients viennent à toi.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </SectionForm>
  );
}

// ---------------------------------------------------- Présentation et galerie

export function PresentationSection({ details, onSave, actions }: SectionProps) {
  const form = useSectionForm(presentationFormSchema, { bio: details.profile.bio });
  return (
    <div className="flex flex-col gap-6">
      <GalleryEditor media={details.media} />
      <SectionForm form={form} actions={actions} onValid={onSave}>
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Présente-toi</FormLabel>
              <FormControl>
                <Textarea
                  rows={6}
                  placeholder="Ton histoire, ton savoir-faire, ce qui rend tes prestations uniques…"
                  {...field}
                />
              </FormControl>
              <FormDescription>{field.value.length} / 3 000 caractères</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </SectionForm>
    </div>
  );
}

// ------------------------------------------------------------------ Formules

export function OfferingsSection({ details, onSave, actions }: SectionProps) {
  const form = useForm();
  return (
    <div className="flex flex-col gap-4">
      <OfferingsEditor details={details} />
      <SectionForm form={form} actions={actions} onValid={() => onSave({})}>
        {null}
      </SectionForm>
    </div>
  );
}

// ------------------------------------------------------------ Disponibilités

export function AvailabilitySection({ details, onSave, actions }: SectionProps) {
  const form = useSectionForm(availabilityFormSchema, {
    maxBookingsPerDay: String(details.profile.maxBookingsPerDay),
  });
  return (
    <SectionForm
      form={form}
      actions={actions}
      onValid={(values) => onSave({ maxBookingsPerDay: Number(values.maxBookingsPerDay) })}
    >
      <p className="text-muted-foreground">
        Par défaut, tu es disponible tous les jours. Tu pourras bloquer des dates dans ton agenda.
      </p>
      <FormField
        control={form.control}
        name="maxBookingsPerDay"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Combien d’événements peux-tu assurer le même jour ?</FormLabel>
            <FormControl>
              <Input inputMode="numeric" className="max-w-32" {...field} />
            </FormControl>
            <FormDescription>
              Au-delà, la date apparaît comme indisponible sur ton profil.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </SectionForm>
  );
}

// ---------------------------------------------------------------- Annulation

export function PolicySection({ details, onSave, actions }: SectionProps) {
  const form = useSectionForm(policyFormSchema, {
    cancellationPolicy: details.profile.cancellationPolicy,
  });
  return (
    <SectionForm form={form} actions={actions} onValid={onSave}>
      <FormField
        control={form.control}
        name="cancellationPolicy"
        render={({ field }) => (
          <FormItem>
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-1 text-sm font-medium">
                Ta politique d’annulation (copiée dans chaque réservation)
              </legend>
              {cancellationPolicySchema.options.map((policy) => (
                <label
                  key={policy}
                  className={cn(
                    'flex cursor-pointer gap-3 rounded-xl border bg-card p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                    field.value === policy && 'border-primary bg-secondary',
                  )}
                >
                  <input
                    type="radio"
                    name={field.name}
                    value={policy}
                    checked={field.value === policy}
                    onChange={() => field.onChange(policy)}
                    className="mt-1 accent-primary"
                  />
                  <span>
                    <span className="font-semibold">{CANCELLATION_POLICIES[policy].label}</span>
                    <ul className="mt-1 text-sm text-muted-foreground">
                      {describeCancellationPolicy(policy).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </span>
                </label>
              ))}
            </fieldset>
            <FormMessage />
          </FormItem>
        )}
      />
    </SectionForm>
  );
}
