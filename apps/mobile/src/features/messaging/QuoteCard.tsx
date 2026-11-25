import { computeDepositAmount, formatPrice, type QuoteRequestDetails } from '@afro/common';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Badge, Text } from '@/components/ui';
import { useLanguage } from '@/i18n/useLanguage';
import { cn } from '@/lib/cn';
import { shortDate } from '@/lib/dates';

type Quote = QuoteRequestDetails['quotes'][number];

/**
 * Un devis dans le fil de la conversation (maquette C4) : version, validité, lignes, total
 * et acompte. Le dernier devis envoyé est bordé d'ocre ; les anciens sont estompés.
 * `children` : ce qui s'affiche sous le devis (les boutons Accepter / Refuser, lot M11).
 */
export function QuoteCard({ quote, children }: { quote: Quote; children?: ReactNode }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const price = (cents: number) => formatPrice(cents, locale);
  const current = quote.status === 'sent';
  return (
    <View
      className={cn(
        'gap-2 rounded-2xl bg-card p-3.5',
        current ? 'border-2 border-ochre' : 'border border-border opacity-70',
      )}
      accessibilityLabel={`${t('quoteCard.title', { version: quote.version })}, ${t('quoteCard.total')} ${price(quote.totalAmount)}`}
    >
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-1.5">
          <Badge variant="sun">{t('quoteCard.title', { version: quote.version })}</Badge>
          {!current ? <Badge>{t(`quoteCard.status.${quote.status}`)}</Badge> : null}
        </View>
        <Text size="xs" tone="muted">
          {t('quoteCard.validUntil', { date: shortDate(quote.validUntil, locale) })}
        </Text>
      </View>
      {quote.lines.map((line) => (
        <View key={line.id} className="flex-row justify-between gap-3">
          <View className="flex-1">
            <Text size="sm">{line.label}</Text>
            {line.quantity > 1 ? (
              <Text size="xs" tone="muted">
                {t('quoteCard.lineDetail', {
                  quantity: line.quantity,
                  unitPrice: price(line.unitPrice),
                })}
              </Text>
            ) : null}
          </View>
          <Text size="sm">{price(line.quantity * line.unitPrice)}</Text>
        </View>
      ))}
      <View className="h-px bg-border" />
      <View className="flex-row justify-between">
        <Text weight="bold">{t('quoteCard.total')}</Text>
        <Text weight="bold" tone="primary">
          {price(quote.totalAmount)}
        </Text>
      </View>
      {quote.depositRate > 0 ? (
        <Text size="xs" tone="muted">
          {t('quoteCard.deposit', {
            rate: quote.depositRate,
            amount: price(computeDepositAmount(quote.totalAmount, quote.depositRate)),
          })}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
