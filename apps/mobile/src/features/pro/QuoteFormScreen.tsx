import {
  addDays,
  ApiError,
  emptyLine,
  formatPrice,
  initialQuoteForm,
  isQuoteRequestOpen,
  liveTotals,
  quoteFormSchema,
  toCreateQuoteInput,
  toIsoDate,
  useCreateQuote,
  useQuoteRequest,
  type QuoteFormLine,
  type QuoteFormValues,
  type QuoteRequestDetails,
} from '@afro/common';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QueryState } from '@/components/QueryState';
import { BackHeader, Button, Card, Chip, EmptyState, Heading, Input, Text } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { useLanguage } from '@/i18n/useLanguage';
import { shortDate, shortDay } from '@/lib/dates';
import { useThemeColors } from '@/theme/useTheme';
import { clientName } from './clientName';

/** Les durées de validité proposées (la maquette S4 montre « Valable jusqu'au 6 déc. »). */
const VALIDITY_DAYS = [7, 14, 30] as const;
type ValidityDays = (typeof VALIDITY_DAYS)[number];

/**
 * Envoyer un devis (S4, lot M14b), par-dessus le détail de la demande :
 * - les lignes, ajoutées une à une (libellé, quantité × prix unitaire, total de la ligne) ;
 * - l'acompte en %, la durée de validité, des conditions facultatives ;
 * - en bas, toujours visibles : le total et l'acompte calculés en direct, et « Envoyer ».
 * Pour négocier, une nouvelle version reprend les lignes de la précédente.
 * Le formulaire est celui du site (`quoteForm` dans common) : mêmes règles, mêmes calculs.
 */
export function QuoteFormScreen() {
  const { t } = useTranslation();
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const details = useQuoteRequest(id);
  const next = (details.data?.latestQuote?.version ?? 0) + 1;
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <BackHeader
        title={next > 1 ? t('quoteForm.titleVersion', { version: next }) : t('quoteForm.title')}
      />
      <QueryState
        isPending={details.isPending}
        isError={details.isError && !isNotFound(details.error)}
        onRetry={() => void details.refetch()}
        loadingLabel={t('requests.loading')}
      >
        {details.data ? (
          isQuoteRequestOpen(details.data.request.status) ? (
            // Monté une fois la demande chargée : les valeurs de départ en dépendent.
            <QuoteForm details={details.data} />
          ) : (
            <EmptyState className="flex-1" title={t('quoteForm.closed')} />
          )
        ) : (
          <EmptyState className="flex-1" title={t('requests.notFound')} />
        )}
      </QueryState>
    </SafeAreaView>
  );
}

function isNotFound(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}

/** Les erreurs du schéma, rangées par champ (« lines.0.label », « depositRate »…). */
function errorsOf(values: QuoteFormValues): Record<string, string> {
  const result = quoteFormSchema.safeParse(values);
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.');
    errors[key] ??= issue.message;
  }
  return errors;
}

function QuoteForm({ details }: { details: QuoteRequestDetails }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { fieldError, apiError } = useErrorText();
  const colors = useThemeColors();
  const router = useRouter();
  const createQuote = useCreateQuote();
  const { request, client, latestQuote } = details;
  const today = toIsoDate(new Date());
  const [values, setValues] = useState<QuoteFormValues>(() => initialQuoteForm(today, latestQuote));
  const [days, setDays] = useState<ValidityDays>(14);
  // Les erreurs s'affichent après le premier essai d'envoi, puis suivent la saisie.
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? errorsOf(values) : {};
  const error = (key: string) => fieldError(errors[key]);
  const totals = liveTotals(values);
  const euros = (cents: number) => formatPrice(cents, locale);

  const setLine = (index: number, patch: Partial<QuoteFormLine>) =>
    setValues((v) => ({
      ...v,
      lines: v.lines.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    }));
  const addLine = () => setValues((v) => ({ ...v, lines: [...v.lines, { ...emptyLine }] }));
  const removeLine = (index: number) =>
    setValues((v) => ({ ...v, lines: v.lines.filter((_, i) => i !== index) }));
  const chooseDays = (value: ValidityDays) => {
    setDays(value);
    setValues((v) => ({ ...v, validUntil: addDays(today, value) }));
  };

  const submit = () => {
    setSubmitted(true);
    const parsed = quoteFormSchema.safeParse(values);
    if (!parsed.success) return;
    createQuote.mutate(toCreateQuoteInput(values, request.id), {
      // Retour au détail de la demande, qui annonce l'envoi.
      onSuccess: () =>
        router.dismissTo({ pathname: '/pro/demande/[id]', params: { id: request.id, sent: '1' } }),
    });
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-6 pt-1"
        keyboardShouldPersistTaps="handled"
      >
        <Text size="xs" tone="muted">
          {t('quoteForm.forWhom', {
            name: clientName(client),
            event: t(`eventTypes.${request.eventType}`),
            date: shortDay(request.eventDate, locale),
          })}
        </Text>
        {latestQuote ? (
          <Text size="sm" tone="muted">
            {t('quoteForm.replaces')}
          </Text>
        ) : null}

        <Heading level={3}>{t('quoteForm.lines')}</Heading>
        {values.lines.map((line, index) => {
          const number = index + 1;
          return (
            // Les champs sont contrôlés (valeurs dans l'état) : l'index suffit comme clé.
            <Card key={index} className="gap-2.5 p-3">
              <View className="flex-row items-center justify-between">
                <Text size="xs" weight="bold" tone="muted">
                  {t('quoteForm.line', { number })}
                </Text>
                {values.lines.length > 1 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('quoteForm.removeLine', { number })}
                    onPress={() => removeLine(index)}
                    hitSlop={8}
                    className="min-h-touch min-w-touch items-center justify-center"
                  >
                    <Trash2 size={18} color={colors['muted-foreground']} />
                  </Pressable>
                ) : null}
              </View>
              <Input
                label={t('quoteForm.lineLabel')}
                accessibilityLabel={t('quoteForm.lineLabelA11y', { number })}
                placeholder={t('quoteForm.lineLabelPlaceholder')}
                value={line.label}
                onChangeText={(label) => setLine(index, { label })}
                maxLength={200}
                error={error(`lines.${index}.label`)}
              />
              <View className="flex-row items-start gap-2">
                <Input
                  containerClassName="w-24"
                  label={t('quoteForm.quantity')}
                  accessibilityLabel={t('quoteForm.quantityA11y', { number })}
                  keyboardType="number-pad"
                  value={line.quantity}
                  onChangeText={(quantity) => setLine(index, { quantity })}
                  error={error(`lines.${index}.quantity`)}
                />
                <Input
                  containerClassName="flex-1"
                  label={t('quoteForm.unitPrice')}
                  accessibilityLabel={t('quoteForm.unitPriceA11y', { number })}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                  value={line.unitPrice}
                  onChangeText={(unitPrice) => setLine(index, { unitPrice })}
                  error={error(`lines.${index}.unitPrice`)}
                />
              </View>
              <Text
                size="sm"
                weight="bold"
                className="text-right"
                accessibilityLabel={t('quoteForm.lineTotal', {
                  number,
                  amount: euros(totals.lineTotals[index] ?? 0),
                })}
              >
                {euros(totals.lineTotals[index] ?? 0)}
              </Text>
            </Card>
          );
        })}
        {errors.lines ? (
          <Text size="sm" tone="destructive" accessibilityRole="alert">
            {error('lines')}
          </Text>
        ) : null}
        <Button
          variant="ghost"
          size="md"
          fullWidth
          icon={<Plus size={18} color={colors.foreground} />}
          onPress={addLine}
        >
          {t('quoteForm.addLine')}
        </Button>

        <Input
          label={t('quoteForm.depositRate')}
          keyboardType="number-pad"
          value={values.depositRate}
          onChangeText={(depositRate) => setValues((v) => ({ ...v, depositRate }))}
          maxLength={3}
          error={error('depositRate')}
        />
        <View className="gap-1.5">
          <Text size="xs" weight="semibold">
            {t('quoteForm.validFor')}
          </Text>
          <View className="flex-row gap-2">
            {VALIDITY_DAYS.map((value) => (
              <Chip key={value} selected={days === value} onPress={() => chooseDays(value)}>
                {t('quoteForm.validForDays', { count: value })}
              </Chip>
            ))}
          </View>
          <Text size="xs" tone="muted">
            {t('quoteForm.validUntil', { date: shortDate(values.validUntil, locale) })}
          </Text>
        </View>
        <Input
          label={t('quoteForm.conditions')}
          placeholder={t('quoteForm.conditionsPlaceholder')}
          value={values.conditions}
          onChangeText={(conditions) => setValues((v) => ({ ...v, conditions }))}
          multiline
          maxLength={2000}
          error={error('conditions')}
        />
        {createQuote.isError ? (
          <Text size="sm" tone="destructive" accessibilityRole="alert">
            {apiError(createQuote.error)}
          </Text>
        ) : null}
      </ScrollView>

      <View className="flex-row items-center gap-3 border-t border-border bg-background px-5 pb-2 pt-3">
        <View
          className="flex-1"
          accessible
          accessibilityLabel={t('quoteForm.totals', {
            total: euros(totals.total),
            deposit: euros(totals.deposit),
          })}
        >
          <Text size="xs" tone="muted">
            {t('quoteForm.depositShort', { amount: euros(totals.deposit) })}
          </Text>
          <Text weight="bold" tone="primary" className="font-serif text-h2">
            {euros(totals.total)}
          </Text>
        </View>
        <Button loading={createQuote.isPending} onPress={submit}>
          {t('quoteForm.send')}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
