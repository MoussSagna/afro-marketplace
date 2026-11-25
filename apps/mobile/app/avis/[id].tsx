import { useTranslation } from 'react-i18next';
import { SignInRequired } from '@/features/auth/SignInRequired';
import { LeaveReviewScreen } from '@/features/reviews/LeaveReviewScreen';

export default function ReviewRoute() {
  const { t } = useTranslation();
  return (
    <SignInRequired title={t('review.title')} reason={t('bookings.signIn')}>
      <LeaveReviewScreen />
    </SignInRequired>
  );
}
