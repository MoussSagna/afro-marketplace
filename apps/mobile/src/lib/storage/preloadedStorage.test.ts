import { createPreloadedStorage, type AsyncKeyValueStorage } from './preloadedStorage';

/** Un faux AsyncStorage : une Map derrière des Promises. */
function fakeAsyncStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  const storage: AsyncKeyValueStorage = {
    getItem: jest.fn(async (key: string) => map.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      map.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      map.delete(key);
    }),
  };
  return { storage, map };
}

describe('createPreloadedStorage', () => {
  it('lit les clés demandées une seule fois, puis répond tout de suite', async () => {
    const { storage } = fakeAsyncStorage({ base: '{"a":1}', autre: 'x' });
    const sync = await createPreloadedStorage(storage, ['base']);

    expect(sync.getItem('base')).toBe('{"a":1}');
    expect(sync.getItem('autre')).toBeNull(); // pas préchargée
    expect(storage.getItem).toHaveBeenCalledTimes(1);
  });

  it('écrit dans la copie en mémoire et dans AsyncStorage', async () => {
    const { storage, map } = fakeAsyncStorage();
    const sync = await createPreloadedStorage(storage, ['base']);

    sync.setItem('base', 'v2');
    expect(sync.getItem('base')).toBe('v2');
    await Promise.resolve();
    expect(map.get('base')).toBe('v2');

    sync.removeItem('base');
    expect(sync.getItem('base')).toBeNull();
    await Promise.resolve();
    expect(map.has('base')).toBe(false);
  });

  it("continue en mémoire si AsyncStorage échoue, et signale l'erreur", async () => {
    const onError = jest.fn();
    const storage: AsyncKeyValueStorage = {
      getItem: () => Promise.reject(new Error('lecture impossible')),
      setItem: () => Promise.reject(new Error('disque plein')),
      removeItem: () => Promise.resolve(),
    };
    const sync = await createPreloadedStorage(storage, ['base'], onError);

    expect(sync.getItem('base')).toBeNull();
    sync.setItem('base', 'v1');
    expect(sync.getItem('base')).toBe('v1');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onError).toHaveBeenCalledWith(new Error('disque plein'));
  });
});
