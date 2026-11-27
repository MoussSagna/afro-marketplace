import { useTranslation } from 'react-i18next';
import { ComingSoonScreen } from '@/features/coming-soon/ComingSoonScreen';

/** L'onglet Favoris : vide pour l'instant (voir agents/questions-ouvertes.md n° 30). */
export default function FavoritesTab() {
  const { t } = useTranslation();
  return <ComingSoonScreen title={t('tabs.favorites')} description={t('comingSoon.favorites')} />;
}
