import {
  ApiError,
  canRequestEventQuote,
  missingGroups,
  providerGroupId,
  useCategories,
  useDeleteEvent,
  useEvent,
  useRemoveEventProvider,
  useRestoreEvent,
  useSetEventProviderRetained,
  type Category,
  type EventDetails,
} from '@afro/common';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
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
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { ConfirmModal } from '@/components/ConfirmModal';
import { QueryState } from '@/components/QueryState';
import { Button, Card, EmptyState, Heading, Photo, Text } from '@/components/ui';
import { useCategoryName } from '@/i18n/useCategoryName';
import { useErrorText } from '@/i18n/useErrorText';
import { useLanguage } from '@/i18n/useLanguage';
import { eventDay } from '@/lib/dates';
import { toast } from '@/stores/toasts';
import { useThemeColors } from '@/theme/useTheme';
import { profileHref } from '../providers/profileHref';
import { requestHref } from '../requests/requestHref';
import { CATEGORY_ICONS } from '../search/categoryIcons';
import { EventProviderStatusBadge, EventStatusBadge } from './EventBadges';
import { EventBottomBar } from './EventChrome';
import { EVENT_TYPE_ICONS, EVENT_TYPE_PHOTOS } from './eventDisplay';

type ProviderEntry = EventDetails['providers'][number];

/**
 * Le détail d'un événement (/evenements/:id, par-dessus les onglets), comme sur le site : la photo, le nom, le statut, les
 * infos ; les prestataires groupés par famille avec leur statut ; « Complète ton événement » ;
 * en bas « Ajouter » et « Demander les devis ». Modifier et Supprimer sont posés sur la photo.
 */
export function EventDetailScreen() {
  const { eventId = '' } = useLocalSearchParams<{ eventId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const details = useEvent(eventId);
  const notFound = details.error instanceof ApiError && details.error.status === 404;

  if (notFound) {
    return (
      <View className="flex-1 justify-center bg-background">
        <EmptyState
          title={t('events.detail.notFound')}
          description={t('events.detail.notFoundHint')}
          action={
            <Button variant="outline" size="md" onPress={() => router.dismissTo('/evenements')}>
              {t('events.detail.backToList')}
            </Button>
          }
        />
      </View>
    );
  }
  return (
    <View className="flex-1 bg-background">
      <QueryState
        isPending={details.isPending}
        isError={details.isError}
        onRetry={() => void details.refetch()}
        loadingLabel={t('events.detail.loading')}
      >
        {details.data ? <EventDetailView details={details.data} /> : null}
      </QueryState>
    </View>
  );
}

function Meta({ icon: Icon, children }: { icon: LucideIcon; children: string }) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center gap-1.5">
      <Icon size={17} color={colors.primary} />
      <Text size="sm">{children}</Text>
    </View>
  );
}

/** Un bouton rond posé sur la photo (retour, modifier, supprimer). */
function PhotoButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress(): void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      className="h-11 w-11 items-center justify-center rounded-xl bg-card/95 active:opacity-80"
      style={{ boxShadow: '0 4px 14px rgba(43, 26, 18, 0.18)' }}
    >
      {children}
    </Pressable>
  );
}

function EventDetailView({ details }: { details: EventDetails }) {
  const { event, status, counts, providers } = details;
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { apiError } = useErrorText();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const categoryName = useCategoryName();
  const categories = useCategories().data ?? [];
  const [removing, setRemoving] = useState<ProviderEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const remove = useRemoveEventProvider(event.id);
  const del = useDeleteEvent();
  const restore = useRestoreEvent();
  const retain = useSetEventProviderRetained(event.id);
  const TypeIcon = EVENT_TYPE_ICONS[event.type];

  // Les prestataires groupés par famille (Traiteur & boissons, Musique & animation…), comme sur le site.
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
  const addHref = {
    pathname: '/evenements/[eventId]/ajouter',
    params: { eventId: event.id },
  } as const;

  function confirmRemove() {
    if (!removing) return;
    const name = removing.provider.displayName;
    remove.mutate(removing.provider.id, {
      onSuccess: () => {
        setRemoving(null);
        toast({
          title: t('events.detail.removed'),
          description: t('events.detail.removedHint', { name }),
        });
      },
    });
  }

  function confirmDelete() {
    del.mutate(event.id, {
      onSuccess: () => {
        setDeleting(false);
        // Retour à « Mes événements » (l'onglet), en refermant les écrans de l'événement.
        router.dismissTo('/evenements');
        toast({
          title: t('events.detail.deleted'),
          description: t('events.detail.deletedHint'),
          action: {
            label: t('events.detail.undo'),
            // L'écran du détail n'est plus affiché : `mutateAsync`, pas un `onSuccess` de `mutate`.
            onPress: () =>
              void restore
                .mutateAsync(event.id)
                .then(() =>
                  toast({
                    title: t('events.detail.restored'),
                    description: t('events.detail.restoredHint', { name: event.name }),
                  }),
                )
                .catch(() => toast({ tone: 'info', title: t('events.detail.restoreFailed') })),
          },
        });
      },
    });
  }

  function toggleRetained(entry: ProviderEntry, retained: boolean) {
    const name = entry.provider.displayName;
    retain.mutate(
      { providerId: entry.provider.id, retained },
      {
        onSuccess: () =>
          toast(
            retained
              ? {
                  title: t('events.detail.retained'),
                  description: t('events.detail.retainedHint', { name }),
                }
              : {
                  title: t('events.detail.unretained'),
                  description: t('events.detail.unretainedHint', { name }),
                },
          ),
        onError: (error) =>
          toast({
            tone: 'info',
            title: t('events.detail.actionFailed'),
            description: apiError(error),
          }),
      },
    );
  }

  const stats = [
    { value: counts.providers, label: t('events.detail.statProviders') },
    { value: counts.requested, label: t('events.detail.statRequested') },
    { value: counts.received, label: t('events.detail.statReceived') },
    { value: counts.retained, label: t('events.detail.statRetained') },
  ];

  return (
    <>
      <StatusBar style="light" />
      <ScrollView className="flex-1" contentContainerClassName="pb-6" testID="event-detail">
        {/* La photo de couverture, avec retour, modifier et supprimer posés dessus. */}
        <View style={{ height: insets.top + 200 }}>
          <Image
            source={EVENT_TYPE_PHOTOS[event.type]}
            contentFit="cover"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            accessibilityIgnoresInvertColors
          />
          <View
            className="flex-row items-center justify-between px-4"
            style={{ paddingTop: insets.top + 8 }}
          >
            <PhotoButton
              label={t('common.back')}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/evenements'))}
            >
              <ArrowLeft size={22} color={colors.foreground} />
            </PhotoButton>
            <View className="flex-row gap-2.5">
              <PhotoButton
                label={t('events.detail.edit')}
                onPress={() =>
                  router.push({
                    pathname: '/evenements/[eventId]/modifier',
                    params: { eventId: event.id },
                  })
                }
              >
                <Pencil size={20} color={colors.primary} />
              </PhotoButton>
              <PhotoButton label={t('events.detail.delete')} onPress={() => setDeleting(true)}>
                <Trash2 size={20} color={colors.destructive} />
              </PhotoButton>
            </View>
          </View>
        </View>

        <View className="-mt-5 gap-4 rounded-t-3xl bg-background px-5 pt-5">
          <View className="gap-2">
            <Heading>{event.name}</Heading>
            <EventStatusBadge status={status} />
            <View className="mt-1 flex-row flex-wrap gap-x-4 gap-y-1.5">
              <Meta icon={TypeIcon}>{t(`events.types.${event.type}`)}</Meta>
              <Meta icon={CalendarDays}>{eventDay(event.date, locale)}</Meta>
              <Meta icon={MapPin}>{`${event.city} (${event.postalCode})`}</Meta>
              <Meta icon={Users}>{t('events.guests', { count: event.guestCount })}</Meta>
              {event.budget ? (
                <Meta icon={Wallet}>{t(`events.budgets.${event.budget}`)}</Meta>
              ) : null}
            </View>
            {event.description ? (
              <Text size="sm" tone="muted" className="mt-1">
                {event.description}
              </Text>
            ) : null}
          </View>

          {/* Les compteurs (calculés par @afro/common). */}
          <View className="flex-row gap-2" accessibilityRole="summary">
            {stats.map((stat) => (
              <Card
                key={stat.label}
                className="flex-1 items-center gap-0.5 px-1 py-2.5"
                accessible
                accessibilityLabel={`${stat.value} ${stat.label}`}
              >
                <Text weight="bold" className="text-[20px] leading-6">
                  {String(stat.value)}
                </Text>
                <Text size="caption" tone="muted" numberOfLines={1}>
                  {stat.label}
                </Text>
              </Card>
            ))}
          </View>

          {/* Les prestataires de l'événement, par famille. */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between gap-3">
              <Heading level={2} className="flex-1">
                {t('events.detail.providersTitle', { count: counts.providers })}
              </Heading>
              {providers.length ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => router.push(addHref)}
                  icon={<Plus size={16} color={colors['secondary-foreground']} />}
                >
                  {t('events.detail.add')}
                </Button>
              ) : null}
            </View>

            {providers.length === 0 ? (
              <Card className="items-center gap-2 px-5 py-6">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-secondary">
                  <UserRound size={22} color={colors.primary} />
                </View>
                <Text weight="bold">{t('events.detail.noProviders')}</Text>
                <Text size="sm" tone="muted" className="text-center">
                  {t('events.detail.noProvidersHint')}
                </Text>
                <Button
                  className="mt-2"
                  size="md"
                  onPress={() => router.push(addHref)}
                  icon={<Plus size={18} color={colors['cta-foreground']} />}
                >
                  {t('events.detail.addProvider')}
                </Button>
              </Card>
            ) : (
              [...groups].map(([groupId, entries]) => {
                const group = categories.find((c) => c.id === groupId);
                return (
                  <Card key={groupId} className="overflow-hidden px-0 py-0">
                    <View className="flex-row items-center gap-2 px-4 pb-2 pt-3">
                      <GroupIcon group={group} />
                      <Text weight="bold">
                        {`${group ? categoryName(group) : t('events.detail.others')} (${entries.length})`}
                      </Text>
                    </View>
                    {entries.map((entry) => (
                      <ProviderRow
                        key={entry.link.id}
                        entry={entry}
                        categories={categories}
                        busy={retain.isPending}
                        onRemove={() => setRemoving(entry)}
                        onRetain={(retained) => toggleRetained(entry, retained)}
                      />
                    ))}
                  </Card>
                );
              })
            )}
          </View>

          {/* « Complète ton événement » : les familles conseillées qui manquent encore. */}
          {missing.length ? (
            <View className="gap-2">
              <Heading level={2}>{t('events.detail.completeTitle')}</Heading>
              <Text size="sm" tone="muted">
                {t('events.detail.completeHint')}
              </Text>
              <Card className="px-0 py-0">
                {missing.map((group, index) => (
                  <Pressable
                    key={group.id}
                    accessibilityRole="link"
                    accessibilityLabel={t('events.detail.discoverLabel', {
                      group: categoryName(group),
                    })}
                    onPress={() =>
                      router.push({
                        pathname: '/evenements/[eventId]/ajouter',
                        params: { eventId: event.id, categorie: group.slug },
                      })
                    }
                    className={`flex-row items-center gap-3 px-4 py-3 active:bg-muted ${
                      index > 0 ? 'border-t border-border' : ''
                    }`}
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                      <GroupIcon group={group} size={22} />
                    </View>
                    <Text weight="semibold" className="flex-1">
                      {categoryName(group)}
                    </Text>
                    <View className="rounded-full bg-secondary px-3 py-1">
                      <Text size="xs" weight="semibold" tone="primary">
                        {t('events.detail.discover')}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.primary} />
                  </Pressable>
                ))}
              </Card>
            </View>
          ) : null}

          <Text size="xs" tone="muted" className="text-center">
            {t('events.detail.noBooking')}
          </Text>
        </View>
      </ScrollView>

      <EventBottomBar>
        <Button
          variant="outline"
          size="md"
          accessibilityLabel={t('events.detail.addProvider')}
          onPress={() => router.push(addHref)}
          icon={<Plus size={18} color={colors.primary} />}
        >
          {t('events.detail.add')}
        </Button>
        <View className="flex-1">
          <Button
            size="md"
            fullWidth
            disabled={!canRequest}
            accessibilityHint={canRequest ? undefined : t('events.detail.requestQuotesDisabled')}
            onPress={() =>
              router.push({
                pathname: '/evenements/[eventId]/devis',
                params: { eventId: event.id },
              })
            }
            icon={<Send size={18} color={colors['cta-foreground']} />}
          >
            {t('events.detail.requestQuotes')}
          </Button>
        </View>
      </EventBottomBar>

      <ConfirmModal
        visible={!!removing}
        onCancel={() => setRemoving(null)}
        onConfirm={confirmRemove}
        icon={Trash2}
        title={t('events.detail.removeTitle')}
        message={t('events.detail.removeMessage', { name: removing?.provider.displayName ?? '' })}
        note={removing && removing.status !== 'added' ? t('events.detail.removeNote') : undefined}
        confirmLabel={t('events.detail.removeConfirm')}
        pending={remove.isPending}
        error={remove.isError ? t('events.detail.removeError') : null}
      />
      <ConfirmModal
        visible={deleting}
        onCancel={() => setDeleting(false)}
        onConfirm={confirmDelete}
        icon={TriangleAlert}
        tone="warning"
        title={t('events.detail.deleteTitle')}
        message={t('events.detail.deleteMessage', { name: event.name })}
        confirmLabel={t('events.detail.deleteConfirm')}
        pending={del.isPending}
        error={del.isError ? t('events.detail.deleteError') : null}
      />
    </>
  );
}

/** L'icône d'une famille de prestataires (les mêmes que la Recherche). */
function GroupIcon({ group, size = 18 }: { group?: Category; size?: number }) {
  const colors = useThemeColors();
  const xml = group ? CATEGORY_ICONS[group.slug] : undefined;
  return xml ? (
    <SvgXml xml={xml} width={size} height={size} color={colors.primary} />
  ) : (
    <UserRound size={size} color={colors.primary} />
  );
}

/** Un prestataire de l'événement : photo, nom, catégorie, statut, et ses actions. */
function ProviderRow({
  entry,
  categories,
  busy,
  onRemove,
  onRetain,
}: {
  entry: ProviderEntry;
  categories: Category[];
  busy: boolean;
  onRemove(): void;
  onRetain(retained: boolean): void;
}) {
  const { provider, status, link } = entry;
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const categoryName = useCategoryName();
  const category = categories.find((c) => c.id === provider.categoryIds[0]);
  return (
    <View
      className="gap-2 border-t border-border px-4 py-3"
      testID={`event-provider-${provider.id}`}
    >
      <View className="flex-row items-center gap-3">
        <Photo uri={provider.coverUrl} className="h-12 w-12 rounded-xl" />
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push(profileHref(provider.slug))}
          className="flex-1"
        >
          <Text weight="bold" numberOfLines={1}>
            {provider.displayName}
          </Text>
          <Text size="xs" tone="muted" numberOfLines={1}>
            {[category ? categoryName(category) : undefined, provider.city]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('events.detail.remove', { name: provider.displayName })}
          onPress={onRemove}
          hitSlop={6}
          className="min-h-touch min-w-touch items-center justify-center rounded-full active:bg-muted"
        >
          <X size={18} color={colors['muted-foreground']} />
        </Pressable>
      </View>
      <View className="ml-[60px] flex-row flex-wrap items-center gap-2">
        <EventProviderStatusBadge status={status} />
        {status === 'received' ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onPress={() => onRetain(true)}
            icon={<Check size={15} color={colors.foreground} />}
          >
            {t('events.detail.retain')}
          </Button>
        ) : null}
        {status === 'retained' ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onPress={() => onRetain(false)}
            icon={<Undo2 size={15} color={colors.foreground} />}
          >
            {t('events.detail.unretain')}
          </Button>
        ) : null}
        {link.quoteRequestId ? (
          <Button
            variant="ghost"
            size="sm"
            onPress={() => router.push(requestHref(link.quoteRequestId!))}
            icon={<FileText size={15} color={colors.foreground} />}
          >
            {t('events.detail.viewRequest')}
          </Button>
        ) : null}
      </View>
    </View>
  );
}
