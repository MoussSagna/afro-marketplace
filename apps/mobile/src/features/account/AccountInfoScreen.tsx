import { accountDefaults, useDeleteMe, type AccountFormValues, type User } from '@afro/common';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader, Button, Card, Input, Text } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { useSessionStore } from '@/stores/session';
import { useThemeColors } from '@/theme/useTheme';
import { useSaveAccount } from './useSaveAccount';

/**
 * Mes informations (C8) : prénom, nom, téléphone (l'email ne se change pas encore),
 * puis « Supprimer mon compte » avec confirmation (anonymisation, voir questions-ouvertes n° 7).
 */
export function AccountInfoScreen() {
  const { t } = useTranslation();
  const user = useSessionStore((s) => s.user);
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <BackHeader title={t('account.infoTitle')} />
      {user ? <InfoForm user={user} /> : null}
    </SafeAreaView>
  );
}

function InfoForm({ user }: { user: User }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { fieldError, apiError } = useErrorText();
  const [form, setForm] = useState<AccountFormValues>(() => accountDefaults(user));
  const { save, errors, saved, mutation } = useSaveAccount();
  const set = (key: 'firstName' | 'lastName' | 'phone', value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-10 pt-2"
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label={t('account.firstName')}
          value={form.firstName}
          onChangeText={(value) => set('firstName', value)}
          autoComplete="given-name"
          error={fieldError(errors.firstName)}
        />
        <Input
          label={t('account.lastName')}
          value={form.lastName}
          onChangeText={(value) => set('lastName', value)}
          autoComplete="family-name"
          error={fieldError(errors.lastName)}
        />
        <Input
          label={t('account.email')}
          value={user.email}
          editable={false}
          hint={t('account.emailHint')}
        />
        <Input
          label={t('account.phone')}
          value={form.phone}
          onChangeText={(value) => set('phone', value)}
          keyboardType="phone-pad"
          autoComplete="tel"
          hint={t('account.phoneHint')}
          error={fieldError(errors.phone)}
        />
        {mutation.isError ? (
          <Text size="sm" tone="destructive" accessibilityRole="alert">
            {apiError(mutation.error)}
          </Text>
        ) : null}
        {saved ? (
          <View
            accessibilityRole="alert"
            className="flex-row items-center gap-2 rounded-2xl bg-success-muted p-3"
          >
            <CheckCircle2 size={18} color={colors.success} />
            <Text size="sm" tone="success">
              {t('account.saved')}
            </Text>
          </View>
        ) : null}
        <Button fullWidth loading={mutation.isPending} onPress={() => save(form)}>
          {t('account.save')}
        </Button>
        <DeleteAccount />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function DeleteAccount() {
  const { t } = useTranslation();
  const router = useRouter();
  const { apiError } = useErrorText();
  const queryClient = useQueryClient();
  const signOut = useSessionStore((s) => s.signOut);
  const deleteMe = useDeleteMe();
  const [confirming, setConfirming] = useState(false);

  const confirm = () =>
    deleteMe.mutate(undefined, {
      onSuccess: () => {
        signOut();
        queryClient.clear();
        router.replace('/');
      },
    });

  if (!confirming) {
    return (
      <Button variant="ghost" fullWidth onPress={() => setConfirming(true)}>
        {t('account.deleteAccount')}
      </Button>
    );
  }
  return (
    <Card className="gap-3 p-4">
      <Text weight="bold">{t('account.deleteTitle')}</Text>
      <Text size="sm" tone="muted">
        {t('account.deleteHint')}
      </Text>
      {deleteMe.isError ? (
        <Text size="sm" tone="destructive" accessibilityRole="alert">
          {apiError(deleteMe.error)}
        </Text>
      ) : null}
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button variant="outline" size="md" fullWidth onPress={() => setConfirming(false)}>
            {t('account.deleteKeep')}
          </Button>
        </View>
        <View className="flex-1">
          <Button
            variant="destructive"
            size="md"
            fullWidth
            loading={deleteMe.isPending}
            onPress={confirm}
          >
            {t('account.deleteConfirm')}
          </Button>
        </View>
      </View>
    </Card>
  );
}
