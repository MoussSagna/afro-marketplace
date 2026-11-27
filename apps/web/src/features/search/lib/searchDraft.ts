import {
  paramsFromFilters,
  toIsoDate,
  type Category,
  type ProviderSearchFilters,
} from '@afro/common';
import {
  Camera,
  ClipboardList,
  ConciergeBell,
  Music,
  PartyPopper,
  Shirt,
  Sparkles,
  Tent,
  type LucideIcon,
} from 'lucide-react';
import { create } from 'zustand';

/*
 * La recherche « guidée » (inspirée du parcours d'Airbnb) : trois étapes, Quoi → Où → Quand.
 * Ce fichier contient la logique sans écran : le brouillon partagé, les suggestions, les dates rapides.
 * Tout est en fonctions pures (faciles à tester), sauf le petit store du brouillon.
 */

/** Les trois étapes de la recherche, dans l'ordre. */
export type SearchStep = 'what' | 'where' | 'when';
export const SEARCH_STEPS: SearchStep[] = ['what', 'where', 'when'];

/** L'étape qui suit (pour avancer tout seul après un choix), ou `null` à la fin. */
export function nextStep(step: SearchStep): SearchStep | null {
  return SEARCH_STEPS[SEARCH_STEPS.indexOf(step) + 1] ?? null;
}

interface SearchDraftState {
  /** Slug de la catégorie choisie (vide : toutes). */
  category: string;
  /** Texte tapé dans « Quoi ? » tant qu'aucune catégorie n'est choisie. */
  whatText: string;
  city: string;
  /** Jour « AAAA-MM-JJ » (vide : n'importe quand). */
  date: string;
  set(changes: Partial<Pick<SearchDraftState, 'category' | 'whatText' | 'city' | 'date'>>): void;
  reset(): void;
}

const EMPTY = { category: '', whatText: '', city: '', date: '' };

/**
 * Le brouillon de recherche, partagé par toutes les barres de la page (hero, en-tête, plein écran
 * sur téléphone) : ce qu'on tape dans l'une se retrouve dans l'autre. Pas gardé au rechargement.
 */
export const useSearchDraft = create<SearchDraftState>()((set) => ({
  ...EMPTY,
  set: (changes) => set(changes),
  reset: () => set(EMPTY),
}));

/**
 * Vrai tant que la grande recherche du hero est à l'écran. L'en-tête de l'accueil s'en sert :
 * une fois le hero dépassé, il affiche sa recherche compacte à la place des liens (comme Airbnb).
 */
export const useHeroSearchInView = create<{ inView: boolean; setInView(inView: boolean): void }>()(
  (set) => ({ inView: true, setInView: (inView) => set({ inView }) }),
);

/** Les valeurs d'un brouillon de recherche (sans les fonctions du store). */
export type SearchDraftValues = Pick<SearchDraftState, 'category' | 'whatText' | 'city' | 'date'>;

/** Les filtres de recherche que donne un brouillon (« Quoi / Où / Quand »). */
export function filtersFromDraft(draft: SearchDraftValues): ProviderSearchFilters {
  return {
    category: draft.category || undefined,
    // Texte tapé sans choisir de catégorie : on cherche ce texte partout (nom, bio…).
    q: (!draft.category && draft.whatText.trim()) || undefined,
    city: draft.city.trim() || undefined,
    date: draft.date || undefined,
  };
}

/** L'inverse : le brouillon qui correspond à des filtres (page de résultats ouverte par un lien). */
export function draftFromFilters(filters: ProviderSearchFilters): SearchDraftValues {
  return {
    category: filters.category ?? '',
    whatText: filters.category ? '' : (filters.q ?? ''),
    city: filters.city ?? '',
    date: filters.date ?? '',
  };
}

/** L'adresse des résultats pour un brouillon (`/recherche?categorie=…&ville=…&date=…`). */
export function searchUrl(draft: SearchDraftValues) {
  const params = paramsFromFilters(filtersFromDraft(draft));
  const query = params.toString();
  return query ? `/recherche?${query}` : '/recherche';
}

/** Minuscules, sans accents : « Évry » et « evry » se retrouvent. */
export function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Une icône par grande catégorie (slugs du catalogue de démo). */
export const GROUP_ICONS: Record<string, LucideIcon> = {
  'organisation-lieux': ClipboardList,
  'traiteur-boissons': ConciergeBell,
  'mode-tenues': Shirt,
  'deco-location': Tent,
  'musique-animation': Music,
  'beaute-soins': Sparkles,
  'photo-video': Camera,
  'services-evenementiels': PartyPopper,
};

export function groupIcon(slug: string): LucideIcon {
  return GROUP_ICONS[slug] ?? Sparkles;
}

/** Une proposition dans la liste « Quoi ? ». */
export interface CategorySuggestion {
  slug: string;
  name: string;
  /** Le nom de la grande catégorie (vide pour une grande catégorie elle-même). */
  groupName: string;
  /** Slug de la grande catégorie, pour l'icône. */
  groupSlug: string;
}

/**
 * Les catégories proposées pour un texte tapé :
 * - rien de tapé : les grandes catégories (les « univers ») ;
 * - sinon : grandes et sous-catégories dont le nom contient le texte, celles qui
 *   COMMENCENT par le texte d'abord.
 */
export function suggestCategories(
  categories: Category[],
  text: string,
  limit = 8,
): CategorySuggestion[] {
  const groups = new Map(categories.filter((c) => !c.parentId).map((c) => [c.id, c]));
  const toSuggestion = (category: Category): CategorySuggestion => {
    const group = category.parentId ? groups.get(category.parentId) : undefined;
    return {
      slug: category.slug,
      name: category.name,
      groupName: group?.name ?? '',
      groupSlug: group?.slug ?? category.slug,
    };
  };
  const query = normalize(text);
  if (!query) return [...groups.values()].map(toSuggestion);

  const scored = categories
    .map((category) => {
      const name = normalize(category.name);
      const words = name.split(/[\s&,-]+/);
      if (name.startsWith(query)) return { category, score: 0 };
      if (words.some((word) => word.startsWith(query))) return { category, score: 1 };
      if (name.includes(query)) return { category, score: 2 };
      return null;
    })
    .filter((match) => match !== null);
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((match) => toSuggestion(match.category));
}

/**
 * Les villes proposées dans « Où ? » (données de démo : là où sont les prestataires).
 * Avec le back-end, elles viendront d'une vraie liste de communes.
 */
export const POPULAR_CITIES = [
  { name: 'Paris', hint: 'Île-de-France' },
  { name: 'Saint-Denis', hint: 'Seine-Saint-Denis' },
  { name: 'Montreuil', hint: 'Seine-Saint-Denis' },
  { name: 'Créteil', hint: 'Val-de-Marne' },
  { name: 'Bobigny', hint: 'Seine-Saint-Denis' },
  { name: 'Argenteuil', hint: "Val-d'Oise" },
  { name: 'Sarcelles', hint: "Val-d'Oise" },
  { name: 'Évry-Courcouronnes', hint: 'Essonne' },
  { name: 'Nanterre', hint: 'Hauts-de-Seine' },
  { name: 'Versailles', hint: 'Yvelines' },
  { name: 'Cergy', hint: "Val-d'Oise" },
  { name: 'Massy', hint: 'Essonne' },
];

export function suggestCities(text: string, limit = 6) {
  const query = normalize(text);
  if (!query) return POPULAR_CITIES.slice(0, limit);
  return POPULAR_CITIES.filter((city) => normalize(city.name).includes(query)).slice(0, limit);
}

/** Le samedi qui vient (aujourd'hui si on est samedi), en jour « AAAA-MM-JJ ». */
export function upcomingSaturday(today: Date = new Date(), weeksLater = 0) {
  const date = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const daysToSaturday = (6 - date.getUTCDay() + 7) % 7;
  date.setUTCDate(date.getUTCDate() + daysToSaturday + weeksLater * 7);
  return toIsoDate(date);
}

/** Les raccourcis de dates : « Ce samedi », « Samedi prochain », « Dans un mois ». */
export function quickDates(today: Date = new Date()) {
  const inAMonth = new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, today.getDate()));
  return [
    { label: 'Ce samedi', date: upcomingSaturday(today) },
    { label: 'Samedi prochain', date: upcomingSaturday(today, 1) },
    { label: 'Dans un mois', date: toIsoDate(inAMonth) },
  ];
}

const shortDate = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

/** « 2027-06-12 » → « sam. 12 juin ». */
export function formatShortDate(day: string) {
  return shortDate.format(new Date(`${day}T00:00:00Z`));
}
