import type { LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, View } from 'react-native';
import { Button, Heading, Text } from '@/components/ui';
import { useThemeColors } from '@/theme/useTheme';

type ConfirmModalProps = {
  visible: boolean;
  onCancel(): void;
  onConfirm(): void;
  icon: LucideIcon;
  /** « danger » : icône rouge (supprimer, retirer) ; « warning » : icône orangée. */
  tone?: 'danger' | 'warning';
  title: string;
  message: string;
  /** Une précision sous le message (avertissement), sur fond orangé. */
  note?: string;
  confirmLabel: string;
  pending?: boolean;
  error?: string | null;
};

/**
 * Une confirmation au centre de l'écran (maquette : « Retirer le prestataire ? », « Supprimer
 * l'événement ? »), comme `ConfirmDialog` du site. Le fond et le bouton « retour » d'Android annulent.
 */
export function ConfirmModal({
  visible,
  onCancel,
  onConfirm,
  icon: Icon,
  tone = 'danger',
  title,
  message,
  note,
  confirmLabel,
  pending,
  error,
}: ConfirmModalProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const color = tone === 'danger' ? colors.destructive : colors.warning;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      {visible ? (
        <View className="flex-1 items-center justify-center px-6">
          <Pressable
            className="absolute inset-0 bg-black/40"
            accessibilityLabel={t('common.cancel')}
            onPress={onCancel}
          />
          <View
            accessibilityViewIsModal
            className="w-full max-w-[360px] items-center gap-3 rounded-3xl bg-card px-6 pb-6 pt-7"
            style={{ boxShadow: '0 20px 50px rgba(43, 26, 18, 0.25)' }}
          >
            <View
              className={
                tone === 'danger'
                  ? 'h-16 w-16 items-center justify-center rounded-full bg-destructive/15'
                  : 'h-16 w-16 items-center justify-center rounded-full bg-warning-muted'
              }
            >
              <Icon size={30} color={color} strokeWidth={1.8} />
            </View>
            <Heading level={2} className="text-center">
              {title}
            </Heading>
            <Text tone="muted" className="text-center">
              {message}
            </Text>
            {note ? (
              <View className="w-full rounded-xl bg-warning-muted p-3">
                <Text size="sm" className="text-warning">
                  {note}
                </Text>
              </View>
            ) : null}
            {error ? (
              <Text size="sm" tone="destructive" accessibilityRole="alert">
                {error}
              </Text>
            ) : null}
            <View className="mt-2 w-full flex-row gap-3">
              <View className="flex-1">
                <Button variant="outline" size="md" fullWidth onPress={onCancel}>
                  {t('common.cancel')}
                </Button>
              </View>
              <View className="flex-1">
                <Button
                  variant="destructive"
                  size="md"
                  fullWidth
                  loading={pending}
                  onPress={onConfirm}
                >
                  {confirmLabel}
                </Button>
              </View>
            </View>
          </View>
        </View>
      ) : null}
    </Modal>
  );
}
