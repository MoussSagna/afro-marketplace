import {
  accountFormSchema,
  toUpdateMeInput,
  useUpdateMe,
  type AccountFormValues,
} from '@afro/common';
import { useState } from 'react';
import { useSessionStore } from '@/stores/session';

export type AccountErrors = Partial<Record<'firstName' | 'lastName' | 'phone', string>>;

/**
 * Enregistre le compte (infos et notifications partagent le même envoi, comme sur le site) :
 * vérifie le formulaire, l'envoie, puis met à jour l'utilisateur de la session.
 */
export function useSaveAccount() {
  const updateMe = useUpdateMe();
  const setUser = useSessionStore((s) => s.setUser);
  const [errors, setErrors] = useState<AccountErrors>({});
  const [saved, setSaved] = useState(false);

  const save = (values: AccountFormValues) => {
    setSaved(false);
    const parsed = accountFormSchema.safeParse(values);
    if (!parsed.success) {
      const next: AccountErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof AccountErrors;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    updateMe.mutate(toUpdateMeInput(parsed.data), {
      onSuccess: (user) => {
        setUser(user);
        setSaved(true);
      },
    });
  };

  return { save, errors, saved, mutation: updateMe };
}
