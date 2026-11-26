import { Search } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import type { SearchStep } from '../../lib/searchDraft';
import { SearchPill } from './SearchPill';
import { useGuidedSearch } from './useGuidedSearch';

interface CompactSearchProps {
  /** Ouvre la grande recherche dans l'en-tête, sur l'étape cliquée. */
  onOpen(step: SearchStep): void;
  className?: string;
}

/**
 * La recherche compacte de l'en-tête (ordinateur), une fois le hero dépassé :
 * « Prestation | Lieu | Date | loupe ». Chaque morceau ouvre la grande recherche sur son étape.
 */
export function CompactSearch({ onOpen, className }: CompactSearchProps) {
  const { summary } = useGuidedSearch();
  const part =
    'h-full min-w-0 truncate px-4 text-sm font-semibold text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-inset';
  return (
    <div
      role="group"
      aria-label="Recherche rapide"
      className={cn(
        'flex h-12 max-w-[30rem] items-center overflow-hidden rounded-full bg-card shadow-pop',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onOpen('what')}
        className={cn(part, 'rounded-l-full pl-5')}
        aria-label={`Quoi : ${summary.what}`}
      >
        {summary.what}
      </button>
      <span aria-hidden className="h-6 w-px shrink-0 bg-border" />
      <button
        type="button"
        onClick={() => onOpen('where')}
        className={part}
        aria-label={`Où : ${summary.where}`}
      >
        {summary.where}
      </button>
      <span aria-hidden className="h-6 w-px shrink-0 bg-border" />
      <button
        type="button"
        onClick={() => onOpen('when')}
        className={cn(part, 'font-normal text-muted-foreground')}
        aria-label={`Quand : ${summary.when}`}
      >
        {summary.when}
      </button>
      <button
        type="button"
        onClick={() => onOpen('what')}
        aria-label="Ouvrir la recherche"
        className="mr-1.5 ml-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-cta text-cta-foreground outline-none hover:bg-cta-hover focus-visible:ring-[3px] focus-visible:ring-ring"
      >
        <Search className="size-4" strokeWidth={2.6} aria-hidden />
      </button>
    </div>
  );
}

interface ExpandedSearchProps {
  /** L'étape à ouvrir ; `null` : la grande recherche est fermée. */
  step: SearchStep | null;
  onClose(): void;
}

/**
 * La grande recherche ouverte depuis l'en-tête : elle se déplie sous la barre, la page s'assombrit
 * derrière. Elle se referme au clic dehors, avec Échap, au défilement ou une fois la recherche lancée.
 */
export function ExpandedSearch({ step, onClose }: ExpandedSearchProps) {
  const reduceMotion = useReducedMotion() ?? false;

  // Défiler la page referme la recherche (comme chez Airbnb).
  useEffect(() => {
    if (!step) return;
    const startY = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > 40) onClose();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [step, onClose]);

  return (
    <>
      <AnimatePresence initial={false}>
        {step && (
          <motion.div
            key="expanded"
            data-state="open"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            className="hidden lg:block"
          >
            <motion.div
              initial={reduceMotion ? false : { scale: 0.7, y: -40 }}
              animate={{ scale: 1, y: 0 }}
              exit={reduceMotion ? undefined : { scale: 0.7, y: -40 }}
              transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              className="mx-auto max-w-[880px] px-8 pt-2 pb-6"
            >
              <SearchPill variant="header" initialStep={step} onClose={onClose} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {createPortal(
        <AnimatePresence>
          {step && (
            <motion.div
              key="backdrop"
              aria-hidden
              data-testid="search-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              className="fixed inset-0 z-30 hidden bg-foreground/45 lg:block"
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
