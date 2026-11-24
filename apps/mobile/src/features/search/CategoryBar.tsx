import { useCategories } from '@afro/common';
import { LayoutGrid } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Text } from '@/components/ui';
import { useCategoryName } from '@/i18n/useCategoryName';
import { mainCategories } from '@/lib/categories';
import { cn } from '@/lib/cn';
import { useThemeColors } from '@/theme/useTheme';
import { CATEGORY_ICONS } from '../home/categoryIcons';

type CategoryBarProps = {
  /** Le slug de la catégorie choisie, ou rien pour « Tout ». */
  selected?: string;
  onSelect(slug: string | undefined): void;
};

/**
 * La rangée de catégories sous la pilule (façon Airbnb) : une icône et un nom, qui défilent de côté.
 * La catégorie choisie est soulignée, son icône prend la couleur terre ; les autres restent grisées.
 */
export function CategoryBar({ selected, onSelect }: CategoryBarProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const categories = useCategories();
  const categoryName = useCategoryName();
  const items = [
    { slug: undefined, name: t('search.anything') },
    ...mainCategories(categories.data ?? []).map((c) => ({ slug: c.slug, name: categoryName(c) })),
  ];
  return (
    <View className="border-b border-border">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-7 px-5 pt-4"
        accessibilityLabel={t('search.categories')}
      >
        {items.map(({ slug, name }) => {
          const on = slug === selected;
          const color = on ? colors.primary : colors['muted-foreground'];
          const icon = slug ? CATEGORY_ICONS[slug] : undefined;
          return (
            <Pressable
              key={slug ?? 'all'}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={name}
              onPress={() => onSelect(slug)}
              className={cn(
                'items-center gap-1.5 border-b-2 pb-2.5',
                on ? 'border-foreground' : 'border-transparent',
              )}
            >
              {icon ? (
                <SvgXml xml={icon} width={28} height={28} color={color} />
              ) : (
                <LayoutGrid size={26} color={color} />
              )}
              <Text size="xs" weight="semibold" tone={on ? 'default' : 'muted'}>
                {name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
