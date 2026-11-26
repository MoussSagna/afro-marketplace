import { useEffect, useState } from 'react';

interface ScrollHeaderOptions {
  /** Au-delà de ce défilement (px), la navbar passe en mode « compact » (fond brun, plus basse). */
  threshold?: number;
  /** En dessous de ce défilement (px), la navbar ne se cache jamais (haut de page, hero). */
  hideAfter?: number;
  /** Les petits mouvements (moins de `tolerance` px) sont ignorés : pas de clignotement. */
  tolerance?: number;
  /** Faux : la navbar ne se cache jamais (ex. « réduire les animations » activé). */
  canHide?: boolean;
}

/**
 * L'état de la navbar selon le défilement :
 * - `scrolled` : vrai dès qu'on a quitté le haut de la page ;
 * - `hidden` : vrai quand on descend (on lit, la navbar s'efface), faux dès qu'on remonte.
 *
 * Un seul calcul par image affichée (`requestAnimationFrame`), même si le navigateur envoie
 * beaucoup d'événements `scroll`.
 */
export function useScrollHeader({
  threshold = 24,
  hideAfter = 320,
  tolerance = 6,
  canHide = true,
}: ScrollHeaderOptions = {}) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let frame = 0;
    // Dernière position où l'on a « décidé » : on compare la position actuelle à celle-ci.
    let lastY = window.scrollY;
    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY); // Safari : défilement élastique négatif en haut.
      setScrolled(y > threshold);
      if (!canHide || y <= hideAfter) {
        setHidden(false);
        lastY = y;
        return;
      }
      const delta = y - lastY;
      if (Math.abs(delta) < tolerance) return;
      setHidden(delta > 0);
      lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [threshold, hideAfter, tolerance, canHide]);

  return { scrolled, hidden };
}
