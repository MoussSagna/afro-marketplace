import type { Media } from '@afro/common';
import { ImageOff } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { cn } from '@/lib/utils';

interface GalleryProps {
  images: Media[];
  providerName: string;
  /** Ouvre la visionneuse (`PhotoLightbox`, gérée par la page) sur cette photo. */
  onOpen(index: number): void;
}

/**
 * Onglet « Galerie » : une mosaïque (la 1re photo en grand, les autres en vignettes),
 * chaque photo ouvre la visionneuse plein écran.
 */
export function Gallery({ images, providerName, onOpen }: GalleryProps) {
  return (
    <section aria-labelledby="gallery-title" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="gallery-title" className="font-display text-[26px] font-semibold md:text-[32px]">
          Galerie
        </h2>
        <p className="text-muted-foreground">
          {images.length} photo{images.length > 1 ? 's' : ''}
        </p>
      </div>
      {images.length === 0 ? (
        <EmptyState
          icon={ImageOff}
          title="Pas encore de photo"
          description="Ce prestataire n’a pas encore ajouté de photo à sa galerie."
        />
      ) : (
        <ul className="grid auto-rows-[130px] grid-cols-2 gap-3 sm:auto-rows-[170px] sm:grid-cols-3">
          {images.map((image, index) => {
            const large = index === 0 && images.length > 2;
            return (
              <li key={image.id} className={cn(large && 'col-span-2 row-span-2')}>
                <button
                  type="button"
                  onClick={() => onOpen(index)}
                  className="block size-full overflow-hidden rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                  aria-label={`Agrandir la photo ${index + 1} sur ${images.length}`}
                >
                  <img
                    src={large ? image.url : (image.thumbnailUrl ?? image.url)}
                    alt={image.caption ?? `Photo ${index + 1} de ${providerName}`}
                    loading="lazy"
                    decoding="async"
                    width={large ? 1200 : 400}
                    height={large ? 800 : 300}
                    className="size-full object-cover transition-transform duration-300 hover:scale-105 motion-reduce:transition-none"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
