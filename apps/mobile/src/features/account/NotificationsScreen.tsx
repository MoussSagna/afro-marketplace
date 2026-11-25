import {
  accountDefaults,
  NOTIFICATION_CHANNEL_KEYS,
  NOTIFICATION_TOPIC_KEYS,
  type AccountFormValues,
  type User,
} from '@afro/common';
import { CheckCircle2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader, Button, Card, Text } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { useSessionStore } from '@/stores/session';
import { useThemeColors } from '@/theme/useTheme';
import { useSaveAccount } from './useSaveAccount';

/** Notifications (C8) : pour chaque sujet, par email, SMS ou notification. Rien n'est envoyé en démo. */
export function NotificationsScreen() {
  const { t } = useTranslation();
  const user = useSessionStore((s) => s.user);
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <BackHeader title={t('account.notificationsTitle')} />
      {user ? <NotificationsForm user={user} /> : null}
    </SafeAreaView>
  );
}

function NotificationsForm({ user }: { user: User }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { apiError } = useErrorText();
  const [form, setForm] = useState<AccountFormValues>(() => accountDefaults(user));
  const { save, saved, mutation } = useSaveAccount();

  const toggle = (
    topic: (typeof NOTIFICATION_TOPIC_KEYS)[number],
    channel: (typeof NOTIFICATION_CHANNEL_KEYS)[number],
    on: boolean,
  ) =>
    setForm((current) => ({
      ...current,
      notificationPrefs: {
        ...current.notificationPrefs,
        [topic]: { ...current.notificationPrefs[topic], [channel]: on },
      },
    }));

  return (
    <ScrollView contentContainerClassName="gap-4 px-5 pb-10 pt-2">
      <Text size="sm" tone="muted">
        {t('account.notificationsHint')}
      </Text>
      {NOTIFICATION_TOPIC_KEYS.map((topic) => (
        <Card key={topic} className="gap-1 px-4 py-3">
          <Text weight="bold">{t(`account.topics.${topic}`)}</Text>
          {NOTIFICATION_CHANNEL_KEYS.map((channel) => {
            const label = `${t(`account.topics.${topic}`)}, ${t(`account.channels.${channel}`)}`;
            return (
              <View key={channel} className="min-h-touch flex-row items-center justify-between">
                <Text size="sm">{t(`account.channels.${channel}`)}</Text>
                <Switch
                  accessibilityLabel={label}
                  value={form.notificationPrefs[topic][channel]}
                  onValueChange={(on) => toggle(topic, channel, on)}
                  trackColor={{ true: colors.primary, false: colors.input }}
                />
              </View>
            );
          })}
        </Card>
      ))}
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
    </ScrollView>
  );
}
