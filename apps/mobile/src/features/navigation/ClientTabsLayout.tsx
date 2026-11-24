import { Tabs } from 'expo-router';
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
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="recherche" options={{ title: 'Recherche' }} />
      <Tabs.Screen name="demandes" options={{ title: 'Demandes' }} />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarAccessibilityLabel:
            unread > 0 ? `Messages, ${unread} non lu${unread > 1 ? 's' : ''}` : 'Messages',
        }}
      />
      <Tabs.Screen name="compte" options={{ title: 'Compte' }} />
    </Tabs>
  );
}
