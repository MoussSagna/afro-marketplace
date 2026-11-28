import {
  draftFromEvent,
  emptyEventDraft,
  eventBudgetSchema,
  plannedEventTypeSchema,
  toEventInput,
  useAddEventProvider,
  useCreateEvent,
  useUpdateEvent,
  validateEventStep,
  type EventDraft,
  type EventErrors,
  type PlannedEvent,
} from '@afro/common';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ArrowLeft, ArrowRight, CalendarDays, Check, MapPin, Users } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomSheet } from '@/components/BottomSheet';
import { Calendar } from '@/components/Calendar';
import { Button, Chip, Input, Text } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { useLanguage } from '@/i18n/useLanguage';
import { cn } from '@/lib/cn';
import { eventDay, todayIso } from '@/lib/dates';
import { toast } from '@/stores/toasts';
import { useThemeColors } from '@/theme/useTheme';
import { FormAlert } from '../auth/components/FormAlert';
import { EventBottomBar, EventHeader } from './EventChrome';
import { EVENT_TYPE_ICONS } from './eventDisplay';
import { EventStepper } from './EventStepper';

type SetField = (field: keyof EventDraft) => (value: string) => void;

/** Étape 1 · Type : six grandes tuiles (icône + nom), deux par ligne. */
function TypeStep({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange(type: string): void;
  error?: string;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  return (
    <View className="gap-4">
      <Text weight="bold">{t('events.form.typeQuestion')}</Text>
      <View accessibilityRole="radiogroup" className="flex-row flex-wrap justify-between gap-y-3">
        {plannedEventTypeSchema.options.map((type) => {
          const Icon = EVENT_TYPE_ICONS[type];
          const selected = value === type;
          return (
            <Pressable
              key={type}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={t(`events.types.${type}`)}
              onPress={() => onChange(type)}
              className={cn(
                'h-[92px] w-[48.5%] items-center justify-center gap-2 rounded-2xl border bg-card active:opacity-80',
                selected ? 'border-[1.5px] border-cta bg-secondary' : 'border-border',
              )}
            >
              <Icon size={28} color={colors.primary} strokeWidth={1.8} />
              <Text weight="semibold">{t(`events.types.${type}`)}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Text size="sm" tone="destructive" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/** Étape 2 · Informations : nom, date (calendrier dans un panneau), ville, code postal, invités. */
function InfoStep({
  draft,
  set,
  errors,
}: {
  draft: EventDraft;
  set: SetField;
  errors: EventErrors;
}) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { fieldError } = useErrorText();
  const colors = useThemeColors();
  const [picking, setPicking] = useState(false);
  const [day, setDay] = useState(draft.date);
  const dateError = fieldError(errors.date);
  return (
    <View className="gap-4">
      <Input
        label={t('events.form.name')}
        value={draft.name}
        onChangeText={set('name')}
        placeholder={t('events.form.namePlaceholder')}
        maxLength={80}
        error={fieldError(errors.name)}
      />
      <View className="gap-1.5">
        <Text size="sm" weight="semibold">
          {t('events.form.date')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('events.form.date')}, ${
            draft.date ? eventDay(draft.date, locale) : t('events.form.datePlaceholder')
          }`}
          accessibilityHint={dateError}
          onPress={() => {
            setDay(draft.date);
            setPicking(true);
          }}
          className={cn(
            'min-h-[50px] flex-row items-center gap-3 rounded-xl border bg-card px-4',
            dateError ? 'border-destructive' : 'border-input',
          )}
        >
          <CalendarDays size={20} color={colors['muted-foreground']} />
          <Text tone={draft.date ? 'default' : 'muted'}>
            {draft.date ? eventDay(draft.date, locale) : t('events.form.datePlaceholder')}
          </Text>
        </Pressable>
        {dateError ? (
          <Text size="xs" tone="destructive">
            {dateError}
          </Text>
        ) : null}
      </View>
      <View className="flex-row gap-3">
        <View className="flex-[1.6]">
          <Input
            label={t('events.form.city')}
            value={draft.city}
            onChangeText={set('city')}
            placeholder={t('events.form.cityPlaceholder')}
            autoComplete="postal-address-locality"
            icon={<MapPin size={18} color={colors['muted-foreground']} />}
            error={fieldError(errors.city)}
          />
        </View>
        <View className="flex-1">
          <Input
            label={t('events.form.postalCode')}
            value={draft.postalCode}
            onChangeText={set('postalCode')}
            placeholder="75011"
            keyboardType="number-pad"
            autoComplete="postal-code"
            maxLength={5}
            error={fieldError(errors.postalCode)}
          />
        </View>
      </View>
      <Input
        label={t('events.form.guests')}
        value={draft.guestCount}
        onChangeText={(text) => set('guestCount')(text.replace(/\D/g, ''))}
        placeholder="150"
        keyboardType="number-pad"
        maxLength={4}
        icon={<Users size={18} color={colors['muted-foreground']} />}
        error={fieldError(errors.guestCount)}
      />

      <BottomSheet
        visible={picking}
        onClose={() => setPicking(false)}
        title={t('events.form.dateSheet')}
        closeLabel={t('common.close')}
        footer={
          <Button
            fullWidth
            disabled={!day}
            onPress={() => {
              set('date')(day);
              setPicking(false);
            }}
          >
            {t('events.form.dateConfirm')}
          </Button>
        }
      >
        <Calendar value={day || undefined} onChange={setDay} firstDay={todayIso()} />
      </BottomSheet>
    </View>
  );
}

/** Étape 3 · Détails : budget indicatif (fourchettes) et description, tous deux facultatifs. */
function DetailsStep({ draft, set }: { draft: EventDraft; set: SetField }) {
  const { t } = useTranslation();
  return (
    <View className="gap-5">
      <View className="gap-2">
        <Text size="sm" weight="semibold">
          {t('events.form.budget')}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {eventBudgetSchema.options.map((budget) => (
            <Chip
              key={budget}
              selected={draft.budget === budget}
              // Toucher la fourchette choisie la retire (le budget est facultatif).
              onPress={() => set('budget')(draft.budget === budget ? '' : budget)}
            >
              {t(`events.budgets.${budget}`)}
            </Chip>
          ))}
        </View>
      </View>
      <Input
        label={t('events.form.description')}
        value={draft.description}
        onChangeText={set('description')}
        placeholder={t('events.form.descriptionPlaceholder')}
        hint={t('events.form.descriptionHint')}
        multiline
        maxLength={600}
        className="min-h-[120px]"
        textAlignVertical="top"
      />
    </View>
  );
}

/**
 * Créer un événement (/evenements/nouveau) ou le modifier (/evenements/:id/modifier) : le MÊME
 * formulaire en 3 étapes, comme sur le site. Chaque étape est validée avec le schéma partagé
 * (`validateEventStep`) ; le brouillon reste dans l'écran, « Précédent » ne fait rien perdre.
 * Création depuis une fiche prestataire (`?prestataire=…&retour=…`) : on l'ajoute, puis on y revient.
 */
export function EventFormScreen({ existing }: { existing?: PlannedEvent }) {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const { apiError, fieldError } = useErrorText();
  const params = useLocalSearchParams<{ prestataire?: string; retour?: string }>();
  const fromProviderId = existing ? '' : (params.prestataire ?? '');
  const backTo = params.retour?.startsWith('/prestataires/') ? params.retour : '';
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<EventDraft>(() =>
    existing ? draftFromEvent(existing) : emptyEventDraft(),
  );
  const [errors, setErrors] = useState<EventErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const create = useCreateEvent();
  const update = useUpdateEvent(existing?.id ?? '');
  const addProvider = useAddEventProvider();
  const pending = create.isPending || update.isPending || addProvider.isPending;

  const set: SetField = (field) => (value) => {
    setDraft((d) => ({ ...d, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  async function next() {
    setServerError(null);
    const found = validateEventStep(step, draft, todayIso(), existing?.date);
    if (Object.keys(found).length) return setErrors(found);
    setErrors({});
    if (step < 3) return setStep(step + 1);

    const input = toEventInput(draft);
    try {
      if (existing) {
        await update.mutateAsync(input);
        toast({
          title: t('events.form.saved'),
          description: t('events.form.savedHint', { name: input.name }),
        });
        if (router.canGoBack()) router.back();
        else
          router.replace({ pathname: '/evenements/[eventId]', params: { eventId: existing.id } });
        return;
      }
      const created = await create.mutateAsync(input);
      if (fromProviderId) {
        await addProvider
          .mutateAsync({ eventId: created.id, providerId: fromProviderId })
          .catch(() => undefined);
      }
      toast({
        title: t('events.form.created'),
        description: fromProviderId
          ? t('events.form.createdWithProvider', { name: created.name })
          : t('events.form.createdHint'),
      });
      if (backTo) router.navigate(backTo as Href);
      else router.replace({ pathname: '/evenements/[eventId]', params: { eventId: created.id } });
    } catch (error) {
      setServerError(apiError(error) ?? t('events.form.saveError'));
    }
  }

  const last = step === 3;
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <EventHeader
        title={existing ? t('events.form.editTitle') : t('events.form.createTitle')}
        fallback={
          existing
            ? { pathname: '/evenements/[eventId]', params: { eventId: existing.id } }
            : '/evenements'
        }
      />
      <EventStepper step={step} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 pb-6 pt-2"
          keyboardShouldPersistTaps="handled"
          testID="event-form"
        >
          {step === 1 ? (
            <TypeStep value={draft.type} onChange={set('type')} error={fieldError(errors.type)} />
          ) : null}
          {step === 2 ? <InfoStep draft={draft} set={set} errors={errors} /> : null}
          {step === 3 ? <DetailsStep draft={draft} set={set} /> : null}
          <FormAlert message={serverError} />
        </ScrollView>
      </KeyboardAvoidingView>
      <EventBottomBar>
        {step > 1 ? (
          <View className="flex-1">
            <Button
              variant="outline"
              size="md"
              fullWidth
              disabled={pending}
              onPress={() => {
                setErrors({});
                setStep(step - 1);
              }}
              icon={<ArrowLeft size={18} color={colors.primary} />}
            >
              {t('events.form.previous')}
            </Button>
          </View>
        ) : (
          <View className="flex-1" />
        )}
        <View className={last ? 'flex-[1.6]' : 'flex-1'}>
          <Button
            size="md"
            fullWidth
            loading={pending}
            onPress={() => void next()}
            icon={
              last ? (
                <Check size={18} color={colors['cta-foreground']} />
              ) : (
                <ArrowRight size={18} color={colors['cta-foreground']} />
              )
            }
          >
            {last
              ? existing
                ? t('events.form.save')
                : t('events.form.create')
              : t('events.form.next')}
          </Button>
        </View>
      </EventBottomBar>
    </SafeAreaView>
  );
}
