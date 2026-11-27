import { Heart } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { useFavoritesStore, useIsFavorite } from '@/stores/favorites';
import { useThemeColors } from '@/theme/useTheme';

/**
 * Le cœur posé sur la photo d'une carte (façon Airbnb) : ajoute le prestataire aux favoris, ou l'en retire.
 * Contour blanc sur un voile sombre (lisible sur toutes les photos), plein en couleur Wenzee quand il est actif.
 */
export function FavoriteButton({
  providerId,
  providerName,
  className,
}: {
  providerId: string;
  providerName: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const active = useIsFavorite(providerId);
  const toggle = useFavoritesStore((state) => state.toggle);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(active ? 'favorites.remove' : 'favorites.add', { name: providerName })}
      accessibilityState={{ selected: active }}
      hitSlop={8}
      onPress={() => toggle(providerId)}
      className={className}
    >
      <Heart
        size={24}
        strokeWidth={2}
        color="#fff"
        fill={active ? colors.primary : 'rgba(0, 0, 0, 0.35)'}
      />
    </Pressable>
  );
}
