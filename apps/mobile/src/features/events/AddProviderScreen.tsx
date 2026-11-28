import {
  useAddEventProvider,
  useCategories,
  useEvent,
  useProviderSearch,
  type ProviderCard,
} from '@afro/common';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, MapPin, Plus, Search } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import emptyImage from '../../../assets/images/aucun-resultat.webp';
import { QueryState } from '@/components/QueryState';
import { Button, Chip, EmptyState, Input, Photo, Rating, Text } from '@/components/ui';
import { useCategoryName } from '@/i18n/useCategoryName';
import { useErrorText } from '@/i18n/useErrorText';
import { mainCategories } from '@/lib/categories';
import { toast } from '@/stores/toasts';
import { useThemeColors } from '@/theme/useTheme';
import { profileHref } from '../providers/profileHref';
import { EventHeader } from './EventChrome';

/** Le texte tapé, appliqué 300 ms après la dernière frappe (comme sur le site). */
function useDebounced(value: string, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

/**
 * Ajouter un prestataire à un événement (/evenements/:id/ajouter), comme sur le site : la recherche
 * existante (texte, famille, ville) et un bouton « Ajouter » par résultat ; un prestataire déjà dans
 * l'événement affiche « Ajouté ». `?categorie=` (depuis « Complète ton événement ») préfiltre.
 */
export function AddProviderScreen() {
  const { eventId = '', categorie } = useLocalSearchParams<{
    eventId: string;
    categorie?: string;
  }>();
  const { t } = useTranslation();
  const { apiError } = useErrorText();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const categoryName = useCategoryName();
  const details = useEvent(eventId);
  const categories = useCategories();
  const groups = mainCategories(categories.data ?? []);
  const [text, setText] = useState('');
  const [category, setCategory] = useState(categorie ?? '');
  const [city, setCity] = useState('');
  const q = useDebounced(text.trim());
  const cityFilter = useDebounced(city.trim());
  const search = useProviderSearch({
    ...(q && { q }),
    ...(category && { category }),
    ...(cityFilter && { city: cityFilter }),
    pageSize: 30,
  });
  const add = useAddEventProvider();
  const inEvent = new Set(details.data?.providerIds ?? []);
  const items = search.data?.items ?? [];

  const categoryOf = (provider: ProviderCard) => {
    const found = categories.data?.find((c) => provider.categoryIds.includes(c.id));
    return found ? categoryName(found) : undefined;
  };

  function addProvider(provider: ProviderCard) {
    add.mutate(
      { eventId, providerId: provider.id },
      {
        onSuccess: () =>
          toast({
            title: t('events.add.addedToast'),
            description: t('events.add.addedToastHint', {
              name: provider.displayName,
              event: details.data?.event.name ?? '',
            }),
          }),
        onError: (error) =>
          toast({ tone: 'info', title: t('events.add.addFailed'), description: apiError(error) }),
      },
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <EventHeader
        title={t('events.add.title')}
        subtitle={t('events.add.subtitle')}
        fallback={{ pathname: '/evenements/[eventId]', params: { eventId } }}
      />
      <View className="gap-3 px-5 pb-2">
        <Input
          label={t('events.add.search')}
          value={text}
          onChangeText={setText}
          placeholder={t('events.add.searchPlaceholder')}
          returnKeyType="search"
          icon={<Search size={18} color={colors['muted-foreground']} />}
        />
        <View className="gap-1.5">
          <Text size="sm" weight="semibold">
            {t('events.add.category')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 pr-5"
            accessibilityLabel={t('events.add.category')}
          >
            <Chip selected={!category} onPress={() => setCategory('')}>
              {t('events.add.allCategories')}
            </Chip>
            {groups.map((group) => (
              <Chip
                key={group.id}
                selected={category === group.slug}
                onPress={() => setCategory(category === group.slug ? '' : group.slug)}
              >
                {categoryName(group)}
              </Chip>
            ))}
          </ScrollView>
        </View>
        <Input
          label={t('events.add.city')}
          value={city}
          onChangeText={setCity}
          placeholder={t('events.add.cityPlaceholder')}
          autoComplete="postal-address-locality"
          icon={<MapPin size={18} color={colors['muted-foreground']} />}
        />
      </View>

      <View className="flex-1">
        <QueryState
          isPending={search.isPending}
          isError={search.isError}
          onRetry={() => void search.refetch()}
          loadingLabel={t('events.add.loading')}
        >
          <FlatList
            data={items}
            keyExtractor={(provider) => provider.id}
            keyboardShouldPersistTaps="handled"
            accessibilityLabel={t('events.add.results', { count: search.data?.total ?? 0 })}
            testID="add-provider-results"
            contentContainerClassName="gap-2.5 px-5 pt-2"
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            ListHeaderComponent={
              items.length ? (
                <Text size="sm" tone="muted" weight="semibold">
                  {t('events.add.results', { count: search.data?.total ?? 0 })}
                </Text>
              ) : undefined
            }
            ListEmptyComponent={
              <EmptyState
                image={emptyImage}
                title={t('events.add.empty')}
                description={t('events.add.emptyHint')}
              />
            }
            renderItem={({ item }) => {
              const added = inEvent.has(item.id);
              return (
                <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-2.5">
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={[item.displayName, categoryOf(item), item.city]
                      .filter(Boolean)
                      .join(', ')}
                    onPress={() => router.push(profileHref(item.slug))}
                    className="flex-1 flex-row items-center gap-3"
                  >
                    <Photo uri={item.coverUrl} className="h-16 w-16 rounded-xl" />
                    <View className="flex-1 gap-0.5">
                      <Text weight="bold" numberOfLines={1}>
                        {item.displayName}
                      </Text>
                      <Text size="xs" tone="muted" numberOfLines={1}>
                        {[categoryOf(item), item.city].filter(Boolean).join(' · ')}
                      </Text>
                      <Rating value={item.ratingAverage} count={item.ratingCount} />
                    </View>
                  </Pressable>
                  {added ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled
                      accessibilityLabel={t('events.add.addedLabel', { name: item.displayName })}
                      icon={<Check size={15} color={colors['secondary-foreground']} />}
                    >
                      {t('events.add.added')}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={add.isPending || !details.isSuccess}
                      accessibilityLabel={t('events.add.addLabel', { name: item.displayName })}
                      onPress={() => addProvider(item)}
                      icon={<Plus size={15} color={colors['cta-foreground']} />}
                    >
                      {t('events.add.add')}
                    </Button>
                  )}
                </View>
              );
            }}
          />
        </QueryState>
      </View>
    </SafeAreaView>
  );
}
