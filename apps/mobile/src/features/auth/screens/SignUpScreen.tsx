import { authMessages, signUpInputSchema } from '@afro/common';
import { useSignUp } from '@afro/common';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { z } from 'zod';
import { Button, Text } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { errorCode } from '../authErrors';
import { AuthScreen } from '../components/AuthScreen';
import { Checkbox } from '../components/Checkbox';
import { FormAlert } from '../components/FormAlert';
import { FormInput } from '../components/FormInput';
import { StrengthMeter, PasswordRulesList } from '../components/PasswordChecks';
import { TextLink } from '../components/TextLink';

/** Le schéma partagé, avec une case à cocher qui commence décochée (false). */
const formSchema = signUpInputSchema.extend({
  acceptTerms: z.boolean().refine((v) => v, authMessages.acceptTerms),
});
type FormValues = z.input<typeof formSchema>;

/** Inscription par email : prénom, email, mot de passe (jauge + règles en direct), conditions. */
export function SignUpScreen() {
  const { t } = useTranslation();
  const { apiError } = useErrorText();
  const router = useRouter();
  const signUp = useSignUp();
  const { control, handleSubmit, setError } = useForm<
    FormValues,
    unknown,
    z.output<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
    defaultValues: { firstName: '', email: '', password: '', acceptTerms: false },
  });
  const password = useWatch({ control, name: 'password' });

  const onSubmit = handleSubmit((values) => {
    signUp.mutate(
      { ...values, acceptTerms: true },
      {
        onSuccess: ({ email }) =>
          router.push({ pathname: '/verification', params: { email, purpose: 'sign-up' } }),
        onError: (error) => {
          // Email déjà pris : on l'affiche sous le champ concerné.
          if (errorCode(error) === 'email_taken') {
            setError('email', { message: apiError(error) });
          }
        },
      },
    );
  });

  const formError =
    signUp.isError && errorCode(signUp.error) !== 'email_taken' ? apiError(signUp.error) : null;

  return (
    <AuthScreen title={t('auth.signUpTitle')} subtitle={t('auth.signUpSubtitle')}>
      <View className="gap-4">
        <FormAlert message={formError} />
        <FormInput
          control={control}
          name="firstName"
          label={t('auth.firstName')}
          placeholder="Aïssatou"
          autoComplete="given-name"
          textContentType="givenName"
        />
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
        <View className="gap-2">
          <FormInput
            control={control}
            name="password"
            label={t('auth.password')}
            password
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <StrengthMeter value={password} />
          <PasswordRulesList value={password} />
        </View>
        <Controller
          control={control}
          name="acceptTerms"
          render={({ field, fieldState }) => (
            <Checkbox
              checked={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
              accessibilityLabel={t('auth.acceptTermsLabel')}
            >
              <Text size="sm">
                {t('auth.acceptTermsStart')}
                <Text size="sm" weight="semibold" tone="primary">
                  {t('auth.termsOfUse')}
                </Text>
                {t('auth.and')}
                <Text size="sm" weight="semibold" tone="primary">
                  {t('auth.privacyPolicy')}
                </Text>
                .
              </Text>
            </Checkbox>
          )}
        />
      </View>
      <View className="gap-2">
        <Button fullWidth loading={signUp.isPending} onPress={() => void onSubmit()}>
          {t('auth.createAccount')}
        </Button>
        <View className="flex-row flex-wrap items-center justify-center gap-x-1">
          <Text size="sm" tone="muted">
            {t('auth.alreadySignedUp')}
          </Text>
          <TextLink onPress={() => router.replace('/connexion')}>{t('auth.signIn')}</TextLink>
        </View>
      </View>
    </AuthScreen>
  );
}
