import { useTranslation } from 'react-i18next';
import { SignInRequired } from '@/features/auth/SignInRequired';
import { ConversationScreen } from '@/features/messaging/ConversationScreen';

export default function ConversationRoute() {
  const { t } = useTranslation();
  return (
    <SignInRequired title={t('tabs.messages')} reason={t('messages.signIn')}>
      <ConversationScreen />
    </SignInRequired>
  );
}
