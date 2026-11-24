import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { AnimatedSplash } from './AnimatedSplash';

// Le splash natif (fond terre + symbole, réglé dans app.json) reste affiché
// tant qu'on ne l'a pas caché nous-mêmes : pas d'écran blanc au démarrage.
SplashScreen.preventAutoHideAsync().catch(() => {});

type SplashGateProps = {
  /** Polices et données de démo chargées. */
  ready: boolean;
  children: ReactNode;
};

/**
 * L'enchaînement du démarrage :
 * 1. tant que l'app charge : le splash natif (statique) ;
 * 2. dès qu'elle est prête : on cache le natif, l'app est dessinée derrière,
 *    et le splash animé joue par-dessus ;
 * 3. à la fin de l'animation : le splash animé disparaît, l'app est déjà là.
 */
export function SplashGate({ ready, children }: SplashGateProps) {
  const [animationDone, setAnimationDone] = useState(false);
  const finish = useCallback(() => setAnimationDone(true), []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <View style={{ flex: 1 }}>
      {/* Tant que le splash est là, l'app derrière est ignorée par VoiceOver / TalkBack. */}
      <View
        style={{ flex: 1 }}
        importantForAccessibility={animationDone ? 'auto' : 'no-hide-descendants'}
        accessibilityElementsHidden={!animationDone}
      >
        {children}
      </View>
      {animationDone ? null : <AnimatedSplash onFinish={finish} />}
    </View>
  );
}
