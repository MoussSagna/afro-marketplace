import { CalendarDays, LayoutGrid, MapPin, Search, X, type LucideIcon } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { SearchStep } from '../../lib/searchDraft';
import { DatePicker } from './DatePicker';
import { OptionList } from './OptionList';
import { useActiveOption, useGuidedSearch } from './useGuidedSearch';

interface SearchPillProps {
  /** `hero` : grande pilule de l'accueil ; `header` : pilule ouverte depuis l'en-tête. */
  variant?: 'hero' | 'header';
  /** Étape ouverte dès l'affichage (en-tête : celle sur laquelle on a cliqué). */
  initialStep?: SearchStep;
  /** Appelé quand la pilule se referme (clic dehors, Échap, recherche lancée). */
  onClose?: () => void;
  className?: string;
}

/**
 * La recherche en pilule (tablette et ordinateur), sur le modèle d'Airbnb :
 * - trois segments, « Quoi ? », « Où ? », « Quand ? », et un bouton loupe ;
 * - cliquer un segment le met en avant (fond blanc qui glisse d'un segment à l'autre, la pilule
 *   passe en sable) et ouvre son panneau juste en dessous ;
 * - choisir une prestation passe tout seul à « Où ? », choisir une ville passe à « Quand ? » ;
 * - clic en dehors ou Échap : tout se referme.
 * Les valeurs sont partagées avec les autres barres de la page (`useSearchDraft`).
 */
export function SearchPill({ variant = 'hero', initialStep, onClose, className }: SearchPillProps) {
  const id = useId();
  const reduceMotion = useReducedMotion() ?? false;
  const search = useGuidedSearch({ onSubmit: onClose });
  const { draft, step, setStep } = search;
  const rootRef = useRef<HTMLFormElement>(null);
  const whatRef = useRef<HTMLInputElement>(null);
  const whereRef = useRef<HTMLInputElement>(null);
  const whenRef = useRef<HTMLButtonElement>(null);
  const hero = variant === 'hero';

  const what = useActiveOption(search.whatOptions, () => search.advance('what'));
  const where = useActiveOption(search.cityOptions, () => search.advance('where'));

  // Ouverture depuis l'en-tête : l'étape demandée est active tout de suite.
  useEffect(() => {
    if (initialStep) setStep(initialStep);
  }, [initialStep, setStep]);

  // Le focus suit l'étape active (après un choix, on passe au champ suivant).
  useEffect(() => {
    if (step === 'what') whatRef.current?.focus();
    if (step === 'where') whereRef.current?.focus();
    if (step === 'when') whenRef.current?.focus();
    what.reset();
    where.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on ne réagit qu'au changement d'étape
  }, [step]);

  // Clic en dehors de la pilule et de ses panneaux : on referme.
  useEffect(() => {
    if (!step) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close();
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  });

  function close() {
    setStep(null);
    onClose?.();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    search.submit();
  }

  const panelTransition = reduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, duration: 0.35, bounce: 0.15 };

  return (
    <form
      ref={rootRef}
      onSubmit={handleSubmit}
      role="search"
      aria-label="Rechercher un prestataire"
      data-variant={variant}
      data-open={step ?? undefined}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && step) {
          event.stopPropagation();
          close();
        }
      }}
      className={cn('relative w-full text-foreground', className)}
    >
      <LayoutGroup id={id}>
        <div
          className={cn(
            'flex w-full items-center rounded-full shadow-pop transition-colors duration-200',
            step ? 'bg-muted' : 'bg-card',
            hero ? 'h-[76px] p-1.5 lg:h-[84px] lg:p-2' : 'h-[68px] p-1.5',
          )}
        >
          <Segment
            step="what"
            active={step}
            icon={LayoutGrid}
            label="Quoi ?"
            htmlFor={`${id}-what`}
            filled={!!search.whatValue}
            onActivate={() => setStep('what')}
            onClear={() => {
              draft.set({ category: '', whatText: '' });
              whatRef.current?.focus();
            }}
            clearLabel="Effacer la prestation"
            reduceMotion={reduceMotion}
            className="flex-[1.25]"
          >
            <input
              ref={whatRef}
              id={`${id}-what`}
              role="combobox"
              aria-expanded={step === 'what'}
              aria-controls={`${id}-what-list`}
              aria-autocomplete="list"
              aria-activedescendant={
                what.active >= 0 ? `${id}-what-list-${what.active}` : undefined
              }
              autoComplete="off"
              placeholder="Traiteur, DJ, danseur…"
              value={search.whatValue}
              onFocus={() => setStep('what')}
              onChange={(event) => {
                draft.set({ category: '', whatText: event.target.value });
                setStep('what');
              }}
              onKeyDown={what.onKeyDown}
              className={inputClass}
            />
          </Segment>

          <Divider hidden={step === 'what' || step === 'where'} />

          <Segment
            step="where"
            active={step}
            icon={MapPin}
            label="Où ?"
            htmlFor={`${id}-where`}
            filled={!!draft.city}
            onActivate={() => setStep('where')}
            onClear={() => {
              draft.set({ city: '' });
              whereRef.current?.focus();
            }}
            clearLabel="Effacer le lieu"
            reduceMotion={reduceMotion}
          >
            <input
              ref={whereRef}
              id={`${id}-where`}
              role="combobox"
              aria-expanded={step === 'where'}
              aria-controls={`${id}-where-list`}
              aria-autocomplete="list"
              aria-activedescendant={
                where.active >= 0 ? `${id}-where-list-${where.active}` : undefined
              }
              autoComplete="off"
              placeholder="Ville, région…"
              value={draft.city}
              onFocus={() => setStep('where')}
              onChange={(event) => {
                draft.set({ city: event.target.value });
                setStep('where');
              }}
              onKeyDown={where.onKeyDown}
              className={inputClass}
            />
          </Segment>

          <Divider hidden={step === 'where' || step === 'when'} />

          <Segment
            step="when"
            active={step}
            icon={CalendarDays}
            label="Quand ?"
            htmlFor={`${id}-when`}
            filled={!!draft.date}
            onActivate={() => setStep('when')}
            onClear={() => {
              draft.set({ date: '' });
              whenRef.current?.focus();
            }}
            clearLabel="Effacer la date"
            reduceMotion={reduceMotion}
          >
            <button
              ref={whenRef}
              id={`${id}-when`}
              type="button"
              aria-expanded={step === 'when'}
              aria-haspopup="dialog"
              onClick={() => setStep('when')}
              className={cn(
                inputClass,
                'cursor-pointer text-left',
                !draft.date && 'text-muted-foreground',
              )}
            >
              {search.dateLabel || 'Ajouter une date'}
            </button>
          </Segment>

          <motion.button
            layout={!reduceMotion}
            type="submit"
            aria-label="Rechercher"
            className={cn(
              'relative z-10 ml-1 flex h-full shrink-0 items-center justify-center gap-2.5 rounded-full bg-cta font-semibold text-cta-foreground shadow-xs transition-colors outline-none hover:bg-cta-hover focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2',
              // La loupe s'élargit en « Rechercher » quand une étape est ouverte (comme chez Airbnb).
              step || hero ? 'px-6 xl:px-8' : 'aspect-square',
            )}
          >
            <Search className="size-6" strokeWidth={2.2} aria-hidden />
            {(step || hero) && (
              <span className={cn('text-lg', hero && !step && 'hidden lg:inline')}>Rechercher</span>
            )}
          </motion.button>
        </div>

        <AnimatePresence>
          {step && (
            <motion.div
              key={step}
              role={step === 'when' ? 'dialog' : undefined}
              aria-label={step === 'when' ? 'Choisir la date de l’événement' : undefined}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.12 } }}
              transition={panelTransition}
              className={cn(
                'absolute top-full z-30 mt-3 max-h-[min(70vh,34rem)] overflow-y-auto rounded-[2rem] bg-card p-5 text-left shadow-[0_18px_50px_-12px_rgb(43_26_18/0.45)] ring-1 ring-border/60 lg:p-6',
                step === 'what' && 'left-0 w-full lg:w-[40rem]',
                step === 'where' && 'left-0 w-full lg:left-[28%] lg:w-[26rem]',
                step === 'when' && 'right-0 w-full lg:w-[44rem]',
              )}
            >
              {step === 'what' && (
                <PanelSection
                  title={
                    search.whatValue && !draft.category ? 'Prestations' : 'Explorez nos univers'
                  }
                >
                  <OptionList
                    id={`${id}-what-list`}
                    label="Prestations proposées"
                    options={search.whatOptions}
                    active={what.active}
                    onActiveChange={what.setActive}
                    layout={search.whatValue && !draft.category ? 'rows' : 'tiles'}
                    emptyText="Aucune prestation ne correspond. Essayez « traiteur », « DJ » ou « coiffure »."
                  />
                </PanelSection>
              )}
              {step === 'where' && (
                <PanelSection title={draft.city ? 'Suggestions' : 'Villes populaires'}>
                  <OptionList
                    id={`${id}-where-list`}
                    label="Villes proposées"
                    options={search.cityOptions}
                    active={where.active}
                    onActiveChange={where.setActive}
                  />
                </PanelSection>
              )}
              {step === 'when' && (
                <DatePicker
                  value={draft.date}
                  onPick={(day) => draft.set({ date: day })}
                  months={2}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </form>
  );
}

const inputClass =
  'w-full min-w-0 truncate bg-transparent p-0 text-[15px] text-foreground outline-none placeholder:text-muted-foreground';

interface SegmentProps {
  step: SearchStep;
  active: SearchStep | null;
  icon: LucideIcon;
  label: string;
  htmlFor: string;
  filled: boolean;
  onActivate(): void;
  onClear(): void;
  clearLabel: string;
  reduceMotion: boolean;
  className?: string;
  children: ReactNode;
}

/** Un segment de la pilule : intitulé, champ, croix pour effacer. */
function Segment({
  step,
  active,
  icon: Icon,
  label,
  htmlFor,
  filled,
  onActivate,
  onClear,
  clearLabel,
  reduceMotion,
  className,
  children,
}: SegmentProps) {
  const isActive = active === step;
  return (
    <div
      data-step={step}
      data-active={isActive}
      onClick={onActivate}
      className={cn(
        'group relative flex h-full min-w-0 flex-1 cursor-pointer items-center rounded-full',
        // Survol : sable clair quand tout est fermé, sable plus soutenu quand la pilule est déjà en sable.
        !active && 'hover:bg-muted',
        active && !isActive && 'hover:bg-secondary/70',
        className,
      )}
    >
      {isActive && (
        <motion.span
          layoutId="segment-highlight"
          aria-hidden
          transition={
            reduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.4, bounce: 0.12 }
          }
          className="absolute inset-0 rounded-full bg-card shadow-[0_6px_20px_-6px_rgb(43_26_18/0.35)]"
        />
      )}
      <div className="relative flex min-w-0 flex-1 items-center gap-3 pr-2 pl-5 xl:gap-3.5 xl:pl-6">
        <Icon className="hidden size-6 shrink-0 lg:block" strokeWidth={1.6} aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <label
            htmlFor={htmlFor}
            className="cursor-pointer truncate text-sm font-bold lg:text-[15px]"
          >
            {label}
          </label>
          {children}
        </div>
        {filled && isActive && (
          <button
            type="button"
            aria-label={clearLabel}
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.stopPropagation();
              onClear();
            }}
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted transition-colors outline-none hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}

/** Le trait entre deux segments, masqué à côté du segment actif (comme chez Airbnb). */
function Divider({ hidden }: { hidden: boolean }) {
  return (
    <span
      aria-hidden
      className={cn('h-8 w-px shrink-0 bg-border transition-opacity', hidden && 'opacity-0')}
    />
  );
}

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="px-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
        {title}
      </p>
      {children}
    </div>
  );
}
