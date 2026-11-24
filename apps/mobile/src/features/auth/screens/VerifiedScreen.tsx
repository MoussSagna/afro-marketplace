import { useLocalSearchParams } from 'expo-router';
import { PartyPopper } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Button, Heading, Text } from '@/components/ui';
import { useSessionStore } from '@/stores/session';
import { HOME, useAuthFlowStore } from '../authFlowStore';
import { AuthScreen } from '../components/AuthScreen';
import { useFinishAuth } from '../useFinishAuth';
import { useThemeColors } from '@/theme/useTheme';

/** « C'est bon ! » : fin du parcours (compte vérifié ou mot de passe changé). On est déjà connecté. */
export function VerifiedScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const firstName = useSessionStore((s) => s.user?.firstName);
  const redirectTo = useAuthFlowStore((s) => s.redirectTo);
  const { leaveAuth } = useFinishAuth();
  const passwordChanged = reason === 'reset-password';

  return (
    <AuthScreen back={false}>
      <View className="flex-1 items-center justify-center gap-3">
        <View className="mb-2 h-24 w-24 items-center justify-center rounded-full bg-success-muted">
          <PartyPopper size={44} color={colors.success} />
        </View>
        <Heading className="text-center">{t('auth.doneTitle')}</Heading>
        <Text tone="muted" className="text-center">
          {passwordChanged
            ? firstName
              ? t('auth.passwordChangedName', { name: firstName })
              : t('auth.passwordChanged')
            : firstName
              ? t('auth.verifiedWelcomeName', { name: firstName })
              : t('auth.verifiedWelcome')}
        </Text>
      </View>
      <Button fullWidth onPress={leaveAuth}>
        {t(redirectTo && redirectTo !== HOME ? 'auth.continue' : 'auth.discoverProviders')}
      </Button>
    </AuthScreen>
  );
}
