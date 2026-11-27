import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GlassTabBar } from './GlassTabBar';
import { useUnreadMessages } from './useUnreadMessages';
import { useThemeColors } from '@/theme/useTheme';

/**
 * Les 5 onglets du mode client : Recherche, Favoris, Événements, Messages, Profil (l'écran « Compte »).
 * Depuis le 27/11/2026 : plus d'onglet Accueil (la Recherche est l'écran d'ouverture), et « Mes demandes »
 * s'ouvre depuis Profil (app/demandes.tsx, par-dessus les onglets). Chaque onglet est un fichier de app/(tabs)/.
 * Les parenthèses de « (tabs) » ne changent pas l'adresse : la Recherche est « / » (fichier index).
 * La barre est la nôtre (GlassTabBar) : en verre, flottante, rétractable au défilement.
 */
export function ClientTabsLayout() {
  const colors = useThemeColors();
  const unread = useUnreadMessages('client');
  const { t } = useTranslation();
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.search') }} />
      <Tabs.Screen name="favoris" options={{ title: t('tabs.favorites') }} />
      <Tabs.Screen name="evenements" options={{ title: t('tabs.events') }} />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('tabs.messages'),
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarAccessibilityLabel:
            unread > 0 ? t('tabs.unread', { count: unread }) : t('tabs.messages'),
        }}
      />
      <Tabs.Screen name="compte" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
