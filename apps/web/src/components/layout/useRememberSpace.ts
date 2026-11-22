import { useEffect } from 'react';
import { useSessionStore, type Space } from '@/stores/session';

/** Retient l'espace visité, pour que le menu y ramène (compte à deux rôles). */
export function useRememberSpace(space: Space) {
  const setLastSpace = useSessionStore((state) => state.setLastSpace);
  useEffect(() => setLastSpace(space), [space, setLastSpace]);
}
