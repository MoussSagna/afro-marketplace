import { useTranslation } from 'react-i18next';
import { SignInRequired } from '@/features/auth/SignInRequired';
import { AccountScreen } from '@/features/account/AccountScreen';

export default function AccountTab() {
  const { t } = useTranslation();
  return (
    <SignInRequired title={t('tabs.account')} reason={t('account.signIn')}>
      <AccountScreen />
    </SignInRequired>
  );
}
