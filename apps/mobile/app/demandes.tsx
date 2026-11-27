import { useTranslation } from 'react-i18next';
import { SignInRequired } from '@/features/auth/SignInRequired';
import { RequestsScreen } from '@/features/requests/RequestsScreen';

/**
 * « Mes demandes » (C2) : plus un onglet depuis le 27/11/2026, mais un écran ouvert depuis Profil
 * (ou « Réservations »), par-dessus les onglets. Même adresse qu'avant : /demandes.
 */
export default function RequestsRoute() {
  const { t } = useTranslation();
  return (
    <SignInRequired title={t('tabs.requests')} reason={t('requests.signIn')}>
      <RequestsScreen withBack />
    </SignInRequired>
  );
}
