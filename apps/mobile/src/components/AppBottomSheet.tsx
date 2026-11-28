import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { ChevronLeft, X } from 'lucide-react-native';
import { forwardRef, useCallback, useImperativeHandle, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { useThemeColors } from '@/theme/useTheme';

export type AppBottomSheetRef = {
  /** Ouvre le panneau. */
  present(): void;
  /** Ferme le panneau (comme la croix ou un glissement vers le bas). */
  dismiss(): void;
};

type AppBottomSheetProps = {
  /** Le titre, au centre de l'en-tête (lu comme un titre par VoiceOver). */
  title: string;
  /** Le contenu, qui défile. */
  children: ReactNode;
  /** Ce qui reste collé en bas, même quand le contenu défile (le bouton principal). */
  footer?: ReactNode;
  /** À droite de l'en-tête (ex. « Réinitialiser »). */
  headerRight?: ReactNode;
  /**
   * Un sous-écran est ouvert : la flèche « retour » remplace la croix et appelle `onBack`
   * (on reste dans le même panneau, sans modale de plus).
   */
  onBack?(): void;
  /** Lu par VoiceOver sur la croix (par défaut « Fermer ») et sur la flèche (par défaut « Retour »). */
  closeLabel?: string;
  backLabel?: string;
  /** Après la fermeture, quelle qu'en soit la cause (croix, glissement, fond, bouton « retour »). */
  onDismiss?(): void;
  /** Hauteurs d'arrêt (par défaut, 92 % de l'écran). */
  snapPoints?: (string | number)[];
  testID?: string;
};

/**
 * Le panneau du bas réutilisable de l'app, construit sur @gorhom/bottom-sheet (`BottomSheetModal`) :
 * fond assombri (on ferme en le touchant), poignée, grands coins arrondis, fermeture par glissement,
 * en-tête (croix ou retour, titre, action à droite), contenu qui défile (`BottomSheetScrollView`)
 * et pied fixe (`BottomSheetFooter`), clavier et zones sûres pris en charge.
 * Ouverture par une ref : `sheet.current?.present()`. Exige `BottomSheetModalProvider` (app/_layout.tsx).
 * Exemple : le panneau des filtres de la recherche (features/search/SearchFiltersSheet.tsx).
 */
export const AppBottomSheet = forwardRef<AppBottomSheetRef, AppBottomSheetProps>(
  function AppBottomSheet(
    {
      title,
      children,
      footer,
      headerRight,
      onBack,
      closeLabel,
      backLabel,
      onDismiss,
      snapPoints = ['92%'],
      testID,
    },
    ref,
  ) {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    const modal = useRef<BottomSheetModal>(null);

    useImperativeHandle(ref, () => ({
      present: () => modal.current?.present(),
      dismiss: () => modal.current?.dismiss(),
    }));

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.45}
          pressBehavior="close"
        />
      ),
      [],
    );

    const renderFooter = useCallback(
      (props: BottomSheetFooterProps) => (
        <BottomSheetFooter {...props} bottomInset={0}>
          <View
            className="border-t border-border bg-background px-5 pt-3"
            style={{ paddingBottom: Math.max(insets.bottom, 12) + 4 }}
          >
            {footer}
          </View>
        </BottomSheetFooter>
      ),
      [footer, insets.bottom],
    );

    return (
      <BottomSheetModal
        ref={modal}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
        footerComponent={footer ? renderFooter : undefined}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        onDismiss={onDismiss}
        handleIndicatorStyle={{ backgroundColor: colors.border, width: 44, height: 5 }}
        backgroundStyle={{
          backgroundColor: colors.background,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
        accessibilityLabel={title}
      >
        <View className="h-14 flex-row items-center border-b border-border px-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              onBack ? (backLabel ?? t('common.back')) : (closeLabel ?? t('common.close'))
            }
            onPress={() => (onBack ? onBack() : modal.current?.dismiss())}
            hitSlop={8}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-muted"
          >
            {onBack ? (
              <ChevronLeft size={24} color={colors.foreground} />
            ) : (
              <X size={22} color={colors.foreground} />
            )}
          </Pressable>
          <Text weight="bold" className="flex-1 text-center text-[18px]" accessibilityRole="header">
            {title}
          </Text>
          {/* Même largeur à droite qu'à gauche : le titre reste centré. */}
          <View className="min-w-11 items-end">{headerRight}</View>
        </View>

        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: (footer ? 120 : 24) + insets.bottom }}
          testID={testID}
        >
          {children}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);
