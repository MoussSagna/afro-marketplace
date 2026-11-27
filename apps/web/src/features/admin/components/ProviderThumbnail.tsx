import { useState } from 'react';
import { cn } from '@/lib/utils';
import { initialsOf } from '../lib/initials';

/**
 * La vignette d'un prestataire : sa photo de couverture, ou ses initiales s'il n'en a pas
 * (ou si l'image ne se charge pas). Pas de logo en base : on n'en invente pas.
 */
export function ProviderThumbnail({
  name,
  src,
  className,
}: {
  name: string;
  src?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary font-display text-lg font-bold text-primary',
        className,
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}
