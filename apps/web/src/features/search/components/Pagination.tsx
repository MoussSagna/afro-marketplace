import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pageRange } from '../lib/pageRange';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange(page: number): void;
}

const roundButton =
  'inline-flex size-11 items-center justify-center rounded-full text-base font-semibold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring';

/**
 * La pagination des résultats : flèche précédente, numéros de page (« … » quand il y en a beaucoup),
 * flèche suivante. La page active est pleine (terre intense) et porte `aria-current="page"`.
 * Le fonctionnement ne change pas : chaque bouton appelle `onPageChange`, qui écrit `?page=` dans l'adresse.
 */
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2 sm:gap-3">
      <button
        type="button"
        aria-label="Précédent"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={cn(
          roundButton,
          'bg-card text-foreground shadow-card ring-1 ring-border hover:bg-muted disabled:pointer-events-none disabled:opacity-40',
        )}
      >
        <ArrowLeft className="size-5" aria-hidden />
      </button>

      <ol className="flex items-center gap-1.5 sm:gap-3">
        {pageRange(page, totalPages).map((item, index) =>
          item === 'gap' ? (
            <li key={`gap-${index}`} aria-hidden className="w-6 text-center text-muted-foreground">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                aria-label={`Page ${item}`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => item !== page && onPageChange(item)}
                className={cn(
                  roundButton,
                  item === page
                    ? 'bg-primary text-primary-foreground shadow-card'
                    : 'bg-card text-foreground shadow-card ring-1 ring-border hover:bg-muted',
                )}
              >
                {item}
              </button>
            </li>
          ),
        )}
      </ol>

      <button
        type="button"
        aria-label="Suivant"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={cn(
          roundButton,
          'bg-card text-foreground shadow-card ring-1 ring-border hover:bg-muted disabled:pointer-events-none disabled:opacity-40',
        )}
      >
        <ArrowRight className="size-5" aria-hidden />
      </button>

      <p className="sr-only" aria-live="polite">
        Page {page} sur {totalPages}
      </p>
    </nav>
  );
}
