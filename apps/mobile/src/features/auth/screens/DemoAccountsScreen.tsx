import { useDemoAccounts, useSignInAsDemo, type DemoAccount } from '@afro/common';
import { Briefcase, Shield, UserRound } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { WenzeeLoader } from '@/components/brand/WenzeeLoader';
import { Badge, Card, Text } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { AuthScreen } from '../components/AuthScreen';
import { FormAlert } from '../components/FormAlert';
import { useFinishAuth } from '../useFinishAuth';
import { useThemeColors } from '@/theme/useTheme';

function iconFor(account: DemoAccount) {
  if (account.roles.includes('admin')) return Shield;
  if (account.roles.includes('provider')) return Briefcase;
  return UserRound;
}

/** Comptes de démo (P8), comme sur le site : on choisit un compte et on est connecté. */
export function DemoAccountsScreen() {
  const { t } = useTranslation();
  const { apiError } = useErrorText();
  const colors = useThemeColors();
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
    <AuthScreen title={t('auth.demoTitle')} subtitle={t('auth.demoSubtitle')}>
      <FormAlert message={signInAsDemo.isError ? apiError(signInAsDemo.error) : null} />
      {accounts.isPending ? <WenzeeLoader size={64} className="py-6" /> : null}
      {accounts.isError ? <FormAlert message={t('auth.demoLoadError')} /> : null}
      <View className="gap-3">
        {accounts.data?.map((account) => {
          const Icon = iconFor(account);
          return (
            <Pressable
              key={account.userId}
              accessibilityRole="button"
              accessibilityLabel={t('auth.demoSignInAs', { label: account.label })}
              disabled={signInAsDemo.isPending}
              onPress={() => choose(account)}
              className="active:opacity-80"
            >
              <Card className="flex-row gap-3 p-4">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Icon size={20} color={colors.primary} />
                </View>
                <View className="flex-1 gap-1">
                  <Text weight="bold">{account.label}</Text>
                  <Text size="sm" tone="muted">
                    {account.description}
                  </Text>
                  <View className="mt-1 flex-row flex-wrap gap-1">
                    {account.roles.map((role) => (
                      <Badge key={role}>{t(`auth.roles.${role}`)}</Badge>
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
