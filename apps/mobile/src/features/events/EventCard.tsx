import type { EventSummary } from '@afro/common';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  CalendarDays,
  ChevronRight,
  FileText,
  MapPin,
  UserRound,
  Users,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { Card, Text } from '@/components/ui';
import { useLanguage } from '@/i18n/useLanguage';
import { eventDay } from '@/lib/dates';
import { useThemeColors } from '@/theme/useTheme';
import { EventStatusBadge } from './EventBadges';
import { EVENT_TYPE_PHOTOS } from './eventDisplay';

function Meta({ icon, children }: { icon: ReactNode; children: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      {icon}
      <Text size="xs" numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

/**
 * Une carte de « Mes événements » (maquette) : photo du type, nom, statut, date, ville, invités,
 * prestataires et devis reçus. Toute la carte ouvre le détail.
 */
export function EventCard({ summary }: { summary: EventSummary }) {
  const { event, status, counts } = summary;
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const router = useRouter();
  const colors = useThemeColors();
  const iconProps = { size: 14, color: colors.primary };
  const day = eventDay(event.date, locale);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={[
        event.name,
        t(`events.status.${status}`),
        day,
        event.city,
        t('events.guests', { count: event.guestCount }),
        t('events.providers', { count: counts.providers }),
        t('events.quotesReceived', { count: counts.received }),
      ].join(', ')}
      onPress={() =>
        router.push({ pathname: '/evenements/[eventId]', params: { eventId: event.id } })
      }
      className="active:opacity-80"
    >
      <Card className="flex-row items-center gap-3.5 p-3">
        <Image
          source={EVENT_TYPE_PHOTOS[event.type]}
          contentFit="cover"
          style={{ width: 92, height: 104, borderRadius: 14 }}
          accessibilityIgnoresInvertColors
        />
        <View className="flex-1 gap-1.5">
          <Text weight="bold" numberOfLines={1}>
            {event.name}
          </Text>
          <EventStatusBadge status={status} />
          <Meta icon={<CalendarDays {...iconProps} />}>{day}</Meta>
          <View className="flex-row flex-wrap gap-x-3 gap-y-1">
            <Meta icon={<MapPin {...iconProps} />}>{event.city}</Meta>
            <Meta icon={<Users {...iconProps} />}>
              {t('events.guests', { count: event.guestCount })}
            </Meta>
          </View>
          <View className="flex-row flex-wrap gap-x-3 gap-y-1">
            <Meta icon={<UserRound {...iconProps} />}>
              {t('events.providers', { count: counts.providers })}
            </Meta>
            <Meta icon={<FileText {...iconProps} />}>
              {t('events.quotesReceived', { count: counts.received })}
            </Meta>
          </View>
        </View>
        <ChevronRight size={20} color={colors.primary} />
      </Card>
    </Pressable>
  );
}
