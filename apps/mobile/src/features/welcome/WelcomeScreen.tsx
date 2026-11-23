import { formatPrice } from '@afro/common';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';

/**
 * Premier écran du lot M1 : il prouve que tout est branché.
 * - Expo + Expo Router affichent un écran sur le téléphone.
 * - L'app importe du code de packages/common (formatPrice), comme le site.
 * Il sera remplacé par le splash et l'accueil (lots M4 et M6).
 */
export function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          Bonjour <Text style={styles.accent}>Wenzee</Text>
        </Text>
        <Text style={styles.subtitle}>
          Les talents qui font vivre nos cultures, bientôt dans ta poche.
        </Text>
        <View style={styles.proof}>
          <Text style={styles.proofLabel}>Formaté par @afro/common :</Text>
          <Text style={styles.proofValue}>À partir de {formatPrice(2500)} / pers.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
  title: { fontSize: 34, fontWeight: '800', color: colors.foreground },
  accent: { color: colors.titleAccent },
  subtitle: { fontSize: 16, lineHeight: 24, color: colors.mutedForeground },
  proof: {
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAD9C7',
    gap: 4,
  },
  proofLabel: { fontSize: 13, color: colors.mutedForeground },
  proofValue: { fontSize: 17, fontWeight: '700', color: colors.primary },
});
