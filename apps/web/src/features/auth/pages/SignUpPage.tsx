import {
  ApiError,
  DEMO_OTP_CODE,
  otpFormSchema,
  signUpFormSchema,
  useResendOtp,
  useSignUp,
  useVerifyOtp,
  type OtpFormValues,
  type SignUpFormValues,
} from '@afro/common';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Loader2, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { usePageMeta } from '@/hooks/usePageMeta';
import { AuthHeading, FormAlert } from '../components/AuthHeading';
import { AuthInput, PasswordInput } from '../components/AuthInput';
import { PasswordRules } from '../components/PasswordRules';
import { useAuthLink, useCompleteSignIn } from '../lib/useCompleteSignIn';

const LABEL = 'text-base font-semibold';
const SUBMIT = 'mt-2 h-14 w-full rounded-full text-lg font-semibold';

/**
 * Inscription (nouvelle page, même authentification simulée que la connexion) :
 * 1. prénom, email, mot de passe, conditions → `useSignUp` « envoie » un code ;
 * 2. le code à 6 chiffres (toujours `123456` en démo) → `useVerifyOtp` crée le compte et ouvre la session.
 * Puis, comme à la connexion : la page demandée (`?retour=`) ou l'espace client.
 */
export function SignUpPage() {
  usePageMeta('Créer un compte');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  return pendingEmail ? (
    <VerifyCodeStep email={pendingEmail} onChangeEmail={() => setPendingEmail(null)} />
  ) : (
    <SignUpStep onCodeSent={setPendingEmail} />
  );
}

function SignUpStep({ onCodeSent }: { onCodeSent(email: string): void }) {
  const signUp = useSignUp();
  const authLink = useAuthLink();
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: { firstName: '', email: '', password: '', acceptTerms: false },
  });
  const password = useWatch({ control: form.control, name: 'password' });

  const onSubmit = form.handleSubmit((values) =>
    signUp.mutate(
      { ...values, acceptTerms: true },
      {
        onSuccess: ({ email }) => onCodeSent(email),
        onError: (error) => {
          // Email déjà pris : le message va sous le champ concerné.
          if (error instanceof ApiError && error.code === 'email_taken') {
            form.setError('email', { message: error.message });
          }
        },
      },
    ),
  );
  const serverError =
    signUp.isError && !(signUp.error instanceof ApiError && signUp.error.code === 'email_taken');

  return (
    <>
      <AuthHeading title="Créer un compte">
        Gratuit, en moins d’une minute. Trouvez ensuite les talents de vos événements.
      </AuthHeading>

      {serverError && (
        <FormAlert>
          {signUp.error instanceof ApiError
            ? signUp.error.message
            : 'L’inscription a échoué. Réessaie dans un instant.'}
        </FormAlert>
      )}

      <Form {...form}>
        <form
          onSubmit={onSubmit}
          noValidate
          aria-label="Créer un compte"
          className="flex w-full flex-col gap-6"
        >
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem className="gap-2.5">
                <FormLabel className={LABEL}>Prénom</FormLabel>
                <FormControl>
                  <AuthInput
                    icon={UserRound}
                    autoComplete="given-name"
                    placeholder="Votre prénom"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="gap-2.5">
                <FormLabel className={LABEL}>Adresse e-mail</FormLabel>
                <FormControl>
                  <AuthInput
                    icon={Mail}
                    type="email"
                    autoComplete="email"
                    placeholder="votre@email.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="gap-2.5">
                <FormLabel className={LABEL}>Mot de passe</FormLabel>
                <FormControl>
                  <PasswordInput
                    icon={LockKeyhole}
                    autoComplete="new-password"
                    placeholder="Choisissez un mot de passe"
                    {...field}
                  />
                </FormControl>
                <PasswordRules value={password} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="acceptTerms"
            render={({ field }) => (
              <FormItem className="gap-2">
                <div className="flex items-start gap-3">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      className="mt-0.5 size-5 shrink-0 accent-primary"
                    />
                  </FormControl>
                  <FormLabel className="block text-[15px] leading-snug font-normal">
                    J’accepte les{' '}
                    <Link
                      to="/cgu"
                      target="_blank"
                      className="font-semibold text-primary underline"
                    >
                      conditions d’utilisation
                    </Link>{' '}
                    et la{' '}
                    <Link
                      to="/confidentialite"
                      target="_blank"
                      className="font-semibold text-primary underline"
                    >
                      politique de confidentialité
                    </Link>
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" disabled={signUp.isPending} className={SUBMIT}>
            {signUp.isPending ? (
              <>
                <Loader2 className="animate-spin" aria-hidden /> Création…
              </>
            ) : (
              'Créer mon compte'
            )}
          </Button>
        </form>
      </Form>

      <p className="text-center text-[17px]">
        Déjà un compte ?{' '}
        <Link
          to={authLink('/connexion')}
          className="rounded-sm font-semibold text-primary underline underline-offset-4 outline-none hover:text-primary-hover focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          Se connecter
        </Link>
      </p>
    </>
  );
}

function VerifyCodeStep({ email, onChangeEmail }: { email: string; onChangeEmail(): void }) {
  const verify = useVerifyOtp();
  const resend = useResendOtp();
  const completeSignIn = useCompleteSignIn();
  const form = useForm<OtpFormValues>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: { code: '' },
  });

  const onSubmit = form.handleSubmit(({ code }) =>
    verify.mutate(
      { email, code, purpose: 'sign-up' },
      { onSuccess: (session) => session && completeSignIn(session) },
    ),
  );

  return (
    <>
      <AuthHeading title="Vérifiez votre e-mail">
        Nous avons envoyé un code à 6 chiffres à{' '}
        <span className="font-semibold text-foreground">{email}</span>.
      </AuthHeading>
      <p className="w-full rounded-xl bg-secondary/60 p-4 text-center text-[15px]">
        Version de démonstration : aucun e-mail n’est envoyé, le code est{' '}
        <span className="font-semibold">{DEMO_OTP_CODE}</span>.
      </p>

      {verify.isError && (
        <FormAlert>
          {verify.error instanceof ApiError
            ? verify.error.message
            : 'La vérification a échoué. Réessaie dans un instant.'}
        </FormAlert>
      )}
      {resend.isSuccess && (
        <p role="status" className="text-success">
          Nouveau code envoyé.
        </p>
      )}

      <Form {...form}>
        <form
          onSubmit={onSubmit}
          noValidate
          aria-label="Vérifier le code"
          className="flex w-full flex-col gap-6"
        >
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem className="gap-2.5">
                <FormLabel className={LABEL}>Code à 6 chiffres</FormLabel>
                <FormControl>
                  <AuthInput
                    icon={KeyRound}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    className="tracking-[0.3em]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" disabled={verify.isPending} className={SUBMIT}>
            {verify.isPending ? (
              <>
                <Loader2 className="animate-spin" aria-hidden /> Vérification…
              </>
            ) : (
              'Confirmer'
            )}
          </Button>
        </form>
      </Form>

      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[15px]">
        <button
          type="button"
          onClick={() => resend.mutate({ email, purpose: 'sign-up' })}
          disabled={resend.isPending}
          className="rounded-sm font-semibold text-primary underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          Renvoyer le code
        </button>
        <button
          type="button"
          onClick={onChangeEmail}
          className="rounded-sm font-semibold text-primary underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          Modifier l’e-mail
        </button>
      </div>
    </>
  );
}
