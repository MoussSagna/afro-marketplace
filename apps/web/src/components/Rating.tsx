import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const ratingFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

interface RatingProps {
  /** Note de 0 à 5 (décimales acceptées). */
  value: number;
  /** Nombre d'avis, affiché entre parenthèses s'il est fourni. */
  count?: number;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Affiche une note sous forme d'étoiles : « ★★★★☆ 4,5 (12 avis) ».
 * Les étoiles sont décoratives ; le texte lu par les lecteurs d'écran est
 * « Note : 4,5 sur 5, 12 avis ».
 */
export function Rating({ value, count, size = 'sm', className }: RatingProps) {
  const label =
    count === 0
      ? 'Pas encore d’avis'
      : `Note : ${ratingFormatter.format(value)} sur 5${count === undefined ? '' : `, ${count} avis`}`;

  if (count === 0) {
    return <span className={cn('text-sm text-muted-foreground', className)}>Nouveau</span>;
  }

  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-1',
        size === 'md' ? 'text-base' : 'text-sm',
        className,
      )}
    >
      <span className="flex" aria-hidden>
        {Array.from({ length: 5 }, (_, index) => {
          // Remplissage de l'étoile entre 0 et 100 % (4,5 → la 5e est à moitié pleine).
          const fill = Math.max(0, Math.min(1, value - index)) * 100;
          return (
            <span key={index} className="relative">
              <Star className={cn('text-gold-400/30', size === 'md' ? 'size-5' : 'size-4')} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill}%` }}>
                <Star
                  className={cn('fill-gold-400 text-gold-400', size === 'md' ? 'size-5' : 'size-4')}
                />
              </span>
            </span>
          );
        })}
      </span>
      <span aria-hidden className="font-medium">
        {ratingFormatter.format(value)}
      </span>
      {count !== undefined && (
        <span aria-hidden className="text-muted-foreground">
          ({count})
        </span>
      )}
    </span>
  );
}
