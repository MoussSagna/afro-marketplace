import type { EventSummary } from '@afro/common';
import { Image } from 'expo-image';
import {
  AlertCircle,
  CalendarCheck,
  Check,
  CheckCircle2,
  MapPin,
  Plus,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react-native';
import { forwardRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { AppBottomSheet, type AppBottomSheetRef } from '@/components/AppBottomSheet';
import { QueryState } from '@/components/QueryState';
import { Button, Heading, Text } from '@/components/ui';
import { useLanguage } from '@/i18n/useLanguage';
import { cn } from '@/lib/cn';
import { eventDay } from '@/lib/dates';
import { useThemeColors } from '@/theme/useTheme';
import { EVENT_TYPE_PHOTOS } from './eventDisplay';
import { useAddToEvent, type AddToEventFeedback, type AddToEventState } from './useAddToEvent';

type AddToEventSheetProps = {
  providerId: string;
  providerName: string;
  /** Un événement tout juste créé depuis la fiche : le panneau le signale en revenant. */
  createdEventId?: string;
  /** false sans compte : les événements ne sont pas chargés. */
  enabled?: boolean;
  /** « Créer mon événement » / « Nouvel événement » : le formulaire existant (le parent navigue). */
  onCreateEvent(): void;
  onDismiss?(): void;
};

/**
 * Le panneau « Ajouter à un événement » (fiche prestataire), sur @gorhom/bottom-sheet via AppBottomSheet :
 * poignée, croix, fond assombri, fermeture au glissement, hauteur du contenu (90 % au plus, puis défilement),
 * « Nouvel événement » collé en bas. Toucher une carte ajoute le prestataire à cet événement.
 * Ouvert par une ref (`present()`), comme tous les panneaux du bas de l'app.
 */
export const AddToEventSheet = forwardRef<AppBottomSheetRef, AddToEventSheetProps>(
  function AddToEventSheet(
    { providerId, providerName, createdEventId, enabled = true, onCreateEvent, onDismiss },
    ref,
  ) {
    const { t } = useTranslation();
    const colors = useThemeColors();
    // Chargés avec la fiche (pas à l'ouverture) : le panneau s'ouvre directement à la bonne hauteur.
    const addToEvent = useAddToEvent({ providerId, providerName, createdEventId, enabled });
    // Sans événement, l'état vide a déjà son bouton « Créer mon événement » : pas de doublon en bas.
    const noEvents = addToEvent.events.isSuccess && addToEvent.events.data.length === 0;
    return (
      <AppBottomSheet
        ref={ref}
        title={t('events.sheet.title')}
        subtitle={t('events.sheet.subtitle')}
        fitContent
        onDismiss={onDismiss}
        testID="add-to-event-sheet"
        footer={
          noEvents ? undefined : (
            <Button
              variant="outline"
              fullWidth
              onPress={onCreateEvent}
              icon={<Plus size={18} color={colors.primary} />}
            >
              {t('events.sheet.newEvent')}
            </Button>
          )
        }
      >
        <SheetBody addToEvent={addToEvent} onCreateEvent={onCreateEvent} />
      </AppBottomSheet>
    );
  },
);

function SheetBody({
  addToEvent,
  onCreateEvent,
}: {
  addToEvent: ReturnType<typeof useAddToEvent>;
  onCreateEvent(): void;
}) {
  const { t } = useTranslation();
  const { events, stateOf, addTo, feedback, busy } = addToEvent;
  const list = events.data ?? [];
  return (
    <View className="gap-3 px-5 pt-4">
      <QueryState
        isPending={events.isPending}
        isError={events.isError}
        onRetry={() => void events.refetch()}
        loadingLabel={t('events.loading')}
        placeholder={
          <View className="items-center py-10">
            <ActivityIndicator accessibilityLabel={t('events.loading')} />
          </View>
        }
      >
        {list.length === 0 ? (
          <EmptySheet onCreate={onCreateEvent} />
        ) : (
          <>
            {feedback ? <FeedbackBanner feedback={feedback} /> : null}
            {list.map((summary) => (
              <EventPickCard
                key={summary.event.id}
                summary={summary}
                state={stateOf(summary)}
                disabled={busy}
                onPress={() => addTo(summary)}
              />
            ))}
          </>
        )}
      </QueryState>
    </View>
  );
}

/** Aucun événement : on invite à créer le premier (même visuel que « Mes événements »). */
function EmptySheet({ onCreate }: { onCreate(): void }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  return (
    <View className="items-center gap-2 px-4 pb-4 pt-2">
      <View className="mb-2 h-28 w-28 items-center justify-center rounded-full bg-secondary">
        <CalendarCheck size={54} color={colors['title-accent']} strokeWidth={1.3} />
        <View className="absolute right-1 top-2">
          <Sparkles size={20} color={colors.ochre} strokeWidth={1.6} />
        </View>
      </View>
      <Heading level={3} className="text-center">
        {t('events.sheet.emptyTitle')}
      </Heading>
      <Text tone="muted" className="text-center">
        {t('events.sheet.emptyHint')}
      </Text>
      <Button
        className="mt-3 self-center"
        onPress={onCreate}
        icon={<Plus size={18} color={colors['cta-foreground']} />}
      >
        {t('events.sheet.createFirst')}
      </Button>
    </View>
  );
}

/** Le message après un ajout : vert si c'est fait, rouge avec la raison sinon. Annoncé par VoiceOver. */
function FeedbackBanner({ feedback }: { feedback: AddToEventFeedback }) {
  const colors = useThemeColors();
  const success = feedback.tone === 'success';
  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className={cn(
        'flex-row items-start gap-2 rounded-2xl p-3',
        success ? 'bg-success-muted' : 'bg-destructive/10',
      )}
    >
      {success ? (
        <CheckCircle2 size={18} color={colors.success} />
      ) : (
        <AlertCircle size={18} color={colors.destructive} />
      )}
      <View className="flex-1">
        {feedback.tone === 'error' ? (
          <Text size="sm" weight="bold" tone="destructive">
            {feedback.title}
          </Text>
        ) : null}
        {feedback.message ? (
          <Text size="sm" tone={success ? 'success' : 'destructive'}>
            {feedback.message}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function Meta({ icon, children }: { icon: ReactNode; children: string }) {
  return (
    <View className="flex-row items-center gap-1">
      {icon}
      <Text size="xs" tone="muted" numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

/**
 * Une carte d'événement à choisir : photo du type, nom, type, date, ville, invités, prestataires.
 * À droite, l'état : « + » (à ajouter), roue (en cours), coche verte (déjà dedans, carte bordée de vert).
 */
function EventPickCard({
  summary,
  state,
  disabled,
  onPress,
}: {
  summary: EventSummary;
  state: AddToEventState;
  disabled: boolean;
  onPress(): void;
}) {
  const { event, counts } = summary;
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const colors = useThemeColors();
  const added = state === 'added';
  const icon = { size: 13, color: colors.primary };
  const label =
    state === 'added'
      ? t('events.sheet.addedLabel', { name: event.name })
      : state === 'adding'
        ? t('events.sheet.adding', { name: event.name })
        : t('events.sheet.addLabel', { name: event.name });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={[
        t(`events.types.${event.type}`),
        eventDay(event.date, locale),
        event.city,
        t('events.guests', { count: event.guestCount }),
        t('events.providers', { count: counts.providers }),
      ].join(', ')}
      accessibilityState={{ disabled: added || disabled, busy: state === 'adding' }}
      disabled={added || disabled}
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-3 rounded-2xl border bg-card p-2.5 active:opacity-80',
        added ? 'border-success' : 'border-border',
      )}
    >
      <Image
        source={EVENT_TYPE_PHOTOS[event.type]}
        contentFit="cover"
        style={{ width: 64, height: 76, borderRadius: 12 }}
        accessibilityIgnoresInvertColors
      />
      <View className="flex-1 gap-1">
        <Text weight="bold" numberOfLines={1}>
          {event.name}
        </Text>
        <Text size="xs" weight="semibold" tone="primary" numberOfLines={1}>
          {`${t(`events.types.${event.type}`)} · ${eventDay(event.date, locale)}`}
        </Text>
        <View className="flex-row flex-wrap gap-x-3 gap-y-0.5">
          <Meta icon={<MapPin {...icon} />}>{event.city}</Meta>
          <Meta icon={<Users {...icon} />}>{t('events.guests', { count: event.guestCount })}</Meta>
          <Meta icon={<UserRound {...icon} />}>
            {t('events.providers', { count: counts.providers })}
          </Meta>
        </View>
      </View>
      <StateMark state={state} />
    </Pressable>
  );
}

function StateMark({ state }: { state: AddToEventState }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  if (state === 'adding') {
    return (
      <View className="h-9 w-9 items-center justify-center">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (state === 'added') {
    return (
      <View className="items-center gap-0.5">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-success">
          <Check size={18} color="#fff" strokeWidth={2.6} />
        </View>
        <Text size="caption" weight="semibold" tone="success">
          {t('events.sheet.added')}
        </Text>
      </View>
    );
  }
  return (
    <View className="h-9 w-9 items-center justify-center rounded-full border-2 border-primary">
      <Plus size={18} color={colors.primary} strokeWidth={2.4} />
    </View>
  );
}
