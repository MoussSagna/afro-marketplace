import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { Text } from './Text';

/** La barre du haut des écrans secondaires : bouton « Retour » et titre. */
export function BackHeader({ title }: { title: string }) {
  const router = useRouter();
  return (
    <View className="flex-row items-center gap-3 px-4 py-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retour"
        onPress={() => router.back()}
        className="min-h-touch min-w-touch items-center justify-center rounded-full border border-border bg-card"
      >
        <ChevronLeft size={22} color="#2B1A12" />
      </Pressable>
      <Text weight="bold">{title}</Text>
    </View>
  );
}
