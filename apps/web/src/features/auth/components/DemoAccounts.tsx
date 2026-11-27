import { ApiError, useDemoAccounts, useSignInAsDemo } from '@afro/common';
import { Briefcase, Shield, UserRound } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompleteSignIn } from '../lib/useCompleteSignIn';

/** Le mot de passe de tous les comptes de démo (voir `agents/donnees-demo.md`). */
const DEMO_PASSWORD_HINT = 'Wenzee2026';

/**
 * Version de démonstration : les 3 comptes de démo, en un clic, sans mot de passe
 * (la connexion de démo d'avant la refonte, gardée sous le formulaire).
 */
export function DemoAccounts() {
  const accounts = useDemoAccounts();
  const signInMutation = useSignInAsDemo();
  const completeSignIn = useCompleteSignIn();

  return (
    <section
      aria-labelledby="demo-title"
      className="flex w-full flex-col gap-3 rounded-2xl border border-dashed bg-secondary/40 p-4 sm:p-5"
    >
      <div>
        <h2 id="demo-title" className="font-sans text-[15px] font-semibold">
          Version de démonstration
        </h2>
        <p className="text-sm text-muted-foreground">
          Choisissez un compte pour découvrir chaque espace, ou connectez-vous avec son e-mail et le
          mot de passe <span className="font-semibold text-foreground">{DEMO_PASSWORD_HINT}</span>.
        </p>
      </div>

      {signInMutation.isError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-destructive">
          {signInMutation.error instanceof ApiError
            ? signInMutation.error.message
            : 'La connexion a échoué. Réessaie dans un instant.'}
        </p>
      )}
      {accounts.isPending && (
        <div className="flex flex-wrap gap-2" role="status" aria-label="Chargement">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-36 rounded-full" />
          ))}
        </div>
      )}
      {accounts.isError && (
        <p role="alert" className="text-sm text-destructive">
          Impossible de charger les comptes de démo.
        </p>
      )}
      {accounts.isSuccess && (
        <ul className="flex flex-wrap gap-2">
          {accounts.data.map((account) => {
            const Icon = account.roles.includes('admin')
              ? Shield
              : account.roles.includes('provider')
                ? Briefcase
                : UserRound;
            return (
              <li key={account.userId}>
                <button
                  type="button"
                  onClick={() =>
                    signInMutation.mutate(account.userId, { onSuccess: completeSignIn })
                  }
                  disabled={signInMutation.isPending}
                  title={account.description}
                  aria-label={`Se connecter : ${account.label}`}
                  className="inline-flex h-10 items-center gap-2 rounded-full border bg-card px-4 text-sm font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-60"
                >
                  <Icon className="size-4 text-primary" aria-hidden />
                  {account.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
