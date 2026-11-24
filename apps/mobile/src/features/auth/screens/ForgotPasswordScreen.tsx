import { forgotPasswordInputSchema, useForgotPassword } from '@afro/common';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import type { z } from 'zod';
import { Button } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { AuthScreen } from '../components/AuthScreen';
import { FormAlert } from '../components/FormAlert';
import { FormInput } from '../components/FormInput';
import { TextLink } from '../components/TextLink';

/**
 * Mot de passe oublié : on demande l'email et on envoie un code.
 * La réponse est la même que l'adresse soit inscrite ou non, pour ne pas révéler qui a un compte.
 */
export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { apiError } = useErrorText();
  const router = useRouter();
  const forgot = useForgotPassword();
  const { control, handleSubmit } = useForm<
    z.input<typeof forgotPasswordInputSchema>,
    unknown,
    z.output<typeof forgotPasswordInputSchema>
  >({
    resolver: zodResolver(forgotPasswordInputSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(({ email }) => {
    forgot.mutate(
      { email },
      {
        onSuccess: () =>
          router.push({ pathname: '/verification', params: { email, purpose: 'reset-password' } }),
      },
    );
  });

  return (
    <AuthScreen title={t('auth.forgotTitle')} subtitle={t('auth.forgotSubtitle')}>
      <View className="gap-4">
        <FormAlert message={forgot.isError ? apiError(forgot.error) : null} />
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
      </View>
      <View className="items-center gap-2">
        <Button fullWidth loading={forgot.isPending} onPress={() => void onSubmit()}>
          {t('auth.sendCode')}
        </Button>
        <TextLink onPress={() => router.back()}>{t('auth.backToSignIn')}</TextLink>
      </View>
    </AuthScreen>
  );
}
