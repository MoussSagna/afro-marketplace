import type { KeyValueStorage } from '@afro/common/mocks';

/** Ce qu'on utilise d'AsyncStorage (on passe un faux dans les tests). */
export interface AsyncKeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * Transforme AsyncStorage (asynchrone) en stockage synchrone, comme le localStorage.
 *
 * Pourquoi ? La base de démo de `common` a été écrite pour le localStorage du
 * navigateur, qui répond tout de suite. Sur téléphone, AsyncStorage répond
 * « plus tard » (une Promise). Alors :
 * 1. au démarrage, on lit une fois les clés utiles (c'est la seule attente) ;
 * 2. ensuite, on lit dans une copie en mémoire (immédiat) et chaque écriture
 *    part aussi vers AsyncStorage, sans attendre.
 */
export async function createPreloadedStorage(
  asyncStorage: AsyncKeyValueStorage,
  keys: readonly string[],
  onError: (error: unknown) => void = () => {},
): Promise<KeyValueStorage> {
  const cache = new Map<string, string>();
  for (const key of keys) {
    const value = await asyncStorage.getItem(key).catch(() => null);
    if (value !== null) cache.set(key, value);
  }

  return {
    getItem: (key) => cache.get(key) ?? null,
    setItem(key, value) {
      cache.set(key, value);
      asyncStorage.setItem(key, value).catch(onError);
    },
    removeItem(key) {
      cache.delete(key);
      asyncStorage.removeItem(key).catch(onError);
    },
  };
}
