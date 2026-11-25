import { useTranslation } from 'react-i18next';
import { ProOnly } from '@/features/pro/ProOnly';
import { ProSoonScreen } from '@/features/pro/ProSoonScreen';

export default function ProMessagesTab() {
  const { t } = useTranslation();
  return (
    <ProOnly title={t('tabs.messages')}>
      <ProSoonScreen title={t('tabs.messages')} lot="M14" description={t('pro.soonMessages')} />
    </ProOnly>
  );
}
