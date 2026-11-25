import { useTranslation } from 'react-i18next';
import { ProOnly } from '@/features/pro/ProOnly';
import { ProSoonScreen } from '@/features/pro/ProSoonScreen';

export default function ProAgendaTab() {
  const { t } = useTranslation();
  return (
    <ProOnly title={t('tabs.agenda')}>
      <ProSoonScreen title={t('tabs.agenda')} lot="M15" description={t('pro.soonAgenda')} />
    </ProOnly>
  );
}
