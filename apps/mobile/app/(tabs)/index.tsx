import { Redirect } from 'expo-router';
import { SearchScreen } from '@/features/search/SearchScreen';
import { useModeStore } from '@/stores/mode';
import { useSessionStore } from '@/stores/session';

/**
 * Le premier onglet : la Recherche, écran d'ouverture de l'app (il n'y a plus d'onglet Accueil).
 * Un prestataire resté en mode pro rouvre l'app sur son tableau de bord.
 */
export default function SearchTab() {
  const mode = useModeStore((s) => s.mode);
  const isProvider = useSessionStore((s) => s.user?.roles.includes('provider') ?? false);
  if (mode === 'pro' && isProvider) return <Redirect href="/pro" />;
  return <SearchScreen />;
}
