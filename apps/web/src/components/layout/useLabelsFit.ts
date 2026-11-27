import { useLayoutEffect, useState, type RefObject } from 'react';

let canvas: HTMLCanvasElement | undefined;

/** La largeur d'un texte sur une ligne, avec la police réellement affichée (`font` calculé). */
function textWidth(text: string, font: string): number {
  canvas ??= document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return 0;
  context.font = font;
  return context.measureText(text).width;
}

/**
 * Vrai si chaque libellé (`[data-label]`) des liens de `listRef` tient sur une seule ligne dans son lien.
 *
 * Le CSS ne sait pas dire « ce texte passe à la ligne » : on mesure la largeur du texte (police calculée,
 * gras compris pour l'onglet actif) et on la compare à la place disponible (largeur du lien moins ses marges).
 * Recalculé quand la liste change de largeur (rotation, fenêtre redimensionnée) ou quand `deps` change
 * (onglet actif, pastille…). Ne s'applique que sous `maxWidthQuery` (téléphone) ; au-delà, toujours vrai.
 * Sans mise en page (jsdom, tests), on considère que tout tient.
 */
export function useLabelsFit(
  listRef: RefObject<HTMLElement | null>,
  { enabled, maxWidthQuery, deps }: { enabled: boolean; maxWidthQuery: string; deps: unknown },
) {
  const [fit, setFit] = useState(true);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!enabled || !list || typeof ResizeObserver === 'undefined') return;
    const media = window.matchMedia?.(maxWidthQuery);

    const measure = () => {
      if (media && !media.matches) return setFit(true);
      const links = [...list.querySelectorAll<HTMLElement>('a')];
      if (links.some((link) => link.clientWidth === 0)) return setFit(true);
      setFit(
        links.every((link) => {
          const label = link.querySelector<HTMLElement>('[data-label]');
          if (!label) return true;
          const style = getComputedStyle(link);
          const available =
            link.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
          return textWidth(label.textContent ?? '', getComputedStyle(label).font) <= available;
        }),
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    media?.addEventListener?.('change', measure);
    // Les polices web arrivent parfois après le premier rendu : on remesure une fois chargées.
    void document.fonts?.ready.then(measure);
    return () => {
      observer.disconnect();
      media?.removeEventListener?.('change', measure);
    };
  }, [listRef, enabled, maxWidthQuery, deps]);

  return fit;
}
