import { ChevronRight, Flag, UserCheck, Users, Zap } from 'lucide-react';
import { Link } from 'react-router';

const ACTIONS = [
  { to: '/admin/prestataires', label: 'Valider des profils', icon: UserCheck },
  { to: '/admin/signalements', label: 'Traiter les signalements', icon: Flag },
  { to: '/admin/utilisateurs', label: 'Gérer les utilisateurs', icon: Users },
];

/** « Accès rapides » : les trois écrans de travail de l'admin, en un clic. */
export function AdminQuickActions() {
  return (
    <section
      aria-labelledby="quick-actions-title"
      className="flex flex-col gap-5 rounded-2xl border bg-card p-4 shadow-card sm:p-5 2xl:flex-row 2xl:items-center 2xl:gap-7 2xl:py-6"
    >
      <div className="flex shrink-0 items-start gap-3 sm:gap-4">
        <Zap
          className="mt-0.5 size-8 shrink-0 text-ochre sm:size-9"
          strokeWidth={1.6}
          aria-hidden
        />
        <div>
          <h2 id="quick-actions-title" className="text-2xl leading-tight font-bold sm:text-[28px]">
            Accès rapides
          </h2>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Vos actions principales en un clic.
          </p>
        </div>
      </div>
      <ul className="grid flex-1 gap-3 lg:grid-cols-3 2xl:flex 2xl:gap-4">
        {ACTIONS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="2xl:flex-auto">
            <Link
              to={to}
              className="group flex h-full min-h-14 items-center gap-3 rounded-xl border bg-card px-4 py-3 font-semibold shadow-card transition-[border-color,background-color] duration-200 outline-none hover:border-primary/25 hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring sm:min-h-[62px] 2xl:px-4"
            >
              <Icon className="size-6 shrink-0 text-primary" strokeWidth={1.7} aria-hidden />
              <span className="flex-1 leading-snug 2xl:whitespace-nowrap">{label}</span>
              <ChevronRight
                className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
