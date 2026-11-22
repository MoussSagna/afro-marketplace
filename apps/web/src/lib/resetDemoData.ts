import type { QueryClient } from '@tanstack/react-query';

/** true si l'application tourne avec les données mockées (MSW). */
export const USES_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

/**
 * Remet les données de démo à zéro (bouton « Réinitialiser les données de démo »).
 * L'import est dynamique : en production sans mocks, ce code n'est jamais téléchargé.
 */
export async function resetDemoData(queryClient: QueryClient) {
  if (!USES_MOCKS) return;
  const { mockDb } = await import('@afro/common/mocks');
  mockDb.reset();
  // Toutes les données en cache sont périmées : on les recharge.
  await queryClient.invalidateQueries();
}
