import { Cake, CalendarHeart, PartyPopper } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { Logo } from '@/components/Logo';

const TAGS = [
  { icon: CalendarHeart, label: 'Mariages' },
  { icon: Cake, label: 'Anniversaires' },
  { icon: PartyPopper, label: 'Événements privés' },
];

/**
 * Gabarit des pages d'authentification (connexion, inscription, mot de passe oublié) :
 * écran partagé, sans navbar ni pied de page (le logo ramène à l'accueil).
 *
 * - À gauche (ordinateur, tablette en paysage, dès 1024 px) : une photo sur toute la hauteur de l'écran, collée pendant que
 *   le formulaire défile, avec un dégradé sombre en bas pour le titre et les pastilles.
 * - À droite : le formulaire, centré sur fond ivoire.
 * - Téléphone et tablette en portrait : la photo passe en bandeau au-dessus du formulaire.
 */
export function AuthLayout() {
  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-2">
      <aside
        aria-label="Wenzee"
        className="relative isolate flex h-56 flex-col justify-end overflow-hidden bg-foreground sm:h-80 lg:sticky lg:top-0 lg:h-dvh"
      >
        <img
          src="/images/hero/soiree.webp"
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 -z-10 size-full object-cover object-[52%_30%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-linear-to-t from-foreground/95 via-foreground/45 to-foreground/10"
        />
        <div className="flex flex-col gap-3 px-5 pb-5 sm:gap-5 sm:px-10 sm:pb-8 lg:gap-7 lg:px-[52px] lg:pb-20">
          <p className="max-w-[20ch] font-display text-[22px] leading-tight font-semibold text-white sm:text-[32px] lg:max-w-[540px] lg:text-[42px]">
            Trouvez le prestataire idéal pour vos événements
          </p>
          <span aria-hidden className="h-1 w-16 rounded-full bg-ochre lg:w-[76px]" />
          <ul className="hidden flex-wrap gap-3 sm:flex">
            {TAGS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex h-11 items-center gap-2.5 rounded-full border border-white/10 bg-white/10 px-4 text-[15px] text-white backdrop-blur-sm lg:h-12 lg:px-5 lg:text-base"
              >
                <Icon className="size-5 text-cta" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex min-w-0 flex-col items-center justify-center px-5 py-7 sm:px-10 sm:py-14 lg:px-16 lg:py-16">
        <div className="flex w-full max-w-[580px] flex-col items-center gap-6 sm:gap-8 lg:gap-10">
          <Link
            to="/"
            aria-label="Wenzee, accueil"
            className="rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            <Logo className="h-10 sm:h-12 lg:h-14" />
          </Link>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
