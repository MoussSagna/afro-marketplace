import { DEMO_OTP_CODE, otpPurposeSchema, useResendOtp, useVerifyOtp } from '@afro/common';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { errorMessage } from '../authErrors';
import { AuthScreen } from '../components/AuthScreen';
import { CodeInput } from '../components/CodeInput';
import { TextLink } from '../components/TextLink';
import { useFinishAuth } from '../useFinishAuth';

/** Attente avant de pouvoir redemander un code, en secondes. */
export const RESEND_DELAY_S = 30;

function formatSeconds(seconds: number) {
  return `0:${String(seconds).padStart(2, '0')}`;
}

/** Un compte à rebours d'une seconde en une seconde, qui repart avec `restart()`. */
function useCountdown(from: number) {
  const [left, setLeft] = useState(from);
  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);
  return { left, restart: () => setLeft(from) };
}

/**
 * « Vérifie ton email » : le code à 6 chiffres (toujours 123456 en démo).
 * - Inscription : le code ouvre la session, puis « Compte vérifié ».
 * - Mot de passe oublié : le code mène au choix du nouveau mot de passe.
 */
export function VerifyCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; purpose?: string }>();
  const email = params.email ?? '';
  const purpose = otpPurposeSchema.catch('sign-up').parse(params.purpose);
  const verify = useVerifyOtp();
  const resend = useResendOtp();
  const { openSession } = useFinishAuth();
  const countdown = useCountdown(RESEND_DELAY_S);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string>();

  function submit(value: string) {
    if (value.length < 6) {
      setCodeError('Le code contient 6 chiffres');
      return;
    }
    if (verify.isPending) return;
    verify.mutate(
      { email, code: value, purpose },
      {
        onSuccess: (session) => {
          if (session) {
            openSession(session);
            router.replace({ pathname: '/compte-verifie', params: { reason: 'sign-up' } });
          } else {
            router.replace({ pathname: '/nouveau-mot-de-passe', params: { email, code: value } });
          }
        },
        onError: (error) => setCodeError(errorMessage(error)),
      },
    );
  }

  function onChange(value: string) {
    setCode(value);
    setCodeError(undefined);
    // Les 6 chiffres sont là : on vérifie tout de suite, sans attendre le bouton.
    if (value.length === 6) submit(value);
  }

  function onResend() {
    resend.mutate(
      { email, purpose },
      {
        onSuccess: () => {
          countdown.restart();
          setCode('');
          setCodeError(undefined);
        },
      },
    );
  }

  return (
    <AuthScreen
      title="Vérifie ton email"
      subtitle={
        <Text tone="muted">
          {purpose === 'sign-up'
            ? 'On a envoyé un code à 6 chiffres à '
            : 'Si un compte existe, on a envoyé un code à 6 chiffres à '}
          <Text weight="semibold">{email}</Text>
        </Text>
      }
    >
      <View className="gap-4">
        <CodeInput
          value={code}
          onChange={onChange}
          error={codeError}
          editable={!verify.isPending}
        />
        <View className="rounded-md bg-secondary/60 p-3">
          <Text size="sm">{`Version de démo : aucun email n’est envoyé, le code est ${DEMO_OTP_CODE}.`}</Text>
        </View>
        <View className="flex-row flex-wrap items-center gap-x-1">
          <Text size="sm" tone="muted">
            Code reçu par erreur ?
          </Text>
          <TextLink onPress={() => router.back()}>Modifier l’email</TextLink>
        </View>
        <View className="flex-row flex-wrap items-center gap-x-1">
          {countdown.left > 0 ? (
            <Text
              size="sm"
              tone="muted"
            >{`Pas reçu ? Renvoyer dans ${formatSeconds(countdown.left)}`}</Text>
          ) : (
            <>
              <Text size="sm" tone="muted">
                Pas reçu ?
              </Text>
              <TextLink onPress={onResend} disabled={resend.isPending}>
                Renvoyer le code
              </TextLink>
            </>
          )}
        </View>
        {resend.isSuccess && countdown.left > 0 ? (
          <Text size="sm" tone="success" accessibilityLiveRegion="polite">
            Nouveau code envoyé.
          </Text>
        ) : null}
      </View>
      <Button fullWidth loading={verify.isPending} onPress={() => submit(code)} className="mt-auto">
        Confirmer
      </Button>
    </AuthScreen>
  );
}
