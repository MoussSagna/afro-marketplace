import type { EventProviderStatus, EventStatus, PlannedEventType } from '@afro/common';
import {
  Briefcase,
  Cake,
  CalendarCheck2,
  CircleCheck,
  CircleSlash,
  Droplet,
  Ellipsis,
  FileText,
  Gem,
  Martini,
  Plus,
  Send,
  type LucideIcon,
} from 'lucide-react';

export const EVENT_TYPE_ICONS: Record<PlannedEventType, LucideIcon> = {
  wedding: Gem,
  party: Martini,
  baptism: Droplet,
  birthday: Cake,
  conference: Briefcase,
  other: Ellipsis,
};

/** La photo d'un événement selon son type (pas de photo envoyée par le client au MVP). */
export const EVENT_TYPE_PHOTOS: Record<PlannedEventType, string> = {
  wedding: '/images/hero/mariage-900.webp',
  party: '/images/hero/soiree.webp',
  baptism: '/images/categories/decoration.webp',
  birthday: '/images/hero/celebration-900.webp',
  conference: '/images/categories/speaker.webp',
  other: '/images/categories/show.webp',
};

export type StatusTone = 'warning' | 'brand' | 'neutral' | 'success' | 'closed';

export const EVENT_STATUS_TONES: Record<EventStatus, StatusTone> = {
  preparation: 'warning',
  quotes: 'brand',
  past: 'closed',
};

/** Statut d'un prestataire : couleur + icône + texte (jamais la couleur seule). */
export const EVENT_PROVIDER_STATUS_DISPLAY: Record<
  EventProviderStatus,
  { tone: StatusTone; icon: LucideIcon }
> = {
  added: { tone: 'neutral', icon: Plus },
  requested: { tone: 'warning', icon: Send },
  received: { tone: 'brand', icon: FileText },
  retained: { tone: 'success', icon: CircleCheck },
  booked: { tone: 'success', icon: CalendarCheck2 },
  closed: { tone: 'closed', icon: CircleSlash },
};

export const TONE_CLASSES: Record<StatusTone, string> = {
  warning: 'bg-warning-muted text-warning',
  brand: 'bg-title-accent/12 text-primary',
  neutral: 'bg-muted text-muted-foreground ring-1 ring-border ring-inset',
  success: 'bg-success-muted text-success',
  closed: 'bg-secondary text-muted-foreground',
};

// Familles conseillées (« Complétez votre événement ») : partagées avec l'app (@afro/common).
export { missingGroups, providerGroupId } from '@afro/common';

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** « 2027-02-10 » → « Mer. 10 févr. 2027 » (jour calculé, pas écrit à la main). */
export function formatEventDay(isoDate: string): string {
  const text = dateFormatter.format(new Date(`${isoDate}T00:00:00Z`));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** « 1 invité », « 150 invités ». */
export const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count > 1 ? many : one}`;
