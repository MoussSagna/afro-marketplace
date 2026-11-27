import type { ReactNode } from 'react';

interface SpaceBannerProps {
  /** Le titre (un h1 si la bannière ouvre la page, sinon un simple paragraphe). */
  title: ReactNode;
  description: ReactNode;
  /** La photo à droite (décorative), fondue vers la gauche. */
  image: string;
  /** Le cadrage de la photo (`object-position`), ex. `50% 22%`. */
  imagePosition?: string;
  as?: 'h1' | 'p';
  titleId?: string;
  testId?: string;
}

/**
 * La bannière d'en-tête des pages de l'espace client (tableau de bord, « Mon compte ») :
 * texte à gauche sur un dégradé sable, photo à droite qui s'y fond, arcs décoratifs discrets.
 */
export function SpaceBanner({
  title,
  description,
  image,
  imagePosition = '50% 50%',
  as: Title = 'p',
  titleId,
  testId,
}: SpaceBannerProps) {
  return (
    <div
      data-testid={testId}
      className="relative isolate overflow-hidden rounded-3xl border border-secondary bg-linear-to-r from-secondary via-secondary/70 to-background shadow-card"
    >
      {/* Photo à droite, fondue vers la gauche par un dégradé (masque CSS). */}
      <img
        src={image}
        alt=""
        decoding="async"
        style={{ objectPosition: imagePosition }}
        className="absolute inset-y-0 right-0 -z-10 h-full w-[42%] object-cover [mask-image:linear-gradient(to_right,transparent,black_55%)] sm:w-[52%] sm:[mask-image:linear-gradient(to_right,transparent,black_38%)] lg:w-[56%]"
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
        <Title
          id={titleId}
          className="max-w-[58%] font-display text-[26px] leading-tight font-semibold sm:max-w-none sm:text-4xl lg:text-[44px]"
        >
          {title}
        </Title>
        <p className="max-w-[58%] text-[15px] leading-snug text-muted-foreground sm:max-w-[46%] sm:text-lg lg:text-xl">
          {description}
        </p>
      </div>
    </div>
  );
}
