import { useEffect, useState } from 'react';

/**
 * Vrai dès que la page a défilé de plus de `threshold` pixels.
 * Sert à la navbar de l'accueil : transparente en haut, fond flouté ensuite.
 */
export function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > threshold);
    };
    // Un seul calcul par image affichée, même si le navigateur envoie beaucoup d'événements.
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return scrolled;
}
