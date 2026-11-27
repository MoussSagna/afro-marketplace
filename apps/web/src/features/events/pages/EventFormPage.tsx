import {
  ApiError,
  EVENT_BUDGET_LABELS,
  PLANNED_EVENT_TYPE_LABELS,
  eventBudgetSchema,
  plannedEventTypeSchema,
  useAddEventProvider,
  useCreateEvent,
  useEvent,
  useUpdateEvent,
  type PlannedEvent,
} from '@afro/common';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CircleAlert,
  MapPin,
  Users,
  Wallet,
} from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { NotFoundPage } from '@/app/NotFoundPage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { usePageMeta } from '@/hooks/usePageMeta';
import { cn } from '@/lib/utils';
import { toast } from '@/stores/toasts';
import { EventStepper } from '../components/EventStepper';
import {
  clearDraft,
  draftFromEvent,
  emptyDraft,
  loadDraft,
  saveDraft,
  toEventInput,
  type EventDraft,
} from '../lib/eventDraft';
import { EVENT_TYPE_ICONS } from '../lib/eventDisplay';
import { validateStep, type EventErrors, type EventField } from '../lib/eventSteps';

/** Le jour, à Paris comme l'affichage (l'écran peut lire l'horloge, pas les règles). */
const todayIso = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());

/**
 * Créer un événement (/evenements/nouveau) ou le modifier (/evenements/:id/modifier) :
 * le MÊME formulaire en 3 étapes (Type, Informations, Détails).
 */
export function EventFormPage() {
  const { eventId = '' } = useParams();
  const event = useEvent(eventId);
  usePageMeta(eventId ? 'Modifier mon événement' : 'Créer un événement');

  if (!eventId) return <EventForm />;
  if (event.isPending)
    return <Skeleton className="h-96 rounded-2xl" role="status" aria-label="Chargement" />;
  if (event.isError) {
    if (event.error instanceof ApiError && event.error.status === 404) return <NotFoundPage />;
    return (
      <p role="alert" className="rounded-xl bg-red-50 p-4 text-destructive">
        Impossible de charger cet événement.
      </p>
    );
  }
  return <EventForm existing={event.data.event} />;
}

function EventForm({ existing }: { existing?: PlannedEvent }) {
  const editing = !!existing;
  const scope = existing ? `edit:${existing.id}` : 'new';
  const [params, setParams] = useSearchParams();
  const step = Math.min(3, Math.max(1, Number(params.get('etape')) || 1));
  // Création depuis une fiche prestataire : on l'ajoute à l'événement, puis on revient à la fiche.
  const fromProviderId = params.get('prestataire') ?? '';
  const retour = params.get('retour') ?? '';
  const backTo = retour.startsWith('/prestataires/') ? retour : '';

  const [draft, setDraft] = useState<EventDraft>(
    () => loadDraft(scope) ?? (existing ? draftFromEvent(existing) : emptyDraft()),
  );
  const [errors, setErrors] = useState<EventErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();
  const create = useCreateEvent();
  const update = useUpdateEvent(existing?.id ?? '');
  const addProvider = useAddEventProvider();
  const pending = create.isPending || update.isPending || addProvider.isPending;
  const today = todayIso();

  useEffect(() => saveDraft(scope, draft), [scope, draft]);

  // On ne saute pas une étape incomplète (adresse tapée à la main, rechargement…).
  useEffect(() => {
    for (let s = 1; s < step; s++) {
      if (Object.keys(validateStep(s, draft, today, existing?.date)).length) {
        setParams((p) => (p.set('etape', String(s)), p), { replace: true });
        return;
      }
    }
    // Seulement quand l'étape change : la saisie elle-même ne doit pas renvoyer en arrière.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const set = (field: keyof EventDraft) => (value: string) => {
    setDraft((d) => ({ ...d, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };
  const goTo = (n: number) => {
    setErrors({});
    setParams((p) => (p.set('etape', String(n)), p));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const found = validateStep(step, draft, today, existing?.date);
    if (Object.keys(found).length) {
      setErrors(found);
      const first = Object.keys(found)[0] as EventField;
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    if (step < 3) return goTo(step + 1);

    const input = toEventInput(draft);
    try {
      if (existing) {
        await update.mutateAsync(input);
        clearDraft();
        toast({
          title: 'Modifications enregistrées',
          description: `« ${input.name} » est à jour.`,
        });
        navigate(`/evenements/${existing.id}`);
        return;
      }
      const created = await create.mutateAsync(input);
      clearDraft();
      if (fromProviderId) {
        await addProvider
          .mutateAsync({ eventId: created.id, providerId: fromProviderId })
          .catch(() => undefined);
      }
      toast({
        title: 'Événement créé',
        description: fromProviderId
          ? `Le prestataire a été ajouté à « ${created.name} ».`
          : 'Ajoutez maintenant vos prestataires.',
      });
      navigate(backTo || `/evenements/${created.id}`);
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.message : 'L’enregistrement a échoué. Réessayez.',
      );
    }
  }

  const title = editing ? 'Modifier mon événement' : 'Créer un événement';
  const back = editing
    ? { to: `/evenements/${existing.id}`, label: existing.name }
    : backTo
      ? { to: backTo, label: 'Retour à la fiche' }
      : { to: '/evenements', label: 'Mes événements' };

  return (
    <section aria-labelledby="form-title" className="flex flex-col gap-5">
      <Link
        to={back.to}
        className="flex w-fit items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {back.label}
      </Link>
      <header>
        <h1 id="form-title" className="text-[26px] leading-tight font-bold sm:text-4xl">
          {title}
        </h1>
        {!editing && (
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Trois étapes, moins d’une minute.
          </p>
        )}
      </header>

      <form
        ref={formRef}
        noValidate
        onSubmit={onSubmit}
        className="relative rounded-2xl border bg-card p-4 pb-0 shadow-card sm:p-8 sm:pb-8"
      >
        <EventStepper step={step} />

        {step === 1 && <TypeStep value={draft.type} onChange={set('type')} error={errors.type} />}
        {step === 2 && <InfoStep draft={draft} set={set} errors={errors} today={today} />}
        {step === 3 && <DetailsStep draft={draft} set={set} />}

        {serverError && (
          <p role="alert" className="mt-5 flex items-center gap-2 text-sm text-destructive">
            <CircleAlert className="size-4" aria-hidden />
            {serverError}
          </p>
        )}

        {/* Téléphone : actions collées en bas de l'écran ; ordinateur : sous le formulaire. */}
        <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex gap-3 border-t bg-card p-4 sm:static sm:mx-0 sm:mt-8 sm:justify-between sm:border-0 sm:p-0">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11 flex-1 sm:flex-none has-[>svg]:px-5"
              onClick={() => goTo(step - 1)}
            >
              <ArrowLeft aria-hidden />
              Précédent
            </Button>
          ) : (
            <span className="hidden sm:block" />
          )}
          <Button
            type="submit"
            variant="cta"
            size="lg"
            className="h-11 flex-1 sm:flex-none has-[>svg]:px-5"
            disabled={pending}
          >
            {step < 3 ? (
              <>
                Suivant
                <ArrowRight aria-hidden />
              </>
            ) : (
              <>
                {editing ? 'Enregistrer les modifications' : 'Créer l’événement'}
                <Check aria-hidden />
              </>
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="flex items-center gap-1.5 text-sm text-destructive">
      <CircleAlert className="size-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

function TypeStep({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange(v: string): void;
  error?: string;
}) {
  const errorId = useId();
  return (
    <fieldset aria-describedby={error ? errorId : undefined} className="flex flex-col gap-4">
      <legend className="mb-4 text-lg font-semibold sm:text-xl">
        Quel type d’événement organisez-vous ?
      </legend>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5">
        {plannedEventTypeSchema.options.map((type) => {
          const Icon = EVENT_TYPE_ICONS[type];
          const checked = value === type;
          return (
            <label
              key={type}
              className={cn(
                'relative flex h-24 cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border-[1.5px] bg-card font-semibold transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring sm:h-28',
                checked ? 'border-2 border-cta bg-cta/10' : 'hover:border-cta/60',
              )}
            >
              <input
                type="radio"
                name="type"
                value={type}
                checked={checked}
                onChange={() => onChange(type)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              <Icon className="size-7 text-primary sm:size-8" strokeWidth={1.6} aria-hidden />
              {PLANNED_EVENT_TYPE_LABELS[type]}
            </label>
          );
        })}
      </div>
      <FieldError id={errorId} message={error} />
    </fieldset>
  );
}

/** Un champ : libellé, contrôle (avec icône), message d'erreur relié par aria-describedby. */
function Field({
  label,
  required,
  optional,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: string;
  error?: string;
  className?: string;
  children: (props: {
    id: string;
    'aria-invalid'?: true;
    'aria-describedby'?: string;
  }) => ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
        {required && <span className="text-destructive"> *</span>}
        {optional && <span className="font-normal text-muted-foreground"> ({optional})</span>}
      </Label>
      {children({ id, ...(error && { 'aria-invalid': true, 'aria-describedby': errorId }) })}
      <FieldError id={errorId} message={error} />
    </div>
  );
}

const inputClass = 'h-12 rounded-md bg-card pl-10 text-[15px]';
const iconClass =
  'pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground';

function InfoStep({
  draft,
  set,
  errors,
  today,
}: {
  draft: EventDraft;
  set: (field: keyof EventDraft) => (value: string) => void;
  errors: EventErrors;
  today: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-sans text-lg font-semibold sm:text-xl">
        Les informations de l’événement
      </h2>
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <Field label="Nom de l’événement" required error={errors.name} className="sm:col-span-2">
          {(props) => (
            <Input
              {...props}
              name="name"
              maxLength={80}
              autoComplete="off"
              placeholder="Mariage de Aïssatou"
              value={draft.name}
              onChange={(e) => set('name')(e.target.value)}
              className="h-12 text-[15px]"
            />
          )}
        </Field>
        <Field label="Date" required error={errors.date}>
          {(props) => (
            <div className="relative">
              <CalendarDays className={iconClass} aria-hidden />
              <Input
                {...props}
                type="date"
                name="date"
                min={today}
                value={draft.date}
                onChange={(e) => set('date')(e.target.value)}
                className={inputClass}
              />
            </div>
          )}
        </Field>
        <Field label="Nombre d’invités" required error={errors.guestCount}>
          {(props) => (
            <div className="relative">
              <Users className={iconClass} aria-hidden />
              <Input
                {...props}
                type="number"
                inputMode="numeric"
                min={1}
                max={5000}
                name="guestCount"
                placeholder="150"
                value={draft.guestCount}
                onChange={(e) => set('guestCount')(e.target.value)}
                className={inputClass}
              />
            </div>
          )}
        </Field>
        <Field label="Ville" required error={errors.city}>
          {(props) => (
            <div className="relative">
              <MapPin className={iconClass} aria-hidden />
              <Input
                {...props}
                name="city"
                maxLength={80}
                autoComplete="address-level2"
                placeholder="Paris"
                value={draft.city}
                onChange={(e) => set('city')(e.target.value)}
                className={inputClass}
              />
            </div>
          )}
        </Field>
        <Field label="Code postal" required error={errors.postalCode}>
          {(props) => (
            <Input
              {...props}
              name="postalCode"
              inputMode="numeric"
              maxLength={5}
              autoComplete="postal-code"
              placeholder="75011"
              value={draft.postalCode}
              onChange={(e) => set('postalCode')(e.target.value)}
              className="h-12 text-[15px]"
            />
          )}
        </Field>
      </div>
      <p className="text-sm text-muted-foreground">
        La ville et le code postal servent aux demandes de devis ; l’adresse exacte n’est donnée
        qu’après réservation.
      </p>
    </div>
  );
}

function DetailsStep({
  draft,
  set,
}: {
  draft: EventDraft;
  set: (field: keyof EventDraft) => (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-sans text-lg font-semibold sm:text-xl">
        Quelques détails pour les prestataires
      </h2>
      <Field label="Budget indicatif" optional="facultatif">
        {(props) => (
          <div className="relative">
            <Wallet className={cn(iconClass, 'z-10')} aria-hidden />
            <NativeSelect
              {...props}
              name="budget"
              value={draft.budget}
              onChange={(e) => set('budget')(e.target.value)}
              className="h-12 pl-10 text-[15px]"
            >
              <option value="">Choisir une fourchette</option>
              {eventBudgetSchema.options.map((budget) => (
                <option key={budget} value={budget}>
                  {EVENT_BUDGET_LABELS[budget]}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}
      </Field>
      <Field label="Description" optional="facultative">
        {(props) => (
          <Textarea
            {...props}
            name="description"
            rows={5}
            maxLength={600}
            placeholder="Ambiance souhaitée, déroulé, contraintes…"
            value={draft.description}
            onChange={(e) => set('description')(e.target.value)}
            className="text-[15px]"
          />
        )}
      </Field>
      <p className="text-sm text-muted-foreground">
        Le budget et la description sont joints à vos demandes de devis : ils aident les
        prestataires à vous répondre.
      </p>
    </div>
  );
}
