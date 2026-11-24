import { useCreateReport } from '@afro/common';
import { Check, X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FullScreenModal } from '@/components/FullScreenModal';
import { Button, Input, Text } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { cn } from '@/lib/cn';
import { useThemeColors } from '@/theme/useTheme';

/** Les motifs proposés pour un profil (« Faux avis » sert aux avis, pas aux profils). */
const PROFILE_REPORT_REASONS = ['fraud', 'inappropriate', 'spam', 'other'] as const;
type Reason = (typeof PROFILE_REPORT_REASONS)[number];

type ReportSheetProps = {
  visible: boolean;
  providerId: string;
  onClose(): void;
  /** Appelé quand le signalement est bien parti. */
  onSent(): void;
};

/**
 * « Signaler ce profil » (P5) : un motif, des détails si on veut, puis « Envoyer ».
 * Le signalement arrive chez l'admin (A3, sur le site).
 */
export function ReportSheet({ visible, onClose, ...props }: ReportSheetProps) {
  return (
    <FullScreenModal visible={visible} onClose={onClose}>
      <ReportBody onClose={onClose} {...props} />
    </FullScreenModal>
  );
}

function ReportBody({ providerId, onClose, onSent }: Omit<ReportSheetProps, 'visible'>) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { apiError } = useErrorText();
  const report = useCreateReport();
  const [reason, setReason] = useState<Reason | null>(null);
  const [details, setDetails] = useState('');

  const send = () => {
    if (!reason) return;
    report.mutate(
      {
        targetType: 'provider',
        targetId: providerId,
        reason,
        details: details.trim() || undefined,
      },
      { onSuccess: onSent },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="h-14 flex-row items-center justify-center border-b border-border">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('search.close')}
          onPress={onClose}
          className="absolute left-4 h-10 w-10 items-center justify-center"
        >
          <X size={20} color={colors.foreground} />
        </Pressable>
        <Text weight="bold">{t('profile.reportTitle')}</Text>
      </View>
      <ScrollView contentContainerClassName="gap-4 p-5" keyboardShouldPersistTaps="handled">
        <Text size="sm" tone="muted">
          {t('profile.reportHint')}
        </Text>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={t('profile.reportReason')}
          className="gap-2"
        >
          {PROFILE_REPORT_REASONS.map((value) => {
            const on = reason === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => setReason(value)}
                className={cn(
                  'flex-row items-center justify-between rounded-2xl border px-4 py-3.5',
                  on ? 'border-primary bg-secondary' : 'border-border bg-card',
                )}
              >
                <Text size="sm" weight={on ? 'bold' : 'medium'}>
                  {t(`profile.reportReasons.${value}`)}
                </Text>
                {on ? <Check size={18} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
        <Input
          label={t('profile.reportDetails')}
          value={details}
          onChangeText={setDetails}
          multiline
          maxLength={1000}
        />
        {report.isError ? (
          <Text size="sm" tone="destructive" accessibilityRole="alert">
            {apiError(report.error)}
          </Text>
        ) : null}
      </ScrollView>
      <View className="border-t border-border bg-card px-5 pb-2 pt-3.5">
        <Button fullWidth disabled={!reason} loading={report.isPending} onPress={send}>
          {t('profile.reportSend')}
        </Button>
      </View>
    </SafeAreaView>
  );
}
