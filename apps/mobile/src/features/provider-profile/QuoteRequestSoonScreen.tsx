import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader, Badge, EmptyState } from '@/components/ui';

/**
 * « Demander un devis », en attendant le formulaire en 3 étapes du lot M9.
 * L'adresse est déjà la bonne (/prestataires/[slug]/demande, comme sur le site).
 */
export function QuoteRequestSoonScreen() {
  const { t } = useTranslation();
  return (
    <SafeAreaView className="flex-1 bg-background">
      <BackHeader title={t('profile.requestQuote')} />
      <EmptyState
        className="flex-1"
        title={t('common.comingSoon')}
        description={t('profile.requestQuoteSoon')}
        action={<Badge variant="sun">{t('common.lot', { lot: 'M9' })}</Badge>}
      />
    </SafeAreaView>
  );
}
