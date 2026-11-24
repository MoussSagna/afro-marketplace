import type { Offering, ProviderDetails } from '@afro/common';
import { useProviderReviews, useUnavailableDates } from '@afro/common';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flag } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { Calendar } from '@/components/Calendar';
import { WenzeeLoader } from '@/components/brand/WenzeeLoader';
import { QueryState } from '@/components/QueryState';
import { Avatar, Card, Heading, Rating, Text } from '@/components/ui';
import { monthRange, monthYear } from '@/lib/dates';
import { useLanguage } from '@/i18n/useLanguage';
import { useThemeColors } from '@/theme/useTheme';
import {
  cancellationLines,
  durationLabel,
  guestsLabel,
  languageName,
  offeringPrice,
  responseTimeLabel,
} from './profileText';

type Profile = ProviderDetails['profile'];

/** Onglet Formules : les formules actives, puis « À propos » (comme la maquette P5). */
export function OfferingsTab({ offerings, bio }: { offerings: Offering[]; bio: string }) {
  const { t } = useTranslation();
  const active = offerings.filter((o) => o.isActive);
  return (
    <View className="gap-2.5">
      {active.length ? (
        active.map((offering) => <OfferingCard key={offering.id} offering={offering} />)
      ) : (
        <Text size="sm" tone="muted">
          {t('profile.noOfferings')}
        </Text>
      )}
      <Heading level={3} className="mt-4">
        {t('profile.about')}
      </Heading>
      <Text size="sm" tone="muted" className="leading-relaxed">
        {bio}
      </Text>
    </View>
  );
}

function OfferingCard({ offering }: { offering: Offering }) {
  const details = [guestsLabel(offering), durationLabel(offering.durationMinutes)].filter(Boolean);
  return (
    <Card className="p-3.5">
      <View className="flex-row items-start justify-between gap-3">
        <Text weight="bold" className="flex-1">
          {offering.title}
        </Text>
        <Text size="sm" weight="bold" tone="primary">
          {offeringPrice(offering)}
        </Text>
      </View>
      {offering.description ? (
        <Text size="sm" tone="muted" className="mt-1">
          {offering.description}
        </Text>
      ) : null}
      {details.length ? (
        <Text size="xs" tone="muted" weight="semibold" className="mt-1.5">
          {details.join(' · ')}
        </Text>
      ) : null}
    </Card>
  );
}

/** Onglet Avis : la note moyenne, puis chaque avis avec la réponse du prestataire. */
export function ReviewsTab({ profile }: { profile: Profile }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const reviews = useProviderReviews(profile.id);
  return (
    <View>
      <Rating value={profile.ratingAverage} count={profile.ratingCount} variant="full" />
      <QueryState
        isPending={reviews.isPending}
        isError={reviews.isError}
        onRetry={() => void reviews.refetch()}
        loadingLabel={t('profile.loadingReviews')}
        placeholder={
          <WenzeeLoader size={64} label={t('profile.loadingReviews')} className="py-8" />
        }
      >
        {reviews.data?.length ? (
          <View className="mt-3 gap-3">
            {reviews.data.map((review) => {
              const author = `${review.author.firstName} ${review.author.lastNameInitial}`;
              return (
                <Card key={review.id} className="p-3.5">
                  <View className="flex-row items-center gap-2.5">
                    <Avatar name={author} uri={review.author.avatarUrl} size="sm" />
                    <View className="flex-1">
                      <Text size="sm" weight="bold">
                        {author}
                      </Text>
                      <Text size="xs" tone="muted">
                        {monthYear(review.createdAt, locale)}
                      </Text>
                    </View>
                    <Rating value={review.rating} />
                  </View>
                  {review.comment ? (
                    <Text size="sm" className="mt-2">
                      {review.comment}
                    </Text>
                  ) : null}
                  {review.providerReply ? (
                    <View className="mt-3 border-l-2 border-accent pl-3">
                      <Text size="xs" weight="bold">
                        {t('profile.providerReply')}
                      </Text>
                      <Text size="sm" tone="muted">
                        {review.providerReply}
                      </Text>
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
        ) : (
          <Text size="sm" tone="muted" className="mt-3">
            {t('profile.noReviewsHint')}
          </Text>
        )}
      </QueryState>
    </View>
  );
}

/** Onglet Dispos : le calendrier du mois, jours déjà pris barrés. */
export function AvailabilityTab({ providerId }: { providerId: string }) {
  const { t } = useTranslation();
  const [range, setRange] = useState(() => {
    const now = new Date();
    return monthRange(now.getFullYear(), now.getMonth());
  });
  const dates = useUnavailableDates(providerId, range);
  return (
    <View>
      <Text size="sm" tone="muted">
        {t('profile.availabilityHint')}
      </Text>
      <Calendar
        unavailable={new Set(dates.data ?? [])}
        onMonthChange={(year, month) => setRange(monthRange(year, month))}
      />
      {dates.isPending ? (
        <WenzeeLoader size={36} label={t('profile.loadingAvailability')} className="mt-2" />
      ) : null}
    </View>
  );
}

type InfoTabProps = {
  profile: Profile;
  /** Les noms des origines culturelles du prestataire. */
  origins: string[];
  onReport(): void;
};

/** Onglet Infos : langues, origines, zone, temps de réponse, statut, annulation, et le signalement. */
export function InfoTab({ profile, origins, onReport }: InfoTabProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const rows = [
    {
      label: t('profile.zone'),
      value: t('profile.zoneValue', { city: profile.city, km: profile.travelRadiusKm }),
    },
    profile.languages.length
      ? { label: t('profile.languages'), value: profile.languages.map(languageName).join(', ') }
      : null,
    origins.length ? { label: t('profile.origins'), value: origins.join(', ') } : null,
    profile.responseTimeHours !== undefined
      ? { label: t('profile.responseTime'), value: responseTimeLabel(profile.responseTimeHours) }
      : null,
    { label: t('profile.status'), value: t(`profile.legal.${profile.legalType}`) },
  ].filter((row) => row !== null);
  return (
    <View>
      {rows.map((row) => (
        <View
          key={row.label}
          className="flex-row justify-between gap-4 border-b border-border py-3"
          accessible
          accessibilityLabel={`${row.label} : ${row.value}`}
        >
          <Text size="sm" tone="muted">
            {row.label}
          </Text>
          <Text size="sm" weight="semibold" className="flex-1 text-right">
            {row.value}
          </Text>
        </View>
      ))}
      <Heading level={3} className="mt-5">
        {t('profile.cancellationTitle', {
          policy: t(`profile.cancellation.${profile.cancellationPolicy}`),
        })}
      </Heading>
      <View className="mt-2 gap-1">
        {cancellationLines(profile.cancellationPolicy).map((line) => (
          <Text key={line} size="sm" tone="muted">
            {`• ${line}`}
          </Text>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onReport}
        className="mt-6 flex-row items-center gap-2 self-start py-2 active:opacity-70"
      >
        <Flag size={16} color={colors['muted-foreground']} />
        <Text size="sm" tone="muted" weight="semibold" className="underline">
          {t('profile.report')}
        </Text>
      </Pressable>
    </View>
  );
}
