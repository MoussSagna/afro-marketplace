import { useTranslation } from 'react-i18next';
import { AgendaScreen } from '@/features/pro/AgendaScreen';
import { ProOnly } from '@/features/pro/ProOnly';

export default function ProAgendaTab() {
  const { t } = useTranslation();
  return (
    <ProOnly title={t('tabs.agenda')}>
      <AgendaScreen />
    </ProOnly>
  );
}
