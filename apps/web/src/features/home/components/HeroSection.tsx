import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { SearchBar } from '@/features/search/components/SearchBar';
import { CATEGORY_SHORTCUTS, HERO_AUTOPLAY_MS, HERO_SLIDES } from '../lib/heroContent';
import { useCarousel } from '../lib/useCarousel';
import { CarouselControls } from './CarouselControls';
import { CategoryShortcuts } from './CategoryShortcuts';
import { HeroCarousel } from './HeroCarousel';
import { HeroDecor } from './HeroDecor';

/**
 * Le hero plein écran de l'accueil (P1) : photos en carrousel en fond, texte et recherche centrés,
 * recherche flottante, catégories populaires et pagination.
 * La navbar transparente est posée au-dessus par `PublicLayout` (composant `Navbar`).
 */
export function HeroSection({ notice }: { notice?: ReactNode }) {
  const reduceMotion = useReducedMotion() ?? false;
  const [focusInside, setFocusInside] = useState(false);
  const [pointerOnControls, setPointerOnControls] = useState(false);
  const pageHidden = usePageHidden();
  const carousel = useCarousel(HERO_SLIDES.length, {
    interval: HERO_AUTOPLAY_MS,
    autoplay: !reduceMotion,
    // Pause pendant que l'utilisateur interagit (clavier ou souris sur la recherche, les
    // catégories, la pagination) et quand l'onglet n'est pas affiché.
    paused: focusInside || pointerOnControls || pageHidden,
  });

  // Balayage horizontal au doigt sur la photo (pas sur la recherche ni sur les catégories).
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  function handlePointerDown(event: PointerEvent) {
    const onControl = (event.target as Element).closest('form, nav, a, button');
    swipeStart.current =
      event.pointerType === 'mouse' || onControl ? null : { x: event.clientX, y: event.clientY };
  }
  function handlePointerUp(event: PointerEvent) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) carousel.next();
    else carousel.previous();
  }

  const pointerHandlers = {
    onPointerEnter: (event: PointerEvent) => {
      if (event.pointerType === 'mouse') setPointerOnControls(true);
    },
    onPointerLeave: () => setPointerOnControls(false),
  };

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-svh touch-pan-y flex-col overflow-hidden bg-foreground text-white"
      onFocus={() => setFocusInside(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocusInside(false);
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <HeroCarousel slides={HERO_SLIDES} index={carousel.index} animate={!reduceMotion} />

      {/* Lisibilité : voile brun général, centré derrière le texte, en haut et en bas (navbar, catégories). */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[62svh] bg-linear-to-b from-foreground/70 via-foreground/10 to-foreground md:h-[70svh] lg:hidden" />
        <div className="absolute inset-0 hidden bg-foreground/25 lg:block" />
        {/* Texte centré : voile doux derrière le bloc central (titre, recherche). */}
        <div className="absolute inset-0 hidden bg-[radial-gradient(ellipse_62%_55%_at_50%_45%,color-mix(in_srgb,var(--foreground)_78%,transparent)_0%,color-mix(in_srgb,var(--foreground)_45%,transparent)_55%,transparent_100%)] lg:block" />
        <div className="absolute inset-x-0 top-0 hidden h-40 bg-linear-to-b from-foreground/60 to-transparent lg:block" />
        <div className="absolute inset-x-0 bottom-0 hidden h-[48%] bg-linear-to-t from-foreground/90 via-foreground/50 to-transparent lg:block" />
      </div>

      <HeroDecor />

      <div className="relative mx-auto flex w-full max-w-[1456px] flex-1 flex-col px-4 pt-[38svh] pb-20 sm:px-6 md:pt-[44svh] md:pb-24 lg:px-8 lg:pt-[150px] lg:pb-[104px]">
        {notice}
        <div className="flex flex-col items-center text-center">
          <p className="flex items-center justify-center gap-3 text-[11px] font-semibold tracking-[0.02em] text-white/90 uppercase sm:gap-4 sm:text-sm lg:text-[17px] lg:tracking-[0.02em]">
            <span aria-hidden className="hidden h-0.5 w-11 shrink-0 bg-cta sm:block" />
            La marketplace afro et caribéenne en France
            <span aria-hidden className="hidden h-0.5 w-11 shrink-0 bg-cta sm:block" />
          </p>
          <h1
            id="hero-title"
            className="mt-4 max-w-[680px] font-display text-[2.6rem] leading-[1.02] font-bold tracking-[-0.01em] text-balance sm:text-6xl lg:mt-6 lg:text-[72px] lg:leading-[0.92]"
          >
            Trouvez les talents <br className="hidden sm:inline" />
            qui subliment <br className="hidden sm:inline" />
            <span className="relative inline-block text-cta">
              vos événements.
              <svg
                aria-hidden
                className="absolute -bottom-2 left-[4%] h-3 w-[92%] lg:-bottom-4 lg:h-4"
                viewBox="0 0 500 16"
                preserveAspectRatio="none"
                fill="none"
              >
                <path
                  d="M3 12 C 110 4, 300 1, 497 7"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <p className="mt-6 max-w-[480px] text-base leading-relaxed text-white/90 sm:text-lg lg:mt-10 lg:text-[21px] lg:leading-[1.6]">
            Traiteurs, artistes, DJ, danseurs, beauté, mode, décoration et bien plus encore.
          </p>
        </div>

        <div {...pointerHandlers}>
          <SearchBar className="mt-7 lg:mx-auto" />
        </div>
        <div className="mt-7 lg:mt-6" {...pointerHandlers}>
          <CategoryShortcuts shortcuts={CATEGORY_SHORTCUTS} />
        </div>

        <div className="mt-auto pt-4" {...pointerHandlers}>
          <CarouselControls
            labels={HERO_SLIDES.map((slide) => slide.label)}
            index={carousel.index}
            onSelect={carousel.goTo}
            onPrevious={carousel.previous}
            onNext={carousel.next}
            canPlay={carousel.canPlay}
            playing={carousel.playing}
            onTogglePlay={carousel.togglePlay}
          />
        </div>
      </div>
    </section>
  );
}

/** Vrai quand l'onglet est en arrière-plan : inutile de faire défiler les photos. */
function usePageHidden() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const update = () => setHidden(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return hidden;
}
