import { useTranslation } from 'react-i18next';
import { ProOnly } from '@/features/pro/ProOnly';
import { EditProfileSectionScreen } from '@/features/pro/profile-edit/EditProfileSectionScreen';

/** Modifier une section du profil : présentation, zone, annulation, infos légales (lot M15c). */
export default function ProEditSectionRoute() {
  const { t } = useTranslation();
  return (
    <ProOnly title={t('proProfile.title')}>
      <EditProfileSectionScreen />
    </ProOnly>
  );
}
