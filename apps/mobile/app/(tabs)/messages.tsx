import { useTranslation } from 'react-i18next';
import { SignInRequired } from '@/features/auth/SignInRequired';
import { ConversationsScreen } from '@/features/messaging/ConversationsScreen';

export default function MessagesTab() {
  const { t } = useTranslation();
  return (
    <SignInRequired title={t('tabs.messages')} reason={t('messages.signIn')}>
      <ConversationsScreen />
    </SignInRequired>
  );
}
