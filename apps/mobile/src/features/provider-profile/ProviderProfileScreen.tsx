import { ApiError, formatPrice, useCulturalOrigins, useProvider } from '@afro/common';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { BadgeCheck, CheckCircle2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import notFoundImage from '../../../assets/images/aucun-resultat.webp';
import { WenzeeLoader } from '@/components/brand/WenzeeLoader';
import { QueryState } from '@/components/QueryState';
import { Badge, Button, EmptyState, Heading, Rating, Text } from '@/components/ui';
import { useLanguage } from '@/i18n/useLanguage';
import { cn } from '@/lib/cn';
import { useSessionStore } from '@/stores/session';
import { useThemeColors } from '@/theme/useTheme';
import { useAuthFlowStore } from '../auth/authFlowStore';
import { AddToEventButton } from '../events/AddToEventButton';
import { ProfileGallery } from './ProfileGallery';
import { AvailabilityTab, InfoTab, OfferingsTab, ReviewsTab } from './ProfileTabs';
import { ReportSheet } from './ReportSheet';

const PROFILE_TABS = ['offerings', 'reviews', 'availability', 'info'] as const;
type Tab = (typeof PROFILE_TABS)[number];
const TAB_LABELS = {
  offerings: 'profile.tabOfferings',
  reviews: 'profile.tabReviews',
  availability: 'profile.tabAvailability',
  info: 'profile.tabInfo',
} as const;

/**
 * Le profil d'un prestataire (P5, maquette « Découvrir »), ouvert depuis une carte.
 * - En haut : la galerie qu'on fait glisser (et qu'on agrandit au toucher).
 * - Puis : badges, nom, note, ville, et quatre onglets Formules / Avis / Dispos / Infos.
 * - En bas, toujours visible : le prix de départ et « Demander un devis ».
 *   Sans compte, le bouton ouvre la connexion et revient ici ensuite.
 */
export function ProviderProfileScreen() {
  const { t } = useTranslation();
  const { slug = '' } = useLocalSearchParams<{ slug: string }>();
  const provider = useProvider(slug);
  const router = useRouter();

  if (provider.isError && provider.error instanceof ApiError && provider.error.status === 404) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <EmptyState
          className="flex-1"
          image={notFoundImage}
          title={t('profile.notFoundTitle')}
          description={t('profile.notFoundHint')}
          action={
            <Button variant="outline" size="md" onPress={() => router.replace('/')}>
              {t('profile.backToSearch')}
            </Button>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <QueryState
        isPending={provider.isPending}
        isError={provider.isError}
        onRetry={() => void provider.refetch()}
        loadingLabel={t('profile.loading')}
        placeholder={
          <View className="flex-1 items-center justify-center">
            <WenzeeLoader size={110} label={t('profile.loading')} />
          </View>
        }
      >
        {provider.data ? <ProfileContent details={provider.data} /> : null}
      </QueryState>
    </View>
  );
}

function ProfileContent({
  details,
}: {
  details: NonNullable<ReturnType<typeof useProvider>['data']>;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { locale } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const user = useSessionStore((s) => s.user);
  const startAuth = useAuthFlowStore((s) => s.startAuth);
  const origins = useCulturalOrigins();
  const [tab, setTab] = useState<Tab>('offerings');
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);

  const { profile, offerings, media } = details;
  const photos = [
    ...(profile.coverUrl ? [profile.coverUrl] : []),
    ...media
      .filter((m) => m.type === 'image' && m.url !== profile.coverUrl)
      .sort((a, b) => a.order - b.order)
      .map((m) => m.url),
  ];
  const originNames = profile.culturalOriginIds
    .map((id) => origins.data?.find((o) => o.id === id)?.name)
    .filter((name) => name !== undefined);

  /** Sans compte : on ouvre la connexion, en retenant ce profil pour y revenir. */
  const signInFirst = () => {
    startAuth(pathname);
    router.push('/bienvenue');
  };
  const requestQuote = () => {
    if (!user) return signInFirst();
    router.push({ pathname: '/prestataires/[slug]/demande', params: { slug: profile.slug } });
  };
  const report = () => (user ? setReporting(true) : signInFirst());

  return (
    <>
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        <ProfileGallery photos={photos} name={profile.displayName} />
        <View className="-mt-5 rounded-t-3xl bg-background px-5 pt-4">
          <View className="flex-row flex-wrap gap-1.5">
            {profile.isProVerified ? (
              <Badge variant="success" icon={<BadgeCheck size={13} color={colors.success} />}>
                {t('common.verified')}
              </Badge>
            ) : null}
            {originNames.map((name) => (
              <Badge key={name}>{name}</Badge>
            ))}
          </View>
          <Heading className="mt-2">{profile.displayName}</Heading>
          <View className="mt-1 flex-row flex-wrap items-center gap-x-2">
            <Rating value={profile.ratingAverage} count={profile.ratingCount} />
            {profile.ratingCount > 0 ? (
              <Text size="sm" tone="muted">
                {t('profile.reviewsCount', { count: profile.ratingCount })}
              </Text>
            ) : null}
            <Text size="sm" tone="muted">
              {`· ${profile.city} · ${t('profile.travel', { km: profile.travelRadiusKm })}`}
            </Text>
          </View>

          <View className="mt-4">
            <AddToEventButton
              providerId={profile.id}
              providerName={profile.displayName}
              profilePath={pathname}
              onSignIn={signInFirst}
            />
          </View>

          <View
            accessibilityRole="tablist"
            accessibilityLabel={t('profile.tabs')}
            className="mt-4 flex-row gap-1 rounded-full bg-muted p-1"
          >
            {PROFILE_TABS.map((value) => {
              const on = tab === value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  onPress={() => setTab(value)}
                  className={cn('flex-1 items-center rounded-full py-2', on && 'bg-card')}
                >
                  <Text size="xs" weight="bold" tone={on ? 'default' : 'muted'}>
                    {t(TAB_LABELS[value])}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="mt-4">
            {tab === 'offerings' ? <OfferingsTab offerings={offerings} bio={profile.bio} /> : null}
            {tab === 'reviews' ? <ReviewsTab profile={profile} /> : null}
            {tab === 'availability' ? <AvailabilityTab providerId={profile.id} /> : null}
            {tab === 'info' ? (
              <>
                {reported ? (
                  <View
                    accessibilityRole="alert"
                    className="mb-3 flex-row items-center gap-2 rounded-2xl bg-success-muted p-3"
                  >
                    <CheckCircle2 size={18} color={colors.success} />
                    <Text size="sm" tone="success" className="flex-1">
                      {t('profile.reportSent')}
                    </Text>
                  </View>
                ) : null}
                <InfoTab profile={profile} origins={originNames} onReport={report} />
              </>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <SafeAreaView
        edges={['bottom']}
        className="border-t border-border bg-card"
        style={{ boxShadow: '0 -6px 20px rgba(43, 26, 18, 0.08)' }}
      >
        <View className="flex-row items-center gap-4 px-5 pt-3">
          <View className="flex-1">
            <Text size="xs" tone="muted">
              {t('profile.startingAt')}
            </Text>
            <Text weight="bold">
              {profile.priceFrom === undefined
                ? t('common.onQuote')
                : formatPrice(profile.priceFrom, locale)}
            </Text>
          </View>
          <Button onPress={requestQuote}>{t('profile.requestQuote')}</Button>
        </View>
      </SafeAreaView>

      <ReportSheet
        visible={reporting}
        providerId={profile.id}
        onClose={() => setReporting(false)}
        onSent={() => {
          setReporting(false);
          setReported(true);
        }}
      />
    </>
  );
}
