import { signUpInputSchema } from '@afro/common';
import { useSignUp } from '@afro/common';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';
import { Button, Text } from '@/components/ui';
import { errorCode, errorMessage } from '../authErrors';
import { AuthScreen } from '../components/AuthScreen';
import { Checkbox } from '../components/Checkbox';
import { FormAlert } from '../components/FormAlert';
import { FormInput } from '../components/FormInput';
import { StrengthMeter, PasswordRulesList } from '../components/PasswordChecks';
import { TextLink } from '../components/TextLink';

/** Le schéma partagé, avec une case à cocher qui commence décochée (false). */
const formSchema = signUpInputSchema.extend({
  acceptTerms: z.boolean().refine((v) => v, 'Accepte les conditions pour continuer'),
});
type FormValues = z.input<typeof formSchema>;

/** Inscription par email : prénom, email, mot de passe (jauge + règles en direct), conditions. */
export function SignUpScreen() {
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
            setError('email', { message: errorMessage(error) });
          }
        },
      },
    );
  });

  const formError =
    signUp.isError && errorCode(signUp.error) !== 'email_taken' ? errorMessage(signUp.error) : null;

  return (
    <AuthScreen title="Crée ton compte" subtitle="Gratuit, en moins d’une minute.">
      <View className="gap-4">
        <FormAlert message={formError} />
        <FormInput
          control={control}
          name="firstName"
          label="Prénom"
          placeholder="Aïssatou"
          autoComplete="given-name"
          textContentType="givenName"
        />
        <FormInput
          control={control}
          name="email"
          label="Email"
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
            label="Mot de passe"
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
              accessibilityLabel="J’accepte les conditions d’utilisation et la politique de confidentialité"
            >
              <Text size="sm">
                J’accepte les{' '}
                <Text size="sm" weight="semibold" tone="primary">
                  conditions d’utilisation
                </Text>{' '}
                et la{' '}
                <Text size="sm" weight="semibold" tone="primary">
                  politique de confidentialité
                </Text>
                .
              </Text>
            </Checkbox>
          )}
        />
      </View>
      <View className="gap-2">
        <Button fullWidth loading={signUp.isPending} onPress={() => void onSubmit()}>
          Créer mon compte
        </Button>
        <View className="flex-row flex-wrap items-center justify-center gap-x-1">
          <Text size="sm" tone="muted">
            Déjà inscrit ?
          </Text>
          <TextLink onPress={() => router.replace('/connexion')}>Se connecter</TextLink>
        </View>
      </View>
    </AuthScreen>
  );
}
