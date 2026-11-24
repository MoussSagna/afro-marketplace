import { Stack } from 'expo-router';
import { Mail, Search } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '@/components/brand/Logo';
import {
  Accent,
  Avatar,
  BackHeader,
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Heading,
  Input,
  Rating,
  Text,
} from '@/components/ui';
// Une image importée devient une « source » pour <Image> (géré par Metro).
import emptyImage from '../../../assets/images/aucun-resultat.webp';
import { useThemeColors } from '@/theme/useTheme';

const ORIGINS = ['Sénégal', 'Mali', "Côte d'Ivoire", 'Cameroun'];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Heading level={3}>{title}</Heading>
      {children}
    </View>
  );
}

/**
 * « Catalogue » : tous les composants de base sur un seul écran, pour relire le design
 * sur un vrai téléphone. Écran de travail, il n'apparaît pas dans la navigation de l'app.
 */
export function CatalogueScreen() {
  const colors = useThemeColors();
  const [origins, setOrigins] = useState<string[]>(['Sénégal']);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleOrigin = (origin: string) =>
    setOrigins((current) =>
      current.includes(origin) ? current.filter((o) => o !== origin) : [...current, origin],
    );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ title: 'Catalogue' }} />
      <BackHeader title="Catalogue des composants" />

      <ScrollView contentContainerClassName="gap-8 px-5 pb-12 pt-2">
        <Section title="Logo">
          <Logo height={36} />
          <View className="flex-row items-center gap-4 rounded-xl bg-primary p-4">
            <Logo variant="light" height={32} />
            <Logo variant="symbol" height={32} />
          </View>
        </Section>

        <Section title="Typographie">
          <Heading>
            Explore nos <Accent>catégories</Accent>
          </Heading>
          <Heading level={2}>Titre de niveau 2</Heading>
          <Heading level={3}>Titre de niveau 3</Heading>
          <Text>Texte courant en Inter, 16 px.</Text>
          <Text size="sm" tone="muted">
            Texte secondaire (argile foncée).
          </Text>
        </Section>

        <Section title="Boutons">
          <Button fullWidth>Demander un devis</Button>
          <Button variant="primary" fullWidth>
            Se connecter
          </Button>
          <Button variant="outline" fullWidth>
            Retirer les filtres
          </Button>
          <View className="flex-row gap-2">
            <Button variant="ghost" size="sm">
              Message
            </Button>
            <Button variant="secondary" size="sm">
              Secondaire
            </Button>
            <Button variant="destructive" size="sm">
              Supprimer
            </Button>
          </View>
          <Button
            fullWidth
            loading={loading}
            onPress={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 1500);
            }}
          >
            Envoyer
          </Button>
          <Button fullWidth disabled>
            Désactivé
          </Button>
        </Section>

        <Section title="Champs">
          <Input
            label="Email"
            placeholder="ton@email.fr"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            icon={<Mail size={16} color={colors['muted-foreground']} />}
            hint="On ne le partage jamais."
          />
          <Input
            label="Date"
            defaultValue="Sam. 21 décembre 2026"
            error="Ce prestataire n'est pas disponible ce jour-là. Choisis une autre date."
          />
          <Input
            label="Recherche"
            placeholder="Traiteur, DJ…"
            icon={<Search size={16} color={colors['muted-foreground']} />}
          />
        </Section>

        <Section title="Pastilles et badges">
          <View className="flex-row flex-wrap gap-2">
            {ORIGINS.map((origin) => (
              <Chip
                key={origin}
                selected={origins.includes(origin)}
                onPress={() => toggleOrigin(origin)}
              >
                {origin}
              </Chip>
            ))}
          </View>
          <View className="flex-row flex-wrap gap-2">
            <Badge variant="success">✓ Vérifié</Badge>
            <Badge variant="sun">Devis reçu</Badge>
            <Badge variant="warning">En attente</Badge>
            <Badge variant="destructive">Expire dans 2 j</Badge>
            <Badge>Discussion</Badge>
          </View>
        </Section>

        <Section title="Cartes, avatars et notes">
          <Card className="flex-row items-center gap-3 p-3">
            <Avatar name="Aïssatou Diallo" />
            <View className="flex-1">
              <Text weight="bold">Aïssatou Diallo</Text>
              <Text size="xs" tone="muted">
                Cliente · prépare un mariage
              </Text>
            </View>
            <Rating value={4.9} count={38} />
          </Card>
          <Rating value={4.4} count={12} variant="full" />
          <Rating value={0} count={0} />
        </Section>

        <Section title="État vide">
          <Card>
            <EmptyState
              image={emptyImage}
              title="Aucun prestataire pour l'instant"
              description="Essaie une autre date, élargis la zone ou retire un filtre."
              action={<Button variant="outline">Retirer les filtres</Button>}
            />
          </Card>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
