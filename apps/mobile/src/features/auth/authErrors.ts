import { ApiError } from '@afro/common';

/** Le message à montrer : celui du serveur quand il explique l'erreur (avec un code), sinon un message générique. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code) return error.message;
  return 'Un problème est survenu. Réessaie dans un instant.';
}

/** Le code stable renvoyé par le serveur (ex. « email_taken »), s'il y en a un. */
export function errorCode(error: unknown): string | undefined {
  return error instanceof ApiError ? error.code : undefined;
}
