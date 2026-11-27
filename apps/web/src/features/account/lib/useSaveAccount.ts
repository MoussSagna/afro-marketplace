import {
  accountDefaults,
  accountFormSchema,
  toUpdateMeInput,
  useUpdateMe,
  type AccountFormValues,
  type User,
} from '@afro/common';
import { useSessionStore } from '@/stores/session';

/**
 * Enregistre une partie du compte (« Informations » OU « Notifications »).
 *
 * L'API reçoit le compte ENTIER (`PATCH /me`, un champ facultatif absent est retiré) :
 * on part donc toujours de l'utilisateur à jour dans la session, et on y applique
 * seulement les champs de la rubrique. Ainsi, enregistrer les notifications ne remet pas
 * l'ancien prénom, et inversement. La session est mise à jour avec la réponse du serveur
 * (la navbar suit : prénom, photo).
 */
export function useSaveAccount() {
  const updateMe = useUpdateMe();
  const setUser = useSessionStore((state) => state.setUser);

  async function save(patch: Partial<AccountFormValues>): Promise<User> {
    const user = useSessionStore.getState().user;
    if (!user) throw new Error('Session fermée');
    const values = accountFormSchema.parse({ ...accountDefaults(user), ...patch });
    const updated = await updateMe.mutateAsync(toUpdateMeInput(values));
    setUser(updated);
    return updated;
  }

  return { save, isPending: updateMe.isPending };
}
