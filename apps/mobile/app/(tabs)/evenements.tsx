import { useTranslation } from 'react-i18next';
import { ComingSoonScreen } from '@/features/coming-soon/ComingSoonScreen';

/** L'onglet Événements : vide pour l'instant (voir agents/questions-ouvertes.md n° 30). */
export default function EventsTab() {
  const { t } = useTranslation();
  return <ComingSoonScreen title={t('tabs.events')} description={t('comingSoon.events')} />;
}
