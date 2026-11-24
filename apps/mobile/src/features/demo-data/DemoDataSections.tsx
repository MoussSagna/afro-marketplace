import { formatPrice, useCategories, useFeaturedProviders } from '@afro/common';
import { BadgeCheck } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Badge, Button, Card, EmptyState, Heading, Photo, Rating, Text } from '@/components/ui';
import { mainCategories } from '@/lib/categories';

/**
 * Les trois états de tout écran qui charge des données :
 * chargement → erreur (avec « Réessayer ») → résultat.
 */
function QueryState({
  isPending,
  isError,
  onRetry,
  loadingLabel,
  children,
}: {
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  loadingLabel: string;
  children: ReactNode;
}) {
  if (isPending) {
    return (
      <ActivityIndicator
        color="#7A1F0E"
        accessibilityLabel={loadingLabel}
        className="self-start py-4"
      />
    );
  }
  if (isError) {
    return (
      <EmptyState
        title="Oups, ça n’a pas chargé"
        description="Vérifie ta connexion puis réessaie."
        action={
          <Button variant="outline" size="md" onPress={onRetry}>
            Réessayer
          </Button>
        }
        className="py-4"
      />
    );
  }
  return <>{children}</>;
}

/**
 * Les données de démo de `common` (catégories, prestataires à la une), avec les mêmes hooks
 * que le site. Affichées dans l'écran de travail /donnees et, en attendant l'accueil complet
 * (lot M6), sur l'Accueil.
 */
export function DemoDataSections() {
  const categories = useCategories();
  const featured = useFeaturedProviders();
  return (
    <>
      <View className="gap-3">
        <Heading level={2}>Catégories</Heading>
        <QueryState
          isPending={categories.isPending}
          isError={categories.isError}
          onRetry={() => void categories.refetch()}
          loadingLabel="Chargement des catégories"
        >
          <View className="flex-row flex-wrap gap-2">
            {mainCategories(categories.data ?? []).map((category) => (
              <Badge key={category.id} className="px-3 py-1.5">
                {category.name}
              </Badge>
            ))}
          </View>
        </QueryState>
      </View>

      <View className="gap-3">
        <Heading level={2}>À la une</Heading>
        <QueryState
          isPending={featured.isPending}
          isError={featured.isError}
          onRetry={() => void featured.refetch()}
          loadingLabel="Chargement des prestataires"
        >
          {(featured.data ?? []).map((provider) => (
            <Card key={provider.id} className="overflow-hidden">
              <Photo uri={provider.coverUrl} className="h-36 w-full" />
              <View className="gap-1 p-4">
                <View className="flex-row items-center justify-between gap-2">
                  <Text weight="bold" className="flex-1">
                    {provider.displayName}
                  </Text>
                  <Rating value={provider.ratingAverage} count={provider.ratingCount} />
                </View>
                <Text size="sm" tone="muted">
                  {provider.city}
                  {provider.priceFrom !== undefined
                    ? ` · dès ${formatPrice(provider.priceFrom)}`
                    : ' · sur devis'}
                </Text>
                {provider.isProVerified ? (
                  <Badge variant="success" icon={<BadgeCheck size={14} color="#2E6B3F" />}>
                    Vérifié
                  </Badge>
                ) : null}
              </View>
            </Card>
          ))}
        </QueryState>
      </View>
    </>
  );
}
