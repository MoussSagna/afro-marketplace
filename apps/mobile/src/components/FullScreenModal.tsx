import type { ReactNode } from 'react';
import { Modal } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaFrame,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

type FullScreenModalProps = {
  visible: boolean;
  onClose(): void;
  animationType?: 'slide' | 'fade';
  children: ReactNode;
};

/**
 * Une fenêtre plein écran (Recherche, Filtres) qui respecte l'encoche et la barre du bas.
 * Pourquoi ce composant : une <Modal> s'ouvre dans une fenêtre native à part, hors du
 * SafeAreaProvider de l'app. Sans fournisseur à elle, le haut de l'écran passait sous
 * l'heure et l'encoche du téléphone. On lui en donne un, démarré avec les marges de l'app
 * (le téléphone les remesure ensuite).
 * Le contenu n'est monté que pendant l'ouverture : il repart à neuf à chaque fois.
 */
export function FullScreenModal({
  visible,
  onClose,
  animationType = 'slide',
  children,
}: FullScreenModalProps) {
  const frame = useSafeAreaFrame();
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      animationType={animationType}
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <SafeAreaProvider initialMetrics={{ frame, insets }}>
        {visible ? children : null}
      </SafeAreaProvider>
    </Modal>
  );
}
