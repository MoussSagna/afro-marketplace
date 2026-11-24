import { useLocalSearchParams } from 'expo-router';
import { PartyPopper } from 'lucide-react-native';
import { View } from 'react-native';
import { Button, Heading, Text } from '@/components/ui';
import { useSessionStore } from '@/stores/session';
import { HOME, useAuthFlowStore } from '../authFlowStore';
import { AuthScreen } from '../components/AuthScreen';
import { useFinishAuth } from '../useFinishAuth';
import { useThemeColors } from '@/theme/useTheme';

/** « C'est bon ! » : fin du parcours (compte vérifié ou mot de passe changé). On est déjà connecté. */
export function VerifiedScreen() {
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
        <Heading className="text-center">C’est bon !</Heading>
        <Text tone="muted" className="text-center">
          {passwordChanged
            ? `Ton mot de passe est changé. Content de te revoir${firstName ? `, ${firstName}` : ''} !`
            : `Ton compte est vérifié. Bienvenue chez Wenzee${firstName ? `, ${firstName}` : ''} 🎉`}
        </Text>
      </View>
      <Button fullWidth onPress={leaveAuth}>
        {redirectTo && redirectTo !== HOME ? 'Continuer' : 'Découvrir les prestataires'}
      </Button>
    </AuthScreen>
  );
}
