import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Le badge « Pro vérifié » des cartes de résultats (même dessin), en version compacte. */
export function VerifiedIcon({ className }: { className?: string }) {
  return (
    <BadgeCheck
      role="img"
      aria-label="Pro vérifié"
      className={cn('inline-block size-5 shrink-0 fill-title-accent text-card', className)}
    />
  );
}
