import {
  acceptQuoteInputSchema,
  computeDepositAmount,
  formatPrice,
  useAcceptQuote,
  useDeclineQuote,
  useProvider,
  type QuoteRequestDetails,
} from '@afro/common';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { Checkbox } from '@/components/Checkbox';
import { Button, Card, Input, Text } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { useLanguage } from '@/i18n/useLanguage';
import { cancellationLines } from '../provider-profile/profileText';

type Quote = QuoteRequestDetails['quotes'][number];

type QuoteActionsProps = {
  details: QuoteRequestDetails;
  quote: Quote;
  /** Appelé quand le devis est accepté (la réservation est créée). */
  onAccepted?(): void;
  /** Appelé quand le devis est refusé. */
  onDeclined?(): void;
};

/** Le devis attend-il une réponse du client ? (sinon, pas de boutons) */
function canAnswerQuote(details: QuoteRequestDetails, quote: Quote) {
  return quote.status === 'sent' && details.request.status === 'quoted';
}

/**
 * Sous le dernier devis (C3) : « Accepter le devis » ouvre le panneau du bas,
 * « Refuser » demande une confirmation sur place. Rien ne s'affiche si le devis
 * n'attend plus de réponse (remplacé, expiré, déjà accepté…).
 */
export function QuoteActions({ details, quote, onAccepted, onDeclined }: QuoteActionsProps) {
  const { t } = useTranslation();
  const { apiError } = useErrorText();
  const decline = useDeclineQuote(quote.id);
  const [accepting, setAccepting] = useState(false);
  const [confirmDecline, setConfirmDecline] = useState(false);

  if (!canAnswerQuote(details, quote)) return null;

  return (
    <View className="gap-2">
      {confirmDecline ? (
        <Card className="gap-3 p-4">
          <Text weight="bold">{t('quoteCard.declineTitle')}</Text>
          <Text size="sm" tone="muted">
            {t('quoteCard.declineHint')}
          </Text>
          {decline.isError ? (
            <Text size="sm" tone="destructive" accessibilityRole="alert">
              {apiError(decline.error)}
            </Text>
          ) : null}
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                variant="outline"
                size="md"
                fullWidth
                onPress={() => setConfirmDecline(false)}
              >
                {t('quoteCard.declineKeep')}
              </Button>
            </View>
            <View className="flex-1">
              <Button
                variant="destructive"
                size="md"
                fullWidth
                loading={decline.isPending}
                onPress={() => decline.mutate(undefined, { onSuccess: () => onDeclined?.() })}
              >
                {t('quoteCard.declineConfirm')}
              </Button>
            </View>
          </View>
        </Card>
      ) : (
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button variant="outline" size="md" fullWidth onPress={() => setConfirmDecline(true)}>
              {t('quoteCard.decline')}
            </Button>
          </View>
          <View className="flex-[2]">
            <Button size="md" fullWidth onPress={() => setAccepting(true)}>
              {t('quoteCard.accept')}
            </Button>
          </View>
        </View>
      )}
      <BottomSheet
        visible={accepting}
        onClose={() => setAccepting(false)}
        title={t('acceptQuote.title')}
        closeLabel={t('acceptQuote.close')}
      >
        <AcceptQuoteForm
          details={details}
          quote={quote}
          onDone={() => {
            setAccepting(false);
            onAccepted?.();
          }}
        />
      </BottomSheet>
    </View>
  );
}

/**
 * Le contenu du panneau « Accepter le devis » (maquette C3, règle n° 5) :
 * l'adresse précise (révélée au prestataire seulement maintenant), les conditions
 * d'annulation, la case à cocher, puis « Accepter et réserver ».
 */
function AcceptQuoteForm({
  details,
  quote,
  onDone,
}: {
  details: QuoteRequestDetails;
  quote: Quote;
  onDone(): void;
}) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { fieldError, apiError } = useErrorText();
  const accept = useAcceptQuote(quote.id);
  // La politique d'annulation est sur le profil complet (la carte du prestataire ne l'a pas).
  const profile = useProvider(details.provider.slug);
  const policy = profile.data?.profile.cancellationPolicy;
  const [address, setAddress] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<{ address?: string; terms?: string }>({});
  const euros = (cents: number) => formatPrice(cents, locale);

  const submit = () => {
    const parsed = acceptQuoteInputSchema.safeParse({ eventAddress: address });
    const next = {
      address: parsed.success ? undefined : parsed.error.issues[0]?.message,
      terms: agreed ? undefined : t('acceptQuote.termsRequired'),
    };
    setErrors(next);
    if (!parsed.success || !agreed) return;
    accept.mutate(parsed.data, { onSuccess: onDone });
  };

  return (
    <>
      <Text size="sm" tone="muted">
        {t('acceptQuote.summary', {
          provider: details.provider.displayName,
          total: euros(quote.totalAmount),
        })}
      </Text>
      {quote.depositRate > 0 ? (
        <Text size="sm" tone="muted">
          {t('acceptQuote.deposit', {
            amount: euros(computeDepositAmount(quote.totalAmount, quote.depositRate)),
          })}
        </Text>
      ) : null}
      <Input
        label={t('acceptQuote.address')}
        placeholder={t('acceptQuote.addressPlaceholder')}
        value={address}
        onChangeText={setAddress}
        autoComplete="street-address"
        textContentType="fullStreetAddress"
        hint={t('acceptQuote.addressHint')}
        error={fieldError(errors.address)}
      />
      {policy ? (
        <View className="gap-1.5 rounded-2xl bg-muted p-3.5">
          <Text size="sm" weight="bold">
            {t('acceptQuote.cancellation', { policy: t(`cancellationPolicies.${policy}`) })}
          </Text>
          {cancellationLines(policy).map((line) => (
            <Text key={line} size="xs" tone="muted">
              {line}
            </Text>
          ))}
        </View>
      ) : null}
      <Checkbox
        checked={agreed}
        onChange={setAgreed}
        accessibilityLabel={t('acceptQuote.terms')}
        error={errors.terms}
      >
        <Text size="sm">{t('acceptQuote.terms')}</Text>
      </Checkbox>
      <Card className="p-3">
        <Text size="xs">{t('acceptQuote.offline')}</Text>
      </Card>
      {accept.isError ? (
        <Text size="sm" tone="destructive" accessibilityRole="alert">
          {apiError(accept.error)}
        </Text>
      ) : null}
      <Button fullWidth loading={accept.isPending} onPress={submit}>
        {t('acceptQuote.confirm')}
      </Button>
    </>
  );
}
