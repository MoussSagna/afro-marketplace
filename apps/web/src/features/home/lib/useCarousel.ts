import { useCallback, useEffect, useState } from 'react';

interface UseCarouselOptions {
  /** Délai entre deux slides en défilement automatique (ms). */
  interval: number;
  /** Défilement automatique autorisé (faux si « réduire les animations »). */
  autoplay: boolean;
  /** Pause temporaire : survol, focus clavier, onglet masqué… */
  paused: boolean;
}

/**
 * L'état d'un carrousel : la slide affichée, avancer / reculer / aller à (balayage au doigt),
 * et le défilement automatique. Toute navigation manuelle relance le minuteur
 * (on ne change pas de photo une seconde après un clic).
 */
export function useCarousel(count: number, { interval, autoplay, paused }: UseCarouselOptions) {
  const [index, setIndex] = useState(0);
  // Incrémenté à chaque action manuelle : relance le minuteur.
  const [restart, setRestart] = useState(0);

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % count) + count) % count);
      setRestart((value) => value + 1);
    },
    [count],
  );
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const previous = useCallback(() => goTo(index - 1), [goTo, index]);

  const playing = autoplay && count > 1;

  useEffect(() => {
    if (!playing || paused) return;
    const timer = window.setTimeout(() => setIndex((value) => (value + 1) % count), interval);
    return () => window.clearTimeout(timer);
  }, [playing, paused, interval, count, index, restart]);

  return {
    index,
    goTo,
    next,
    previous,
  };
}
