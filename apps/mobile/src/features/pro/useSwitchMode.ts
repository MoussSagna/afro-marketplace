import { useRouter } from 'expo-router';
import { useModeStore } from '@/stores/mode';

/** Passer d'un mode à l'autre : on change le mode retenu, puis on ouvre ses onglets. */
export function useSwitchMode() {
  const router = useRouter();
  const setMode = useModeStore((s) => s.setMode);
  return {
    toPro: () => {
      setMode('pro');
      router.replace('/pro');
    },
    toClient: () => {
      setMode('client');
      router.replace('/compte');
    },
  };
}
