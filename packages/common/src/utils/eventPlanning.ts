import type { Category, PlannedEventType } from '../types';

/**
 * Les familles de prestataires conseillées par type d'événement (« Complétez votre événement »),
 * dans l'ordre d'importance. Identifiants des 8 groupes du catalogue. Partagé site + app.
 */
const RECOMMENDED_GROUPS: Record<PlannedEventType, string[]> = {
  wedding: [
    'cat-food',
    'cat-show',
    'cat-deco',
    'cat-media',
    'cat-beauty',
    'cat-fashion',
    'cat-planning',
  ],
  party: ['cat-show', 'cat-food', 'cat-deco', 'cat-media'],
  baptism: ['cat-food', 'cat-deco', 'cat-media', 'cat-planning'],
  birthday: ['cat-food', 'cat-show', 'cat-deco', 'cat-media'],
  conference: ['cat-planning', 'cat-food', 'cat-media', 'cat-services'],
  other: ['cat-food', 'cat-show', 'cat-deco', 'cat-media'],
};

/** La famille (groupe) d'un prestataire : celle de sa première catégorie. */
export function providerGroupId(categoryIds: string[], categories: Category[]): string | undefined {
  const first = categories.find((c) => c.id === categoryIds[0]);
  return first ? (first.parentId ?? first.id) : undefined;
}

/** Les familles conseillées qui manquent encore (3 au plus). */
export function missingGroups(type: PlannedEventType, presentGroupIds: Iterable<string>, max = 3) {
  const present = new Set(presentGroupIds);
  return RECOMMENDED_GROUPS[type].filter((id) => !present.has(id)).slice(0, max);
}
