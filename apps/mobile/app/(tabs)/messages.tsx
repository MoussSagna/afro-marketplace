import { SignInRequired } from '@/features/auth/SignInRequired';
import { ComingSoonScreen } from '@/features/coming-soon/ComingSoonScreen';

export default function MessagesTab() {
  return (
    <SignInRequired title="Messages" reason="Connecte-toi pour discuter avec les prestataires.">
      <ComingSoonScreen
        title="Messages"
        lot="M10"
        description="Discuter avec les prestataires à qui tu as demandé un devis."
      />
    </SignInRequired>
  );
}
