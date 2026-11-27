import { useAdminOverview } from '@afro/common';
import { Bell, Flag, UserCheck } from 'lucide-react';
import { Link } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`;

/**
 * La cloche du back-office. Il n'existe pas (encore) de notifications enregistrées en base :
 * elle montre donc ce qui attend l'admin (profils à valider, signalements ouverts), à partir des
 * mêmes chiffres que la vue d'ensemble. La pastille jaune s'allume tant qu'il reste quelque chose.
 */
export function AdminNotifications() {
  const overview = useAdminOverview();
  const toReview = overview.data?.providersToReview ?? 0;
  const openReports = overview.data?.openReports ?? 0;
  const total = toReview + openReports;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={total > 0 ? `Notifications : ${total} à traiter` : 'Notifications'}
        className="relative flex size-11 items-center justify-center rounded-full text-white transition-colors outline-none hover:bg-white/10 focus-visible:ring-[3px] focus-visible:ring-ring data-[state=open]:bg-white/10"
      >
        <Bell className="size-7" strokeWidth={1.6} aria-hidden />
        {total > 0 && (
          <span
            aria-hidden
            data-testid="notification-dot"
            className="absolute top-2 right-2 size-3 rounded-full bg-accent ring-2 ring-foreground"
          />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={14}
        collisionPadding={12}
        className="w-72 rounded-xl p-2"
      >
        <DropdownMenuLabel className="font-display text-base">À traiter</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {overview.isPending && (
          <p className="px-2 py-3 text-sm text-muted-foreground">Chargement…</p>
        )}
        {overview.isError && (
          <p role="alert" className="px-2 py-3 text-sm text-destructive">
            Impossible de charger les notifications.
          </p>
        )}
        {overview.isSuccess && total === 0 && (
          <p className="px-2 py-3 text-sm text-muted-foreground">Rien à traiter pour le moment.</p>
        )}
        {toReview > 0 && (
          <NotificationLink to="/admin/prestataires" icon={UserCheck}>
            {plural(toReview, 'profil')} à valider
          </NotificationLink>
        )}
        {openReports > 0 && (
          <NotificationLink to="/admin/signalements" icon={Flag}>
            {plural(openReports, 'signalement')} à traiter
          </NotificationLink>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationLink({
  to,
  icon: Icon,
  children,
}: {
  to: string;
  icon: typeof Bell;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenuItem asChild>
      <Link to={to} className={cn('gap-3 py-2.5 font-medium')}>
        <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
        {children}
      </Link>
    </DropdownMenuItem>
  );
}
