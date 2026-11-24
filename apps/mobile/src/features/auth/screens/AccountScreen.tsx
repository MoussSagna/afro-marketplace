import { useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Badge, Button, Card, Heading, Text } from '@/components/ui';
import { useSessionStore } from '@/stores/session';

/**
 * Onglet Compte, connecté (version courte) : qui je suis, et « Se déconnecter ».
 * Le reste (infos, notifications, mode prestataire) arrive au lot M12.
 */
export function AccountScreen() {
  const user = useSessionStore((s) => s.user);
  const signOut = useSessionStore((s) => s.signOut);
  const queryClient = useQueryClient();
  if (!user) return null;
  const name =
    user.lastName && user.lastName !== '-' ? `${user.firstName} ${user.lastName}` : user.firstName;

  function onSignOut() {
    signOut();
    // Les données en cache étaient celles de ce compte.
    queryClient.clear();
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerClassName="gap-6 px-5 pb-32 pt-4">
        <Heading>Compte</Heading>
        <Card className="flex-row items-center gap-4 p-4">
          <Avatar name={name} uri={user.avatarUrl} size="lg" />
          <View className="flex-1 gap-0.5">
            <Text weight="bold">{name}</Text>
            <Text size="sm" tone="muted">
              {user.email}
            </Text>
          </View>
        </Card>
        <View className="items-start gap-2">
          <Badge variant="sun">Lot M12</Badge>
          <Text size="sm" tone="muted">
            Bientôt ici : tes informations, tes notifications et le passage en mode prestataire.
          </Text>
        </View>
        <Button
          variant="outline"
          fullWidth
          icon={<LogOut size={18} color="#7A1F0E" />}
          onPress={onSignOut}
        >
          Se déconnecter
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
