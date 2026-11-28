import { useRouter, type Href } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heading, Text } from '@/components/ui';
import { useThemeColors } from '@/theme/useTheme';

/**
 * Le haut d'un écran du planificateur (maquette) : une flèche retour et le titre de l'écran.
 * Pas de header global ni de logo. Sans écran précédent (lien direct), « retour » ouvre `fallback`.
 */
export function EventHeader({
  title,
  subtitle,
  fallback = '/evenements',
}: {
  title: string;
  subtitle?: string;
  fallback?: Href;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  return (
    <View className="gap-1 px-5 pb-2 pt-2">
      <View className="flex-row items-center gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback))}
          hitSlop={8}
          className="-ml-2 min-h-touch min-w-touch items-center justify-center rounded-full active:bg-muted"
        >
          <ArrowLeft size={24} color={colors.foreground} />
        </Pressable>
        <Heading level={2} className="flex-1" numberOfLines={1}>
          {title}
        </Heading>
      </View>
      {subtitle ? (
        <Text size="sm" tone="muted">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Les actions collées en bas de l'écran, sous le pouce. Les écrans d'un événement s'ouvrent
 * par-dessus les onglets : pas de barre d'onglets ici, seulement la zone sûre du téléphone.
 */
export function EventBottomBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-row items-center gap-3 border-t border-border bg-background px-5 pt-3"
      style={{ paddingBottom: Math.max(insets.bottom, 12) + 4 }}
    >
      {children}
    </View>
  );
}
