import { mockDataSchema, type MockData } from './data';
import { buildSeed } from './seed/buildSeed';
import { DEMO_PASSWORD } from './seed/people';

/** Un stockage clé/valeur comme le localStorage (on accepte aussi un faux, pour les tests). */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface MockDbOptions {
  /** L'horloge de la base. Les tests passent une date fixe. */
  now?: () => Date;
  /** Si fourni, les données survivent au rechargement de la page. */
  storage?: KeyValueStorage;
  /** Change ce numéro quand la forme des données change : l'ancienne sauvegarde sera ignorée. */
  storageKey?: string;
}

export interface MockDb {
  /** Les tables. On les lit et on les modifie directement, puis on appelle `save()`. */
  readonly data: MockData;
  /** L'heure « actuelle » de la base (fixe dans les tests). */
  now(): Date;
  /** Un nouvel identifiant unique, préfixé pour rester lisible : « qr-3f9a1c2b ». */
  newId(prefix: string): string;
  /**
   * Modifie la base puis sauvegarde. Le résultat de `change` est renvoyé :
   *   const request = db.update((data) => { … ; return request; });
   */
  update<T>(change: (data: MockData) => T): T;
  /** Sauvegarde dans le stockage (s'il y en a un). */
  save(): void;
  /** Repart du jeu de données de démo (bouton « Réinitialiser les données »). */
  reset(): void;
  /**
   * Active la sauvegarde (le localStorage dans le navigateur) : recharge la
   * sauvegarde précédente si elle est valide, puis sauvegarde à chaque `update`.
   */
  enablePersistence(storage: KeyValueStorage): void;
}

/** v3 (27/11/2026) : tables `events` et `eventProviders` ; la démo repart du seed qui les contient. */
export const DEFAULT_STORAGE_KEY = 'afro-marketplace:mock-db:v3';

/**
 * La base de données en mémoire utilisée par les handlers MSW.
 *
 * Contrairement au seed (figé), elle se MODIFIE : envoyer une demande l'ajoute
 * vraiment, accepter un devis crée vraiment la réservation. Les handlers
 * s'appuient sur les règles de common/rules : le faux serveur se comporte
 * comme le vrai le fera.
 */
export function createMockDb(options: MockDbOptions = {}): MockDb {
  const { now = () => new Date(), storageKey = DEFAULT_STORAGE_KEY } = options;
  let storage = options.storage;

  let data = load() ?? buildSeed(now());

  /** Relit la sauvegarde. Si elle est absente, illisible ou d'un ancien format : on l'ignore. */
  function load(): MockData | null {
    if (!storage) return null;
    try {
      const raw = storage.getItem(storageKey);
      if (!raw) return null;
      const parsed = mockDataSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) return null;
      // Sauvegarde d'avant la connexion par email (M5) : on donne le mot de passe de démo à chacun.
      if (parsed.data.credentials.length === 0) {
        parsed.data.credentials = parsed.data.users.map((user) => ({
          userId: user.id,
          email: user.email.toLowerCase(),
          password: DEMO_PASSWORD,
        }));
      }
      return parsed.data;
    } catch {
      return null;
    }
  }

  const db: MockDb = {
    get data() {
      return data;
    },
    now,
    newId(prefix) {
      return `${prefix}-${globalThis.crypto.randomUUID().slice(0, 8)}`;
    },
    update(change) {
      const result = change(data);
      db.save();
      return result;
    },
    save() {
      try {
        storage?.setItem(storageKey, JSON.stringify(data));
      } catch {
        // Stockage plein ou désactivé (navigation privée) : on continue en mémoire.
      }
    },
    reset() {
      storage?.removeItem(storageKey);
      data = buildSeed(now());
    },
    enablePersistence(newStorage) {
      storage = newStorage;
      data = load() ?? data;
    },
  };

  return db;
}
