import { CalendarDays, CircleCheck, Sparkle, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserType } from '../lib/userTypes';

interface UserTypeIllustrationProps {
  illustration: UserType['illustration'];
  side: UserType['illustrationSide'];
}

/**
 * L'illustration vectorielle d'une carte (aucune photo) : icônes lucide en trait terre,
 * posées sur un demi-cercle sable collé au bord de la carte.
 * - tablette et grand écran (≥ 1400 px) : grande, dans la colonne réservée de la carte ;
 * - téléphone et 1024–1399 px : petite, en haut à droite, pour laisser toute la largeur au texte.
 */
export function UserTypeIllustration({ illustration, side }: UserTypeIllustrationProps) {
  const left = side === 'left';
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Demi-cercle sable (grand format seulement). */}
      <div
        className={cn(
          'absolute top-[34%] hidden size-[292px] rounded-full bg-secondary/60 md:block lg:max-[1399px]:hidden',
          left ? '-left-[125px]' : '-right-[35px]',
        )}
      />
      <div
        className={cn(
          'absolute top-6 right-6 size-16 text-primary sm:size-20',
          'md:top-[42%] md:size-[150px]',
          'lg:max-[1399px]:top-7 lg:max-[1399px]:right-7 lg:max-[1399px]:left-auto lg:max-[1399px]:size-20',
          left ? 'md:right-auto md:left-[33px]' : 'md:right-[32px]',
        )}
      >
        {illustration === 'store' ? <StoreArt /> : <CalendarArt />}
      </div>
    </div>
  );
}

function StoreArt() {
  return (
    <div className="relative size-full">
      <Store className="size-full" strokeWidth={1.4} />
      <Sparkle className="absolute -top-[6%] -right-[8%] size-[22%] fill-current" strokeWidth={1} />
    </div>
  );
}

function CalendarArt() {
  return (
    <div className="relative size-full">
      <CalendarDays className="size-[82%]" strokeWidth={1.4} />
      {/* Pastille « validé » qui chevauche le coin du calendrier. */}
      <span className="absolute right-0 bottom-[2%] flex size-[46%] items-center justify-center rounded-full bg-card">
        <CircleCheck className="size-full" strokeWidth={1.6} />
      </span>
      {/* Petits traits « ça brille ». */}
      <svg
        className="absolute -top-[22%] right-[2%] size-[34%]"
        viewBox="0 0 40 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <path d="M6 6 L8 16" />
        <path d="M24 4 L18 16" />
        <path d="M36 18 L26 22" />
      </svg>
    </div>
  );
}
