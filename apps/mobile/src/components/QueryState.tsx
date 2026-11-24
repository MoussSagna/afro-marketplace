import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';
import { Button, EmptyState } from '@/components/ui';
import { useThemeColors } from '@/theme/useTheme';

type QueryStateProps = {
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  /** Ce que lit VoiceOver pendant le chargement (« Chargement des catégories »). */
  loadingLabel: string;
  /** Ce qu'on affiche pendant le chargement (par défaut : une roue). */
  placeholder?: ReactNode;
  children: ReactNode;
};

/**
 * Les trois états de tout bloc qui charge des données :
 * chargement → erreur (avec « Réessayer ») → résultat.
 */
export function QueryState({
  isPending,
  isError,
  onRetry,
  loadingLabel,
  placeholder,
  children,
}: QueryStateProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  if (isPending) {
    return (
      placeholder ?? (
        <ActivityIndicator
          color={colors.primary}
          accessibilityLabel={loadingLabel}
          className="self-start py-4"
        />
      )
    );
  }
  if (isError) {
    return (
      <EmptyState
        title={t('common.loadError')}
        description={t('common.loadErrorHint')}
        action={
          <Button variant="outline" size="md" onPress={onRetry}>
            {t('common.retry')}
          </Button>
        }
        className="py-4"
      />
    );
  }
  return <>{children}</>;
}
