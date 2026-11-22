import { describe, expect, it } from 'vitest';
import { createMockDb, DEFAULT_STORAGE_KEY, type KeyValueStorage } from './db';

const NOW = new Date('2026-11-22T12:00:00Z');

/** Un faux localStorage, en mémoire. */
function memoryStorage(): KeyValueStorage & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
    removeItem: (key) => void store.delete(key),
  };
}

describe('createMockDb', () => {
  it('démarre avec le jeu de données de démo', () => {
    const db = createMockDb({ now: () => NOW });
    expect(db.data.providers.length).toBeGreaterThanOrEqual(25);
    expect(db.now()).toBe(NOW);
  });

  it('permet de modifier les données et renvoie le résultat de la modification', () => {
    const db = createMockDb({ now: () => NOW });
    const before = db.data.reports.length;
    const count = db.update((data) => {
      data.reports.pop();
      return data.reports.length;
    });
    expect(count).toBe(before - 1);
    expect(db.data.reports).toHaveLength(before - 1);
  });

  it('crée des identifiants uniques et lisibles', () => {
    const db = createMockDb({ now: () => NOW });
    const a = db.newId('qr');
    expect(a).toMatch(/^qr-[0-9a-f]{8}$/);
    expect(db.newId('qr')).not.toBe(a);
  });

  it('se réinitialise sur le jeu de démo', () => {
    const db = createMockDb({ now: () => NOW });
    db.update((data) => void (data.users = []));
    db.reset();
    expect(db.data.users.length).toBeGreaterThan(0);
  });

  describe('avec persistance', () => {
    it('sauvegarde à chaque modification et recharge au démarrage suivant', () => {
      const storage = memoryStorage();
      const first = createMockDb({ now: () => NOW, storage });
      first.update((data) => void (data.users[0]!.firstName = 'Modifiée'));
      expect(storage.store.has(DEFAULT_STORAGE_KEY)).toBe(true);

      const second = createMockDb({ now: () => NOW, storage });
      expect(second.data.users[0]!.firstName).toBe('Modifiée');
    });

    it('ignore une sauvegarde abîmée ou d’un ancien format', () => {
      const storage = memoryStorage();
      storage.setItem(DEFAULT_STORAGE_KEY, '{"users": "pas un tableau"}');
      expect(createMockDb({ now: () => NOW, storage }).data.users.length).toBeGreaterThan(0);

      storage.setItem(DEFAULT_STORAGE_KEY, 'ceci n’est pas du JSON');
      expect(createMockDb({ now: () => NOW, storage }).data.users.length).toBeGreaterThan(0);
    });

    it('efface la sauvegarde à la réinitialisation', () => {
      const storage = memoryStorage();
      const db = createMockDb({ now: () => NOW, storage });
      db.update((data) => void (data.users[0]!.firstName = 'Modifiée'));
      db.reset();
      expect(storage.store.has(DEFAULT_STORAGE_KEY)).toBe(false);
      expect(db.data.users[0]!.firstName).not.toBe('Modifiée');
    });

    it('peut être activée après coup (cas du navigateur)', () => {
      const storage = memoryStorage();
      createMockDb({ now: () => NOW, storage }).update(
        (data) => void (data.users[0]!.firstName = 'Sauvegardée'),
      );

      const db = createMockDb({ now: () => NOW });
      db.enablePersistence(storage);
      expect(db.data.users[0]!.firstName).toBe('Sauvegardée');
    });

    it('continue en mémoire si le stockage est plein', () => {
      const storage = memoryStorage();
      storage.setItem = () => {
        throw new Error('QuotaExceededError');
      };
      const db = createMockDb({ now: () => NOW, storage });
      expect(() => db.update((data) => void data.reports.pop())).not.toThrow();
    });
  });
});
