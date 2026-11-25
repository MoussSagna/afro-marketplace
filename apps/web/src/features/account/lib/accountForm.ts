/** Les libellés du tableau des préférences de notification (le formulaire est dans @afro/common). */
export const NOTIFICATION_TOPICS = [
  { key: 'quotes', label: 'Demandes et devis' },
  { key: 'messages', label: 'Messages' },
  { key: 'bookings', label: 'Réservations et rappels' },
  { key: 'marketing', label: 'Nouveautés et bons plans' },
] as const;

export const NOTIFICATION_CHANNELS = [
  { key: 'email', label: 'Email' },
  { key: 'sms', label: 'SMS' },
  { key: 'push', label: 'Notification' },
] as const;
