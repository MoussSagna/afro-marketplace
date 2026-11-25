import { Pause, Play } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface CarouselControlsProps {
  labels: string[];
  index: number;
  onSelect: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  /** Bouton pause / lecture (absent si « réduire les animations »). */
  canPlay: boolean;
  playing: boolean;
  onTogglePlay: () => void;
}

/**
 * La pagination du carrousel : un point par photo (le point actif s'allonge),
 * flèches gauche / droite au clavier, et un bouton pour arrêter le défilement
 * automatique (exigé par l'accessibilité pour tout contenu qui bouge tout seul).
 */
export function CarouselControls({
  labels,
  index,
  onSelect,
  onPrevious,
  onNext,
  canPlay,
  playing,
  onTogglePlay,
}: CarouselControlsProps) {
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onPrevious();
    }
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <div
        role="group"
        aria-label="Choisir une ambiance"
        className="flex"
        onKeyDown={handleKeyDown}
      >
        {labels.map((label, dotIndex) => {
          const active = dotIndex === index;
          return (
            <button
              key={label}
              type="button"
              aria-label={`${dotIndex + 1} sur ${labels.length} : ${label}`}
              aria-current={active ? 'true' : undefined}
              onClick={() => onSelect(dotIndex)}
              className="group flex h-11 items-center px-1.5 outline-none lg:h-8"
            >
              <span
                className={cn(
                  'block h-2.5 rounded-full transition-all duration-300 group-hover:bg-white group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-foreground',
                  active ? 'w-7 bg-cta group-hover:bg-cta' : 'w-2.5 bg-white/80',
                )}
              />
            </button>
          );
        })}
      </div>
      {canPlay && (
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label={playing ? 'Mettre en pause le diaporama' : 'Relancer le diaporama'}
          className="ml-1 flex size-11 items-center justify-center rounded-full text-white/80 transition-colors outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-ring lg:size-8"
        >
          {playing ? (
            <Pause className="size-3.5" aria-hidden />
          ) : (
            <Play className="size-3.5" aria-hidden />
          )}
        </button>
      )}
    </div>
  );
}
