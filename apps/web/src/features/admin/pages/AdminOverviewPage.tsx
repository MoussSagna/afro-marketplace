import { useAdminOverview } from '@afro/common';
import { Flag, Store, UserCheck, Users } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminPriorityTasks } from '../components/AdminPriorityTasks';
import { AdminQuickActions } from '../components/AdminQuickActions';
import { AdminRecentActivity } from '../components/AdminRecentActivity';
import { AdminStatsGrid } from '../components/AdminStatsGrid';

/**
 * A1 : la vue d'ensemble de l'admin. Quatre chiffres (chacun mène à son écran), les tâches
 * prioritaires, l'activité récente et les accès rapides. Tout vient de l'API : rien n'est écrit
 * en dur, et tout se recharge après chaque décision d'admin.
 */
export function AdminOverviewPage() {
  const overview = useAdminOverview();
  usePageMeta('Administration');
  const data = overview.data;

  return (
    <section aria-labelledby="admin-title" className="flex flex-col gap-6 sm:gap-8 xl:gap-10">
      <div className="flex flex-col gap-6">
        <AdminPageHeader
          id="admin-title"
          title="Vue d’ensemble"
          description="Pilotez l’activité de Wenzee"
        />
        {overview.isError ? (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-destructive">
            Impossible de charger les chiffres.
          </p>
        ) : (
          <div aria-busy={overview.isPending || undefined}>
            {overview.isPending && (
              <span role="status" className="sr-only">
                Chargement
              </span>
            )}
            <AdminStatsGrid
              stats={[
                {
                  icon: UserCheck,
                  value: data?.providersToReview,
                  label: 'profils à valider',
                  to: '/admin/prestataires',
                },
                {
                  icon: Flag,
                  value: data?.openReports,
                  label: 'signalements à traiter',
                  to: '/admin/signalements',
                },
                {
                  icon: Store,
                  value: data?.publishedProviders,
                  label: 'prestataires en ligne',
                  to: '/recherche',
                },
                { icon: Users, value: data?.users, label: 'comptes', to: '/admin/utilisateurs' },
              ]}
            />
          </div>
        )}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.16fr)_minmax(0,1fr)] xl:gap-8">
        <AdminPriorityTasks />
        <AdminRecentActivity />
      </div>
      <AdminQuickActions />
    </section>
  );
}
