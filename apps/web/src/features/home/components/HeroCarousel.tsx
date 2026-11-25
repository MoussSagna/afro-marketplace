import { motion } from 'motion/react';
import { useState, type CSSProperties } from 'react';
import type { HeroSlide } from '../lib/heroContent';

interface HeroCarouselProps {
  slides: HeroSlide[];
  index: number;
  /** Faux si « réduire les animations » : pas de zoom lent ni de fondu long. */
  animate: boolean;
}

/**
 * Les photos du hero, empilées : seule la slide active est visible (fondu enchaîné),
 * avec un zoom très lent (effet « Ken Burns »).
 * La photo occupe tout le fond sur grand écran (texte centré) et le haut sur téléphone ; les dégradés
 * qui garantissent la lisibilité du texte sont posés par-dessus (`HeroSection`).
 */
export function HeroCarousel({ slides, index, animate }: HeroCarouselProps) {
  // Performance : la 1re photo est chargée en priorité, les autres seulement une fois
  // celle-ci affichée (elles ne ralentissent pas le premier affichage).
  const [firstLoaded, setFirstLoaded] = useState(false);

  return (
    <div
      className="absolute inset-x-0 top-0 h-[62svh] overflow-hidden md:h-[70svh] lg:inset-y-0 lg:h-auto"
      aria-hidden
    >
      {slides.map((slide, slideIndex) => {
        const active = slideIndex === index;
        if (slideIndex > 0 && !firstLoaded && !active) return null;
        return (
          <motion.div
            key={slide.id}
            data-slide={slide.id}
            data-active={active}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: active ? 1 : 0 }}
            transition={{ duration: animate ? 1.2 : 0, ease: 'easeInOut' }}
          >
            <motion.img
              src={slide.src}
              srcSet={slide.srcSet}
              sizes="100vw"
              alt=""
              fetchPriority={slideIndex === 0 ? 'high' : 'low'}
              decoding="async"
              onLoad={slideIndex === 0 ? () => setFirstLoaded(true) : undefined}
              style={
                {
                  '--pos-desktop': slide.position.desktop,
                  '--pos-mobile': slide.position.mobile,
                } as CSSProperties
              }
              className="size-full [object-position:var(--pos-mobile)] object-cover lg:[object-position:var(--pos-desktop)]"
              initial={false}
              // Zoom lent sur la photo active ; 5 s < 6 s : l'animation se termine avant la slide suivante.
              animate={{ scale: active && animate ? [1.08, 1] : 1 }}
              transition={{ duration: active && animate ? 5 : 0, ease: 'easeOut' }}
            />
          </motion.div>
        );
      })}
      {/* Voile chaud (terre) sur la photo : même ambiance quelle que soit la slide. */}
      <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
    </div>
  );
}
