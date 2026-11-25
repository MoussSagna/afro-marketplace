import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader, Badge, EmptyState } from '@/components/ui';

/** « Laisser un avis » : l'écran arrive au lot M12 (C6). En attendant, on le dit. */
export default function ReviewRoute() {
  const { t } = useTranslation();
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <BackHeader title={t('bookings.review')} />
      <EmptyState
        className="flex-1"
        title={t('common.comingSoon')}
        description={t('bookings.reviewSoon')}
        action={<Badge variant="sun">{t('common.lot', { lot: 'M12' })}</Badge>}
      />
    </SafeAreaView>
  );
}
