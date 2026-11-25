import { useTranslation } from 'react-i18next';
import { SignInRequired } from '@/features/auth/SignInRequired';
import { RequestDetailScreen } from '@/features/requests/RequestDetailScreen';

export default function RequestRoute() {
  const { t } = useTranslation();
  return (
    <SignInRequired title={t('tabs.requests')} reason={t('requests.signIn')}>
      <RequestDetailScreen />
    </SignInRequired>
  );
}
