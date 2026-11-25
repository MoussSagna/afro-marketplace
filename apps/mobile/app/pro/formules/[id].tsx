import { useTranslation } from 'react-i18next';
import { ProOnly } from '@/features/pro/ProOnly';
import { OfferingFormScreen } from '@/features/pro/profile-edit/OfferingFormScreen';

/** Ajouter (« nouvelle ») ou modifier une formule (lot M15c). */
export default function ProOfferingRoute() {
  const { t } = useTranslation();
  return (
    <ProOnly title={t('proProfile.offerings')}>
      <OfferingFormScreen />
    </ProOnly>
  );
}
