import { ApiError, useDemoAccounts, useSignInAsDemo, type DemoAccount } from '@afro/common';
import { useQueryClient } from '@tanstack/react-query';
import { Briefcase, Shield, UserRound } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { safeRedirect } from '@/lib/safeRedirect';
import { defaultSpaceFor, SPACE_HOME, useSessionStore } from '@/stores/session';

const ROLE_LABELS = { client: 'Client', provider: 'Prestataire', admin: 'Admin' } as const;

function iconFor(account: DemoAccount) {
  if (account.roles.includes('admin')) return Shield;
  if (account.roles.includes('provider')) return Briefcase;
  return UserRound;
}

/**
 * Connexion de démo (P8) : on choisit un compte en un clic.
 * Après la connexion, on revient à la page demandée (`?retour=`) ou, à défaut,
 * à l'accueil de l'espace du compte. La vraie connexion arrivera au lot 10.
 */
export function LoginPage() {
  const accounts = useDemoAccounts();
  const signInMutation = useSignInAsDemo();
  const signIn = useSessionStore((state) => state.signIn);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  function handleChoose(account: DemoAccount) {
    signInMutation.mutate(account.userId, {
      onSuccess: (session) => {
        // Les données en cache appartenaient peut-être à un autre compte.
        queryClient.clear();
        signIn(session);
        const fallback = SPACE_HOME[defaultSpaceFor(session.user.roles)];
        navigate(safeRedirect(searchParams.get('retour'), fallback), { replace: true });
      },
    });
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 md:py-20">
      <h1 className="font-display text-3xl font-semibold md:text-4xl">Connexion</h1>
      <p className="mt-2 text-muted-foreground">
        Version de démonstration : choisis un compte pour découvrir chaque espace. Aucun mot de
        passe n’est nécessaire.
      </p>

      {signInMutation.isError && (
        <p role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-destructive">
          {signInMutation.error instanceof ApiError
            ? signInMutation.error.message
            : 'La connexion a échoué. Réessaie dans un instant.'}
        </p>
      )}

      {accounts.isPending && (
        <div className="mt-8 grid gap-4 md:grid-cols-3" aria-label="Chargement">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-44 rounded-xl" />
          ))}
        </div>
      )}

      {accounts.isError && (
        <p role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-destructive">
          Impossible de charger les comptes de démo.
        </p>
      )}

      {accounts.isSuccess && (
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {accounts.data.map((account, index) => {
            const Icon = iconFor(account);
            return (
              <motion.li
                key={account.userId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
              >
                <button
                  type="button"
                  onClick={() => handleChoose(account)}
                  disabled={signInMutation.isPending}
                  className="h-full w-full rounded-xl text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60"
                  aria-label={`Se connecter : ${account.label}`}
                >
                  <Card className="h-full py-5 transition-shadow hover:shadow-md">
                    <CardHeader className="gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <CardTitle>{account.label}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <p className="text-sm text-muted-foreground">{account.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {account.roles.map((role) => (
                          <Badge key={role} variant="outline">
                            {ROLE_LABELS[role]}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </button>
              </motion.li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
