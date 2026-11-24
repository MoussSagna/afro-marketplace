import i18n from 'i18next';
import { Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { cn, formatRating } from '@/lib/cn';
import { Text } from './Text';
import { useThemeColors } from '@/theme/useTheme';

type RatingProps = {
  /** Note de 0 à 5 (décimales acceptées). */
  value: number;
  /** Nombre d'avis ; 0 affiche « Nouveau ». */
  count?: number;
  /** compact = une étoile et la note (cartes) ; full = cinq étoiles (profil). */
  variant?: 'compact' | 'full';
  className?: string;
};

/** Le texte lu par VoiceOver / TalkBack (même phrase que sur le site). */
export function ratingLabel(value: number, count?: number): string {
  if (count === 0) return i18n.t('common.noReviews');
  const rating = formatRating(value);
  return count === undefined
    ? i18n.t('common.rating', { value: rating })
    : i18n.t('common.ratingWithCount', { value: rating, count });
}

/** Une note en étoiles : « ★ 4,9 (38) ». Les étoiles sont décoratives. */
export function Rating({ value, count, variant = 'compact', className }: RatingProps) {
  const colors = useThemeColors();
  const { t } = useTranslation(); // pour se redessiner si la langue change
  if (count === 0) {
    return (
      <Text size="sm" tone="muted" className={className}>
        {t('common.newProvider')}
      </Text>
    );
  }

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={ratingLabel(value, count)}
      className={cn('flex-row items-center gap-1', className)}
    >
      <View className="flex-row" importantForAccessibility="no-hide-descendants">
        {variant === 'compact' ? (
          <Star size={16} color={colors.ochre} fill={colors.ochre} />
        ) : (
          Array.from({ length: 5 }, (_, index) => {
            const filled = value - index >= 0.5;
            return (
              <Star
                key={index}
                size={16}
                color={filled ? colors.ochre : colors.input}
                fill={filled ? colors.ochre : 'transparent'}
              />
            );
          })
        )}
      </View>
      <Text size="sm" weight="bold" importantForAccessibility="no">
        {formatRating(value)}
      </Text>
      {count !== undefined ? (
        <Text size="sm" tone="muted" importantForAccessibility="no">
          ({count})
        </Text>
      ) : null}
    </View>
  );
}
