import { useTranslation } from 'react-i18next';
import { SignInRequired } from '@/features/auth/SignInRequired';
import { ComingSoonScreen } from '@/features/coming-soon/ComingSoonScreen';

export default function RequestsTab() {
  const { t } = useTranslation();
  return (
    <SignInRequired title={t('tabs.requests')} reason={t('requests.signIn')}>
      <ComingSoonScreen title={t('tabs.requests')} lot="M10" description={t('requests.soon')} />
    </SignInRequired>
  );
}
