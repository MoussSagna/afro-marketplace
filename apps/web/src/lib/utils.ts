import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine des classes Tailwind en résolvant les conflits.
 * cn('px-2', condition && 'px-4') → 'px-4'. Utilisé par tous les composants shadcn/ui.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
