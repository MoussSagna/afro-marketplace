import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heading } from '@/components/ui';
import { useThemeColors } from '@/theme/useTheme';

type BottomSheetProps = {
  visible: boolean;
  onClose(): void;
  title: string;
  /** Le texte du bouton de fermeture (lu par VoiceOver). */
  closeLabel: string;
  /** Ce qui reste collé en bas du panneau (le bouton principal). */
  footer?: ReactNode;
  children: ReactNode;
};

/**
 * Un panneau qui monte du bas de l'écran, par-dessus un fond assombri (maquette C3).
 * On le ferme en touchant le fond, la croix, ou le bouton « retour » d'Android.
 * Le contenu n'est monté que pendant l'ouverture : il repart à neuf à chaque fois.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  closeLabel,
  footer,
  children,
}: BottomSheetProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {visible ? (
        <KeyboardAvoidingView
          className="flex-1 justify-end"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            className="absolute inset-0 bg-black/40"
            accessibilityLabel={closeLabel}
            onPress={onClose}
          />
          <View
            className="max-h-[88%] rounded-t-3xl bg-background"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <View className="items-center pt-2.5">
              <View className="h-1 w-10 rounded-full bg-border" />
            </View>
            <View className="flex-row items-center justify-between px-5 pb-1 pt-2">
              <Heading level={2}>{title}</Heading>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={closeLabel}
                onPress={onClose}
                className="h-10 w-10 items-center justify-center"
              >
                <X size={20} color={colors.foreground} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerClassName="gap-4 px-5 pb-4"
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
            {footer ? <View className="px-5 pt-1">{footer}</View> : null}
          </View>
        </KeyboardAvoidingView>
      ) : null}
    </Modal>
  );
}
