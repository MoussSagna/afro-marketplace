import { z } from 'zod';
import { categorySchema, providerCardSchema } from '../schemas';
import { ApiError, type ApiClient } from './ApiClient';

export interface HttpApiClientOptions {
  /** Préfixe des routes de l'API, « /api » par défaut. */
  baseUrl?: string;
  /** Permet de remplacer fetch (tests, mobile…). */
  fetchFn?: typeof fetch;
}

/**
 * Implémentation de l'ApiClient qui fait de vrais appels HTTP.
 * Chaque réponse est validée avec Zod : si le serveur renvoie des données
 * inattendues, on le voit tout de suite au lieu d'avoir un bug plus loin.
 */
export function createHttpApiClient(options: HttpApiClientOptions = {}): ApiClient {
  const { baseUrl = '/api', fetchFn = (...args) => fetch(...args) } = options;

  async function get<T>(path: string, schema: z.ZodType<T>): Promise<T> {
    // On construit une URL absolue : nécessaire en dehors du navigateur (tests Node, mobile).
    const url = new URL(`${baseUrl}${path}`, globalThis.location?.origin ?? 'http://localhost');
    const response = await fetchFn(url);
    if (!response.ok) {
      throw new ApiError(response.status, `GET ${path} a échoué (${response.status})`);
    }
    return schema.parse(await response.json());
  }

  return {
    listCategories: () => get('/categories', z.array(categorySchema)),
    listFeaturedProviders: () => get('/providers/featured', z.array(providerCardSchema)),
  };
}
