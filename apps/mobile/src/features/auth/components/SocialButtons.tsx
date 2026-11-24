import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Button, Text } from '@/components/ui';

const PROVIDERS = ['Google', 'Apple'] as const;

/**
 * « Continuer avec Google / Apple ». Pas encore branché (il faut le vrai back-end, lot 10) :
 * un appui explique que ça arrive bientôt.
 */
export function SocialButtons() {
  const { t } = useTranslation();
  const [tapped, setTapped] = useState<(typeof PROVIDERS)[number] | null>(null);
  return (
    <View className="gap-3">
      {PROVIDERS.map((provider) => (
        <Button key={provider} variant="outline" fullWidth onPress={() => setTapped(provider)}>
          {t('auth.continueWith', { provider })}
        </Button>
      ))}
      {tapped ? (
        <Text size="sm" tone="muted" className="text-center" accessibilityLiveRegion="polite">
          {t('auth.comingSoonProvider', { provider: tapped })}
        </Text>
      ) : null}
    </View>
  );
}
