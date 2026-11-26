import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Search, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { SearchStep } from '../../lib/searchDraft';
import { DatePicker } from './DatePicker';
import { OptionList } from './OptionList';
import { useActiveOption, useGuidedSearch, type GuidedSearch } from './useGuidedSearch';

const STEP_TITLES: Record<SearchStep, { short: string; question: string }> = {
  what: { short: 'Quoi', question: 'Que recherchez-vous ?' },
  where: { short: 'Où', question: 'Où se passe l’événement ?' },
  when: { short: 'Quand', question: 'Quand a lieu l’événement ?' },
};

interface MobileSearchProps {
  /** `hero` : grand bouton blanc dans le hero ; `icon` : loupe ronde (en-tête). */
  trigger?: 'hero' | 'icon';
  className?: string;
}

/**
 * La recherche sur téléphone, sur le modèle d'Airbnb : un bouton qui ouvre une recherche plein écran
 * par étapes. Trois cartes, « Quoi », « Où », « Quand » : une seule est dépliée à la fois, les autres
 * montrent un résumé et se déplient d'un toucher. Choisir une valeur passe à l'étape suivante.
 * En bas, « Tout effacer » et « Rechercher » restent toujours à portée de pouce.
 */
export function MobileSearch({ trigger = 'hero', className }: MobileSearchProps) {
  const [open, setOpen] = useState(false);
  const search = useGuidedSearch({ onSubmit: () => setOpen(false) });
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // On rouvre toujours sur « Quoi » s'il est vide, sinon sur la première étape à remplir.
        if (next) search.setStep(firstStepToFill(search));
      }}
    >
      <DialogPrimitive.Trigger asChild>
        {trigger === 'hero' ? (
          <button
            type="button"
            className={cn(
              'flex h-16 w-full items-center gap-4 rounded-full bg-card pr-2 pl-5 text-left text-foreground shadow-pop transition-transform outline-none focus-visible:ring-[3px] focus-visible:ring-ring active:scale-[0.98]',
              className,
            )}
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[15px] font-bold">Que recherchez-vous ?</span>
              <span className="truncate text-sm text-muted-foreground">
                {hasDraft(search)
                  ? `${search.summary.what} · ${search.summary.where} · ${search.summary.when}`
                  : 'Prestation · Lieu · Date'}
              </span>
            </span>
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-cta text-cta-foreground">
              <Search className="size-5" strokeWidth={2.4} aria-hidden />
            </span>
          </button>
        ) : (
          <button
            type="button"
            aria-label="Rechercher un prestataire"
            className={cn(
              'flex size-11 items-center justify-center rounded-full bg-cta text-cta-foreground transition-colors outline-none hover:bg-cta-hover focus-visible:ring-[3px] focus-visible:ring-ring',
              className,
            )}
          >
            <Search className="size-5" strokeWidth={2.4} aria-hidden />
          </button>
        )}
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col bg-background text-foreground outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-8"
        >
          <div className="flex h-16 shrink-0 items-center justify-between px-4">
            <DialogPrimitive.Close
              aria-label="Fermer la recherche"
              className="flex size-10 items-center justify-center rounded-full border border-border bg-card outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              <X className="size-5" aria-hidden />
            </DialogPrimitive.Close>
            <DialogPrimitive.Title className="text-base font-bold">
              Votre recherche
            </DialogPrimitive.Title>
            <span className="size-10" aria-hidden />
          </div>

          <form
            role="search"
            aria-label="Rechercher un prestataire"
            onSubmit={(event) => {
              event.preventDefault();
              search.submit();
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-6">
              {(['what', 'where', 'when'] as const).map((step) => (
                <StepCard key={step} step={step} search={search} reduceMotion={reduceMotion} />
              ))}
            </div>

            <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border bg-card px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => {
                  search.draft.reset();
                  search.setStep('what');
                }}
                className="rounded-md px-1 py-2 text-[15px] font-semibold underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                Tout effacer
              </button>
              <button
                type="submit"
                className="flex h-12 items-center gap-2 rounded-full bg-cta px-6 text-base font-semibold text-cta-foreground outline-none hover:bg-cta-hover focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                <Search className="size-5" strokeWidth={2.4} aria-hidden />
                Rechercher
              </button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function hasDraft(search: GuidedSearch) {
  return !!(search.whatValue || search.draft.city || search.draft.date);
}

function firstStepToFill(search: GuidedSearch): SearchStep {
  if (!search.whatValue) return 'what';
  if (!search.draft.city) return 'where';
  return 'when';
}

/** Une étape : repliée (résumé cliquable) ou dépliée (question + champ + propositions). */
function StepCard({
  step,
  search,
  reduceMotion,
}: {
  step: SearchStep;
  search: GuidedSearch;
  reduceMotion: boolean;
}) {
  const expanded = search.step === step;
  const titles = STEP_TITLES[step];
  const transition = reduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, duration: 0.4, bounce: 0.1 };

  return (
    <motion.section
      layout={!reduceMotion}
      transition={transition}
      data-step={step}
      data-expanded={expanded}
      aria-label={titles.short}
      className={cn(
        // `shrink-0` : dans la colonne qui défile, une carte garde sa hauteur au lieu d'être écrasée.
        'shrink-0 overflow-hidden rounded-3xl bg-card',
        expanded
          ? 'shadow-[0_10px_34px_-10px_rgb(43_26_18/0.35)]'
          : 'shadow-xs ring-1 ring-border/70',
      )}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {expanded ? (
          <motion.div
            key="open"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="flex flex-col gap-4 p-5"
          >
            <h2 className="font-display text-2xl leading-tight font-bold">{titles.question}</h2>
            <StepBody step={step} search={search} />
          </motion.div>
        ) : (
          <motion.button
            key="closed"
            type="button"
            layout="position"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.15 }}
            onClick={() => search.setStep(step)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-inset"
          >
            <span className="text-[15px] text-muted-foreground">{titles.short}</span>
            <span className="truncate text-[15px] font-semibold">{search.summary[step]}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function StepBody({ step, search }: { step: SearchStep; search: GuidedSearch }) {
  const id = useId();
  const { draft } = search;
  const what = useActiveOption(search.whatOptions, () => search.advance('what'));
  const where = useActiveOption(search.cityOptions, () => search.advance('where'));

  if (step === 'when') {
    return <DatePicker value={draft.date} onPick={(day) => draft.set({ date: day })} months={1} />;
  }

  const isWhat = step === 'what';
  const nav = isWhat ? what : where;
  const typed = isWhat ? !!search.whatValue && !draft.category : !!draft.city;

  return (
    <>
      <SearchInput
        id={`${id}-input`}
        label={isWhat ? 'Prestation recherchée' : 'Ville de l’événement'}
        placeholder={isWhat ? 'Traiteur, DJ, danseur…' : 'Ville, région…'}
        value={isWhat ? search.whatValue : draft.city}
        onChange={(value) =>
          isWhat ? draft.set({ category: '', whatText: value }) : draft.set({ city: value })
        }
        onClear={() =>
          isWhat ? draft.set({ category: '', whatText: '' }) : draft.set({ city: '' })
        }
        listId={`${id}-list`}
        active={nav.active}
        onKeyDown={nav.onKeyDown}
      />
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
          {isWhat
            ? typed
              ? 'Prestations'
              : 'Explorez nos univers'
            : typed
              ? 'Suggestions'
              : 'Villes populaires'}
        </p>
        <OptionList
          id={`${id}-list`}
          label={isWhat ? 'Prestations proposées' : 'Villes proposées'}
          options={isWhat ? search.whatOptions : search.cityOptions}
          active={nav.active}
          onActiveChange={nav.setActive}
          layout={isWhat && !typed ? 'tiles' : 'rows'}
          emptyText="Aucune prestation ne correspond. Essayez « traiteur », « DJ » ou « coiffure »."
        />
      </div>
    </>
  );
}

function SearchInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  onClear,
  listId,
  active,
  onKeyDown,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange(value: string): void;
  onClear(): void;
  listId: string;
  active: number;
  onKeyDown(event: KeyboardEvent): void;
}): ReactNode {
  return (
    <div className="flex h-14 items-center gap-3 rounded-2xl border-[1.5px] border-input px-4 focus-within:border-foreground">
      <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        role="combobox"
        aria-expanded
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        enterKeyHint="next"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
      />
      {value && (
        <button
          type="button"
          aria-label="Effacer"
          onClick={onClear}
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
