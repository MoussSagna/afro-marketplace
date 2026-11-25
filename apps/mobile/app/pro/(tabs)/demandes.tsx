import { useTranslation } from 'react-i18next';
import { ProOnly } from '@/features/pro/ProOnly';
import { RequestsScreen } from '@/features/requests/RequestsScreen';

export default function ProDemandesTab() {
  const { t } = useTranslation();
  return (
    <ProOnly title={t('tabs.requests')}>
      <RequestsScreen side="provider" />
    </ProOnly>
  );
}
