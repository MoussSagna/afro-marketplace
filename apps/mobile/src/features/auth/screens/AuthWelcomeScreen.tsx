import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Logo } from '@/components/brand/Logo';
import { Accent, Button, Text } from '@/components/ui';
import { AuthScreen } from '../components/AuthScreen';
import { SocialButtons } from '../components/SocialButtons';
import { TextLink } from '../components/TextLink';

/** Bienvenue (maquette section 2) : Google / Apple, inscription par email, ou connexion. */
export function AuthWelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <AuthScreen
      top={<Logo height={40} />}
      title={
        <>
          {t('auth.welcomeStart')}
          <Accent>Wenzee</Accent>
        </>
      }
      subtitle={t('auth.welcomeSubtitle')}
    >
      <View className="gap-3">
        <SocialButtons />
        <Button fullWidth onPress={() => router.push('/inscription')}>
          {t('auth.signUpWithEmail')}
        </Button>
      </View>
      <View className="flex-row flex-wrap items-center justify-center gap-x-1">
        <Text size="sm" tone="muted">
          {t('auth.haveAccount')}
        </Text>
        <TextLink onPress={() => router.push('/connexion')}>{t('auth.signIn')}</TextLink>
      </View>
      <View className="items-center">
        <TextLink onPress={() => router.push('/comptes-demo')}>{t('auth.tryDemo')}</TextLink>
      </View>
      <Text size="caption" tone="muted" className="mt-auto text-center">
        {t('auth.terms')}
      </Text>
    </AuthScreen>
  );
}
