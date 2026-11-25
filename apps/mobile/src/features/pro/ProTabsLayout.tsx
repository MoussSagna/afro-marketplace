import { useProviderDashboard } from '@afro/common';
import { Tabs } from 'expo-router';
import { CalendarDays, Inbox, LayoutDashboard, MessageCircle, Store } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/session';
import { useThemeColors } from '@/theme/useTheme';
import { GlassTabBar } from '../navigation/GlassTabBar';
import { useUnreadMessages } from '../navigation/useUnreadMessages';

/** L'icône de chaque onglet pro (nom du fichier dans app/pro/(tabs)/). */
const PRO_TAB_ICONS = {
  index: LayoutDashboard,
  demandes: Inbox,
  messages: MessageCircle,
  agenda: CalendarDays,
  profil: Store,
};

/**
 * Les 5 onglets du mode prestataire (maquette, partie 6) : Tableau, Demandes, Messages, Agenda,
 * Profil, sous l'adresse /pro (fichiers de app/pro/(tabs)/). Même barre en verre que le mode client, mais brune, pour qu'on
 * sache toujours dans quel mode on est. La pastille de Demandes compte les demandes à traiter.
 */
export function ProTabsLayout() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const pending = usePendingCount();
  const unread = useUnreadMessages('provider');
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} variant="pro" icons={PRO_TAB_ICONS} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.dashboard') }} />
      <Tabs.Screen
        name="demandes"
        options={{
          title: t('tabs.requests'),
          tabBarBadge: pending > 0 ? pending : undefined,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('tabs.messages'),
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarAccessibilityLabel:
            unread > 0 ? t('tabs.unread', { count: unread }) : t('tabs.messages'),
        }}
      />
      <Tabs.Screen name="agenda" options={{ title: t('tabs.agenda') }} />
      <Tabs.Screen name="profil" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}

/** Les demandes à traiter, seulement pour un prestataire connecté (sinon le serveur refuse). */
function usePendingCount() {
  const isProvider = useSessionStore((s) => s.user?.roles.includes('provider') ?? false);
  const dashboard = useProviderDashboard({ enabled: isProvider });
  return isProvider ? (dashboard.data?.pendingRequestsCount ?? 0) : 0;
}
