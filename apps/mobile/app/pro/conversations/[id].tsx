import { useTranslation } from 'react-i18next';
import { ConversationScreen } from '@/features/messaging/ConversationScreen';
import { ProOnly } from '@/features/pro/ProOnly';

export default function ProConversationRoute() {
  const { t } = useTranslation();
  return (
    <ProOnly title={t('tabs.messages')}>
      <ConversationScreen side="provider" />
    </ProOnly>
  );
}
