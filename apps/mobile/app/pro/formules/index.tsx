import { useTranslation } from 'react-i18next';
import { ProOnly } from '@/features/pro/ProOnly';
import { OfferingsScreen } from '@/features/pro/profile-edit/OfferingsScreen';

/** « Formules et prix » (lot M15c), ouvert depuis « Mon profil ». */
export default function ProOfferingsRoute() {
  const { t } = useTranslation();
  return (
    <ProOnly title={t('proProfile.offerings')}>
      <OfferingsScreen />
    </ProOnly>
  );
}
