import { useDemoAccounts, useSignInAsDemo, type DemoAccount } from '@afro/common';
import { Briefcase, Shield, UserRound } from 'lucide-react-native';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Badge, Card, Text } from '@/components/ui';
import { errorMessage } from '../authErrors';
import { AuthScreen } from '../components/AuthScreen';
import { FormAlert } from '../components/FormAlert';
import { useFinishAuth } from '../useFinishAuth';

const ROLE_LABELS = { client: 'Client', provider: 'Prestataire', admin: 'Admin' } as const;

function iconFor(account: DemoAccount) {
  if (account.roles.includes('admin')) return Shield;
  if (account.roles.includes('provider')) return Briefcase;
  return UserRound;
}

/** Comptes de démo (P8), comme sur le site : on choisit un compte et on est connecté. */
export function DemoAccountsScreen() {
  const accounts = useDemoAccounts();
  const signInAsDemo = useSignInAsDemo();
  const { openSession, leaveAuth } = useFinishAuth();

  function choose(account: DemoAccount) {
    signInAsDemo.mutate(account.userId, {
      onSuccess: (session) => {
        openSession(session);
        leaveAuth();
      },
    });
  }

  return (
    <AuthScreen
      title="Comptes de démo"
      subtitle="Choisis un compte pour découvrir l’app, sans mot de passe."
    >
      <FormAlert message={signInAsDemo.isError ? errorMessage(signInAsDemo.error) : null} />
      {accounts.isPending ? (
        <ActivityIndicator accessibilityLabel="Chargement" color="#7A1F0E" />
      ) : null}
      {accounts.isError ? <FormAlert message="Impossible de charger les comptes de démo." /> : null}
      <View className="gap-3">
        {accounts.data?.map((account) => {
          const Icon = iconFor(account);
          return (
            <Pressable
              key={account.userId}
              accessibilityRole="button"
              accessibilityLabel={`Se connecter : ${account.label}`}
              disabled={signInAsDemo.isPending}
              onPress={() => choose(account)}
              className="active:opacity-80"
            >
              <Card className="flex-row gap-3 p-4">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Icon size={20} color="#7A1F0E" />
                </View>
                <View className="flex-1 gap-1">
                  <Text weight="bold">{account.label}</Text>
                  <Text size="sm" tone="muted">
                    {account.description}
                  </Text>
                  <View className="mt-1 flex-row flex-wrap gap-1">
                    {account.roles.map((role) => (
                      <Badge key={role}>{ROLE_LABELS[role]}</Badge>
                    ))}
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </AuthScreen>
  );
}
