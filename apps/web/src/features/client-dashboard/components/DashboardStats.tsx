import { ChevronRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';

export interface DashboardStat {
  icon: LucideIcon;
  /** `undefined` pendant le chargement (squelette à la place du chiffre). */
  value: number | undefined;
  label: string;
  to: string;
}

/** « 2 » → « 02 », comme la maquette ; au-delà de 99, le nombre tel quel. */
const twoDigits = (value: number) => String(value).padStart(2, '0');

/**
 * Les 3 chiffres du tableau de bord client (demandes en cours, réservations à venir, messages non lus).
 * Chaque carte est un lien vers la section concernée. Les chiffres viennent des requêtes
 * TanStack Query existantes : ils se mettent à jour tout seuls quand les données changent.
 */
export function DashboardStats({ stats }: { stats: DashboardStat[] }) {
  return (
    <ul aria-label="Résumé de mon activité" className="grid grid-cols-3 gap-2.5 sm:gap-4 lg:gap-5">
      {stats.map(({ icon: Icon, value, label, to }) => (
        <li key={label}>
          <Link
            to={to}
            data-testid="stat-card"
            className="group flex h-full flex-col gap-2 rounded-2xl border bg-card p-3 shadow-card transition-[border-color,box-shadow,translate] duration-200 outline-none hover:-translate-y-0.5 hover:border-primary/25 focus-visible:ring-[3px] focus-visible:ring-ring motion-reduce:transition-none sm:flex-row sm:items-center sm:gap-5 sm:p-5 lg:px-7 lg:py-5"
          >
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-title-accent sm:size-16 lg:size-20 lg:rounded-2xl"
            >
              <Icon className="size-5 sm:size-8 lg:size-10" strokeWidth={1.6} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              {value === undefined ? (
                <Skeleton className="h-8 w-12 sm:h-10" />
              ) : (
                <span className="font-sans text-2xl leading-tight font-bold tabular-nums sm:text-4xl lg:text-[40px]">
                  {twoDigits(value)}
                </span>
              )}
              <span className="text-[13px] leading-snug sm:text-base lg:text-lg">{label}</span>
            </span>
            <ChevronRight
              aria-hidden
              className="hidden size-6 shrink-0 text-foreground/70 transition-transform group-hover:translate-x-0.5 sm:block"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
