import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { ChevronLeft, X } from 'lucide-react-native';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler, Pressable, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { cn } from '@/lib/cn';
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
  /** Une phrase sous le titre, pour dire ce qu'on attend (ex. « Choisis l'événement… »). */
  subtitle?: string;
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
  /** Hauteurs d'arrêt (par défaut, 92 % de l'écran). Ignorées avec `fitContent`. */
  snapPoints?: (string | number)[];
  /**
   * Le panneau prend la hauteur de son contenu (jamais plus de 90 % de l'écran ; au-delà, il défile).
   * Pour les choix courts (une liste d'événements) : pas de grand vide sur un téléphone, rien de coupé sur un petit.
   */
  fitContent?: boolean;
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
      subtitle,
      children,
      footer,
      headerRight,
      onBack,
      closeLabel,
      backLabel,
      onDismiss,
      snapPoints = ['92%'],
      fitContent = false,
      testID,
    },
    ref,
  ) {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    const { height: screenHeight } = useWindowDimensions();
    const modal = useRef<BottomSheetModal>(null);
    const [open, setOpen] = useState(false);

    // Android : le bouton « retour » ferme d'abord le panneau (sans quitter l'écran en dessous),
    // comme le faisait l'ancien panneau (Modal). BottomSheetModal ne le fait pas tout seul.
    useEffect(() => {
      if (!open) return;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        modal.current?.dismiss();
        return true;
      });
      return () => subscription.remove();
    }, [open]);

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

    /**
     * La poignée ET l'en-tête (croix, titre, sous-titre) : gorhom les compte dans la hauteur du panneau
     * (avec `fitContent`, un en-tête posé à côté du contenu serait oublié : la fin de la liste passerait
     * sous le pied). Bonus : on peut attraper l'en-tête pour faire glisser le panneau.
     */
    const renderHandle = useCallback(
      () => (
        <View>
          <View className="items-center pb-1 pt-2.5">
            <View
              style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border }}
            />
          </View>
          <View
            className={cn('h-14 flex-row items-center px-3', !subtitle && 'border-b border-border')}
          >
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
            <Text
              weight="bold"
              className="flex-1 text-center text-[18px]"
              accessibilityRole="header"
            >
              {title}
            </Text>
            {/* Même largeur à droite qu'à gauche : le titre reste centré. */}
            <View className="min-w-11 items-end">{headerRight}</View>
          </View>
          {subtitle ? (
            // Le sous-titre fait partie de l'en-tête : la ligne de séparation passe en dessous.
            <Text size="sm" tone="muted" className="border-b border-border px-6 pb-3 text-center">
              {subtitle}
            </Text>
          ) : null}
        </View>
      ),
      [
        backLabel,
        closeLabel,
        colors.border,
        colors.foreground,
        headerRight,
        onBack,
        subtitle,
        t,
        title,
      ],
    );

    return (
      <BottomSheetModal
        ref={modal}
        snapPoints={fitContent ? undefined : snapPoints}
        enableDynamicSizing={fitContent}
        maxDynamicContentSize={fitContent ? Math.round(screenHeight * 0.9) : undefined}
        backdropComponent={renderBackdrop}
        footerComponent={footer ? renderFooter : undefined}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        onChange={(index) => setOpen(index >= 0)}
        onDismiss={() => {
          setOpen(false);
          onDismiss?.();
        }}
        handleComponent={renderHandle}
        backgroundStyle={{
          backgroundColor: colors.background,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
        accessibilityLabel={title}
      >
        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          // Juste la place du pied (bouton + marges + zone sûre), plus un peu d'air : pas de vide en trop.
          contentContainerStyle={{ paddingBottom: (footer ? 92 : 24) + insets.bottom }}
          testID={testID}
        >
          {children}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);
