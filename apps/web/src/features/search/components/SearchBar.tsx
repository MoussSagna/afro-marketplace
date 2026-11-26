import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useHeroSearchInView } from '../lib/searchDraft';
import { MobileSearch } from './guided-search/MobileSearch';
import { SearchPill } from './guided-search/SearchPill';

/**
 * La recherche du hero (P1) : « Quoi ? / Où ? / Quand ? », inspirée du parcours d'Airbnb.
 * - tablette et ordinateur : une pilule à trois segments, chacun ouvre son panneau ;
 * - téléphone : un grand bouton qui ouvre une recherche plein écran, étape par étape.
 * Les deux mènent à la page de résultats avec les filtres dans l'adresse.
 * Quand elle sort de l'écran, l'en-tête prend le relais avec sa version compacte.
 * Le détail est dans `guided-search/`.
 */
export function SearchBar({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const setInView = useHeroSearchInView((state) => state.setInView);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // La marge du haut compte la hauteur de l'en-tête : sous l'en-tête, la barre n'est plus utilisable.
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? true),
      { rootMargin: '-72px 0px 0px 0px' },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      setInView(true);
    };
  }, [setInView]);

  return (
    <div ref={ref} className={cn('w-full', className)}>
      <SearchPill className="hidden md:block lg:mx-auto lg:max-w-[1120px]" />
      <MobileSearch className="md:hidden" />
    </div>
  );
}
