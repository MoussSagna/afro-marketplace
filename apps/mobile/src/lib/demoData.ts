import { DEFAULT_STORAGE_KEY, mockDb } from '@afro/common/mocks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSessionStore } from '@/stores/session';
import { createPreloadedStorage } from './storage/preloadedStorage';

/**
 * Prépare les données de démo au démarrage de l'app (pendant le chargement des polices) :
 * - recharge la base de démo sauvegardée sur le téléphone (demandes, messages… créés
 *   pendant les essais), ou part du jeu de démo s'il n'y a rien ;
 * - recharge la session (qui était connecté).
 * Ensuite, chaque modification de la base est sauvegardée dans AsyncStorage.
 */
export async function prepareDemoData(): Promise<void> {
  const storage = await createPreloadedStorage(AsyncStorage, [DEFAULT_STORAGE_KEY]);
  mockDb.enablePersistence(storage);
  await useSessionStore.persist.rehydrate();
}
