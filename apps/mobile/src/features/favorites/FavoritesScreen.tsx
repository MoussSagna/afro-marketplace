import type { ProviderCard } from '@afro/common';
import { usePathname, useRouter } from 'expo-router';
import { CalendarPlus, FileText, Heart, Search, Sparkles } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AppBottomSheetRef } from '@/components/AppBottomSheet';
import { WenzeeLoader } from '@/components/brand/WenzeeLoader';
import { QueryState } from '@/components/QueryState';
import { Button, Chip, Heading, Text } from '@/components/ui';
import { useCategoryName } from '@/i18n/useCategoryName';
import { useSessionStore } from '@/stores/session';
import { useThemeColors } from '@/theme/useTheme';
import { useAuthFlowStore } from '../auth/authFlowStore';
import { AddToEventSheet } from '../events/AddToEventSheet';
import { TAB_BAR_SPACE } from '../navigation/GlassTabBar';
import { useCollapseOnScroll } from '../navigation/useCollapseOnScroll';
import { ProviderMiniCard } from '../search/ProviderMiniCard';
import { useFavoriteProviders } from './useFavoriteProviders';

const SIDE = 20;
const GAP = 12;

/**
 * L'onglet Favoris : les prestataires gardés d'un cœur dans la Recherche (ou sur leur fiche).
 * - Une grille de 2 colonnes, avec la MÊME petite carte que les rangées de la Recherche (photo, cœur, note, prix).
 *   Toucher la carte ouvre la fiche ; toucher le cœur retire le favori (la carte s'efface, les autres se replacent).
 * - Un compteur, et des pastilles par catégorie quand il y en a plusieurs.
 * - Sous chaque carte : « Devis » (demande de devis) et « Ajouter à un événement » (panneau du bas existant).
 * - Sans favori : un état vide qui ramène à la Recherche.
 * Les favoris sont ceux du store existant : la Recherche, la fiche et cet écran partagent le même état.
 */
export function FavoritesScreen() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const favorites = useFavoriteProviders(selected);
  const onScroll = useCollapseOnScroll();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="gap-1 px-5 pb-2 pt-4">
        <Heading>{t('favorites.title')}</Heading>
        {favorites.total > 0 ? (
          <Text size="sm" tone="muted">
            {t('favorites.count', { count: favorites.total })}
          </Text>
        ) : null}
      </View>

      {!favorites.hasFavorites ? (
        <EmptyFavorites />
      ) : (
        <QueryState
          isPending={favorites.cards.isPending}
          isError={favorites.cards.isError}
          onRetry={() => void favorites.cards.refetch()}
          loadingLabel={t('favorites.loading')}
          placeholder={
            <View className="flex-1 items-center justify-center">
              <WenzeeLoader size={96} label={t('favorites.loading')} />
            </View>
          }
        >
          {favorites.total === 0 ? (
            // Des cœurs, mais plus aucun profil publié derrière : même invitation que sans favori.
            <EmptyFavorites />
          ) : (
            <ScrollView
              className="flex-1"
              onScroll={onScroll}
              scrollEventThrottle={16}
              contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
              testID="favorites-list"
            >
              {favorites.chips.length > 1 ? (
                <CategoryFilter
                  chips={favorites.chips}
                  total={favorites.total}
                  selected={favorites.selectedId}
                  onSelect={setSelected}
                />
              ) : null}
              <FavoritesGrid items={favorites.items} />
            </ScrollView>
          )}
        </QueryState>
      )}
    </SafeAreaView>
  );
}

function CategoryFilter({
  chips,
  total,
  selected,
  onSelect,
}: {
  chips: ReturnType<typeof useFavoriteProviders>['chips'];
  total: number;
  selected: string | null;
  onSelect(id: string | null): void;
}) {
  const { t } = useTranslation();
  const categoryName = useCategoryName();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={t('favorites.filters')}
      contentContainerClassName="gap-2 px-5 pb-1 pt-2"
    >
      <Chip selected={selected === null} onPress={() => onSelect(null)}>
        {t('favorites.chip', { name: t('favorites.all'), count: total })}
      </Chip>
      {chips.map(({ category, count }) => (
        <Chip
          key={category.id}
          selected={selected === category.id}
          onPress={() => onSelect(category.id)}
        >
          {t('favorites.chip', { name: categoryName(category), count })}
        </Chip>
      ))}
    </ScrollView>
  );
}

/** La grille : chaque carte entre en fondu, sort en fondu quand on retire son cœur, et les autres glissent. */
function FavoritesGrid({ items }: { items: ProviderCard[] }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const user = useSessionStore((s) => s.user);
  const startAuth = useAuthFlowStore((s) => s.startAuth);
  const sheet = useRef<AppBottomSheetRef>(null);
  const [forEvent, setForEvent] = useState<ProviderCard | null>(null);
  const cardWidth = Math.floor((width - SIDE * 2 - GAP) / 2);

  /** Sans compte : la connexion d'abord, puis retour sur `then` (comme la fiche). */
  const signInFirst = (then: string) => {
    startAuth(then);
    router.push('/bienvenue');
  };
  const requestQuote = (provider: ProviderCard) => {
    const path = `/prestataires/${provider.slug}/demande`;
    if (!user) return signInFirst(path);
    router.push({ pathname: '/prestataires/[slug]/demande', params: { slug: provider.slug } });
  };
  const addToEvent = (provider: ProviderCard) => {
    if (!user) return signInFirst(pathname);
    setForEvent(provider);
    sheet.current?.present();
  };

  return (
    <>
      <View className="flex-row flex-wrap px-5 pt-3" style={{ columnGap: GAP, rowGap: 20 }}>
        {items.map((provider) => (
          <Animated.View
            key={provider.id}
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(180)}
            layout={LinearTransition.duration(220)}
            style={{ width: cardWidth }}
          >
            <ProviderMiniCard provider={provider} width={cardWidth} />
            <View className="mt-2 flex-row gap-2">
              <ActionPill
                icon={FileText}
                label={t('favorites.quote')}
                accessibilityLabel={t('favorites.quoteLabel', { name: provider.displayName })}
                onPress={() => requestQuote(provider)}
              />
              <ActionPill
                icon={CalendarPlus}
                accessibilityLabel={t('favorites.addToEventLabel', { name: provider.displayName })}
                onPress={() => addToEvent(provider)}
              />
            </View>
          </Animated.View>
        ))}
      </View>
      {/* Un seul panneau pour tout l'écran, ouvert sur le prestataire choisi (celui de la fiche). */}
      <AddToEventSheet
        ref={sheet}
        providerId={forEvent?.id ?? ''}
        providerName={forEvent?.displayName ?? ''}
        enabled={!!user}
        onCreateEvent={() => {
          if (!forEvent) return;
          sheet.current?.dismiss();
          router.push({
            pathname: '/evenements/nouveau',
            params: { prestataire: forEvent.id, retour: `/prestataires/${forEvent.slug}` },
          });
        }}
      />
    </>
  );
}

/** Une petite action sous la carte : pilule bordée (avec texte) ou rond (icône seule). */
function ActionPill({
  icon: Icon,
  label,
  accessibilityLabel,
  onPress,
}: {
  icon: typeof FileText;
  label?: string;
  accessibilityLabel: string;
  onPress(): void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={4}
      className={
        label
          ? 'h-9 flex-1 flex-row items-center justify-center gap-1.5 rounded-full border border-input bg-card active:opacity-70'
          : 'h-9 w-9 items-center justify-center rounded-full border border-input bg-card active:opacity-70'
      }
    >
      <Icon size={15} color={colors.primary} />
      {label ? (
        <Text size="xs" weight="semibold" tone="primary">
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** Sans favori : un cœur sur un rond sable (comme l'état vide des événements), et retour à la Recherche. */
function EmptyFavorites() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();
  return (
    <Animated.View
      entering={FadeIn.duration(260)}
      className="flex-1 items-center justify-center gap-3 px-8"
      style={{ paddingBottom: TAB_BAR_SPACE }}
    >
      <View className="mb-3 h-44 w-44 items-center justify-center rounded-full bg-secondary">
        <Heart size={80} color={colors['title-accent']} strokeWidth={1.3} />
        <View className="absolute right-3 top-4">
          <Sparkles size={26} color={colors.ochre} strokeWidth={1.6} />
        </View>
      </View>
      <Heading level={2} className="text-center">
        {t('favorites.emptyTitle')}
      </Heading>
      <Text tone="muted" className="text-center">
        {t('favorites.emptyHint')}
      </Text>
      <Button
        className="mt-3 self-center"
        onPress={() => router.navigate('/')}
        icon={<Search size={18} color={colors['cta-foreground']} />}
      >
        {t('favorites.explore')}
      </Button>
    </Animated.View>
  );
}
