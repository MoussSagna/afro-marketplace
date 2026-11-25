import { useTranslation } from 'react-i18next';
import { SignInRequired } from '@/features/auth/SignInRequired';
import { BookingsScreen } from '@/features/bookings/BookingsScreen';

export default function BookingsRoute() {
  const { t } = useTranslation();
  return (
    <SignInRequired title={t('bookings.title')} reason={t('bookings.signIn')}>
      <BookingsScreen />
    </SignInRequired>
  );
}
