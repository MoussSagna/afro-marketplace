import { useTranslation } from 'react-i18next';
import { ProOnly } from '@/features/pro/ProOnly';
import { ProRequestDetailScreen } from '@/features/pro/ProRequestDetailScreen';

export default function ProRequestRoute() {
  const { t } = useTranslation();
  return (
    <ProOnly title={t('tabs.requests')}>
      <ProRequestDetailScreen />
    </ProOnly>
  );
}
