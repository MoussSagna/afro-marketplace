import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Assemble des classes Tailwind (même fonction que `cn` sur le site) :
 * cn('px-4 bg-primary', isActive && 'bg-cta') → la dernière couleur gagne.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const decimal = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** 4.9 → « 4,9 » (note avec une décimale, à la française). */
export function formatRating(value: number): string {
  return decimal.format(value);
}

/** « Aïssatou Diallo » → « AD » (pastille d'avatar sans photo). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return letters
    .map((part) => part?.[0] ?? '')
    .join('')
    .toUpperCase();
}
