import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import type { MosaicCard } from '../lib/categoryMosaic';

interface CategoryImageCardProps {
  card: MosaicCard;
  href: string;
  /** Tailles affichées de l'image (`sizes`), pour que le navigateur choisisse le bon fichier. */
  sizes: string;
  className?: string;
}

/**
 * Une carte photo de catégorie : la photo remplit la carte, un dégradé sombre en bas
 * garde le nom lisible. Au survol : la carte se soulève et la photo zoome légèrement
 * (rien ne bouge si « réduire les animations » est activé).
 */
export function CategoryImageCard({ card, href, sizes, className }: CategoryImageCardProps) {
  const { image } = card;
  return (
    <Link
      to={href}
      className={cn(
        'group relative isolate block size-full overflow-hidden rounded-2xl bg-foreground shadow-card outline-none',
        'transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-pop',
        'focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        className,
      )}
    >
      <img
        src={image.src}
        srcSet={image.srcSet}
        sizes={sizes}
        width={image.width}
        height={image.height}
        alt=""
        loading="lazy"
        decoding="async"
        style={
          {
            '--pos-mobile': image.position.mobile,
            '--pos-desktop': image.position.desktop,
          } as CSSProperties
        }
        className="absolute inset-0 -z-10 size-full [object-position:var(--pos-mobile)] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100 md:[object-position:var(--pos-desktop)]"
      />
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-3/4 bg-linear-to-t from-foreground/90 via-foreground/40 to-transparent"
      />
      <span className="absolute bottom-4 left-5 text-xl leading-tight font-bold text-white sm:text-2xl lg:bottom-7 lg:left-9 lg:text-[26px]">
        {card.label}
      </span>
    </Link>
  );
}
