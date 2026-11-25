import { cn } from '@/lib/utils';

const SOURCES = {
  /** Texte terre : sur fond clair (par défaut). */
  default: '/wenzee-logo.svg',
  /** Même logo, texte ivoire : sur photo ou fond sombre (le hero de l'accueil). Identique au `light` de l'app. */
  light: '/wenzee-logo-light.svg',
} as const;

interface LogoProps {
  className?: string;
  variant?: keyof typeof SOURCES;
}

/**
 * Le logo Wenzee (piste 3 « Le lien ») : symbole + nom, en SVG dans `public/`.
 * Le mot est déjà vectorisé dans le fichier : aucune police à charger.
 * Fixe la hauteur avec `className` (ex. `h-8`), la largeur suit.
 */
export function Logo({ className, variant = 'default' }: LogoProps) {
  return <img src={SOURCES[variant]} alt="Wenzee" className={cn('h-8 w-auto', className)} />;
}
