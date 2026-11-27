import {
  ApiError,
  DEMO_OTP_CODE,
  forgotPasswordFormSchema,
  resetPasswordFormSchema,
  useForgotPassword,
  useResetPassword,
  type ForgotPasswordFormValues,
  type ResetPasswordFormValues,
} from '@afro/common';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Loader2, LockKeyhole, Mail } from 'lucide-react';
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
const TEXT_LINK =
  'rounded-sm font-semibold text-primary underline underline-offset-4 outline-none hover:text-primary-hover focus-visible:ring-[3px] focus-visible:ring-ring';

/**
 * Mot de passe oublié (simulé, comme dans l'app mobile) :
 * 1. l'email → `useForgotPassword` (même réponse que le compte existe ou non) ;
 * 2. le code (toujours `123456` en démo) et le nouveau mot de passe → `useResetPassword`,
 *    qui ouvre la session. Puis, comme à la connexion : `?retour=` ou l'espace du compte.
 */
export function ForgotPasswordPage() {
  usePageMeta('Mot de passe oublié');
  const [email, setEmail] = useState<string | null>(null);
  return email ? (
    <ResetStep email={email} onChangeEmail={() => setEmail(null)} />
  ) : (
    <EmailStep onCodeSent={setEmail} />
  );
}

function EmailStep({ onCodeSent }: { onCodeSent(email: string): void }) {
  const forgot = useForgotPassword();
  const authLink = useAuthLink();
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: '' },
  });
  const onSubmit = form.handleSubmit(({ email }) =>
    forgot.mutate({ email }, { onSuccess: () => onCodeSent(email) }),
  );

  return (
    <>
      <AuthHeading title="Mot de passe oublié ?">
        Indiquez votre e-mail : nous vous envoyons un code pour en choisir un nouveau.
      </AuthHeading>
      {forgot.isError && (
        <FormAlert>
          {forgot.error instanceof ApiError
            ? forgot.error.message
            : 'L’envoi du code a échoué. Réessaie dans un instant.'}
        </FormAlert>
      )}
      <Form {...form}>
        <form
          onSubmit={onSubmit}
          noValidate
          aria-label="Recevoir un code"
          className="flex w-full flex-col gap-6"
        >
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
          <Button type="submit" size="lg" disabled={forgot.isPending} className={SUBMIT}>
            {forgot.isPending ? (
              <>
                <Loader2 className="animate-spin" aria-hidden /> Envoi…
              </>
            ) : (
              'Envoyer le code'
            )}
          </Button>
        </form>
      </Form>
      <Link to={authLink('/connexion')} className={`text-[17px] ${TEXT_LINK}`}>
        Retour à la connexion
      </Link>
    </>
  );
}

function ResetStep({ email, onChangeEmail }: { email: string; onChangeEmail(): void }) {
  const reset = useResetPassword();
  const completeSignIn = useCompleteSignIn();
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { code: '', password: '', confirmPassword: '' },
  });
  const password = useWatch({ control: form.control, name: 'password' });
  const onSubmit = form.handleSubmit(({ code, password: newPassword }) =>
    reset.mutate({ email, code, password: newPassword }, { onSuccess: completeSignIn }),
  );

  return (
    <>
      <AuthHeading title="Nouveau mot de passe">
        Si un compte existe, nous avons envoyé un code à 6 chiffres à{' '}
        <span className="font-semibold text-foreground">{email}</span>.
      </AuthHeading>
      <p className="w-full rounded-xl bg-secondary/60 p-4 text-center text-[15px]">
        Version de démonstration : aucun e-mail n’est envoyé, le code est{' '}
        <span className="font-semibold">{DEMO_OTP_CODE}</span>.
      </p>
      {reset.isError && (
        <FormAlert>
          {reset.error instanceof ApiError
            ? reset.error.message
            : 'Le changement a échoué. Réessaie dans un instant.'}
        </FormAlert>
      )}
      <Form {...form}>
        <form
          onSubmit={onSubmit}
          noValidate
          aria-label="Choisir un nouveau mot de passe"
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="gap-2.5">
                <FormLabel className={LABEL}>Nouveau mot de passe</FormLabel>
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
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="gap-2.5">
                <FormLabel className={LABEL}>Confirmez le mot de passe</FormLabel>
                <FormControl>
                  <PasswordInput
                    icon={LockKeyhole}
                    autoComplete="new-password"
                    placeholder="Le même mot de passe"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" disabled={reset.isPending} className={SUBMIT}>
            {reset.isPending ? (
              <>
                <Loader2 className="animate-spin" aria-hidden /> Enregistrement…
              </>
            ) : (
              'Enregistrer et me connecter'
            )}
          </Button>
        </form>
      </Form>
      <button type="button" onClick={onChangeEmail} className={`text-[15px] ${TEXT_LINK}`}>
        Modifier l’e-mail
      </button>
    </>
  );
}
