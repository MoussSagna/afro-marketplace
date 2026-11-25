import { DEFAULT_STORAGE_KEY, mockDb } from '@afro/common/mocks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguageStore } from '@/i18n/languageStore';
import { useModeStore } from '@/stores/mode';
import { useSessionStore } from '@/stores/session';
import { useThemeStore } from '@/theme/themeStore';
import { createPreloadedStorage } from './storage/preloadedStorage';

/**
 * Prépare les données de démo au démarrage de l'app (pendant le chargement des polices) :
 * - recharge la base de démo sauvegardée sur le téléphone (demandes, messages… créés
 *   pendant les essais), ou part du jeu de démo s'il n'y a rien ;
 * - recharge la session (qui était connecté), le thème et la langue choisis dans Compte, et le mode (client ou pro).
 * Ensuite, chaque modification de la base est sauvegardée dans AsyncStorage.
 */
export async function prepareDemoData(): Promise<void> {
  const storage = await createPreloadedStorage(AsyncStorage, [DEFAULT_STORAGE_KEY]);
  mockDb.enablePersistence(storage);
  await Promise.all([
    useSessionStore.persist.rehydrate(),
    useThemeStore.persist.rehydrate(),
    useLanguageStore.persist.rehydrate(),
    useModeStore.persist.rehydrate(),
  ]);
}

/**
 * « Réinitialiser les données de démo » (Compte) : la base repart du jeu de démo.
 * Renvoie false si l'utilisateur connecté n'existe plus (un compte créé pendant les essais) :
 * il faut alors le déconnecter.
 */
export function resetDemoData(): boolean {
  mockDb.reset();
  const userId = useSessionStore.getState().user?.id;
  return userId === undefined || mockDb.data.users.some((u) => u.id === userId);
}
