import type { Media } from '@afro/common';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

interface PhotoLightboxProps {
  images: Media[];
  providerName: string;
  /** La photo affichée, ou `null` quand la visionneuse est fermée. */
  index: number | null;
  onIndexChange(index: number | null): void;
}

/**
 * La visionneuse plein écran (« lightbox ») des photos du profil.
 * Ouverte depuis la grande photo (« Voir toute la galerie ») ou depuis une vignette de la galerie.
 * C'est un Dialog shadcn/ui : il gère le focus, la touche Échap et le fond assombri.
 * On ajoute la navigation au clavier avec ← et →.
 */
export function PhotoLightbox({ images, providerName, index, onIndexChange }: PhotoLightboxProps) {
  const current = index === null ? undefined : images[index];
  const go = (step: number) =>
    onIndexChange(index === null ? null : (index + step + images.length) % images.length);

  return (
    <Dialog open={current !== undefined} onOpenChange={(open) => !open && onIndexChange(null)}>
      <DialogContent
        className="max-w-4xl gap-3 p-3 sm:max-w-4xl"
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') go(1);
          if (event.key === 'ArrowLeft') go(-1);
        }}
      >
        <DialogTitle className="sr-only">
          Photo {(index ?? 0) + 1} sur {images.length}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Utilise les flèches gauche et droite pour passer d’une photo à l’autre.
        </DialogDescription>
        {current && (
          <img
            src={current.url}
            alt={current.caption ?? `Photo ${(index ?? 0) + 1} de ${providerName}`}
            className="max-h-[75vh] w-full rounded-md object-contain"
          />
        )}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => go(-1)}>
            <ChevronLeft aria-hidden /> Précédente
          </Button>
          <span className="text-sm text-muted-foreground" aria-hidden>
            {(index ?? 0) + 1} / {images.length}
          </span>
          <Button variant="outline" size="sm" onClick={() => go(1)}>
            Suivante <ChevronRight aria-hidden />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
