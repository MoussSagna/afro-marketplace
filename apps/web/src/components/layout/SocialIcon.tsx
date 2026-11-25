import type { SocialNetwork } from './footerContent';

/**
 * Pictogrammes simples des réseaux sociaux, dessinés pour Wenzee (lucide ne fournit plus les icônes
 * de marques). Trait ou aplat `currentColor`, 24 × 24 ; décoratifs (le nom est porté par le lien).
 */
export function SocialIcon({ network, className }: { network: SocialNetwork; className?: string }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    'aria-hidden': true,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (network) {
    case 'instagram':
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg {...common}>
          <path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5" />
          <path d="M14 4c.4 2.6 2.2 4.3 5 4.5" />
        </svg>
      );
    case 'facebook':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M13.4 21v-7.4h2.5l.4-3h-2.9V8.8c0-.9.3-1.5 1.5-1.5h1.6V4.6c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.2H7.9v3h2.5V21h3z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg {...common}>
          <rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="currentColor" stroke="none" />
          <path d="M10.2 9.2v5.6l4.6-2.8z" fill="var(--foreground)" stroke="none" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <rect x="4" y="9.5" width="3.2" height="10" rx="0.6" />
          <circle cx="5.6" cy="5.8" r="1.9" />
          <path d="M10 9.5h3v1.5c.6-1 1.8-1.8 3.4-1.8 2.6 0 3.6 1.7 3.6 4.5v5.8h-3.2v-5.2c0-1.4-.4-2.3-1.7-2.3s-1.9 1-1.9 2.3v5.2H10z" />
        </svg>
      );
  }
}
