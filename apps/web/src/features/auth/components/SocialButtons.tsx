import { useState } from 'react';

const PROVIDERS = ['Google', 'Apple'] as const;
type Provider = (typeof PROVIDERS)[number];

/** Le « G » multicolore de Google (marque officielle, pour le bouton « Continuer avec Google »). */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-6">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.3A7.2 7.2 0 0 1 4.91 12c0-.8.14-1.57.38-2.3V6.6H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.28 6.6l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75Z"
      />
    </svg>
  );
}

/** La pomme d'Apple (marque officielle, pour le bouton « Continuer avec Apple »). */
function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-6 fill-current">
      <path d="M16.37 12.73c-.03-2.6 2.12-3.85 2.22-3.91a4.78 4.78 0 0 0-3.76-2.03c-1.6-.16-3.12.94-3.93.94-.82 0-2.06-.92-3.39-.9a5.02 5.02 0 0 0-4.25 2.58c-1.82 3.15-.47 7.8 1.3 10.36.87 1.25 1.9 2.65 3.25 2.6 1.3-.05 1.8-.84 3.37-.84 1.58 0 2.02.84 3.4.81 1.4-.02 2.29-1.27 3.15-2.53a11.1 11.1 0 0 0 1.42-2.93 4.55 4.55 0 0 1-2.78-4.15ZM13.8 5.1A4.56 4.56 0 0 0 14.86 1.8a4.65 4.65 0 0 0-3.02 1.56 4.36 4.36 0 0 0-1.08 3.19 3.86 3.86 0 0 0 3.04-1.45Z" />
    </svg>
  );
}

const ICONS: Record<Provider, () => React.JSX.Element> = { Google: GoogleIcon, Apple: AppleIcon };

/**
 * « Continuer avec Google / Apple » : présents pour la maquette, mais **simulés**.
 * Pas d'OAuth avant le vrai back-end (lot 10) : un clic explique que ça arrive bientôt,
 * exactement comme dans l'app mobile (`SocialButtons` de `apps/mobile`).
 */
export function SocialButtons() {
  const [tapped, setTapped] = useState<Provider | null>(null);
  return (
    <div className="flex w-full flex-col gap-4">
      {PROVIDERS.map((provider) => {
        const Icon = ICONS[provider];
        return (
          <button
            key={provider}
            type="button"
            onClick={() => setTapped(provider)}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-full border bg-card text-base font-semibold text-foreground shadow-xs transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            <Icon />
            Continuer avec {provider}
          </button>
        );
      })}
      <p role="status" className="min-h-0 text-center text-sm text-muted-foreground empty:hidden">
        {tapped &&
          `Bientôt disponible : la connexion avec ${tapped} arrive avec la vraie version. En attendant, utilisez votre e-mail.`}
      </p>
    </div>
  );
}
