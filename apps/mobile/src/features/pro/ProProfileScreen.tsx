import {
  useMyProviderProfile,
  useMyReviews,
  useSetMyProviderProfilePaused,
  type MyProviderDetails,
} from '@afro/common';
import { useRouter } from 'expo-router';
import { ChevronRight, ExternalLink } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QueryState } from '@/components/QueryState';
import { Badge, Button, Card, Heading, Text } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { cn } from '@/lib/cn';
import { SITE_PAGES, siteUrl } from '@/lib/site';
import { useThemeColors } from '@/theme/useTheme';
import { TAB_BAR_SPACE } from '../navigation/GlassTabBar';
import { useCollapseOnScroll } from '../navigation/useCollapseOnScroll';
import { profileHref } from '../providers/profileHref';
import { ProviderCard } from '../providers/ProviderCard';
import { useSwitchMode } from './useSwitchMode';

/**
 * « Mon profil » (S7, lot M15b), dernier onglet du mode pro :
 * - l'aperçu de sa carte dans la recherche, et l'état du profil (« En ligne », « En pause »…) ;
 * - les sections du profil (présentation, formules, photos…) : elles s'ouvrent sur le site
 *   pour l'instant (lot M15c pour les modifier dans l'app) ; « Avis reçus » s'ouvre ici ;
 * - « Profil visible » : la pause pendant les vacances ;
 * - « Revenir en mode client ».
 */
export function ProProfileScreen() {
  const { t } = useTranslation();
  const details = useMyProviderProfile();
  const onScroll = useCollapseOnScroll();
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <QueryState
        isPending={details.isPending}
        isError={details.isError}
        onRetry={() => void details.refetch()}
        loadingLabel={t('proProfile.loading')}
      >
        <ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerClassName="gap-4 px-5 pt-2"
          contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
        >
          <Heading>{t('proProfile.title')}</Heading>
          {details.data ? <Profile details={details.data} /> : null}
        </ScrollView>
      </QueryState>
    </SafeAreaView>
  );
}

function Profile({ details }: { details: MyProviderDetails }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();
  const { apiError } = useErrorText();
  const { toClient } = useSwitchMode();
  const reviews = useMyReviews();
  const pause = useSetMyProviderProfilePaused();
  const { profile, offerings, media } = details;
  const published = profile.status === 'published';
  const canPause = published || profile.status === 'paused';
  const inOnboarding = profile.status === 'draft' || profile.status === 'changes_requested';
  const toAnswer = (reviews.data ?? []).filter(
    (r) => !r.providerReply && r.status === 'published',
  ).length;
  const onSite = () => void Linking.openURL(siteUrl(SITE_PAGES.providerProfile));
  const siteRows = [
    { label: t('proProfile.presentation') },
    { label: t('proProfile.offerings'), count: offerings.length },
    { label: t('proProfile.photos'), count: media.length },
    { label: t('proProfile.zone') },
    { label: t('proProfile.cancellation') },
    { label: t('proProfile.legal') },
  ];

  return (
    <>
      <View className="gap-2">
        <ProviderCard provider={{ ...profile, city: profile.city || '–' }} preview />
        <View className="flex-row items-center justify-between gap-2">
          <Text size="xs" tone="muted" className="flex-1">
            {t('proProfile.preview')}
          </Text>
          <Badge variant={published ? 'success' : 'warning'}>
            {t(`pro.status.${profile.status}`)}
          </Badge>
        </View>
      </View>

      {profile.status === 'paused' ? (
        <View accessibilityRole="alert" className="rounded-2xl bg-secondary p-3">
          <Text size="sm">{t('proProfile.paused')}</Text>
        </View>
      ) : null}
      {profile.status === 'changes_requested' && profile.rejectionReason ? (
        <View className="rounded-2xl bg-warning-muted p-3">
          <Text size="sm">
            {t('proProfile.changesRequested', { reason: profile.rejectionReason })}
          </Text>
        </View>
      ) : null}
      {inOnboarding ? (
        <Button fullWidth onPress={onSite}>
          {t('proProfile.finishOnSite')}
        </Button>
      ) : null}

      <Card className="px-3.5 py-0" accessibilityLabel={t('proProfile.sections')}>
        <Row
          label={t('proProfile.reviews')}
          badge={toAnswer > 0 ? t('proProfile.toAnswer', { count: toAnswer }) : undefined}
          onPress={() => router.push('/pro/avis')}
        />
        {siteRows.map((row, index) => (
          <Row
            key={row.label}
            label={row.label}
            count={row.count}
            external={t('proProfile.onSite')}
            onPress={onSite}
            last={index === siteRows.length - 1}
          />
        ))}
      </Card>
      <Text size="xs" tone="muted">
        {t('proProfile.onSiteHint')}
      </Text>

      {canPause ? (
        <View className="min-h-touch flex-row items-center gap-3">
          <View className="flex-1">
            <Text size="sm" weight="bold">
              {t('proProfile.visible')}
            </Text>
            <Text size="xs" tone="muted">
              {t('proProfile.visibleHint')}
            </Text>
          </View>
          <Switch
            accessibilityLabel={t('proProfile.visible')}
            value={published}
            disabled={pause.isPending}
            // Visible = publié ; décocher met le profil en pause.
            onValueChange={(visible) => pause.mutate(!visible)}
            trackColor={{ true: colors.primary, false: colors.input }}
          />
        </View>
      ) : null}
      {pause.isError ? (
        <Text size="sm" tone="destructive" accessibilityRole="alert">
          {apiError(pause.error)}
        </Text>
      ) : null}

      <View className="gap-2">
        {published ? (
          <Button
            variant="secondary"
            fullWidth
            onPress={() => router.push(profileHref(profile.slug))}
          >
            {t('proProfile.publicPage')}
          </Button>
        ) : null}
        <Button variant="ghost" fullWidth onPress={toClient}>
          {t('pro.switchToClient')}
        </Button>
      </View>
    </>
  );
}

/** Une section du profil : libellé, compteur ou pastille, puis chevron (ou « sur le site »). */
function Row({
  label,
  count,
  badge,
  external,
  onPress,
  last,
}: {
  label: string;
  count?: number;
  badge?: string;
  /** Si la section s'ouvre sur le site : ce qui est dit à VoiceOver (« sur le site »). */
  external?: string;
  onPress(): void;
  last?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole={external ? 'link' : 'button'}
      accessibilityLabel={[label, count !== undefined ? String(count) : undefined, badge, external]
        .filter(Boolean)
        .join(', ')}
      onPress={onPress}
      className={cn(
        'min-h-touch flex-row items-center gap-2 py-3.5 active:opacity-70',
        !last && 'border-b border-border',
      )}
    >
      <Text size="sm" className="shrink">
        {label}
      </Text>
      {count !== undefined ? <Badge>{String(count)}</Badge> : null}
      {badge ? <Badge variant="sun">{badge}</Badge> : null}
      <View className="flex-1" />
      {external ? (
        <ExternalLink size={16} color={colors['muted-foreground']} />
      ) : (
        <ChevronRight size={18} color={colors['muted-foreground']} />
      )}
    </Pressable>
  );
}
