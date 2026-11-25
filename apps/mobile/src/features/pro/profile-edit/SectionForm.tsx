import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';

/**
 * Le cadre d'un formulaire du profil (lot M15c) : les champs qui défilent, et en bas,
 * toujours visible, le bouton d'enregistrement (avec l'erreur du serveur s'il y en a une).
 */
export function SectionForm({
  children,
  onSubmit,
  saving,
  error,
  submitLabel,
}: {
  children: ReactNode;
  onSubmit(): void;
  saving: boolean;
  error?: unknown;
  submitLabel?: string;
}) {
  const { t } = useTranslation();
  const { apiError } = useErrorText();
  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerClassName="gap-5 px-5 pb-6 pt-1"
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      <View className="gap-2 border-t border-border bg-background px-5 pb-2 pt-3">
        {error ? (
          <Text size="sm" tone="destructive" accessibilityRole="alert">
            {apiError(error)}
          </Text>
        ) : null}
        <Button fullWidth loading={saving} onPress={onSubmit}>
          {submitLabel ?? t('proEdit.save')}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

/** Un groupe de pastilles avec son titre et son erreur (catégories, langues, type de prix…). */
export function ChipField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-2" accessibilityLabel={label}>
      <Text size="xs" weight="semibold">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
      {error ? (
        <Text size="caption" weight="medium" tone="destructive">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
