import { FileText, MessageCircle, Search, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Heading, Text } from '@/components/ui';
import { useThemeColors } from '@/theme/useTheme';

const STEPS: { key: 'search' | 'quote' | 'choose'; icon: LucideIcon }[] = [
  { key: 'search', icon: Search },
  { key: 'quote', icon: FileText },
  { key: 'choose', icon: MessageCircle },
];

/**
 * « Comment ça marche » en trois étapes, en bas de l'état initial : rappelle que Wenzee fonctionne
 * par devis (gratuit et sans engagement), pas par réservation directe.
 */
export function HowItWorks() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  return (
    <View className="mx-5 mt-10 rounded-3xl bg-secondary p-5" testID="how-it-works">
      <Heading level={3}>{t('home.howItWorks.title')}</Heading>
      <View className="mt-4 gap-4">
        {STEPS.map(({ key, icon: Icon }, index) => (
          <View key={key} className="flex-row gap-3.5">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-background">
              <Icon size={20} color={colors.primary} strokeWidth={2} />
            </View>
            <View className="shrink">
              <Text weight="bold">
                {index + 1}. {t(`home.howItWorks.${key}Title`)}
              </Text>
              <Text size="sm" tone="muted">
                {t(`home.howItWorks.${key}Text`)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
