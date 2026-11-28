import { CircleAlert, CircleCheck, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { useToastStore } from '@/stores/toasts';
import { useThemeColors } from '@/theme/useTheme';
import { TAB_BAR_SPACE } from '@/features/navigation/GlassTabBar';

/**
 * Affiche le toast en cours, au-dessus de la barre d'onglets (maquette : « Événement supprimé »).
 * Monté une fois, à la racine (app/_layout.tsx). Annoncé aux lecteurs d'écran (région « polite »).
 */
export function Toaster() {
  const toast = useToastStore((s) => s.toasts[0]);
  const dismiss = useToastStore((s) => s.dismiss);
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { t } = useTranslation();
  if (!toast) return null;
  const Icon = toast.tone === 'info' ? CircleAlert : CircleCheck;
  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-4"
      style={{ bottom: insets.bottom + TAB_BAR_SPACE - 30 }}
    >
      <View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        testID="toast"
        className="flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
        style={{ boxShadow: '0 10px 30px rgba(43, 26, 18, 0.18)' }}
      >
        <View
          className={
            toast.tone === 'info'
              ? 'h-9 w-9 items-center justify-center rounded-full bg-warning-muted'
              : 'h-9 w-9 items-center justify-center rounded-full bg-success'
          }
        >
          <Icon size={20} color={toast.tone === 'info' ? colors.warning : '#FFFFFF'} />
        </View>
        <View className="flex-1">
          <Text weight="bold">{toast.title}</Text>
          {toast.description ? (
            <Text size="sm" tone="muted">
              {toast.description}
            </Text>
          ) : null}
        </View>
        {toast.action ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              toast.action?.onPress();
              dismiss(toast.id);
            }}
            hitSlop={8}
            className="min-h-touch justify-center px-1"
          >
            <Text weight="bold" tone="primary">
              {toast.action.label}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={() => dismiss(toast.id)}
          hitSlop={8}
          className="min-h-touch min-w-touch items-center justify-center"
        >
          <X size={18} color={colors['muted-foreground']} />
        </Pressable>
      </View>
    </View>
  );
}
