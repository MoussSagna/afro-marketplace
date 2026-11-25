import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge, Button, EmptyState, Heading } from '@/components/ui';
import { useSwitchMode } from './useSwitchMode';

type ProSoonScreenProps = {
  title: string;
  lot: string;
  description: string;
  /** L'onglet Profil porte aussi le retour au mode client (Compte n'est pas dans la barre pro). */
  withSwitch?: boolean;
};

/** Un onglet pro encore vide : ce qu'il contiendra, et le lot qui le remplira. */
export function ProSoonScreen({ title, lot, description, withSwitch }: ProSoonScreenProps) {
  const { t } = useTranslation();
  const { toClient } = useSwitchMode();
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-5 pt-4">
        <Heading>{title}</Heading>
      </View>
      <EmptyState
        className="flex-1"
        title={t('pro.soonTitle')}
        description={description}
        action={
          <View className="items-center gap-4">
            <Badge variant="sun">{t('common.lot', { lot })}</Badge>
            {withSwitch ? (
              <Button variant="outline" onPress={toClient}>
                {t('pro.switchToClient')}
              </Button>
            ) : null}
          </View>
        }
      />
    </SafeAreaView>
  );
}
