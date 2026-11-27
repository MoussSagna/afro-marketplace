import { useCategories } from '@afro/common';
import { createContext, useContext, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import {
  formatShortDate,
  nextStep,
  searchUrl,
  suggestCategories,
  suggestCities,
  useSearchDraft,
  type SearchDraftValues,
  type SearchStep,
} from '../../lib/searchDraft';

/**
 * Ce que fait « Rechercher ». Par défaut (accueil, en-tête) : aller sur `/recherche` avec la prestation,
 * la ville et la date. La page de résultats fournit sa propre action pour garder les autres filtres
 * (origines, note, tri…) : mêmes barres, seule l'action change.
 */
export const GuidedSearchActionContext = createContext<((draft: SearchDraftValues) => void) | null>(
  null,
);

/** Une ligne des listes « Quoi ? » et « Où ? ». */
export interface GuidedOption {
  key: string;
  label: string;
  hint: string;
  /** Slug de la grande catégorie (icône) pour « Quoi ? » ; vide pour une ville. */
  groupSlug?: string;
  pick(): void;
}

/**
 * La logique commune à la pilule (ordinateur) et au plein écran (téléphone) :
 * l'étape ouverte, le brouillon, les listes de propositions et l'envoi.
 * Les deux écrans ne font qu'afficher ce que ce hook leur donne.
 */
export function useGuidedSearch({ onSubmit }: { onSubmit?: () => void } = {}) {
  const draft = useSearchDraft();
  const categories = useCategories();
  const navigate = useNavigate();
  const customAction = useContext(GuidedSearchActionContext);
  const [step, setStep] = useState<SearchStep | null>(null);

  const categoryName = categories.data?.find((c) => c.slug === draft.category)?.name ?? '';
  /** Ce qu'affiche le champ « Quoi ? » : la catégorie choisie, sinon le texte tapé. */
  const whatValue = draft.category ? categoryName : draft.whatText;

  function advance(from: SearchStep) {
    setStep(nextStep(from) ?? from);
  }

  const whatOptions: GuidedOption[] = suggestCategories(
    categories.data ?? [],
    draft.category ? '' : draft.whatText,
  ).map((suggestion) => ({
    key: suggestion.slug,
    label: suggestion.name,
    hint: suggestion.groupName,
    groupSlug: suggestion.groupSlug,
    pick: () => {
      draft.set({ category: suggestion.slug, whatText: '' });
      advance('what');
    },
  }));

  const typedCity = draft.city.trim();
  const cities = suggestCities(draft.city);
  const cityOptions: GuidedOption[] = cities.map((city) => ({
    key: city.name,
    label: city.name,
    hint: city.hint,
    pick: () => {
      draft.set({ city: city.name });
      advance('where');
    },
  }));
  // Une ville hors de la liste reste possible : on la propose telle quelle, en premier.
  if (typedCity && !cities.some((city) => city.name.toLowerCase() === typedCity.toLowerCase())) {
    cityOptions.unshift({
      key: `free-${typedCity}`,
      label: typedCity,
      hint: 'Chercher dans cette ville',
      pick: () => advance('where'),
    });
  }

  function submit() {
    setStep(null);
    onSubmit?.();
    const values = useSearchDraft.getState();
    if (customAction) customAction(values);
    else void navigate(searchUrl(values));
  }

  return {
    draft,
    step,
    setStep,
    advance,
    categoriesLoading: categories.isPending,
    whatValue,
    whatOptions,
    cityOptions,
    dateLabel: draft.date ? formatShortDate(draft.date) : '',
    /** Résumés courts (en-tête compact, cartes repliées du plein écran). */
    summary: {
      what: whatValue || 'Toutes les prestations',
      where: draft.city.trim() || 'Partout',
      when: draft.date ? formatShortDate(draft.date) : 'N’importe quand',
    },
    submit,
  };
}

export type GuidedSearch = ReturnType<typeof useGuidedSearch>;

/**
 * Le clavier dans une liste de propositions (motif « combobox » de l'ARIA) :
 * flèches haut/bas pour se déplacer, Entrée pour choisir. Le focus reste dans le champ.
 */
export function useActiveOption(options: GuidedOption[], onEnterWithoutChoice: () => void) {
  const [active, setActive] = useState(-1);
  const index = active < options.length ? active : -1;

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!options.length) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((current) => (current + step + options.length) % options.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const option = options[index];
      if (option) option.pick();
      else onEnterWithoutChoice();
      setActive(-1);
    }
  }

  return { active: index, setActive, onKeyDown, reset: () => setActive(-1) };
}
