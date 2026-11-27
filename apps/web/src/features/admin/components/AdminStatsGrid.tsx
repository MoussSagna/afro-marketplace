import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';

export interface AdminStat {
  icon: LucideIcon;
  /** `undefined` pendant le chargement (squelette à la place du chiffre). */
  value: number | undefined;
  label: string;
  to: string;
}

/** Une carte chiffrée de la vue d'ensemble ; toute la carte est un lien vers l'écran concerné. */
export function AdminStatCard({ icon: Icon, value, label, to }: AdminStat) {
  return (
    <Link
      to={to}
      data-testid="admin-stat"
      className="group flex h-full flex-col gap-3 rounded-2xl border bg-card p-4 shadow-card transition-[border-color,translate] duration-200 outline-none hover:-translate-y-0.5 hover:border-primary/25 focus-visible:ring-[3px] focus-visible:ring-ring motion-reduce:transition-none sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-6"
    >
      <span
        aria-hidden
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground sm:size-14"
      >
        <Icon className="size-6 sm:size-7" strokeWidth={1.8} />
      </span>
      <span className="flex min-w-0 flex-col">
        {value === undefined ? (
          <Skeleton className="h-9 w-14 sm:h-10" />
        ) : (
          <span className="font-sans text-[32px] leading-none font-extrabold tabular-nums sm:text-[40px]">
            {value}
          </span>
        )}
        <span className="mt-1.5 text-sm leading-snug sm:text-base 2xl:text-[17px]">{label}</span>
      </span>
    </Link>
  );
}

/** Les 4 chiffres de la vue d'ensemble : 2 colonnes sur téléphone et tablette, 4 sur grand écran. */
export function AdminStatsGrid({ stats }: { stats: AdminStat[] }) {
  return (
    <ul
      aria-label="Chiffres clés"
      className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 xl:gap-5"
    >
      {stats.map((stat) => (
        <li key={stat.label}>
          <AdminStatCard {...stat} />
        </li>
      ))}
    </ul>
  );
}
