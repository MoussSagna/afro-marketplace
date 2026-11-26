import { useCulturalOrigins, type ProviderSearchFilters } from '@afro/common';
import { BadgeCheck, ChevronDown, RotateCcw, Star } from 'lucide-react';
import { useId, useState, type FocusEvent, type FormEvent, type ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface SearchFiltersProps {
  filters: ProviderSearchFilters;
  onChange: (changes: Partial<ProviderSearchFilters>) => void;
  onReset: () => void;
  /** Titre « Filtres » + « Réinitialiser » (colonne de gauche). Dans le panneau mobile, c'est le panneau qui les affiche. */
  showHeader?: boolean;
  className?: string;
}

/** Origines visibles avant « Voir plus ». */
const VISIBLE_ORIGINS = 6;

/** Les choix de « Note minimale » (mêmes valeurs qu'avant : `?note=4` ou `?note=4.5`). */
const RATING_CHOICES: { value: number | undefined; label: string; short: string }[] = [
  { value: undefined, label: 'Toutes', short: 'Toutes' },
  { value: 4, label: '4 et plus', short: '4+' },
  { value: 4.5, label: '4,5 et plus', short: '4,5+' },
];

function FilterSection({
  title,
  children,
  as: Tag = 'div',
}: {
  title: ReactNode;
  children: ReactNode;
  as?: 'div' | 'fieldset';
}) {
  const Title = Tag === 'fieldset' ? 'legend' : 'h3';
  // Le filet est sur un <div> autour : sur un <fieldset>, la légende couperait la bordure.
  return (
    <div className="border-t border-border/70 pt-5 first:border-t-0 first:pt-0">
      <Tag className="grid gap-3">
        {/* Une <legend> ne compte pas dans l'écart de la grille : elle a sa propre marge. */}
        <Title
          className={cn(
            'font-sans text-base font-bold text-foreground',
            Tag === 'fieldset' && 'mb-3',
          )}
        >
          {title}
        </Title>
        {children}
      </Tag>
    </div>
  );
}

const checkboxClass =
  'size-5 shrink-0 cursor-pointer rounded accent-cta outline-none focus-visible:ring-[3px] focus-visible:ring-ring';

/**
 * Le panneau de filtres (P2). Il ne garde AUCUN état de recherche : il lit les filtres
 * reçus (venant de l'adresse) et signale les changements avec `onChange`.
 * La prestation, la ville et la date sont dans la barre du haut (`ResultsSearchBar`).
 *
 * Les cases et les choix s'appliquent tout de suite. Les champs nombre s'appliquent quand
 * on quitte le champ ou qu'on appuie sur Entrée, pour ne pas relancer une recherche à chaque chiffre.
 */
export function SearchFilters({
  filters,
  onChange,
  onReset,
  showHeader = true,
  className,
}: SearchFiltersProps) {
  const id = useId();
  const origins = useCulturalOrigins();
  const [showAllOrigins, setShowAllOrigins] = useState(false);

  const allOrigins = origins.data ?? [];
  // Repliée, la liste garde quand même les origines cochées (on ne cache jamais un filtre actif).
  const shownOrigins = showAllOrigins
    ? allOrigins
    : allOrigins.filter(
        (origin, index) =>
          index < VISIBLE_ORIGINS || (filters.origins?.includes(origin.slug) ?? false),
      );
  const hiddenCount = allOrigins.length - shownOrigins.length;

  function toggleOrigin(slug: string, checked: boolean) {
    const current = filters.origins ?? [];
    const next = checked ? [...current, slug] : current.filter((s) => s !== slug);
    onChange({ origins: next.length ? next : undefined });
  }

  /** Lit un champ nombre ; vide ou invalide = filtre retiré. */
  const numberValue = (value: string) => {
    const number = Number(value);
    return value.trim() === '' || !Number.isFinite(number) || number <= 0 ? undefined : number;
  };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const budget = numberValue(String(form.get('budget') ?? ''));
    onChange({
      budgetMax: budget === undefined ? undefined : Math.round(budget) * 100,
      guests: numberValue(String(form.get('invites') ?? '')),
    });
  }

  const submitOnBlur = (event: FocusEvent<HTMLInputElement>) =>
    event.currentTarget.form?.requestSubmit();

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-5', className)}
      aria-label="Filtres"
    >
      {showHeader && (
        <div className="-mb-1 flex items-center justify-between gap-3">
          <h2 className="font-sans text-xl font-bold text-foreground">Filtres</h2>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-medium text-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            <RotateCcw className="size-4" aria-hidden />
            Réinitialiser
          </button>
        </div>
      )}

      <FilterSection title="Budget et invités">
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-budget`} className="text-xs font-medium text-muted-foreground">
              Budget max (€)
            </Label>
            <Input
              key={`budget-${filters.budgetMax ?? ''}`}
              id={`${id}-budget`}
              name="budget"
              type="number"
              min={1}
              inputMode="numeric"
              placeholder="Max"
              className="h-10 rounded-[0.625rem] bg-card"
              defaultValue={filters.budgetMax === undefined ? '' : filters.budgetMax / 100}
              onBlur={submitOnBlur}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-guests`} className="text-xs font-medium text-muted-foreground">
              Invités
            </Label>
            <Input
              key={`guests-${filters.guests ?? ''}`}
              id={`${id}-guests`}
              name="invites"
              type="number"
              min={1}
              inputMode="numeric"
              placeholder="Nombre"
              className="h-10 rounded-[0.625rem] bg-card"
              defaultValue={filters.guests ?? ''}
              onBlur={submitOnBlur}
            />
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Origine culturelle" as="fieldset">
        <ul id={`${id}-origins`} className="grid gap-2.5">
          {shownOrigins.map((origin) => (
            <li key={origin.id}>
              <label className="flex cursor-pointer items-center gap-3 text-[0.9375rem]">
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={filters.origins?.includes(origin.slug) ?? false}
                  onChange={(event) => toggleOrigin(origin.slug, event.target.checked)}
                />
                {origin.name}
              </label>
            </li>
          ))}
        </ul>
        {(hiddenCount > 0 || showAllOrigins) && (
          <button
            type="button"
            aria-expanded={showAllOrigins}
            aria-controls={`${id}-origins`}
            onClick={() => setShowAllOrigins((open) => !open)}
            className="inline-flex w-fit items-center gap-1 rounded-sm text-sm font-semibold text-primary underline underline-offset-4 outline-none hover:text-primary-hover focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            {showAllOrigins ? 'Voir moins' : `Voir plus (${hiddenCount})`}
            <ChevronDown
              className={cn('size-4 transition-transform', showAllOrigins && 'rotate-180')}
              aria-hidden
            />
          </button>
        )}
      </FilterSection>

      <FilterSection title="Note minimale" as="fieldset">
        <div className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1">
          {RATING_CHOICES.map((choice) => {
            const checked = filters.minRating === choice.value;
            return (
              <label
                key={choice.label}
                className={cn(
                  'relative inline-flex h-10 cursor-pointer items-center justify-center gap-1 rounded-full text-sm font-semibold transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring',
                  checked
                    ? 'bg-primary text-primary-foreground shadow-card'
                    : 'text-foreground hover:bg-card',
                )}
              >
                <input
                  type="radio"
                  name={`${id}-note`}
                  className="sr-only"
                  checked={checked}
                  onChange={() => onChange({ minRating: choice.value })}
                />
                {choice.value !== undefined && (
                  <Star
                    aria-hidden
                    className={cn(
                      'size-4',
                      checked ? 'fill-accent text-accent' : 'fill-ochre text-ochre',
                    )}
                  />
                )}
                <span aria-hidden>{choice.short}</span>
                <span className="sr-only">{choice.label}</span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Profil">
        <label className="flex cursor-pointer items-center gap-3 text-[0.9375rem]">
          <input
            type="checkbox"
            className={checkboxClass}
            checked={filters.verifiedOnly ?? false}
            onChange={(event) => onChange({ verifiedOnly: event.target.checked || undefined })}
          />
          <span className="flex-1">Pros vérifiés uniquement</span>
          <BadgeCheck className="size-5 fill-title-accent text-card" aria-hidden />
        </label>
      </FilterSection>

      {/* Bouton invisible : permet d'appliquer les champs nombre avec la touche Entrée. */}
      <button type="submit" hidden />
    </form>
  );
}
