import { useTranslation } from 'react-i18next';
import { ConversationsScreen } from '@/features/messaging/ConversationsScreen';
import { ProOnly } from '@/features/pro/ProOnly';

export default function ProMessagesTab() {
  const { t } = useTranslation();
  return (
    <ProOnly title={t('tabs.messages')}>
      <ConversationsScreen side="provider" />
    </ProOnly>
  );
}
