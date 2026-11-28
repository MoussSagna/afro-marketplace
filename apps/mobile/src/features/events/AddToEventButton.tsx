import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarPlus } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppBottomSheetRef } from '@/components/AppBottomSheet';
import { Button } from '@/components/ui';
import { useSessionStore } from '@/stores/session';
import { useThemeColors } from '@/theme/useTheme';
import { AddToEventSheet } from './AddToEventSheet';

/** Le paramètre posé par le formulaire en revenant sur la fiche : l'événement qu'il vient de créer. */
export const CREATED_EVENT_PARAM = 'evenementCree';

type AddToEventButtonProps = {
  providerId: string;
  providerName: string;
  /** L'adresse de la fiche, pour y revenir après « Nouvel événement ». */
  profilePath: string;
  /** Sans compte : ouvrir la connexion (la fiche s'en souvient). */
  onSignIn(): void;
};

/**
 * « Ajouter à un événement » sur la fiche prestataire, comme sur le site. Le bouton ne change pas ;
 * il ouvre le panneau du bas (AddToEventSheet, @gorhom/bottom-sheet) : on touche un événement pour
 * y ajouter le prestataire, ou « Nouvel événement » ouvre le formulaire existant.
 * Après la création, le formulaire ajoute le prestataire et revient ici avec `?evenementCree=…` :
 * le panneau se rouvre et montre le nouvel événement, prestataire ajouté (on ne perd pas le fil).
 */
export function AddToEventButton({
  providerId,
  providerName,
  profilePath,
  onSignIn,
}: AddToEventButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const user = useSessionStore((s) => s.user);
  const sheet = useRef<AppBottomSheetRef>(null);
  const params = useLocalSearchParams<{ [CREATED_EVENT_PARAM]?: string }>();
  const [createdEventId, setCreatedEventId] = useState<string | undefined>();

  // Retour du formulaire : on retient le nouvel événement (pendant le rendu, comme le conseille React),
  // puis on rouvre le panneau et on efface le paramètre (pour ne pas le rouvrir une seconde fois).
  const fromForm = user ? params[CREATED_EVENT_PARAM] : undefined;
  const [seen, setSeen] = useState<string | undefined>();
  if (fromForm && fromForm !== seen) {
    setSeen(fromForm);
    setCreatedEventId(fromForm);
  }
  useEffect(() => {
    if (!fromForm) return;
    sheet.current?.present();
    router.setParams({ [CREATED_EVENT_PARAM]: undefined });
  }, [fromForm, router]);

  const newEvent = () => {
    sheet.current?.dismiss();
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
        onPress={() => (user ? sheet.current?.present() : onSignIn())}
        icon={<CalendarPlus size={18} color={colors.primary} />}
      >
        {t('events.sheet.button')}
      </Button>
      <AddToEventSheet
        ref={sheet}
        providerId={providerId}
        providerName={providerName}
        createdEventId={createdEventId}
        enabled={!!user}
        onCreateEvent={newEvent}
        onDismiss={() => setCreatedEventId(undefined)}
      />
    </>
  );
}
