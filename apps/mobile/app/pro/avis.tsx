import { useTranslation } from 'react-i18next';
import { ProOnly } from '@/features/pro/ProOnly';
import { ReceivedReviewsScreen } from '@/features/pro/ReceivedReviewsScreen';

/** Les avis reçus (S8, lot M15b), ouverts depuis « Mon profil ». */
export default function ProReviewsRoute() {
  const { t } = useTranslation();
  return (
    <ProOnly title={t('proReviews.title')}>
      <ReceivedReviewsScreen />
    </ProOnly>
  );
}
