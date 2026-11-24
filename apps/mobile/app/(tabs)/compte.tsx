import { SignInRequired } from '@/features/auth/SignInRequired';
import { AccountScreen } from '@/features/auth/screens/AccountScreen';

export default function AccountTab() {
  return (
    <SignInRequired title="Compte" reason="Connecte-toi pour retrouver ton compte et tes infos.">
      <AccountScreen />
    </SignInRequired>
  );
}
