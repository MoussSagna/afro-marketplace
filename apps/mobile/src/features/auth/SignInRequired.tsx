import { usePathname, useRouter } from 'expo-router';
import { LockKeyhole } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Heading, Text } from '@/components/ui';
import { useSessionStore } from '@/stores/session';
import { useAuthFlowStore } from './authFlowStore';
import { useThemeColors } from '@/theme/useTheme';

type SignInRequiredProps = {
  /** Le titre de l'onglet (« Demandes »). */
  title: string;
  /** Pourquoi se connecter, en une phrase (« Connecte-toi pour suivre tes demandes de devis. »). */
  reason: string;
  /** L'écran à montrer une fois connecté. */
  children: ReactNode;
};

/**
 * Une « garde » d'écran (comme RequireAuth sur le site) : si personne n'est connecté,
 * on montre un panneau « Connecte-toi » au lieu du contenu. Le bouton ouvre la connexion
 * en retenant l'écran actuel, pour y revenir juste après.
 * Comme sur le site, c'est du confort : le vrai contrôle se fait côté serveur.
 */
export function SignInRequired({ title, reason, children }: SignInRequiredProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const user = useSessionStore((s) => s.user);
  const pathname = usePathname();
  const router = useRouter();
  const startAuth = useAuthFlowStore((s) => s.startAuth);

  if (user) return children;

  function open(path: '/bienvenue' | '/inscription') {
    startAuth(pathname);
    router.push(path);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-5 pt-4">
        <Heading>{title}</Heading>
      </View>
      <View className="flex-1 items-center justify-center gap-3 px-9">
        <View className="mb-2 h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <LockKeyhole size={34} color={colors.primary} />
        </View>
        <Heading level={2} className="text-center">
          {t('guard.title')}
        </Heading>
        <Text size="sm" tone="muted" className="text-center">
          {reason}
        </Text>
        <View className="mt-3 w-full gap-3">
          <Button fullWidth onPress={() => open('/bienvenue')}>
            {t('guard.signIn')}
          </Button>
          <Button fullWidth variant="outline" onPress={() => open('/inscription')}>
            {t('guard.signUp')}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
