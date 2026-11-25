import { useTranslation } from 'react-i18next';
import { SignInRequired } from '@/features/auth/SignInRequired';
import { RequestsScreen } from '@/features/requests/RequestsScreen';

export default function RequestsTab() {
  const { t } = useTranslation();
  return (
    <SignInRequired title={t('tabs.requests')} reason={t('requests.signIn')}>
      <RequestsScreen />
    </SignInRequired>
  );
}
