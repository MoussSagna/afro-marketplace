import type { NotificationPrefs } from '@afro/common';
import { CalendarCheck, Megaphone, MessageCircle, type LucideIcon } from 'lucide-react';

export type NotificationTopic = keyof NotificationPrefs;
export type NotificationChannel = keyof NotificationPrefs[NotificationTopic];

/**
 * Les préférences de notification, regroupées comme sur la maquette. Chaque ligne est un
 * SUJET réellement enregistré (`notificationPrefs` : quotes, messages, bookings, marketing) ;
 * la description dit ce qu'il couvre. On n'invente pas de sujet que le modèle ne connaît pas.
 */
export const NOTIFICATION_GROUPS: readonly {
  id: string;
  title: string;
  icon: LucideIcon;
  topics: readonly { key: NotificationTopic; label: string; description: string }[];
}[] = [
  {
    id: 'messages',
    title: 'Messages',
    icon: MessageCircle,
    topics: [
      {
        key: 'messages',
        label: 'Nouveaux messages',
        description: 'Un prestataire vous écrit ou répond à votre demande.',
      },
    ],
  },
  {
    id: 'requests',
    title: 'Demandes et réservations',
    icon: CalendarCheck,
    topics: [
      {
        key: 'quotes',
        label: 'Demandes et devis',
        description: 'Réponse à une demande, devis reçu.',
      },
      {
        key: 'bookings',
        label: 'Réservations et rappels',
        description: 'Confirmation, modification ou annulation, rappel avant l’événement.',
      },
    ],
  },
  {
    id: 'news',
    title: 'Actualités',
    icon: Megaphone,
    topics: [
      {
        key: 'marketing',
        label: 'Nouveautés et offres',
        description: 'Nouveautés Wenzee, offres et événements.',
      },
    ],
  },
];

/** Les canaux, dans l'ordre des colonnes. « Application » = notification de l'app (push). */
export const NOTIFICATION_CHANNELS: readonly { key: NotificationChannel; label: string }[] = [
  { key: 'email', label: 'E-mail' },
  { key: 'push', label: 'Application' },
  { key: 'sms', label: 'SMS' },
];

/** Vrai si les deux jeux de préférences sont identiques (formulaire « modifié » ou non). */
export function samePrefs(a: NotificationPrefs, b: NotificationPrefs): boolean {
  return (Object.keys(a) as NotificationTopic[]).every((topic) =>
    NOTIFICATION_CHANNELS.every(({ key }) => a[topic][key] === b[topic][key]),
  );
}
