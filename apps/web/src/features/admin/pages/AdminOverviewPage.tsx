import { useAdminOverview } from '@afro/common';
import { Flag, Store, UserCheck, Users, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';

function Tile({
  icon: Icon,
  value,
  label,
  to,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted"
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="flex flex-col">
        <span className="font-display text-3xl font-bold tabular-nums">{value}</span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </span>
    </Link>
  );
}

/** A1 : la vue d'ensemble de l'admin. Quatre chiffres, chacun mène à son écran. */
export function AdminOverviewPage() {
  const overview = useAdminOverview();
  usePageMeta('Administration');

  return (
    <section aria-labelledby="admin-title" className="flex flex-col gap-6">
      <h1 id="admin-title" className="text-3xl font-semibold">
        Vue d’ensemble
      </h1>
      {overview.isPending && (
        <Skeleton className="h-28 rounded-xl" role="status" aria-label="Chargement" />
      )}
      {overview.isError && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-destructive">
          Impossible de charger les chiffres.
        </p>
      )}
      {overview.isSuccess && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Tile
            icon={UserCheck}
            value={overview.data.providersToReview}
            label="profils à valider"
            to="/admin/prestataires"
          />
          <Tile
            icon={Flag}
            value={overview.data.openReports}
            label="signalements à traiter"
            to="/admin/signalements"
          />
          <Tile
            icon={Store}
            value={overview.data.publishedProviders}
            label="prestataires en ligne"
            to="/recherche"
          />
          <Tile icon={Users} value={overview.data.users} label="comptes" to="/admin/utilisateurs" />
        </div>
      )}
    </section>
  );
}
