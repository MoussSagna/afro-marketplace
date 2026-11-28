import { useEvent } from '@afro/common';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { QueryState } from '@/components/QueryState';
import { EventFormScreen } from './EventFormScreen';

/** Modifier un événement : le MÊME formulaire que la création, prérempli. */
export function EditEventScreen() {
  const { eventId = '' } = useLocalSearchParams<{ eventId: string }>();
  const { t } = useTranslation();
  const event = useEvent(eventId);
  return (
    <View className="flex-1 bg-background">
      <QueryState
        isPending={event.isPending}
        isError={event.isError}
        onRetry={() => void event.refetch()}
        loadingLabel={t('events.detail.loading')}
      >
        {event.data ? <EventFormScreen existing={event.data.event} /> : null}
      </QueryState>
    </View>
  );
}
