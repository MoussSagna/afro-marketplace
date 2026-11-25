import { ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UserType } from '../lib/userTypes';
import { UserTypeIllustration } from './UserTypeIllustration';

/**
 * Une carte « parcours » : badge, titre (fin mise en valeur), description, 5 avantages cochés,
 * bouton principal et « Déjà inscrit ? Se connecter ». Le bouton est poussé en bas de la carte :
 * dans une rangée, les boutons des deux cartes restent alignés.
 */
export function UserTypeCard({ userType }: { userType: UserType }) {
  const left = userType.illustrationSide === 'left';
  const titleId = `user-type-${userType.id}`;
  return (
    <article
      aria-labelledby={titleId}
      className="relative isolate flex flex-col rounded-2xl bg-card shadow-card ring-1 ring-border/60"
    >
      <UserTypeIllustration illustration={userType.illustration} side={userType.illustrationSide} />

      <div
        className={cn(
          'relative flex flex-1 flex-col p-6 pt-7 sm:p-8 xl:pt-[33px] xl:pb-[30px]',
          // Colonne réservée à l'illustration (tablette et ≥ 1400 px).
          left
            ? 'md:pl-[211px] lg:max-[1399px]:pl-8'
            : 'md:pr-[237px] lg:max-[1399px]:pr-8 min-[1400px]:pl-[63px]',
        )}
      >
        <p className="self-start rounded-full bg-secondary px-4 py-2 text-xs font-bold tracking-[0.04em] text-primary uppercase sm:text-sm lg:px-5 lg:text-[15px]">
          {userType.badge}
        </p>
        <h3
          id={titleId}
          className="mt-3 pr-20 font-display text-[2rem] leading-[1.05] font-bold tracking-[-0.01em] sm:pr-24 sm:text-[2.5rem] md:pr-0 lg:max-[1399px]:pr-24 xl:text-[46px]"
        >
          {userType.title.start} <br />
          <span className="text-title-accent">{userType.title.accent}</span>
        </h3>
        <p className="mt-4 max-w-[440px] text-base leading-relaxed text-muted-foreground xl:text-lg">
          {userType.description}
        </p>

        <ul className="mt-6 flex flex-col gap-3 xl:gap-[15px]">
          {userType.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-[15px] xl:text-base">
              <span
                aria-hidden
                className="mt-px flex size-[22px] shrink-0 items-center justify-center rounded-full bg-accent/45 text-primary"
              >
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              {feature}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-col items-stretch pt-8 sm:items-start">
          <div className="flex flex-col items-stretch gap-4 sm:items-center">
            <Button
              asChild
              variant={userType.cta.variant}
              // `has-[>svg]` : le bouton de base réduit les marges quand il contient une icône ; on les rétablit.
              className="h-14 gap-3 px-6 text-base font-semibold has-[>svg]:px-6 sm:has-[>svg]:px-10 xl:h-[58px] xl:text-[19px] xl:has-[>svg]:px-14"
            >
              <Link to={userType.cta.to}>
                {userType.cta.label}
                <ArrowRight className="size-5" aria-hidden />
              </Link>
            </Button>
            <Link
              to={userType.loginTo}
              className="self-center rounded-sm text-[15px] text-primary underline underline-offset-4 hover:text-primary-hover focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none xl:text-[17px]"
            >
              Déjà inscrit ? <span className="font-semibold text-foreground">Se connecter</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
