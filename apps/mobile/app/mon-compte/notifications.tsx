import { useTranslation } from 'react-i18next';
import { SignInRequired } from '@/features/auth/SignInRequired';
import { NotificationsScreen } from '@/features/account/NotificationsScreen';

export default function NotificationsRoute() {
  const { t } = useTranslation();
  return (
    <SignInRequired title={t('tabs.account')} reason={t('account.signIn')}>
      <NotificationsScreen />
    </SignInRequired>
  );
}
