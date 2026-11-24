import { useCategories, useFeaturedProviders, type Category } from '@afro/common';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight, Search } from 'lucide-react-native';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import banner from '../../../assets/images/banniere-accueil.webp';
import { Logo } from '@/components/brand/Logo';
import { QueryState } from '@/components/QueryState';
import { Accent, Button, Heading, Text } from '@/components/ui';
import { mainCategories } from '@/lib/categories';
import { TAB_BAR_SPACE } from '../navigation/GlassTabBar';
import { useCollapseOnScroll } from '../navigation/useCollapseOnScroll';
import { ProviderCard } from '../providers/ProviderCard';
import { searchHref } from '../search/searchHref';
import { CATEGORY_ICONS } from './categoryIcons';
import { useThemeColors } from '@/theme/useTheme';

/** Un titre de section avec son lien « Tout voir ». */
function SectionTitle({
  title,
  accent,
  onSeeAll,
}: {
  title: string;
  accent: string;
  onSeeAll: () => void;
}) {
  return (
    <View className="flex-row items-baseline justify-between px-5">
      <Heading level={2}>
        {title} <Accent>{accent}</Accent>
      </Heading>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Tout voir : ${title} ${accent}`}
        hitSlop={10}
        onPress={onSeeAll}
      >
        <Text size="sm" weight="semibold" tone="primary">
          Tout voir
        </Text>
      </Pressable>
    </View>
  );
}

/** Une catégorie principale : son icône sur fond sable et son nom. */
function CategoryTile({ category, onPress }: { category: Category; onPress: () => void }) {
  const icon = CATEGORY_ICONS[category.slug];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={category.name}
      onPress={onPress}
      className="flex-1 items-center gap-1.5 active:opacity-70"
    >
      <View className="aspect-square w-full items-center justify-center rounded-2xl bg-secondary">
        {icon ? (
          <SvgXml xml={icon} width={38} height={38} />
        ) : (
          <Text className="text-h3">{category.icon ?? '•'}</Text>
        )}
      </View>
      <Text size="xs" weight="medium" numberOfLines={1}>
        {category.name}
      </Text>
    </Pressable>
  );
}

/**
 * L'Accueil (maquette P1, lot M6) :
 * bannière photo avec le logo et le grand titre, recherche en pilule, catégories, « À la une ».
 * Toucher la recherche ou une catégorie ouvre l'onglet Recherche (filtré sur la catégorie).
 */
export function HomeScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const onScroll = useCollapseOnScroll();
  const categories = useCategories();
  const featured = useFeaturedProviders();
  const goSearch = (category?: Category) => router.navigate(searchHref(category));

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
        testID="home-scroll"
      >
        {/* La bannière : photo assombrie, logo clair, grand titre. */}
        <View className="h-[330px] overflow-hidden px-5" style={{ paddingTop: insets.top + 14 }}>
          <Image
            source={banner}
            contentFit="cover"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            accessibilityIgnoresInvertColors
          />
          <View
            className="absolute inset-0"
            style={{
              experimental_backgroundImage:
                'linear-gradient(180deg, rgba(43,26,18,0.25), rgba(43,26,18,0.7))',
              backgroundColor: 'rgba(43,26,18,0.35)',
            }}
          />
          <Logo variant="light" height={38} />
          <Heading className="mt-8 text-[31px] leading-[35px] text-white">
            Des talents qui font vivre <Accent className="text-cta">nos cultures</Accent>
          </Heading>
          <Text className="mt-2 text-white opacity-90">
            Traiteurs, danseurs, DJ, speakers… près de chez toi.
          </Text>
        </View>

        {/* La recherche en pilule, à cheval sur la bannière. */}
        <View className="-mt-[30px] px-4">
          <Pressable
            accessibilityRole="search"
            accessibilityLabel="Rechercher un prestataire"
            onPress={() => goSearch()}
            className="flex-row items-center gap-3 rounded-full border border-border bg-card py-1.5 pl-5 pr-1.5 active:opacity-90"
            style={{ boxShadow: '0 12px 32px rgba(43, 26, 18, 0.16)' }}
          >
            <Search size={20} color={colors['muted-foreground']} />
            <View className="flex-1">
              <Text size="sm" weight="semibold">
                Que cherches-tu ?
              </Text>
              <Text size="caption" tone="muted">
                Où · Quand · Catégorie
              </Text>
            </View>
            <View className="h-11 w-11 items-center justify-center rounded-full bg-cta">
              <ArrowRight size={20} color={colors['cta-foreground']} />
            </View>
          </Pressable>
        </View>

        {/* Les catégories principales. */}
        <View className="mt-6 gap-3.5">
          <SectionTitle title="Explore nos" accent="catégories" onSeeAll={() => goSearch()} />
          <View className="px-5">
            <QueryState
              isPending={categories.isPending}
              isError={categories.isError}
              onRetry={() => void categories.refetch()}
              loadingLabel="Chargement des catégories"
            >
              <View className="flex-row gap-2.5">
                {mainCategories(categories.data ?? []).map((category) => (
                  <CategoryTile
                    key={category.id}
                    category={category}
                    onPress={() => goSearch(category)}
                  />
                ))}
              </View>
            </QueryState>
          </View>
        </View>

        {/* « À la une » : les prestataires mis en avant, en défilement horizontal. */}
        <View className="mt-7 gap-3">
          <SectionTitle title="À la" accent="une" onSeeAll={() => goSearch()} />
          <QueryState
            isPending={featured.isPending}
            isError={featured.isError}
            onRetry={() => void featured.refetch()}
            loadingLabel="Chargement des prestataires à la une"
          >
            <FlatList
              horizontal
              data={featured.data ?? []}
              keyExtractor={(provider) => provider.id}
              renderItem={({ item }) => <ProviderCard provider={item} className="w-[220px]" />}
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-3 px-5 pb-4"
              accessibilityLabel="Prestataires à la une"
              testID="featured-list"
            />
          </QueryState>
        </View>

        {/* Pendant le développement seulement : l'écran de travail des composants. */}
        {__DEV__ ? (
          <View className="mt-4 px-5">
            <Link href="/catalogue" asChild>
              <Button variant="ghost" size="sm">
                Voir les composants
              </Button>
            </Link>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
