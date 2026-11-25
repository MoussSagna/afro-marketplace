import { useTranslation } from 'react-i18next';
import { ProOnly } from '@/features/pro/ProOnly';
import { ProProfileScreen } from '@/features/pro/ProProfileScreen';

export default function ProProfileTab() {
  const { t } = useTranslation();
  return (
    <ProOnly title={t('tabs.profile')}>
      <ProProfileScreen />
    </ProOnly>
  );
}
