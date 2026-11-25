import { useTranslation } from 'react-i18next';
import { ProOnly } from '@/features/pro/ProOnly';
import { ProSoonScreen } from '@/features/pro/ProSoonScreen';

export default function ProProfilTab() {
  const { t } = useTranslation();
  return (
    <ProOnly title={t('tabs.profile')}>
      <ProSoonScreen
        title={t('tabs.profile')}
        lot="M15"
        description={t('pro.soonProfile')}
        withSwitch
      />
    </ProOnly>
  );
}
