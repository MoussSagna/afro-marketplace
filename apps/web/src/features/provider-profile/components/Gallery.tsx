import type { Media } from '@afro/common';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

interface GalleryProps {
  media: Media[];
  providerName: string;
}

/**
 * La galerie photo du profil, avec une visionneuse (« lightbox ») plein écran.
 * La visionneuse est un Dialog shadcn/ui : il gère le focus, la touche Échap
 * et le fond assombri. On ajoute la navigation au clavier avec ← et →.
 */
export function Gallery({ media, providerName }: GalleryProps) {
  const images = media.filter((m) => m.type === 'image');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (images.length === 0) return null;

  const current = openIndex === null ? undefined : images[openIndex];
  const go = (step: number) =>
    setOpenIndex((index) =>
      index === null ? null : (index + step + images.length) % images.length,
    );

  return (
    <section aria-labelledby="gallery-title">
      <h2 id="gallery-title" className="mb-4 font-display text-2xl font-semibold">
        Galerie
      </h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map((image, index) => (
          <li key={image.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="block aspect-[4/3] w-full overflow-hidden rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              aria-label={`Agrandir la photo ${index + 1} sur ${images.length}`}
            >
              <img
                src={image.thumbnailUrl ?? image.url}
                alt={image.caption ?? `Photo ${index + 1} de ${providerName}`}
                loading="lazy"
                className="size-full object-cover transition-transform hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={current !== undefined} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent
          className="max-w-4xl gap-3 p-3 sm:max-w-4xl"
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') go(1);
            if (event.key === 'ArrowLeft') go(-1);
          }}
        >
          <DialogTitle className="sr-only">
            Photo {(openIndex ?? 0) + 1} sur {images.length}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Utilise les flèches gauche et droite pour passer d’une photo à l’autre.
          </DialogDescription>
          {current && (
            <img
              src={current.url}
              alt={current.caption ?? `Photo ${(openIndex ?? 0) + 1} de ${providerName}`}
              className="max-h-[75vh] w-full rounded-md object-contain"
            />
          )}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => go(-1)}>
              <ChevronLeft aria-hidden /> Précédente
            </Button>
            <span className="text-sm text-muted-foreground" aria-hidden>
              {(openIndex ?? 0) + 1} / {images.length}
            </span>
            <Button variant="outline" size="sm" onClick={() => go(1)}>
              Suivante <ChevronRight aria-hidden />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
