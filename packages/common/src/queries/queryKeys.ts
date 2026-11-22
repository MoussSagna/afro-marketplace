/**
 * Les « clés de cache » de TanStack Query, rangées au même endroit.
 * Après une modification (ex. accepter un devis), on invalide une clé
 * et TanStack Query recharge tout seul les écrans concernés.
 */
export const queryKeys = {
  auth: {
    demoAccounts: ['auth', 'demo-accounts'] as const,
    me: ['auth', 'me'] as const,
  },
  categories: ['categories'] as const,
  providers: {
    all: ['providers'] as const,
    featured: () => [...queryKeys.providers.all, 'featured'] as const,
  },
};
