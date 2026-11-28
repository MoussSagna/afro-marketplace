import { useAddEventProvider, useEvents } from '@afro/common';
import { useRouter } from 'expo-router';
import { CalendarPlus, Check, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { QueryState } from '@/components/QueryState';
import { Button, Text } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { useLanguage } from '@/i18n/useLanguage';
import { eventDay } from '@/lib/dates';
import { useSessionStore } from '@/stores/session';
import { toast } from '@/stores/toasts';
import { useThemeColors } from '@/theme/useTheme';

type AddToEventButtonProps = {
  providerId: string;
  providerName: string;
  /** L'adresse de la fiche, pour y revenir après « Nouvel événement ». */
  profilePath: string;
  /** Sans compte : ouvrir la connexion (la fiche s'en souvient). */
  onSignIn(): void;
};

/**
 * « Ajouter à un événement » sur la fiche prestataire, comme sur le site : un panneau liste mes
 * événements (« Ajouter » ou « Ajouté ») et propose « Nouvel événement » (formulaire, prestataire
 * ajouté à la fin, puis retour sur la fiche).
 */
export function AddToEventButton({
  providerId,
  providerName,
  profilePath,
  onSignIn,
}: AddToEventButtonProps) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { apiError } = useErrorText();
  const router = useRouter();
  const colors = useThemeColors();
  const user = useSessionStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const events = useEvents({ enabled: open && !!user });
  const add = useAddEventProvider();

  const newEvent = () => {
    setOpen(false);
    router.push({
      pathname: '/evenements/nouveau',
      params: { prestataire: providerId, retour: profilePath },
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="md"
        fullWidth
        onPress={() => (user ? setOpen(true) : onSignIn())}
        icon={<CalendarPlus size={18} color={colors.primary} />}
      >
        {t('events.sheet.button')}
      </Button>
      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={t('events.sheet.title')}
        closeLabel={t('common.close')}
        footer={
          <Button
            variant="outline"
            fullWidth
            onPress={newEvent}
            icon={<Plus size={18} color={colors.primary} />}
          >
            {t('events.sheet.newEvent')}
          </Button>
        }
      >
        <QueryState
          isPending={events.isPending}
          isError={events.isError}
          onRetry={() => void events.refetch()}
          loadingLabel={t('events.loading')}
        >
          {(events.data ?? []).length === 0 ? (
            <Text tone="muted" className="py-4 text-center">
              {t('events.sheet.noEvents')}
            </Text>
          ) : (
            <View className="gap-1">
              {(events.data ?? []).map(({ event, providerIds }) => {
                const added = providerIds.includes(providerId);
                return (
                  <View
                    key={event.id}
                    className="flex-row items-center gap-3 border-b border-border py-3"
                  >
                    <View className="flex-1">
                      <Text weight="bold" numberOfLines={1}>
                        {event.name}
                      </Text>
                      <Text size="xs" tone="muted">
                        {`${eventDay(event.date, locale)} · ${event.city}`}
                      </Text>
                    </View>
                    {added ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled
                        accessibilityLabel={t('events.sheet.addedLabel', { name: event.name })}
                        icon={<Check size={15} color={colors['secondary-foreground']} />}
                      >
                        {t('events.sheet.added')}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={add.isPending}
                        accessibilityLabel={t('events.sheet.addLabel', { name: event.name })}
                        onPress={() =>
                          add.mutate(
                            { eventId: event.id, providerId },
                            {
                              onSuccess: () =>
                                toast({
                                  title: t('events.add.addedToast'),
                                  description: t('events.add.addedToastHint', {
                                    name: providerName,
                                    event: event.name,
                                  }),
                                }),
                              onError: (error) =>
                                toast({
                                  tone: 'info',
                                  title: t('events.add.addFailed'),
                                  description: apiError(error),
                                }),
                            },
                          )
                        }
                        icon={<Plus size={15} color={colors['cta-foreground']} />}
                      >
                        {t('events.sheet.add')}
                      </Button>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </QueryState>
      </BottomSheet>
    </>
  );
}
