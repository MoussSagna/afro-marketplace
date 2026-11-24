import { signInInputSchema, useSignIn } from '@afro/common';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import type { z } from 'zod';
import { Button, Text } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { AuthScreen } from '../components/AuthScreen';
import { FormAlert } from '../components/FormAlert';
import { FormInput } from '../components/FormInput';
import { SocialButtons } from '../components/SocialButtons';
import { TextLink } from '../components/TextLink';
import { useFinishAuth } from '../useFinishAuth';

/** Connexion : email et mot de passe, « Mot de passe oublié ? », puis Google / Apple. */
export function SignInScreen() {
  const { t } = useTranslation();
  const { apiError } = useErrorText();
  const router = useRouter();
  const signIn = useSignIn();
  const { openSession, leaveAuth } = useFinishAuth();
  const { control, handleSubmit } = useForm<
    z.input<typeof signInInputSchema>,
    unknown,
    z.output<typeof signInInputSchema>
  >({
    resolver: zodResolver(signInInputSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    signIn.mutate(values, {
      onSuccess: (session) => {
        openSession(session);
        leaveAuth();
      },
    });
  });

  return (
    <AuthScreen title={t('auth.signInTitle')} subtitle={t('auth.signInSubtitle')}>
      <View className="gap-4">
        <FormAlert message={signIn.isError ? apiError(signIn.error) : null} />
        <FormInput
          control={control}
          name="email"
          label={t('auth.email')}
          placeholder="aissatou.diallo@email.fr"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <View>
          <FormInput
            control={control}
            name="password"
            label={t('auth.password')}
            password
            autoComplete="current-password"
            textContentType="password"
          />
          <TextLink className="self-end" onPress={() => router.push('/mot-de-passe-oublie')}>
            {t('auth.forgotPasswordLink')}
          </TextLink>
        </View>
        <Button fullWidth loading={signIn.isPending} onPress={() => void onSubmit()}>
          {t('auth.signIn')}
        </Button>
      </View>
      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-border" />
        <Text size="sm" tone="muted">
          {t('auth.or')}
        </Text>
        <View className="h-px flex-1 bg-border" />
      </View>
      <SocialButtons />
      <View className="items-center">
        <View className="flex-row flex-wrap items-center justify-center gap-x-1">
          <Text size="sm" tone="muted">
            {t('auth.noAccount')}
          </Text>
          <TextLink onPress={() => router.replace('/inscription')}>{t('auth.signUp')}</TextLink>
        </View>
        <TextLink onPress={() => router.push('/comptes-demo')}>{t('auth.tryDemo')}</TextLink>
      </View>
    </AuthScreen>
  );
}
