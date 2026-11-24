import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GlassTabBar } from './GlassTabBar';
import { useClientUnreadCount } from './useClientUnreadCount';
import { useThemeColors } from '@/theme/useTheme';

/**
 * Les 5 onglets du mode client (maquette) : Accueil, Recherche, Demandes, Messages, Compte.
 * Chaque onglet est un fichier de app/(tabs)/. Les parenthèses de « (tabs) » ne
 * changent pas l'adresse : l'Accueil reste « / ».
 * La barre est la nôtre (GlassTabBar) : en verre, flottante, rétractable au défilement.
 */
export function ClientTabsLayout() {
  const colors = useThemeColors();
  const unread = useClientUnreadCount();
  const { t } = useTranslation();
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="recherche" options={{ title: t('tabs.search') }} />
      <Tabs.Screen name="demandes" options={{ title: t('tabs.requests') }} />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('tabs.messages'),
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarAccessibilityLabel:
            unread > 0 ? t('tabs.unread', { count: unread }) : t('tabs.messages'),
        }}
      />
      <Tabs.Screen name="compte" options={{ title: t('tabs.account') }} />
    </Tabs>
  );
}
