import { useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from '@/components/ui';

const PROVIDERS = ['Google', 'Apple'] as const;

/**
 * « Continuer avec Google / Apple ». Pas encore branché (il faut le vrai back-end, lot 10) :
 * un appui explique que ça arrive bientôt.
 */
export function SocialButtons() {
  const [tapped, setTapped] = useState<(typeof PROVIDERS)[number] | null>(null);
  return (
    <View className="gap-3">
      {PROVIDERS.map((provider) => (
        <Button
          key={provider}
          variant="outline"
          fullWidth
          onPress={() => setTapped(provider)}
        >{`Continuer avec ${provider}`}</Button>
      ))}
      {tapped ? (
        <Text
          size="sm"
          tone="muted"
          className="text-center"
          accessibilityLiveRegion="polite"
        >{`Bientôt disponible : la connexion avec ${tapped} arrive avec la vraie version. En attendant, utilise ton email.`}</Text>
      ) : null}
    </View>
  );
}
