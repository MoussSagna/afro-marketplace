import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { Text } from './Text';
import { useThemeColors } from '@/theme/useTheme';

/** La barre du haut des écrans secondaires : bouton « Retour » et titre. */
export function BackHeader({ title }: { title: string }) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <View className="flex-row items-center gap-3 px-4 py-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        onPress={() => router.back()}
        className="min-h-touch min-w-touch items-center justify-center rounded-full border border-border bg-card"
      >
        <ChevronLeft size={22} color={colors.foreground} />
      </Pressable>
      <Text weight="bold">{title}</Text>
    </View>
  );
}
