import { cn } from '@/lib/utils';
import type { MosaicCard, MosaicLayout } from '../lib/categoryMosaic';
import { categorySearchUrl } from '../lib/homeCategories';
import { CategoryImageCard } from './CategoryImageCard';

/**
 * Où va chaque carte selon l'écran :
 * - téléphone : 2 colonnes ; la grande carte et la dernière prennent toute la largeur ;
 * - tablette et ordinateur : 3 colonnes, la grande carte sur 2 lignes (comme la maquette).
 */
const LAYOUT: Record<MosaicLayout, { cell: string; sizes: string }> = {
  featured: {
    cell: 'col-span-2 aspect-[4/5] sm:aspect-[16/11] md:col-span-1 md:row-span-2 md:aspect-auto',
    sizes: '(min-width: 1024px) 22vw, (min-width: 768px) 33vw, 100vw',
  },
  wide: {
    cell: 'col-span-2 aspect-[16/9] md:col-span-1 md:aspect-auto',
    sizes: '(min-width: 1024px) 22vw, (min-width: 768px) 33vw, 100vw',
  },
  regular: {
    cell: 'aspect-[4/5] md:aspect-auto',
    sizes: '(min-width: 1024px) 22vw, (min-width: 768px) 33vw, 50vw',
  },
};

/** La mosaïque photo asymétrique des catégories (8 cartes de tailles variées). */
export function CategoryMosaic({ cards, className }: { cards: MosaicCard[]; className?: string }) {
  return (
    <ul
      aria-label="Univers Wenzee"
      className={cn(
        'grid grid-cols-2 gap-3 sm:gap-4 md:aspect-[1036/716] md:grid-cols-3 md:grid-rows-[257fr_260fr_170fr] md:gap-3.5',
        className,
      )}
    >
      {cards.map((card) => (
        <li key={card.id} className={LAYOUT[card.layout].cell}>
          <CategoryImageCard
            card={card}
            href={categorySearchUrl(card.categorySlug)}
            sizes={LAYOUT[card.layout].sizes}
          />
        </li>
      ))}
    </ul>
  );
}
