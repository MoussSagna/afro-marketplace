import { formatPrice } from '@afro/common';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '@/components/brand/Logo';
import { Accent, Button, Card, Heading, Text } from '@/components/ui';

/**
 * Écran provisoire (lots M1 et M2) : il prouve que tout est branché.
 * - Le thème Wenzee (NativeWind, polices, logo).
 * - Le code partagé de packages/common (formatPrice).
 * Il sera remplacé par le splash et l'accueil (lots M4 et M6).
 */
export function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" />
      <View className="flex-1 justify-center gap-4 px-6">
        <Logo height={40} />
        <Heading>
          Bonjour <Accent>Wenzee</Accent>
        </Heading>
        <Text tone="muted">Les talents qui font vivre nos cultures, bientôt dans ta poche.</Text>
        <Card className="gap-1 p-4">
          <Text size="xs" tone="muted">
            Formaté par @afro/common :
          </Text>
          <Text weight="bold" tone="primary">
            À partir de {formatPrice(2500)} / pers.
          </Text>
        </Card>
        <Link href="/catalogue" asChild>
          <Button variant="outline">Voir les composants</Button>
        </Link>
      </View>
    </SafeAreaView>
  );
}
