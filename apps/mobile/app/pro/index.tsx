import { useTranslation } from 'react-i18next';
import { DashboardScreen } from '@/features/pro/DashboardScreen';
import { ProOnly } from '@/features/pro/ProOnly';

export default function DashboardTab() {
  const { t } = useTranslation();
  return (
    <ProOnly title={t('tabs.dashboard')}>
      <DashboardScreen />
    </ProOnly>
  );
}
