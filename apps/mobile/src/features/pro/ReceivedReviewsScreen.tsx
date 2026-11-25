import {
  computeProviderRating,
  replyToReviewInputSchema,
  useMyReviews,
  useReplyToReview,
  type ReviewWithAuthor,
} from '@afro/common';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QueryState } from '@/components/QueryState';
import {
  Avatar,
  BackHeader,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Rating,
  Text,
} from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { useLanguage } from '@/i18n/useLanguage';
import { monthYear } from '@/lib/dates';
import { clientName } from './clientName';

const SUB_RATINGS = ['quality', 'punctuality', 'value'] as const;

/**
 * Les avis reçus (S8, lot M15b), ouverts depuis « Mon profil » : la note (règle n° 8 : les avis
 * masqués ne comptent pas), puis chaque avis avec ses sous-notes, et la réponse publique.
 * On ne répond qu'une fois ; la réponse s'affiche ensuite sur le profil.
 */
export function ReceivedReviewsScreen() {
  const { t } = useTranslation();
  const reviews = useMyReviews();
  const list = reviews.data ?? [];
  const { ratingAverage, ratingCount } = computeProviderRating(list);
  const toAnswer = list.filter((r) => !r.providerReply && r.status === 'published').length;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <BackHeader title={t('proReviews.title')} />
      <QueryState
        isPending={reviews.isPending}
        isError={reviews.isError}
        onRetry={() => void reviews.refetch()}
        loadingLabel={t('proReviews.loading')}
      >
        {list.length === 0 ? (
          <EmptyState
            className="flex-1"
            title={t('proReviews.emptyTitle')}
            description={t('proReviews.emptyHint')}
          />
        ) : (
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerClassName="gap-3 px-5 pb-8 pt-2"
              keyboardShouldPersistTaps="handled"
            >
              <View className="gap-1">
                <Rating value={ratingAverage} count={ratingCount} variant="full" />
                <Text size="sm" tone="muted">
                  {toAnswer === 0
                    ? t('proReviews.allAnswered')
                    : t('proReviews.toAnswer', { count: toAnswer })}
                </Text>
              </View>
              {list.map((review) => (
                <ReviewItem key={review.id} review={review} />
              ))}
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </QueryState>
    </SafeAreaView>
  );
}

function ReviewItem({ review }: { review: ReviewWithAuthor }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const author = clientName(review.author);
  return (
    <Card className="gap-2 p-3.5" accessibilityLabel={t('proReviews.reviewBy', { name: author })}>
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
      {review.status === 'hidden' ? (
        <Badge className="self-start">{t('proReviews.hidden')}</Badge>
      ) : null}
      {review.subRatings ? (
        <View className="flex-row flex-wrap gap-x-3 gap-y-1">
          {SUB_RATINGS.map((key) => (
            <Text key={key} size="xs" tone="muted">
              {`${t(`review.${key}`)} : ${review.subRatings![key]}/5`}
            </Text>
          ))}
        </View>
      ) : null}
      {review.comment ? <Text size="sm">{review.comment}</Text> : null}
      {review.providerReply ? (
        <View className="border-l-2 border-accent pl-3">
          <Text size="xs" weight="bold">
            {t('proReviews.yourReply')}
          </Text>
          <Text size="sm" tone="muted">
            {review.providerReply}
          </Text>
        </View>
      ) : review.status === 'published' ? (
        <ReplyForm reviewId={review.id} authorName={author} />
      ) : null}
    </Card>
  );
}

/** La réponse publique à un avis : une seule, qui ne se modifie plus ensuite. */
function ReplyForm({ reviewId, authorName }: { reviewId: string; authorName: string }) {
  const { t } = useTranslation();
  const { fieldError, apiError } = useErrorText();
  const reply = useReplyToReview(reviewId);
  const [text, setText] = useState('');
  const [error, setError] = useState<string>();

  const submit = () => {
    const parsed = replyToReviewInputSchema.safeParse({ reply: text });
    setError(parsed.success ? undefined : parsed.error.issues[0]?.message);
    if (parsed.success) reply.mutate(parsed.data);
  };

  return (
    <View className="gap-2 pt-1">
      <Input
        label={t('proReviews.replyLabel', { name: authorName })}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={1000}
        hint={t('proReviews.replyHint')}
        error={fieldError(error)}
      />
      {reply.isError ? (
        <Text size="sm" tone="destructive" accessibilityRole="alert">
          {apiError(reply.error)}
        </Text>
      ) : null}
      <Button size="sm" className="self-end" loading={reply.isPending} onPress={submit}>
        {t('proReviews.publish')}
      </Button>
    </View>
  );
}
