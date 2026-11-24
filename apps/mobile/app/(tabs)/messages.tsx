import { useTranslation } from 'react-i18next';
import { SignInRequired } from '@/features/auth/SignInRequired';
import { ComingSoonScreen } from '@/features/coming-soon/ComingSoonScreen';

export default function MessagesTab() {
  const { t } = useTranslation();
  return (
    <SignInRequired title={t('tabs.messages')} reason={t('messages.signIn')}>
      <ComingSoonScreen title={t('tabs.messages')} lot="M10" description={t('messages.soon')} />
    </SignInRequired>
  );
}
