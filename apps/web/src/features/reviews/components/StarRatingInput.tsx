import { Star } from 'lucide-react';
import { useId, useState } from 'react';
import { cn } from '@/lib/utils';

interface StarRatingInputProps {
  /** Le nom du groupe, lu par les lecteurs d'écran (« Note générale »). */
  label: string;
  value: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md';
  invalid?: boolean;
  describedBy?: string;
}

/**
 * Choisir une note de 1 à 5 étoiles.
 * Sous le capot, ce sont 5 boutons radio (masqués) : le clavier (flèches)
 * et les lecteurs d'écran fonctionnent sans code en plus.
 */
export function StarRatingInput({
  label,
  value,
  onChange,
  size = 'md',
  invalid,
  describedBy,
}: StarRatingInputProps) {
  const name = useId();
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className="flex w-fit gap-1"
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <label
          key={star}
          className="relative cursor-pointer rounded-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
          onMouseEnter={() => setHovered(star)}
        >
          <input
            type="radio"
            name={name}
            value={star}
            checked={value === star}
            onChange={() => onChange(star)}
            // Invisible mais posée SUR l'étoile (et non 1 px à côté, comme avec `sr-only`) :
            // un clic n'importe où sur l'étoile coche la note ; le clavier et les lecteurs d'écran
            // la voient comme une vraie case radio.
            className="absolute inset-0 m-0 size-full cursor-pointer appearance-none opacity-0"
            aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
          />
          <Star
            aria-hidden
            className={cn(
              'transition-colors',
              size === 'md' ? 'size-8' : 'size-6',
              star <= shown ? 'fill-ochre text-ochre' : 'text-clay/50',
            )}
          />
        </label>
      ))}
    </div>
  );
}
