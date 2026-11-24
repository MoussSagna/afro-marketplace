import { View } from 'react-native';
import { Text } from '@/components/ui';

/** Un message d'erreur pour tout le formulaire (ex. « Email ou mot de passe incorrect. »). */
export function FormAlert({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <View
      className="rounded-md bg-destructive/10 p-3"
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Text size="sm" weight="medium" tone="destructive">
        {message}
      </Text>
    </View>
  );
}
