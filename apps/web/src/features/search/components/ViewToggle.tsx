import { LayoutGrid, List, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResultsView, type ResultsView } from '../lib/resultsView';

const OPTIONS: { value: ResultsView; label: string; icon: LucideIcon }[] = [
  { value: 'list', label: 'Liste', icon: List },
  { value: 'grid', label: 'Grille', icon: LayoutGrid },
];

/**
 * Le choix « Liste / Grille » des résultats. Deux boutons bascule (`aria-pressed`) dans un groupe.
 * Le changement est instantané : il ne relance pas la recherche et ne touche pas aux filtres.
 */
export function ViewToggle({ className }: { className?: string }) {
  const view = useResultsView((state) => state.view);
  const setView = useResultsView((state) => state.setView);

  return (
    <div
      role="group"
      aria-label="Affichage des résultats"
      className={cn(
        'inline-flex rounded-full bg-card p-1 shadow-card ring-1 ring-border',
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={view === value}
          onClick={() => setView(value)}
          className={cn(
            'inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring sm:px-4',
            view === value
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground hover:bg-muted',
          )}
        >
          <Icon className="size-4" aria-hidden />
          <span className="max-sm:sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
