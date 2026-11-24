import { formatPrice } from '@afro/common';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '@/components/brand/Logo';
import { Accent, Button, Card, Heading, Text } from '@/components/ui';
import { DemoDataSections } from '../demo-data/DemoDataSections';
import { TAB_BAR_SPACE } from '../navigation/GlassTabBar';
import { useCollapseOnScroll } from '../navigation/useCollapseOnScroll';

/**
 * Onglet Accueil, provisoire (lots M1 à M4) : il prouve que tout est branché.
 * - Le thème Wenzee (NativeWind, polices, logo) et le code partagé (formatPrice).
 * - Les données de démo (catégories, prestataires à la une) : assez longues pour faire défiler
 *   et voir la barre d'onglets se rétracter en rond.
 * Il sera remplacé par l'accueil de la maquette au lot M6.
 */
export function WelcomeScreen() {
  const onScroll = useCollapseOnScroll();
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerClassName="gap-8 px-6 pt-6"
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
        testID="home-scroll"
      >
        <View className="gap-4">
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
        <DemoDataSections />
      </ScrollView>
    </SafeAreaView>
  );
}
