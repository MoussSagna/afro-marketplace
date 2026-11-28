import {
  forwardRef,
  useImperativeHandle,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { ScrollView, TextInput, View } from 'react-native';

/**
 * Un faux @gorhom/bottom-sheet pour Jest (la vraie bibliothèque a besoin des gestes et de
 * Reanimated natifs). Branché dans jest.config.js (moduleNameMapper).
 * `present()` / `dismiss()` ouvrent et ferment VRAIMENT le panneau : on peut tester qu'il s'ouvre,
 * et qu'une fermeture sans validation ne change rien. Les animations et les gestes, eux, sautent.
 */
type ModalProps = {
  children?: ReactNode;
  footerComponent?: ComponentType<Record<string, unknown>>;
  onDismiss?(): void;
  accessibilityLabel?: string;
};

export const BottomSheetModal = forwardRef<unknown, ModalProps>(function BottomSheetModal(
  { children, footerComponent: Footer, onDismiss, accessibilityLabel },
  ref,
) {
  const [open, setOpen] = useState(false);
  useImperativeHandle(ref, () => ({
    present: () => setOpen(true),
    dismiss: () => {
      setOpen(false);
      onDismiss?.();
    },
    close: () => setOpen(false),
    expand: () => setOpen(true),
    snapToIndex: () => setOpen(true),
  }));
  if (!open) return null;
  return (
    <View testID="bottom-sheet-modal" accessibilityLabel={accessibilityLabel}>
      {children}
      {Footer ? <Footer animatedFooterPosition={{ value: 0 }} /> : null}
    </View>
  );
});

export function BottomSheetModalProvider({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function BottomSheetFooter({ children }: { children?: ReactNode }) {
  return <View>{children}</View>;
}

export const BottomSheetScrollView = ScrollView;
export const BottomSheetView = View;
export const BottomSheetTextInput = TextInput;
export function BottomSheetBackdrop() {
  return null;
}
export default BottomSheetModal;
