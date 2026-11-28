import { useTranslation } from 'react-i18next';
import { SignInRequired } from '@/features/auth/SignInRequired';
import { EventsListScreen } from '@/features/events/EventsListScreen';

/**
 * L'onglet Événements : « Mes événements », avec la barre d'onglets. Créer, consulter, modifier un
 * événement s'ouvre PAR-DESSUS les onglets (app/evenements/…), sans la barre.
 */
export default function EventsTab() {
  const { t } = useTranslation();
  return (
    <SignInRequired title={t('tabs.events')} reason={t('events.signIn')}>
      <EventsListScreen />
    </SignInRequired>
  );
}
