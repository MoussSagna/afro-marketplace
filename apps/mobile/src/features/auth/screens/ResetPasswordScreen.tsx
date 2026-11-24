import { passwordSchema, useResetPassword } from '@afro/common';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';
import { Button, Text } from '@/components/ui';
import { errorMessage } from '../authErrors';
import { AuthScreen } from '../components/AuthScreen';
import { FormAlert } from '../components/FormAlert';
import { FormInput } from '../components/FormInput';
import { PasswordRulesList, RuleLine } from '../components/PasswordChecks';
import { useFinishAuth } from '../useFinishAuth';

/** Le nouveau mot de passe, tapé deux fois. */
const formSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((values) => values.password === values.confirm, {
    path: ['confirm'],
    message: 'Les deux mots de passe ne sont pas identiques',
  });
type FormValues = z.infer<typeof formSchema>;

/** Nouveau mot de passe, après le code vérifié : règles cochées en direct, puis confirmation. */
export function ResetPasswordScreen() {
  const router = useRouter();
  const { email = '', code = '' } = useLocalSearchParams<{ email?: string; code?: string }>();
  const reset = useResetPassword();
  const { openSession } = useFinishAuth();
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: '', confirm: '' },
  });
  const [password, confirm] = useWatch({ control, name: ['password', 'confirm'] });

  const onSubmit = handleSubmit((values) => {
    reset.mutate(
      { email, code, password: values.password },
      {
        onSuccess: (session) => {
          openSession(session);
          router.replace({ pathname: '/compte-verifie', params: { reason: 'reset-password' } });
        },
      },
    );
  });

  return (
    <AuthScreen
      title="Nouveau mot de passe"
      subtitle={
        <Text tone="muted">
          <Text tone="success" weight="semibold">
            Code vérifié ✓{' '}
          </Text>
          Choisis un nouveau mot de passe pour <Text weight="semibold">{email}</Text>.
        </Text>
      }
    >
      <View className="gap-4">
        <FormAlert message={reset.isError ? errorMessage(reset.error) : null} />
        <View className="gap-2">
          <FormInput
            control={control}
            name="password"
            label="Nouveau mot de passe"
            password
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <PasswordRulesList value={password} />
        </View>
        <View className="gap-2">
          <FormInput
            control={control}
            name="confirm"
            label="Confirme le mot de passe"
            password
            autoComplete="new-password"
            textContentType="newPassword"
          />
          {confirm ? (
            <RuleLine ok={confirm === password} label="Les deux mots de passe sont identiques" />
          ) : null}
        </View>
      </View>
      <Button
        fullWidth
        loading={reset.isPending}
        onPress={() => void onSubmit()}
        className="mt-auto"
      >
        Enregistrer
      </Button>
    </AuthScreen>
  );
}
