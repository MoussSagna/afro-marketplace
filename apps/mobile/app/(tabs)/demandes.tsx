import { SignInRequired } from '@/features/auth/SignInRequired';
import { ComingSoonScreen } from '@/features/coming-soon/ComingSoonScreen';

export default function RequestsTab() {
  return (
    <SignInRequired title="Demandes" reason="Connecte-toi pour suivre tes demandes de devis.">
      <ComingSoonScreen
        title="Demandes"
        lot="M10"
        description="Suivre tes demandes de devis, les devis reçus et tes réservations."
      />
    </SignInRequired>
  );
}
