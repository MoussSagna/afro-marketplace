import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
import { localeOf } from '@afro/common/i18n';
import { currentLanguage } from '@/i18n/currentLanguage';

/**
 * `text-h1`, `text-h2`, `text-h3` sont des TAILLES de notre thème (preset.cjs). Sans le dire à tailwind-merge,
 * il les prend pour des couleurs et supprime `text-foreground` : les titres perdaient la couleur du thème
 * (noirs en thème sombre). `body` et `caption` sont dans le même cas, mais les déclarer changerait la taille
 * du texte de toute l'app : décision reportée (questions-ouvertes).
 */
const twMerge = extendTailwindMerge({
  extend: { classGroups: { 'font-size': [{ text: ['h1', 'h2', 'h3'] }] } },
});

/**
 * Assemble des classes Tailwind (même fonction que `cn` sur le site) :
 * cn('px-4 bg-primary', isActive && 'bg-cta') → la dernière couleur gagne.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const decimals = new Map<string, Intl.NumberFormat>();

/**
 * 4.9 → « 4,9 » en français, « 4.9 » en anglais (note avec une décimale).
 * Sans langue précisée : celle de l'app.
 */
export function formatRating(value: number, locale = localeOf(currentLanguage())): string {
  let format = decimals.get(locale);
  if (!format) {
    format = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    decimals.set(locale, format);
  }
  return format.format(value);
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
