import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Logo } from '@/components/brand/Logo';
import { Accent, Button, Text } from '@/components/ui';
import { AuthScreen } from '../components/AuthScreen';
import { SocialButtons } from '../components/SocialButtons';
import { TextLink } from '../components/TextLink';

/** Bienvenue (maquette section 2) : Google / Apple, inscription par email, ou connexion. */
export function AuthWelcomeScreen() {
  const router = useRouter();
  return (
    <AuthScreen
      top={<Logo height={40} />}
      title={
        <>
          Bienvenue sur <Accent>Wenzee</Accent>
        </>
      }
      subtitle="Trouve les meilleurs talents afro pour tes événements, ou propose tes services."
    >
      <View className="gap-3">
        <SocialButtons />
        <Button fullWidth onPress={() => router.push('/inscription')}>
          S’inscrire avec un email
        </Button>
      </View>
      <View className="flex-row flex-wrap items-center justify-center gap-x-1">
        <Text size="sm" tone="muted">
          Déjà un compte ?
        </Text>
        <TextLink onPress={() => router.push('/connexion')}>Se connecter</TextLink>
      </View>
      <View className="items-center">
        <TextLink onPress={() => router.push('/comptes-demo')}>Essayer un compte de démo</TextLink>
      </View>
      <Text size="caption" tone="muted" className="mt-auto text-center">
        En continuant, tu acceptes les conditions d’utilisation et la politique de confidentialité.
      </Text>
    </AuthScreen>
  );
}
