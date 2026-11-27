import { TriangleAlert } from 'lucide-react';
import { useBlocker } from 'react-router';
import { ConfirmDialog } from '@/components/ConfirmDialog';

/**
 * Prévient avant de quitter une rubrique dont les modifications ne sont pas enregistrées
 * (changer de rubrique, d'onglet de l'espace, se déconnecter…). `useBlocker` de React Router
 * retient la navigation ; on la reprend (« Quitter sans enregistrer ») ou on l'annule.
 */
export function useUnsavedChangesGuard(dirty: boolean) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search),
  );

  return (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      onOpenChange={(open) => {
        if (!open && blocker.state === 'blocked') blocker.reset();
      }}
      icon={TriangleAlert}
      title="Quitter sans enregistrer ?"
      description="Vos modifications de cette rubrique seront perdues."
      confirmLabel="Quitter"
      onConfirm={() => blocker.proceed?.()}
    />
  );
}
