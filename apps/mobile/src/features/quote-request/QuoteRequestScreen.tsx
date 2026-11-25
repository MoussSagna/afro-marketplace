import {
  ApiError,
  emptyQuoteRequestForm,
  QUOTE_REQUEST_TTL_DAYS,
  quoteRequestFormSchema,
  quoteRequestMessages,
  toCreateQuoteRequestInput,
  useApiClient,
  useCreateQuoteRequest,
  useProvider,
  type ProviderDetails,
  type QuoteRequestFormValues,
} from '@afro/common';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { useForm, type FieldPath } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import notFoundImage from '../../../assets/images/aucun-resultat.webp';
import { WenzeeLoader } from '@/components/brand/WenzeeLoader';
import { QueryState } from '@/components/QueryState';
import { Button, Card, EmptyState, Heading, Photo, Text } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { useSessionStore } from '@/stores/session';
import { useThemeColors } from '@/theme/useTheme';
import { FormAlert } from '../auth/components/FormAlert';
import { SignInRequired } from '../auth/SignInRequired';
import { EventStep, MessageStep, OfferingStep } from './QuoteSteps';
import { quoteSummary } from './quoteSummary';

const STEPS = 3;
/** Les champs vérifiés en quittant l'étape 2 (« Événement »). */
const EVENT_FIELDS: FieldPath<QuoteRequestFormValues>[] = [
  'eventType',
  'eventDate',
  'guestCount',
  'budgetMin',
  'budgetMax',
  'eventCity',
  'eventPostalCode',
];

/**
 * C1 : la demande de devis en 3 étapes (maquette « Demander un devis », lot M9).
 * 1. Formule · 2. Événement · 3. Message, avec une barre de progression.
 * Il faut être connecté : sinon, on se connecte et on revient ici.
 * Une fois la demande envoyée : l'écran « Demande envoyée » avec le récapitulatif.
 */
export function QuoteRequestScreen() {
  const { t } = useTranslation();
  return (
    <SignInRequired title={t('quote.title')} reason={t('quote.signIn')}>
      <QuoteRequestFlow />
    </SignInRequired>
  );
}

function QuoteRequestFlow() {
  const { t } = useTranslation();
  const router = useRouter();
  const { slug = '' } = useLocalSearchParams<{ slug: string }>();
  const provider = useProvider(slug);

  if (provider.isError && provider.error instanceof ApiError && provider.error.status === 404) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <EmptyState
          className="flex-1"
          image={notFoundImage}
          title={t('profile.notFoundTitle')}
          description={t('profile.notFoundHint')}
          action={
            <Button variant="outline" size="md" onPress={() => router.replace('/recherche')}>
              {t('profile.backToSearch')}
            </Button>
          }
        />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <QueryState
        isPending={provider.isPending}
        isError={provider.isError}
        onRetry={() => void provider.refetch()}
        loadingLabel={t('quote.loading')}
        placeholder={
          <View className="flex-1 items-center justify-center">
            <WenzeeLoader size={110} label={t('quote.loading')} />
          </View>
        }
      >
        {provider.data ? <QuoteForm details={provider.data} /> : null}
      </QueryState>
    </SafeAreaView>
  );
}

function QuoteForm({ details }: { details: ProviderDetails }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();
  const api = useApiClient();
  const { apiError } = useErrorText();
  const { formule } = useLocalSearchParams<{ formule?: string }>();
  const user = useSessionStore((s) => s.user);
  const createRequest = useCreateQuoteRequest();
  const { profile, offerings } = details;

  const [step, setStep] = useState(1);
  const [offeringId, setOfferingId] = useState<string | undefined>(() =>
    offerings.some((o) => o.id === formule && o.isActive) ? formule : undefined,
  );
  const [sent, setSent] = useState<QuoteRequestFormValues>();
  const { control, trigger, setError, getValues, handleSubmit, formState } =
    useForm<QuoteRequestFormValues>({
      resolver: zodResolver(quoteRequestFormSchema),
      defaultValues: emptyQuoteRequestForm,
    });
  const isOwnProfile = user?.id === profile.userId;

  const back = () => (step > 1 ? setStep(step - 1) : router.back());

  const next = async () => {
    if (step === 2) {
      if (!(await trigger(EVENT_FIELDS))) return;
      // Règle n° 3 : on prévient tout de suite si le jour est déjà pris.
      const date = getValues('eventDate');
      const busy = await api.listUnavailableDates(profile.id, { from: date, to: date });
      if (busy.includes(date)) {
        setError('eventDate', { message: quoteRequestMessages.dateUnavailable });
        return;
      }
    }
    setStep(step + 1);
  };

  const send = handleSubmit(async (values) => {
    try {
      // Le serveur ouvre aussi la conversation avec le prestataire (messagerie : lot M10).
      await createRequest.mutateAsync(
        toCreateQuoteRequestInput(values, { providerId: profile.id, offeringId }),
      );
      setSent(values);
    } catch (error) {
      setError('root', { message: apiError(error) });
    }
  });

  if (sent) return <QuoteSent name={profile.displayName} values={sent} />;

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-row items-center gap-3 px-4 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('quote.back')}
          onPress={back}
          className="min-h-touch min-w-touch items-center justify-center rounded-full border border-border bg-card"
        >
          <ChevronLeft size={22} color={colors.foreground} />
        </Pressable>
        <Text weight="bold" className="flex-1">
          {t('quote.title')}
        </Text>
        <Text size="sm" tone="muted">
          {t('quote.stepOf', { step, total: STEPS })}
        </Text>
      </View>
      <View
        className="mx-5 h-1.5 overflow-hidden rounded-full bg-muted"
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t('quote.progress', { step, total: STEPS })}
        accessibilityValue={{ min: 0, max: STEPS, now: step }}
      >
        <View
          className="h-full rounded-full bg-primary"
          style={{ width: `${(step / STEPS) * 100}%` }}
        />
      </View>

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-5 px-5 pb-8 pt-4"
      >
        <Card className="flex-row items-center gap-3 p-2.5">
          <Photo uri={profile.coverUrl} className="h-12 w-12 rounded-xl" />
          <View className="flex-1">
            <Text size="sm" weight="bold">
              {profile.displayName}
            </Text>
            <Text size="xs" tone="muted">
              {profile.city}
            </Text>
          </View>
        </Card>
        {isOwnProfile ? <FormAlert message={t('quote.ownProfile')} /> : null}

        {step === 1 ? (
          <OfferingStep offerings={offerings} value={offeringId} onChange={setOfferingId} />
        ) : null}
        {step === 2 ? <EventStep control={control} providerId={profile.id} /> : null}
        {step === 3 ? <MessageStep control={control} /> : null}

        {step === 3 ? <FormAlert message={formState.errors.root?.message} /> : null}
      </ScrollView>

      <View className="flex-row gap-3 border-t border-border bg-card px-5 pb-2 pt-3">
        {step > 1 ? (
          <Button variant="ghost" onPress={back}>
            {t('quote.back')}
          </Button>
        ) : null}
        <View className="flex-1">
          {step < STEPS ? (
            <Button fullWidth onPress={() => void next()}>
              {t('quote.next')}
            </Button>
          ) : (
            <Button
              fullWidth
              loading={formState.isSubmitting}
              disabled={isOwnProfile}
              onPress={() => void send()}
            >
              {t('quote.send')}
            </Button>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/** « Demande envoyée ! » : le délai de réponse, le récapitulatif, et la suite. */
function QuoteSent({ name, values }: { name: string; values: QuoteRequestFormValues }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();
  const summary = quoteSummary(values);
  return (
    <View className="flex-1">
      <ScrollView contentContainerClassName="grow items-center justify-center px-8 py-10">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-success-muted">
          <Check size={48} color={colors.success} />
        </View>
        <Heading className="mt-5 text-center">{t('quote.sentTitle')}</Heading>
        <Text size="sm" tone="muted" className="mt-2.5 text-center">
          {t('quote.sentText', { name, days: QUOTE_REQUEST_TTL_DAYS })}
        </Text>
        <Card className="mt-6 w-full p-3.5">
          <Text size="xs" tone="muted">
            {t('quote.summary')}
          </Text>
          <Text weight="semibold" className="mt-1">
            {summary.title}
          </Text>
          {summary.detail ? (
            <Text size="sm" tone="muted">
              {summary.detail}
            </Text>
          ) : null}
        </Card>
      </ScrollView>
      <View className="gap-2 px-5 pb-2">
        <Button fullWidth onPress={() => router.replace('/messages')}>
          {t('quote.openConversation')}
        </Button>
        <Button fullWidth variant="ghost" onPress={() => router.replace('/')}>
          {t('quote.backHome')}
        </Button>
      </View>
    </View>
  );
}
