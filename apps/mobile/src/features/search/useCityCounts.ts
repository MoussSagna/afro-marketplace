import { useProviderSearch } from '@afro/common';
import { useMemo } from 'react';

/**
 * Les villes où des prestataires sont inscrits, avec leur nombre (les plus fournies d'abord),
 * filtrées par ce qu'on tape. Ce sont de VRAIES données (pas des suggestions inventées) :
 * tous les prestataires (une page de 50) ; le vrai serveur aura sa liste de villes.
 * Partagé par l'étape « Où ? » de la recherche et le filtre « Lieu ».
 */
export function useCityCounts(typed: string | undefined, max = 5): [string, number][] {
  const all = useProviderSearch({ pageSize: 50 });
  return useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of all.data?.items ?? []) {
      if (p.city) counts.set(p.city, (counts.get(p.city) ?? 0) + 1);
    }
    const text = (typed ?? '').trim().toLowerCase();
    return [...counts]
      .filter(([city]) => !text || city.toLowerCase().includes(text))
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, max);
  }, [all.data, typed, max]);
}
