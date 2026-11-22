import type { Category, ProviderCard } from '../types';

/**
 * La liste de toutes les opérations que les écrans peuvent demander au serveur.
 *
 * Les écrans ne connaissent QUE cette interface. Aujourd'hui, elle est servie
 * par une implémentation HTTP qui parle à MSW (données mockées) ; demain, par
 * le vrai back-end (Supabase probablement), sans toucher aux écrans.
 *
 * Elle grandira lot après lot (recherche, demandes de devis, messages…).
 */
export interface ApiClient {
  listCategories(): Promise<Category[]>;
  listFeaturedProviders(): Promise<ProviderCard[]>;
}

/** Erreur renvoyée quand le serveur répond avec un statut d'échec. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
