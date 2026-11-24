import { useCategories, paramsFromFilters } from '@afro/common';
import { Search } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';

/** La recherche « Quoi / Où / Quand » de l'accueil (P1) : elle mène à la page de résultats. */
export function HeroSearchForm() {
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
    navigate(query ? `/recherche?${query}` : '/recherche');
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Rechercher un prestataire"
      className="grid gap-3 rounded-2xl border bg-card p-4 shadow-sm md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-end"
    >
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-what`}>Quoi ?</Label>
        <NativeSelect
          id={`${id}-what`}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">Toutes les prestations</option>
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
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-where`}>Où ?</Label>
        <Input
          id={`${id}-where`}
          placeholder="Paris, Créteil…"
          value={city}
          onChange={(event) => setCity(event.target.value)}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-when`}>Quand ?</Label>
        <Input
          id={`${id}-when`}
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>
      <Button type="submit" variant="cta" size="lg" className="md:h-9">
        <Search aria-hidden />
        Rechercher
      </Button>
    </form>
  );
}
