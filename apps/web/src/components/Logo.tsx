import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

/**
 * Le logo Wenzee (piste 3 « Le lien ») : symbole + nom, en SVG dans `public/`.
 * Le mot est déjà vectorisé dans le fichier : aucune police à charger.
 * Fixe la hauteur avec `className` (ex. `h-8`), la largeur suit.
 */
export function Logo({ className }: LogoProps) {
  return <img src="/wenzee-logo.svg" alt="Wenzee" className={cn('h-8 w-auto', className)} />;
}
