import {
  useCategories,
  useCulturalOrigins,
  type CulturalOrigin,
  type ProviderSearchFilters,
} from '@afro/common';
import { useId, type FocusEvent, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';

interface SearchFiltersProps {
  filters: ProviderSearchFilters;
  onChange: (changes: Partial<ProviderSearchFilters>) => void;
  onReset: () => void;
  /** Sur une page catégorie, la catégorie est imposée par l'adresse : pas de liste. */
  showCategory?: boolean;
}

/** Regroupe les origines par région (« Afrique de l'Ouest », « Caraïbes »…). */
function groupByRegion(origins: CulturalOrigin[]) {
  const groups = new Map<string, CulturalOrigin[]>();
  for (const origin of origins) {
    const region = origin.region ?? 'Autres';
    groups.set(region, [...(groups.get(region) ?? []), origin]);
  }
  return [...groups.entries()];
}

/**
 * Le panneau de filtres (P2). Il ne garde AUCUN état : il lit les filtres
 * reçus (venant de l'adresse) et signale les changements avec `onChange`.
 *
 * Les cases et listes s'appliquent tout de suite. Les champs texte et nombre
 * s'appliquent quand on quitte le champ ou qu'on appuie sur Entrée, pour ne
 * pas relancer une recherche à chaque lettre tapée.
 */
export function SearchFilters({
  filters,
  onChange,
  onReset,
  showCategory = true,
}: SearchFiltersProps) {
  const id = useId();
  const categories = useCategories();
  const origins = useCulturalOrigins();
  const mainCategories = categories.data?.filter((c) => !c.parentId) ?? [];

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
      city: String(form.get('ville') ?? '').trim() || undefined,
      budgetMax: budget === undefined ? undefined : Math.round(budget) * 100,
      guests: numberValue(String(form.get('invites') ?? '')),
    });
  }

  const submitOnBlur = (event: FocusEvent<HTMLInputElement>) =>
    event.currentTarget.form?.requestSubmit();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" aria-label="Filtres">
      {showCategory && (
        <div className="grid gap-2">
          <Label htmlFor={`${id}-category`}>Catégorie</Label>
          <NativeSelect
            id={`${id}-category`}
            value={filters.category ?? ''}
            onChange={(event) => onChange({ category: event.target.value || undefined })}
          >
            <option value="">Toutes les catégories</option>
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
          </NativeSelect>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor={`${id}-city`}>Ville</Label>
        <Input
          // La clé force le champ à se remettre à jour si le filtre change ailleurs (« Effacer »).
          key={`city-${filters.city ?? ''}`}
          id={`${id}-city`}
          name="ville"
          placeholder="Paris, Saint-Denis…"
          defaultValue={filters.city ?? ''}
          onBlur={submitOnBlur}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${id}-date`}>Date de l’événement</Label>
        <Input
          id={`${id}-date`}
          type="date"
          value={filters.date ?? ''}
          onChange={(event) => onChange({ date: event.target.value || undefined })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor={`${id}-budget`}>Budget max (€)</Label>
          <Input
            key={`budget-${filters.budgetMax ?? ''}`}
            id={`${id}-budget`}
            name="budget"
            type="number"
            min={1}
            inputMode="numeric"
            defaultValue={filters.budgetMax === undefined ? '' : filters.budgetMax / 100}
            onBlur={submitOnBlur}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${id}-guests`}>Invités</Label>
          <Input
            key={`guests-${filters.guests ?? ''}`}
            id={`${id}-guests`}
            name="invites"
            type="number"
            min={1}
            inputMode="numeric"
            defaultValue={filters.guests ?? ''}
            onBlur={submitOnBlur}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${id}-rating`}>Note minimale</Label>
        <NativeSelect
          id={`${id}-rating`}
          value={filters.minRating ?? ''}
          onChange={(event) =>
            onChange({ minRating: event.target.value ? Number(event.target.value) : undefined })
          }
        >
          <option value="">Toutes les notes</option>
          <option value="4.5">4,5 et plus</option>
          <option value="4">4 et plus</option>
        </NativeSelect>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          className="size-4 accent-brand-600"
          checked={filters.verifiedOnly ?? false}
          onChange={(event) => onChange({ verifiedOnly: event.target.checked || undefined })}
        />
        Pros vérifiés uniquement
      </label>

      <fieldset className="grid gap-3">
        <legend className="mb-2 text-sm font-medium">Origine culturelle</legend>
        {groupByRegion(origins.data ?? []).map(([region, items]) => (
          <div key={region} className="grid gap-1.5">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {region}
            </p>
            {items.map((origin) => (
              <label key={origin.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-brand-600"
                  checked={filters.origins?.includes(origin.slug) ?? false}
                  onChange={(event) => toggleOrigin(origin.slug, event.target.checked)}
                />
                {origin.name}
              </label>
            ))}
          </div>
        ))}
      </fieldset>

      {/* Bouton invisible : permet d'appliquer les champs texte avec la touche Entrée. */}
      <button type="submit" hidden />
      <Button type="button" variant="outline" onClick={onReset}>
        Effacer les filtres
      </Button>
    </form>
  );
}
