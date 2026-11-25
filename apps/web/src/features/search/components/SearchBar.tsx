import { paramsFromFilters, toIsoDate, useCategories } from '@afro/common';
import {
  CalendarDays,
  ChevronDown,
  LayoutGrid,
  MapPin,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { cn } from '@/lib/utils';

/**
 * La recherche flottante du hero (P1) : « Que recherchez-vous ? / Où ? / Quand ? ».
 * Elle mène à la page de résultats avec les filtres dans l'adresse.
 *
 * Mise en page : une pilule horizontale sur grand écran, deux lignes sur tablette,
 * une colonne sur téléphone. Les champs restent natifs (liste, texte, date) :
 * clavier, lecteurs d'écran et sélecteurs du téléphone fonctionnent sans effort.
 */
export function SearchBar({ className }: { className?: string }) {
  const id = useId();
  const navigate = useNavigate();
  const categories = useCategories();
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [date, setDate] = useState('');
  const mainCategories = categories.data?.filter((c) => !c.parentId) ?? [];

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const params = paramsFromFilters({
      category: category || undefined,
      city: city.trim() || undefined,
      date: date || undefined,
    });
    const query = params.toString();
    void navigate(query ? `/recherche?${query}` : '/recherche');
  }

  const control =
    'w-full min-w-0 truncate bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed lg:text-sm xl:text-[15px]';

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Rechercher un prestataire"
      className={cn(
        'grid grid-cols-1 gap-1 rounded-3xl bg-card p-2 text-foreground shadow-pop md:grid-cols-2 lg:flex lg:h-[84px] lg:w-full lg:max-w-[1120px] lg:items-center lg:gap-0 lg:rounded-full lg:py-2.5 lg:pr-2.5 lg:pl-2',
        className,
      )}
    >
      <SearchField
        icon={LayoutGrid}
        label="Que recherchez-vous ?"
        htmlFor={`${id}-what`}
        chevron
        wide
      >
        <select
          id={`${id}-what`}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          disabled={categories.isPending}
          className={cn(
            control,
            'cursor-pointer appearance-none pr-1',
            !category && 'text-muted-foreground',
          )}
        >
          <option value="">Traiteur, DJ, danseur…</option>
          {mainCategories.map((main) => (
            <optgroup key={main.id} label={main.name}>
              <option value={main.slug}>Tout « {main.name} »</option>
              {categories.data
                ?.filter((c) => c.parentId === main.id)
                .map((sub) => (
                  <option key={sub.id} value={sub.slug}>
                    {sub.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </SearchField>

      <Separator />

      <SearchField icon={MapPin} label="Où ?" htmlFor={`${id}-where`} chevron>
        <input
          id={`${id}-where`}
          placeholder="Ville, région…"
          autoComplete="address-level2"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          className={control}
        />
      </SearchField>

      <Separator />

      <SearchField icon={CalendarDays} label="Quand ?" htmlFor={`${id}-when`} chevron>
        <div className="relative">
          <input
            id={`${id}-when`}
            type="date"
            min={toIsoDate(new Date())}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            // Ouvre le calendrier au clic n'importe où dans le champ (navigateurs récents).
            onClick={(event) => {
              try {
                event.currentTarget.showPicker();
              } catch {
                // Navigateur ancien ou test : le champ reste utilisable au clavier.
              }
            }}
            className={cn(
              control,
              'peer cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden',
              // Vide et sans focus : on cache « jj/mm/aaaa » au profit du texte d'aide.
              !date && '[&:not(:focus)]:text-transparent',
            )}
          />
          {!date && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center truncate text-[15px] text-muted-foreground peer-focus:hidden lg:text-sm xl:text-[15px]"
            >
              Date de votre événement
            </span>
          )}
        </div>
      </SearchField>

      <button
        type="submit"
        className="mt-1 flex h-14 items-center justify-center gap-3 rounded-2xl bg-cta px-8 text-lg font-semibold text-cta-foreground shadow-xs transition-[background-color,transform,box-shadow] outline-none hover:bg-cta-hover focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 md:mt-0 md:h-auto md:min-h-14 lg:ml-2 lg:h-full lg:shrink-0 lg:rounded-full lg:px-7 lg:text-lg xl:px-9"
      >
        <Search className="size-6" strokeWidth={2.2} aria-hidden />
        Rechercher
      </button>
    </form>
  );
}

interface SearchFieldProps {
  icon: LucideIcon;
  label: string;
  htmlFor: string;
  chevron?: boolean;
  /** Champ un peu plus large (la prestation a le libellé le plus long). */
  wide?: boolean;
  children: ReactNode;
}

/** Un champ de la recherche : icône, intitulé en gras, contrôle en dessous. */
function SearchField({ icon: Icon, label, htmlFor, chevron, wide, children }: SearchFieldProps) {
  return (
    <div
      className={cn(
        'relative flex min-w-0 items-center gap-4 rounded-2xl bg-muted/50 px-4 py-3 transition-colors focus-within:bg-muted hover:bg-muted lg:h-full lg:gap-3.5 lg:rounded-full lg:bg-transparent lg:px-5 xl:px-6',
        wide ? 'lg:flex-[1.25]' : 'lg:flex-1',
      )}
    >
      <Icon className="size-7 shrink-0 lg:size-6" strokeWidth={1.6} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 lg:gap-1">
        <label
          htmlFor={htmlFor}
          className="cursor-pointer truncate text-base font-semibold lg:text-[15px] xl:text-base"
        >
          {label}
        </label>
        {children}
      </div>
      {chevron && (
        <ChevronDown
          className="pointer-events-none size-5 shrink-0 lg:hidden xl:block"
          aria-hidden
        />
      )}
    </div>
  );
}

/** Le trait vertical entre deux champs (grand écran seulement). */
function Separator() {
  return <span aria-hidden className="hidden h-11 w-px shrink-0 bg-border lg:block" />;
}
