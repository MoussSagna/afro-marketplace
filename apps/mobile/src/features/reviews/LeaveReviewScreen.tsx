import {
  canReviewBooking,
  initialReviewForm,
  reviewFormSchema,
  toCreateReviewInput,
  useBookings,
  useCreateReview,
  type BookingSummary,
  type ReviewFormValues,
} from '@afro/common';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QueryState } from '@/components/QueryState';
import { StarRatingInput } from '@/components/StarRatingInput';
import {
  Avatar,
  BackHeader,
  Button,
  Card,
  EmptyState,
  Heading,
  Input,
  Text,
} from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { useLanguage } from '@/i18n/useLanguage';
import { longDay } from '@/lib/dates';
import { useSessionStore } from '@/stores/session';
import { useThemeColors } from '@/theme/useTheme';
import { profileHref } from '../providers/profileHref';

const SUB_RATINGS = ['quality', 'punctuality', 'value'] as const;
type Errors = Partial<Record<keyof ReviewFormValues, string>>;

/**
 * Laisser un avis (C6), à l'adresse `/avis/[id]` (id = la réservation), ouvert depuis
 * « Mes réservations ». La règle n° 6 est vérifiée avant d'afficher le formulaire :
 * si l'avis n'est pas permis (pas encore passé, déjà donné…), on explique pourquoi.
 */
export function LeaveReviewScreen() {
  const { t } = useTranslation();
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const bookings = useBookings('client');
  const summary = bookings.data?.find((s) => s.booking.id === id);
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <BackHeader title={t('review.title')} />
      <QueryState
        isPending={bookings.isPending}
        isError={bookings.isError}
        onRetry={() => void bookings.refetch()}
        loadingLabel={t('review.loading')}
      >
        {summary ? (
          <ReviewBody summary={summary} />
        ) : (
          <EmptyState className="flex-1" title={t('review.notFound')} />
        )}
      </QueryState>
    </SafeAreaView>
  );
}

function ReviewBody({ summary }: { summary: BookingSummary }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const colors = useThemeColors();
  const router = useRouter();
  const { fieldError, apiError } = useErrorText();
  const userId = useSessionStore((s) => s.user?.id ?? '');
  const createReview = useCreateReview();
  const [form, setForm] = useState<ReviewFormValues>(initialReviewForm);
  const [errors, setErrors] = useState<Errors>({});
  const [published, setPublished] = useState(false);
  const { booking, provider } = summary;
  const tAny = t as unknown as (key: string) => string;

  const set = <K extends keyof ReviewFormValues>(key: K, value: ReviewFormValues[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = () => {
    const parsed = reviewFormSchema.safeParse(form);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ReviewFormValues;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    createReview.mutate(toCreateReviewInput(booking.id, parsed.data), {
      onSuccess: () => setPublished(true),
    });
  };

  const header = (
    <View className="items-center gap-1">
      <Avatar name={provider.displayName} uri={provider.coverUrl} size="lg" />
      <Heading level={2} className="mt-2 text-center">
        {provider.displayName}
      </Heading>
      <Text size="sm" tone="muted">
        {longDay(booking.eventDate, locale)}
      </Text>
    </View>
  );

  if (published) {
    return (
      <ScrollView contentContainerClassName="gap-6 px-5 pb-10 pt-4">
        {header}
        <View
          accessibilityRole="alert"
          className="flex-row items-center gap-2 rounded-2xl bg-success-muted p-3"
        >
          <CheckCircle2 size={18} color={colors.success} />
          <Text size="sm" tone="success" className="flex-1">
            {t('review.published')}
          </Text>
        </View>
        <Button fullWidth onPress={() => router.replace(profileHref(provider.slug))}>
          {t('review.seeProfile', { name: provider.displayName })}
        </Button>
      </ScrollView>
    );
  }

  // La même règle que le serveur : si elle refuse, on dit pourquoi au lieu du formulaire.
  const verdict = canReviewBooking({
    booking,
    userId,
    existingReviews: summary.review ? [summary.review] : [],
  });
  if (!verdict.allowed) {
    return (
      <ScrollView contentContainerClassName="gap-6 px-5 pb-10 pt-4">
        {header}
        <Card className="p-4">
          <Text size="sm" accessibilityRole="alert">
            {tAny(`apiErrors.${verdict.reason}`)}
          </Text>
        </Card>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerClassName="gap-6 px-5 pb-6 pt-4"
        keyboardShouldPersistTaps="handled"
      >
        {header}
        <View className="items-center gap-2.5">
          <Text weight="bold">{t('review.overall')}</Text>
          <StarRatingInput
            label={t('review.overall')}
            value={form.rating}
            onChange={(value) => set('rating', value)}
            invalid={Boolean(errors.rating)}
          />
          {form.rating > 0 ? (
            <Text size="sm" tone="muted">
              {tAny(`review.words.${form.rating}`)}
            </Text>
          ) : null}
          {errors.rating ? (
            <Text size="caption" weight="medium" tone="destructive" accessibilityRole="alert">
              {fieldError(errors.rating)}
            </Text>
          ) : null}
        </View>

        <Card className="gap-2.5 p-4">
          <Text size="xs" tone="muted">
            {t('review.details')}
          </Text>
          {SUB_RATINGS.map((key) => (
            <View key={key} className="flex-row items-center justify-between gap-3">
              <Text size="sm" className="flex-1">
                {t(`review.${key}`)}
              </Text>
              <StarRatingInput
                label={t(`review.${key}`)}
                size="sm"
                value={form[key]}
                onChange={(value) => set(key, value)}
                invalid={Boolean(errors.value) && form[key] === 0}
              />
            </View>
          ))}
          {errors.value ? (
            <Text size="caption" weight="medium" tone="destructive" accessibilityRole="alert">
              {fieldError(errors.value)}
            </Text>
          ) : null}
        </Card>

        <Input
          label={t('review.comment')}
          placeholder={t('review.commentPlaceholder')}
          value={form.comment}
          onChangeText={(value) => set('comment', value)}
          multiline
          maxLength={2000}
          hint={t('review.commentHint')}
          error={fieldError(errors.comment)}
          className="min-h-[110px]"
          textAlignVertical="top"
        />

        {createReview.isError ? (
          <Text size="sm" tone="destructive" accessibilityRole="alert">
            {apiError(createReview.error)}
          </Text>
        ) : null}
      </ScrollView>
      <View className="border-t border-border bg-card px-5 pb-2 pt-3.5">
        <Button fullWidth loading={createReview.isPending} onPress={submit}>
          {t('review.publish')}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
