import { USER_TYPES } from '../lib/userTypes';
import { UserTypeCard } from './UserTypeCard';

/**
 * 3ᵉ section de l'accueil : « Deux façons d'utiliser Wenzee » (prestataires / particuliers).
 * En-tête centré + deux cartes ; aucune photo, seulement des illustrations vectorielles.
 * Les deux cartes sont côte à côte dès 1024 px, empilées en dessous.
 * Fond sable clair uni (`muted`) : il se distingue de la section ivoire au-dessus (demande de Mouss).
 */
export function UserTypesSection() {
  return (
    <section aria-labelledby="user-types-title" className="bg-muted">
      <div className="mx-auto max-w-[1539px] px-4 pt-14 pb-16 sm:px-6 lg:px-8 lg:pt-10 lg:pb-[76px]">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <p className="flex items-center gap-3 text-xs font-bold tracking-[0.12em] text-primary uppercase sm:text-sm lg:text-[17px]">
            <span aria-hidden className="h-0.5 w-4 shrink-0 bg-primary sm:w-5" />
            Deux façons d’utiliser Wenzee
            <span aria-hidden className="h-0.5 w-4 shrink-0 bg-primary sm:w-5" />
          </p>
          <h2
            id="user-types-title"
            className="mt-4 font-display text-[2rem] leading-[1.08] font-bold tracking-[-0.01em] text-balance sm:text-5xl lg:mt-3 lg:text-[52px] lg:leading-[1] lg:text-wrap"
          >
            Une plateforme pensée <br className="hidden sm:inline" />
            pour tous les acteurs de{' '}
            <span className="relative inline-block text-title-accent">
              vos événements.
              <svg
                aria-hidden
                className="absolute -bottom-3 left-[8%] h-3 w-[90%] text-ochre"
                viewBox="0 0 500 16"
                preserveAspectRatio="none"
                fill="none"
              >
                <path
                  d="M3 12 C 140 3, 330 1, 497 9"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h2>
        </div>

        <div className="mt-12 grid gap-6 lg:mt-[65px] lg:grid-cols-2 lg:gap-[30px]">
          {USER_TYPES.map((userType) => (
            <UserTypeCard key={userType.id} userType={userType} />
          ))}
        </div>
      </div>
    </section>
  );
}
