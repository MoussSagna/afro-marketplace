import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SignInRequired } from '@/features/auth/SignInRequired';
import { useThemeColors } from '@/theme/useTheme';

/**
 * Les écrans d'un événement (créer, détail, modifier, ajouter un prestataire, demander les devis) :
 * une pile ouverte PAR-DESSUS les onglets, donc sans la barre d'onglets (demande de Mouss). Mêmes
 * adresses que le site (/evenements/nouveau, /evenements/:id…). Il faut être connecté.
 */
export default function EventScreensLayout() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  return (
    <SignInRequired title={t('tabs.events')} reason={t('events.signIn')}>
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      />
    </SignInRequired>
  );
}
