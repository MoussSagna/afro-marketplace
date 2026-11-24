import { useCategories } from '@afro/common';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge, EmptyState, Heading } from '@/components/ui';
import { useCategoryName } from '@/i18n/useCategoryName';

/**
 * Onglet Recherche, provisoire : il montre déjà le filtre reçu de l'Accueil
 * (« ?categorie=nourriture »). Les résultats et les filtres arrivent au lot M7.
 */
export function SearchScreen() {
  const { categorie } = useLocalSearchParams<{ categorie?: string }>();
  const categories = useCategories();
  const { t } = useTranslation();
  const categoryName = useCategoryName();
  const category = categories.data?.find((c) => c.slug === categorie);
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="gap-3 px-5 pt-4">
        <Heading>{t('search.title')}</Heading>
        {category ? (
          <Badge variant="primary">{t('search.category', { name: categoryName(category) })}</Badge>
        ) : null}
      </View>
      <EmptyState
        className="flex-1"
        title={t('common.comingSoon')}
        description={t('search.soon')}
        action={<Badge variant="sun">{t('common.lot', { lot: 'M7' })}</Badge>}
      />
    </SafeAreaView>
  );
}
