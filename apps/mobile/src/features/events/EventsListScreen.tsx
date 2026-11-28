import { useEvents } from '@afro/common';
import { useRouter } from 'expo-router';
import { CalendarCheck, Plus, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QueryState } from '@/components/QueryState';
import { Button, Heading, Text } from '@/components/ui';
import { useThemeColors } from '@/theme/useTheme';
import { TAB_BAR_SPACE } from '../navigation/GlassTabBar';
import { useCollapseOnScroll } from '../navigation/useCollapseOnScroll';
import { EventCard } from './EventCard';

/** L'état vide illustré (maquette) : un calendrier sur un rond sable, deux éclats. */
function EmptyEvents({ onCreate }: { onCreate(): void }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8 pb-24">
      <View className="mb-3 h-44 w-44 items-center justify-center rounded-full bg-secondary">
        <CalendarCheck size={84} color={colors['title-accent']} strokeWidth={1.3} />
        <View className="absolute right-3 top-4">
          <Sparkles size={26} color={colors.ochre} strokeWidth={1.6} />
        </View>
      </View>
      <Heading level={2} className="text-center">
        {t('events.emptyTitle')}
      </Heading>
      <Text tone="muted" className="text-center">
        {t('events.emptyHint')}
      </Text>
      <Button
        className="mt-3 self-center"
        onPress={onCreate}
        icon={<Plus size={18} color={colors['cta-foreground']} />}
      >
        {t('events.create')}
      </Button>
    </View>
  );
}

/**
 * « Mes événements » (onglet Événements, comme la page /evenements du site) : les événements du
 * client, du plus proche au plus lointain, chacun ouvre son détail. Pas de header global : le titre
 * de l'écran, puis « Créer mon événement ».
 */
export function EventsListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const events = useEvents();
  const onScroll = useCollapseOnScroll();
  const create = () => router.push('/evenements/nouveau');
  const items = events.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1">
        <QueryState
          isPending={events.isPending}
          isError={events.isError}
          onRetry={() => void events.refetch()}
          loadingLabel={t('events.loading')}
        >
          {items.length === 0 ? (
            <>
              <View className="px-5 pt-4">
                <Heading>{t('events.listTitle')}</Heading>
              </View>
              <EmptyEvents onCreate={create} />
            </>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(summary) => summary.event.id}
              renderItem={({ item }) => <EventCard summary={item} />}
              accessibilityLabel={t('events.listTitle')}
              testID="events-list"
              onScroll={onScroll}
              scrollEventThrottle={16}
              contentContainerClassName="gap-3.5 px-5 pt-4"
              contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
              ListHeaderComponent={
                <View className="mb-1 gap-1.5">
                  <Heading>{t('events.listTitle')}</Heading>
                  <Text size="sm" tone="muted">
                    {t('events.listSubtitle')}
                  </Text>
                  <Button
                    fullWidth
                    className="mt-3"
                    onPress={create}
                    icon={<Plus size={18} color={colors['cta-foreground']} />}
                  >
                    {t('events.create')}
                  </Button>
                </View>
              }
            />
          )}
        </QueryState>
      </View>
    </SafeAreaView>
  );
}
