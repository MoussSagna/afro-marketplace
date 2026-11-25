import { useTranslation } from 'react-i18next';
import { ProOnly } from '@/features/pro/ProOnly';
import { ProSoonScreen } from '@/features/pro/ProSoonScreen';

export default function ProDemandesTab() {
  const { t } = useTranslation();
  return (
    <ProOnly title={t('tabs.requests')}>
      <ProSoonScreen title={t('tabs.requests')} lot="M14" description={t('pro.soonRequests')} />
    </ProOnly>
  );
}
