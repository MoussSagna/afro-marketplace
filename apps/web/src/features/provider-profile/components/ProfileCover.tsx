import { Images } from 'lucide-react';
import type { ReactNode } from 'react';
import { useOverlayNavbar } from '@/stores/navbarOverlay';

interface ProfileCoverProps {
  /** La photo de couverture, sinon la première photo de la galerie. */
  imageUrl?: string;
  providerName: string;
  photoCount: number;
  onOpenGallery(): void;
  /** L'identité du prestataire, posée en bas de la photo. */
  children: ReactNode;
}

/**
 * La couverture de la fiche : photo sur toute la largeur de l'écran, tout en haut de la page
 * (la navbar transparente est posée dessus, comme sur l'accueil).
 *
 * - `object-cover` recadre sans déformer ; la hauteur suit l'écran (plus haute en portrait).
 * - Deux dégradés sombres : en haut pour la navbar, en bas (progressif) pour l'identité en blanc.
 * - Photo la plus importante de la page : chargée en priorité (`fetchPriority="high"`).
 */
export function ProfileCover({
  imageUrl,
  providerName,
  photoCount,
  onOpenGallery,
  children,
}: ProfileCoverProps) {
  useOverlayNavbar();

  return (
    <div
      data-testid="profile-cover"
      className="relative isolate flex min-h-[560px] w-full flex-col justify-end overflow-hidden bg-linear-to-br from-ochre via-primary to-foreground sm:min-h-[500px] lg:min-h-[540px] xl:min-h-[580px]"
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={`Photo de ${providerName}`}
          fetchPriority="high"
          decoding="async"
          width={1600}
          height={600}
          className="absolute inset-0 -z-10 size-full object-cover"
        />
      )}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-36 bg-linear-to-b from-foreground/70 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-[75%] bg-linear-to-t from-foreground/95 via-foreground/55 to-transparent"
      />

      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-4 pt-28 pb-6 sm:pb-8 lg:gap-8 lg:px-6 lg:pb-12">
        {photoCount > 0 && (
          <button
            type="button"
            onClick={onOpenGallery}
            className="inline-flex h-10 items-center gap-2 self-end rounded-full border border-white/70 bg-foreground/35 px-4 text-sm font-medium text-white backdrop-blur-md transition-colors outline-none hover:bg-foreground/60 focus-visible:ring-[3px] focus-visible:ring-white sm:h-11 sm:px-5 sm:text-[15px]"
          >
            <Images className="size-5" aria-hidden />
            Voir toute la galerie ({photoCount})
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
