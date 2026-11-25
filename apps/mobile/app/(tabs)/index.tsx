import { Redirect } from 'expo-router';
import { HomeScreen } from '@/features/home/HomeScreen';
import { useModeStore } from '@/stores/mode';
import { useSessionStore } from '@/stores/session';

/** L'accueil. Un prestataire resté en mode pro rouvre l'app sur son tableau de bord. */
export default function HomeTab() {
  const mode = useModeStore((s) => s.mode);
  const isProvider = useSessionStore((s) => s.user?.roles.includes('provider') ?? false);
  if (mode === 'pro' && isProvider) return <Redirect href="/pro" />;
  return <HomeScreen />;
}
