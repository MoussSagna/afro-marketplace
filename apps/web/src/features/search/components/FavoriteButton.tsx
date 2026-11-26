import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFavoritesStore, useIsFavorite } from '@/stores/favorites';

interface FavoriteButtonProps {
  providerId: string;
  providerName: string;
  className?: string;
}

/**
 * Le cœur posé sur la photo d'une carte. C'est un bouton « bascule » (`aria-pressed`) :
 * le lecteur d'écran annonce « Favori : DJ Makossa Vibes, activé / désactivé ».
 * Il est au-dessus du lien qui couvre la carte (`z-10`) : cliquer le cœur n'ouvre pas le profil.
 */
export function FavoriteButton({ providerId, providerName, className }: FavoriteButtonProps) {
  const isFavorite = useIsFavorite(providerId);
  const toggle = useFavoritesStore((state) => state.toggle);

  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-label={`Favori : ${providerName}`}
      onClick={() => toggle(providerId)}
      className={cn(
        'relative z-10 inline-flex size-11 items-center justify-center rounded-full bg-background/90 text-primary shadow-card backdrop-blur-sm transition-transform outline-none hover:scale-105 focus-visible:ring-[3px] focus-visible:ring-ring active:scale-95 motion-reduce:transition-none',
        className,
      )}
    >
      <Heart
        aria-hidden
        className={cn('size-5 transition-colors', isFavorite && 'fill-primary')}
        strokeWidth={2.2}
      />
    </button>
  );
}
