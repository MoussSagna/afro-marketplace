import { errorKeyOf } from '@afro/common/i18n';
import { ApiError } from '@afro/common';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Traduit les messages d'erreur venus de `common` :
 * - `fieldError(message)` : un message d'un schéma Zod (« Adresse email invalide »), sous un champ ;
 * - `apiError(error)` : une erreur du serveur, par son code (« invalid_code »), sinon un message générique.
 */
export function useErrorText() {
  const { t } = useTranslation();
  // Les clés sont typées ; ici elles sont calculées à l'exécution, on relâche donc le typage.
  const tAny = t as unknown as (key: string, options?: Record<string, unknown>) => string;

  const fieldError = useCallback(
    (message: string | undefined) => {
      if (!message) return undefined;
      const found = errorKeyOf(message);
      return found ? tAny(found.key, found.values) : message;
    },
    [tAny],
  );

  const apiError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.code) {
        return tAny(`apiErrors.${error.code}`, { defaultValue: error.message });
      }
      return t('errors.generic');
    },
    [t, tAny],
  );

  return { fieldError, apiError };
}
