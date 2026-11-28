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
} from 'lucide-react-native';
import anniversaire from '../../../assets/images/evenements/anniversaire.webp';
import autre from '../../../assets/images/evenements/autre.webp';
import bapteme from '../../../assets/images/evenements/bapteme.webp';
import conference from '../../../assets/images/evenements/conference.webp';
import mariage from '../../../assets/images/evenements/mariage.webp';
import soiree from '../../../assets/images/evenements/soiree.webp';

/*
 * L'affichage du planificateur, repris du site (features/events/lib/eventDisplay.ts) : mêmes icônes,
 * mêmes photos par type, mêmes couleurs de statut. Les statuts eux-mêmes sont calculés par
 * @afro/common (rules/event.ts) : rien n'est recalculé ici.
 */

export const EVENT_TYPE_ICONS: Record<PlannedEventType, LucideIcon> = {
  wedding: Gem,
  party: Martini,
  baptism: Droplet,
  birthday: Cake,
  conference: Briefcase,
  other: Ellipsis,
};

/** La photo d'un événement selon son type (pas de photo envoyée par le client au MVP). */
/** Identifiants d'images de Metro (des nombres), passés tels quels à expo-image. */
export const EVENT_TYPE_PHOTOS: Record<PlannedEventType, number> = {
  wedding: mariage,
  party: soiree,
  baptism: bapteme,
  birthday: anniversaire,
  conference: conference,
  other: autre,
};

/** La variante de pastille (Badge) de chaque statut d'événement. */
export const EVENT_STATUS_BADGE: Record<EventStatus, 'warning' | 'sun' | 'muted'> = {
  preparation: 'warning',
  quotes: 'sun',
  past: 'muted',
};

/** Statut d'un prestataire dans l'événement : pastille + icône + texte (jamais la couleur seule). */
export const EVENT_PROVIDER_STATUS_DISPLAY: Record<
  EventProviderStatus,
  { badge: 'muted' | 'warning' | 'sun' | 'success'; icon: LucideIcon }
> = {
  added: { badge: 'muted', icon: Plus },
  requested: { badge: 'warning', icon: Send },
  received: { badge: 'sun', icon: FileText },
  retained: { badge: 'success', icon: CircleCheck },
  booked: { badge: 'success', icon: CalendarCheck2 },
  closed: { badge: 'muted', icon: CircleSlash },
};
