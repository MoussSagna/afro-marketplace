/**
 * La bannière d'accueil de l'espace client : « Bonjour Aïssatou 👋 » à gauche,
 * une photo de réception à droite qui se fond dans le dégradé sable.
 * Le prénom vient de la session (profil de l'utilisateur), jamais inventé.
 */
export function WelcomeBanner({ firstName }: { firstName?: string }) {
  return (
    <div
      data-testid="welcome-banner"
      className="relative isolate overflow-hidden rounded-3xl border border-secondary bg-linear-to-r from-secondary via-secondary/70 to-background shadow-card"
    >
      {/* Photo à droite, fondue vers la gauche par un dégradé (masque CSS). */}
      <img
        src="/images/hero/celebration.webp"
        alt=""
        decoding="async"
        className="absolute inset-y-0 right-0 -z-10 h-full w-[42%] object-cover object-[50%_22%] [mask-image:linear-gradient(to_right,transparent,black_55%)] sm:w-[52%] sm:[mask-image:linear-gradient(to_right,transparent,black_38%)] lg:w-[56%]"
      />
      {/* Arcs décoratifs discrets, entre le texte et la photo. */}
      <svg
        aria-hidden
        viewBox="0 0 200 200"
        className="pointer-events-none absolute top-[58%] left-[36%] -z-10 hidden size-64 text-background opacity-60 lg:block"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      >
        <circle cx="100" cy="100" r="96" />
        <circle cx="100" cy="100" r="76" />
        <circle cx="100" cy="100" r="56" />
      </svg>
      <div className="flex min-h-36 flex-col justify-center gap-2 px-6 py-7 sm:min-h-44 sm:px-10 lg:min-h-[182px] lg:px-12">
        <p className="max-w-[58%] font-display text-[26px] leading-tight font-semibold sm:max-w-none sm:text-4xl lg:text-[44px]">
          Bonjour{firstName && <span className="text-title-accent"> {firstName}</span>}{' '}
          <span aria-hidden>👋</span>
        </p>
        <p className="max-w-[58%] text-[15px] leading-snug text-muted-foreground sm:max-w-[46%] sm:text-lg lg:text-xl">
          Suivez vos demandes et l’organisation de vos événements.
        </p>
      </div>
    </div>
  );
}
