import { declineQuoteRequestInputSchema, useDeclineQuoteRequest } from '@afro/common';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { Button, Chip, Input, Text } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';

const SUGGESTED = ['unavailable', 'notMyService', 'budget'] as const;

type DeclineRequestSheetProps = {
  requestId: string;
  visible: boolean;
  onClose(): void;
  onDeclined(): void;
};

/**
 * Décliner une demande (S3), dans un panneau du bas : trois motifs proposés à toucher,
 * ou un motif libre. Le client le lira dans la conversation (message automatique).
 */
export function DeclineRequestSheet({
  requestId,
  visible,
  onClose,
  onDeclined,
}: DeclineRequestSheetProps) {
  const { t } = useTranslation();
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t('proRequests.declineTitle')}
      closeLabel={t('proRequests.close')}
    >
      <DeclineForm requestId={requestId} onDeclined={onDeclined} />
    </BottomSheet>
  );
}

function DeclineForm({ requestId, onDeclined }: { requestId: string; onDeclined(): void }) {
  const { t } = useTranslation();
  const { fieldError, apiError } = useErrorText();
  const decline = useDeclineQuoteRequest(requestId);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string>();

  const submit = () => {
    const parsed = declineQuoteRequestInputSchema.safeParse({ reason });
    setError(parsed.success ? undefined : parsed.error.issues[0]?.message);
    if (parsed.success) decline.mutate(parsed.data, { onSuccess: onDeclined });
  };

  return (
    <View className="gap-4">
      <Text size="sm" tone="muted">
        {t('proRequests.declineHint')}
      </Text>
      <View accessibilityLabel={t('proRequests.declineSuggestions')} className="gap-2">
        {SUGGESTED.map((key) => {
          const text = t(`proRequests.declineReasons.${key}`);
          return (
            <Chip
              key={key}
              selected={reason === text}
              onPress={() => {
                setReason(text);
                setError(undefined);
              }}
            >
              {text}
            </Chip>
          );
        })}
      </View>
      <Input
        label={t('proRequests.declineReason')}
        value={reason}
        onChangeText={setReason}
        multiline
        maxLength={500}
        error={fieldError(error)}
      />
      {decline.isError ? (
        <Text size="sm" tone="destructive" accessibilityRole="alert">
          {apiError(decline.error)}
        </Text>
      ) : null}
      <Button variant="destructive" fullWidth loading={decline.isPending} onPress={submit}>
        {t('proRequests.declineConfirm')}
      </Button>
    </View>
  );
}
