import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { CATEGORY_MOSAIC } from '../lib/categoryMosaic';
import { CategoryMosaic } from './CategoryMosaic';

/**
 * 2ᵉ section de l'accueil, sous le hero : « Explorez nos univers ».
 * À gauche le texte éditorial, à droite la mosaïque photo des catégories
 * (les icônes sont déjà dans le hero : ici, on découvre par la photo).
 * Téléphone et tablette : le texte au-dessus, la mosaïque dessous.
 */
export function ExploreCategoriesSection() {
  return (
    <section
      aria-labelledby="explore-title"
      className="relative isolate overflow-hidden bg-background"
    >
      <ExploreDecor />
      <div className="mx-auto grid max-w-[1660px] gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[minmax(0,533fr)_minmax(0,1036fr)] lg:items-center lg:gap-[27px] lg:px-8 lg:py-[93px]">
        <div className="max-w-2xl lg:max-w-none lg:pb-[120px]">
          <p className="flex items-center gap-3 text-sm font-bold tracking-[0.08em] text-primary uppercase lg:text-[17px]">
            <span aria-hidden className="h-0.5 w-7 shrink-0 bg-primary" />
            Explorez nos catégories
          </p>
          <h2
            id="explore-title"
            className="mt-5 font-display text-4xl leading-[1.08] font-bold tracking-[-0.01em] sm:text-5xl lg:mt-12 lg:text-[clamp(2rem,2.8vw,3.15rem)]"
          >
            Découvrez nos <br className="hidden sm:inline" />
            <span className="lg:whitespace-nowrap">
              univers <span className="text-title-accent">événementiels</span>
            </span>
          </h2>
          <p className="mt-5 max-w-[490px] text-base leading-relaxed text-muted-foreground lg:mt-9 lg:text-lg">
            Des prestataires de confiance pour tous vos événements, selon vos envies et votre
            culture.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 h-14 px-8 text-base font-semibold lg:mt-11 lg:h-[62px] lg:gap-4 lg:px-10 lg:text-[19px]"
          >
            <Link to="/recherche">
              Voir toutes les catégories
              <ArrowRight className="size-5" aria-hidden />
            </Link>
          </Button>
        </div>

        <CategoryMosaic cards={CATEGORY_MOSAIC} />
      </div>
    </section>
  );
}

/**
 * Décor discret, avec les jetons du thème : deux grands cercles sable et un motif de
 * losanges emboîtés (le même esprit que le losange du logo et les motifs du hero).
 */
function ExploreDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute -top-12 left-[31%] hidden size-[440px] rounded-full bg-muted lg:block" />
      <div className="absolute -bottom-56 left-[24%] hidden size-[560px] rounded-full bg-muted/70 lg:block" />
      <svg
        className="absolute -bottom-4 -left-4 h-[260px] w-[520px] text-secondary"
        viewBox="0 0 520 260"
        fill="none"
      >
        <defs>
          <pattern id="explore-diamonds" width="88" height="88" patternUnits="userSpaceOnUse">
            <g stroke="currentColor" strokeWidth="7">
              <path d="M44 4 L84 44 L44 84 L4 44 Z" />
              <path d="M44 22 L66 44 L44 66 L22 44 Z" />
            </g>
          </pattern>
        </defs>
        <path d="M0 20 Q240 120 520 260 L0 260 Z" fill="url(#explore-diamonds)" opacity="0.7" />
      </svg>
      <svg
        className="absolute -top-6 -left-6 hidden h-[150px] w-[150px] text-secondary lg:block"
        viewBox="0 0 150 150"
        fill="none"
      >
        <path d="M0 0 H150 L0 150 Z" fill="url(#explore-diamonds)" opacity="0.6" />
      </svg>
    </div>
  );
}
