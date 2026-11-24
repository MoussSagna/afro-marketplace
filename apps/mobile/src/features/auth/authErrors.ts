import { ApiError } from '@afro/common';

/**
 * Le code stable renvoyé par le serveur (ex. « email_taken »), s'il y en a un.
 * Le texte à montrer, lui, vient de useErrorText (traduit).
 */
export function errorCode(error: unknown): string | undefined {
  return error instanceof ApiError ? error.code : undefined;
}
