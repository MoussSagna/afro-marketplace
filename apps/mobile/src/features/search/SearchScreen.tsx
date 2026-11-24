import { useCategories } from '@afro/common';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge, EmptyState, Heading } from '@/components/ui';

/**
 * Onglet Recherche, provisoire : il montre déjà le filtre reçu de l'Accueil
 * (« ?categorie=nourriture »). Les résultats et les filtres arrivent au lot M7.
 */
export function SearchScreen() {
  const { categorie } = useLocalSearchParams<{ categorie?: string }>();
  const categories = useCategories();
  const category = categories.data?.find((c) => c.slug === categorie);
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="gap-3 px-5 pt-4">
        <Heading>Recherche</Heading>
        {category ? <Badge variant="primary">{`Catégorie : ${category.name}`}</Badge> : null}
      </View>
      <EmptyState
        className="flex-1"
        title="Bientôt disponible"
        description="Chercher un prestataire par catégorie, ville, origine et budget."
        action={<Badge variant="sun">Lot M7</Badge>}
      />
    </SafeAreaView>
  );
}
