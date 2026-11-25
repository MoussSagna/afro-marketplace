import { useTranslation } from 'react-i18next';
import { SignInRequired } from '@/features/auth/SignInRequired';
import { AccountInfoScreen } from '@/features/account/AccountInfoScreen';

export default function AccountInfoRoute() {
  const { t } = useTranslation();
  return (
    <SignInRequired title={t('tabs.account')} reason={t('account.signIn')}>
      <AccountInfoScreen />
    </SignInRequired>
  );
}
