import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/ui';
import { useSessionStore } from '@/stores/session';
import { SignInRequired } from '../auth/SignInRequired';

/** La garde du mode pro : il faut être connecté, et prestataire (comme RequireRole sur le site). */
export function ProOnly({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useTranslation();
  const isProvider = useSessionStore((s) => s.user?.roles.includes('provider') ?? false);
  return (
    <SignInRequired title={title} reason={t('pro.signIn')}>
      {isProvider ? (
        children
      ) : (
        <SafeAreaView className="flex-1 bg-background">
          <EmptyState className="flex-1" title={t('pro.notProvider')} />
        </SafeAreaView>
      )}
    </SignInRequired>
  );
}
