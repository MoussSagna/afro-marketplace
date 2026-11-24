import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { WenzeeLoader } from '@/components/brand/WenzeeLoader';
import { Button, EmptyState } from '@/components/ui';

type QueryStateProps = {
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  /** Ce que lit VoiceOver pendant le chargement (« Chargement des catégories »). */
  loadingLabel: string;
  /** Ce qu'on affiche pendant le chargement (par défaut : le loader Wenzee). */
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
  const { t } = useTranslation();
  if (isPending) {
    return (
      placeholder ?? <WenzeeLoader size={48} label={loadingLabel} className="self-center py-4" />
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
