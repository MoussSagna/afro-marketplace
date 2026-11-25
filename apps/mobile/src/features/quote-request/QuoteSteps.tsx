import {
  clientTypeSchema,
  eventTypeSchema,
  useUnavailableDates,
  type Offering,
  type QuoteRequestFormValues,
} from '@afro/common';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { Calendar } from '@/components/Calendar';
import { Chip, Heading, Text } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { cn } from '@/lib/cn';
import { monthRange, tomorrowIso } from '@/lib/dates';
import { useThemeColors } from '@/theme/useTheme';
import { FormInput } from '../auth/components/FormInput';
import { offeringPrice } from '../provider-profile/profileText';

type FormControl = Control<QuoteRequestFormValues>;

/** Une carte qu'on coche (formule, « qui organise ») : bordure terre et coche quand elle est choisie. */
function ChoiceCard({
  selected,
  title,
  detail,
  aside,
  onPress,
}: {
  selected: boolean;
  title: string;
  detail?: string;
  aside?: string;
  onPress(): void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={[title, aside].filter(Boolean).join(', ')}
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-3 rounded-2xl border px-4 py-3.5 active:opacity-80',
        selected ? 'border-primary bg-secondary' : 'border-border bg-card',
      )}
    >
      <View className="flex-1">
        <View className="flex-row items-start justify-between gap-3">
          <Text weight="bold" size="sm" className="flex-1">
            {title}
          </Text>
          {aside ? (
            <Text size="sm" weight="bold" tone="primary">
              {aside}
            </Text>
          ) : null}
        </View>
        {detail ? (
          <Text size="xs" tone="muted" className="mt-0.5" numberOfLines={2}>
            {detail}
          </Text>
        ) : null}
      </View>
      <View
        className={cn(
          'h-6 w-6 items-center justify-center rounded-full border',
          selected ? 'border-primary bg-primary' : 'border-input',
        )}
      >
        {selected ? <Check size={14} color={colors['primary-foreground']} /> : null}
      </View>
    </Pressable>
  );
}

type OfferingStepProps = {
  offerings: Offering[];
  /** La formule choisie, ou undefined pour « Je ne sais pas encore ». */
  value: string | undefined;
  onChange(offeringId: string | undefined): void;
};

/** Étape 1 · Formule : une des formules actives du prestataire, ou « Je ne sais pas encore ». */
export function OfferingStep({ offerings, value, onChange }: OfferingStepProps) {
  const { t } = useTranslation();
  return (
    <View className="gap-2.5">
      <Heading level={2}>{t('quote.stepOffering')}</Heading>
      <Text size="sm" tone="muted" className="mb-1">
        {t('quote.stepOfferingHint')}
      </Text>
      <View accessibilityRole="radiogroup" className="gap-2.5">
        {offerings
          .filter((offering) => offering.isActive)
          .map((offering) => (
            <ChoiceCard
              key={offering.id}
              selected={value === offering.id}
              title={offering.title}
              detail={offering.description}
              aside={offeringPrice(offering)}
              onPress={() => onChange(offering.id)}
            />
          ))}
        <ChoiceCard
          selected={value === undefined}
          title={t('quote.noOffering')}
          detail={t('quote.noOfferingHint')}
          onPress={() => onChange(undefined)}
        />
      </View>
    </View>
  );
}

/**
 * Étape 2 · Événement : type, date (jours pris barrés), invités, budget, ville et code postal.
 * La date est vérifiée en passant à l'étape suivante (règle n° 3) ; le serveur revérifie à l'envoi.
 */
export function EventStep({ control, providerId }: { control: FormControl; providerId: string }) {
  const { t } = useTranslation();
  const { fieldError } = useErrorText();
  const [range, setRange] = useState(() => {
    const first = tomorrowIso();
    return monthRange(Number(first.slice(0, 4)), Number(first.slice(5, 7)) - 1);
  });
  const unavailable = useUnavailableDates(providerId, range);

  return (
    <View className="gap-5">
      <Heading level={2}>{t('quote.stepEvent')}</Heading>

      <Controller
        control={control}
        name="eventType"
        render={({ field, fieldState }) => (
          <View>
            <Text size="xs" weight="semibold">
              {t('quote.eventType')}
            </Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              {eventTypeSchema.options.map((type) => (
                <Chip
                  key={type}
                  selected={field.value === type}
                  onPress={() => field.onChange(type)}
                >
                  {t(`eventTypes.${type}`)}
                </Chip>
              ))}
            </View>
            <FieldError message={fieldError(fieldState.error?.message)} />
          </View>
        )}
      />

      <Controller
        control={control}
        name="eventDate"
        render={({ field, fieldState }) => (
          <View>
            <Text size="xs" weight="semibold">
              {t('quote.date')}
            </Text>
            <Text size="xs" tone="muted">
              {t('quote.dateHint')}
            </Text>
            <Calendar
              value={field.value || undefined}
              onChange={field.onChange}
              firstDay={tomorrowIso()}
              unavailable={new Set(unavailable.data ?? [])}
              onMonthChange={(year, month) => setRange(monthRange(year, month))}
            />
            <FieldError message={fieldError(fieldState.error?.message)} />
          </View>
        )}
      />

      <FormInput
        control={control}
        name="guestCount"
        label={t('quote.guests')}
        keyboardType="number-pad"
        placeholder="120"
      />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormInput
            control={control}
            name="budgetMin"
            label={t('quote.budgetMin')}
            keyboardType="number-pad"
            placeholder="1500"
          />
        </View>
        <View className="flex-1">
          <FormInput
            control={control}
            name="budgetMax"
            label={t('quote.budgetMax')}
            keyboardType="number-pad"
            placeholder="3000"
          />
        </View>
      </View>
      <FormInput
        control={control}
        name="eventCity"
        label={t('quote.city')}
        hint={t('quote.cityHint')}
        autoComplete="postal-address-locality"
        placeholder="Saint-Denis"
      />
      <FormInput
        control={control}
        name="eventPostalCode"
        label={t('quote.postalCode')}
        keyboardType="number-pad"
        autoComplete="postal-code"
        maxLength={5}
        placeholder="93200"
      />
    </View>
  );
}

/** Étape 3 · Message : qui organise, puis le message au prestataire. */
export function MessageStep({ control }: { control: FormControl }) {
  const { t } = useTranslation();
  return (
    <View className="gap-5">
      <Heading level={2}>{t('quote.stepMessage')}</Heading>
      <Controller
        control={control}
        name="clientType"
        render={({ field }) => (
          <View>
            <Text size="xs" weight="semibold">
              {t('quote.clientType')}
            </Text>
            <View accessibilityRole="radiogroup" className="mt-2 gap-2">
              {clientTypeSchema.options.map((type) => (
                <ChoiceCard
                  key={type}
                  selected={field.value === type}
                  title={t(`clientTypes.${type}`)}
                  onPress={() => field.onChange(type)}
                />
              ))}
            </View>
          </View>
        )}
      />
      <FormInput
        control={control}
        name="message"
        label={t('quote.message')}
        hint={t('quote.messageHint')}
        placeholder={t('quote.messagePlaceholder')}
        multiline
        numberOfLines={6}
        maxLength={2000}
        className="min-h-[140px]"
        textAlignVertical="top"
      />
    </View>
  );
}

function FieldError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return (
    <Text size="xs" tone="destructive" className="mt-1.5" accessibilityRole="alert">
      {message}
    </Text>
  );
}
