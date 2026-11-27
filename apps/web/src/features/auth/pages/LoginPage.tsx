import { ApiError, signInInputSchema, useSignIn, type SignInInput } from '@afro/common';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, LockKeyhole, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
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
import { AuthHeading, FormAlert, OrDivider } from '../components/AuthHeading';
import { AuthInput, PasswordInput } from '../components/AuthInput';
import { DemoAccounts } from '../components/DemoAccounts';
import { SocialButtons } from '../components/SocialButtons';
import { useAuthLink, useCompleteSignIn } from '../lib/useCompleteSignIn';

/**
 * Connexion (P8), dans le gabarit `AuthLayout` (photo à gauche, formulaire à droite).
 *
 * Tout reste **simulé** (faux serveur MSW, pas de fournisseur externe) :
 * - email + mot de passe → `useSignIn` (les comptes de démo ont le mot de passe `Wenzee2026`) ;
 * - Google / Apple → message « bientôt disponible » ;
 * - les comptes de démo en un clic, sous le formulaire.
 * Après la connexion : la page demandée (`?retour=`) ou l'accueil de l'espace du compte.
 */
export function LoginPage() {
  usePageMeta('Connexion');
  const signInMutation = useSignIn();
  const completeSignIn = useCompleteSignIn();
  const authLink = useAuthLink();
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInInputSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit((values) =>
    signInMutation.mutate(values, { onSuccess: completeSignIn }),
  );

  return (
    <>
      <AuthHeading title="Bon retour sur Wenzee">
        Connectez-vous à votre compte pour continuer.
      </AuthHeading>

      {signInMutation.isError && (
        <FormAlert>
          {signInMutation.error instanceof ApiError
            ? signInMutation.error.message
            : 'La connexion a échoué. Réessaie dans un instant.'}
        </FormAlert>
      )}

      <Form {...form}>
        <form
          onSubmit={onSubmit}
          noValidate
          aria-label="Se connecter avec un e-mail"
          className="flex w-full flex-col gap-6"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="gap-2.5">
                <FormLabel className="text-base font-semibold">Adresse e-mail</FormLabel>
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
                <FormLabel className="text-base font-semibold">Mot de passe</FormLabel>
                <FormControl>
                  <PasswordInput
                    icon={LockKeyhole}
                    autoComplete="current-password"
                    placeholder="Votre mot de passe"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Link
            to={authLink('/mot-de-passe-oublie')}
            className="-mt-2 self-end rounded-sm font-semibold text-primary outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            Mot de passe oublié ?
          </Link>
          <Button
            type="submit"
            size="lg"
            disabled={signInMutation.isPending}
            className="mt-2 h-14 w-full rounded-full text-lg font-semibold"
          >
            {signInMutation.isPending ? (
              <>
                <Loader2 className="animate-spin" aria-hidden /> Connexion…
              </>
            ) : (
              'Se connecter'
            )}
          </Button>
        </form>
      </Form>

      <OrDivider />
      <SocialButtons />

      <p className="text-center text-[17px]">
        Pas encore de compte ?{' '}
        <Link
          to={authLink('/inscription')}
          className="rounded-sm font-semibold text-primary underline underline-offset-4 outline-none hover:text-primary-hover focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          Créer un compte
        </Link>
      </p>

      <DemoAccounts />
    </>
  );
}
