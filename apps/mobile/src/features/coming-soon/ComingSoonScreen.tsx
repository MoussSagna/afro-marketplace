import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge, EmptyState, Heading } from '@/components/ui';

type ComingSoonScreenProps = {
  /** Le titre de l'onglet (« Recherche »). */
  title: string;
  /** Le lot qui remplira cet écran (« M7 »), voir agents/sprint-mobile.md. */
  lot: string;
  /** Ce que l'écran contiendra. */
  description: string;
};

/** Un onglet encore vide : « Bientôt disponible (lot M7) », comme on l'avait fait sur le site. Textes déjà traduits. */
export function ComingSoonScreen({ title, lot, description }: ComingSoonScreenProps) {
  const { t } = useTranslation();
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-5 pt-4">
        <Heading>{title}</Heading>
      </View>
      <EmptyState
        className="flex-1"
        title={t('common.comingSoon')}
        description={description}
        action={<Badge variant="sun">{t('common.lot', { lot })}</Badge>}
      />
    </SafeAreaView>
  );
}
