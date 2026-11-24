import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader, Heading, Text } from '@/components/ui';

type AuthScreenProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Affiche le bouton « Retour » en haut (oui par défaut). */
  back?: boolean;
  /** Au-dessus du titre (logo, icône…). */
  top?: ReactNode;
  children: ReactNode;
  testID?: string;
};

/**
 * Le gabarit commun des écrans de connexion (maquette section 2) :
 * bouton Retour, grand titre, sous-titre, puis le formulaire.
 * Le clavier ne cache jamais le champ en cours : on fait défiler (KeyboardAvoidingView).
 */
export function AuthScreen({
  title,
  subtitle,
  back = true,
  top,
  children,
  testID,
}: AuthScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']} testID={testID}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {back ? <BackHeader title="" /> : null}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="grow gap-6 px-6 pb-8 pt-4"
        >
          <View className="gap-2">
            {top}
            {title ? <Heading>{title}</Heading> : null}
            {subtitle ? (
              typeof subtitle === 'string' ? (
                <Text tone="muted">{subtitle}</Text>
              ) : (
                subtitle
              )
            ) : null}
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
