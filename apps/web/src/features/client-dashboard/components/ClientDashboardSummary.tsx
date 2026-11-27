import { toIsoDate, useBookings, useUnreadCount, type QuoteRequestSummary } from '@afro/common';
import { CalendarCheck, FileText, MessageCircle } from 'lucide-react';
import { upcomingBookings } from '@/features/bookings/lib/upcomingBookings';
import { requestTab } from '@/features/quote-requests/lib/requestStatus';
import { useSessionStore } from '@/stores/session';
import { DashboardStats } from './DashboardStats';
import { WelcomeBanner } from './WelcomeBanner';

/**
 * Le haut du tableau de bord client (C2) : la bannière « Bonjour … » et les 3 chiffres.
 * Aucune donnée en dur : demandes (déjà chargées par la page), réservations (`useBookings`)
 * et messages non lus (`useUnreadCount`, le même chiffre que la pastille de l'onglet Messages).
 */
export function ClientDashboardSummary({
  requests,
}: {
  /** Les demandes du client, `undefined` pendant le chargement. */
  requests: QuoteRequestSummary[] | undefined;
}) {
  const firstName = useSessionStore((state) => state.user?.firstName);
  const bookings = useBookings('client');
  const unread = useUnreadCount('client');

  const openRequests = requests?.filter((s) => requestTab(s.request.status) === 'open').length;
  const upcoming = bookings.data
    ? upcomingBookings(bookings.data, toIsoDate(new Date())).length
    : undefined;

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <WelcomeBanner firstName={firstName} />
      <DashboardStats
        stats={[
          {
            icon: FileText,
            value: openRequests,
            label: 'Demandes en cours',
            to: '/espace/demandes?onglet=open',
          },
          {
            icon: CalendarCheck,
            value: upcoming,
            label: 'Réservations à venir',
            to: '/espace/reservations',
          },
          {
            icon: MessageCircle,
            value: unread,
            label: 'Messages non lus',
            to: '/espace/messages',
          },
        ]}
      />
    </div>
  );
}
