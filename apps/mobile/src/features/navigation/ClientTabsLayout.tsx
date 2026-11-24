import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import {
  House,
  Inbox,
  MessageCircle,
  Search,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
import { useClientUnreadCount } from './useClientUnreadCount';

// Couleurs de la maquette (barre d'onglets client).
const ACTIVE = '#7A1F0E'; // primary
const INACTIVE = '#6B4A36'; // muted-foreground
const SUN = '#F3B618'; // accent : la pastille de non-lus

function icon(Icon: LucideIcon) {
  // Expo Router donne la couleur (active ou non) et la taille : on les passe à l'icône lucide.
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Icon size={24} color={String(color)} strokeWidth={focused ? 2.4 : 2} />;
  }
  return TabIcon;
}

/**
 * Les 5 onglets du mode client (maquette) : Accueil, Recherche, Demandes, Messages, Compte.
 * Chaque onglet est un fichier de app/(tabs)/. Les parenthèses de « (tabs) » ne
 * changent pas l'adresse : l'Accueil reste « / ».
 */
export function ClientTabsLayout() {
  const unread = useClientUnreadCount();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#EAD9C7' },
        tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 11 },
        tabBarBadgeStyle: {
          backgroundColor: SUN,
          color: '#2B1A12',
          fontFamily: 'Inter_700Bold',
          fontSize: 10,
        },
        sceneStyle: { backgroundColor: '#FDF7F0' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: icon(House) }} />
      <Tabs.Screen name="recherche" options={{ title: 'Recherche', tabBarIcon: icon(Search) }} />
      <Tabs.Screen name="demandes" options={{ title: 'Demandes', tabBarIcon: icon(Inbox) }} />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: icon(MessageCircle),
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarAccessibilityLabel:
            unread > 0 ? `Messages, ${unread} non lu${unread > 1 ? 's' : ''}` : 'Messages',
        }}
      />
      <Tabs.Screen name="compte" options={{ title: 'Compte', tabBarIcon: icon(UserRound) }} />
    </Tabs>
  );
}
