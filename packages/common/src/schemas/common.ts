import { z } from 'zod';

/** Identifiant unique (UUID ou slug technique dans les mocks). */
export const idSchema = z.string().min(1);

/** Slug pour les URL : minuscules, chiffres et tirets (« saveurs-de-dakar »). */
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Uniquement des minuscules, chiffres et tirets');

/**
 * Montant en centimes d'euro (entier positif).
 * 90000 = 900,00 €. On évite ainsi les erreurs d'arrondi des nombres à virgule.
 */
export const amountInCentsSchema = z.number().int().nonnegative();

/** Pourcentage entre 0 et 100 (ex. 30 pour un acompte de 30 %). */
export const percentSchema = z.number().min(0).max(100);

/** Date et heure au format ISO, ex. « 2026-11-22T10:00:00Z ». */
export const isoDateTimeSchema = z.iso.datetime();

/** Jour au format ISO, ex. « 2026-12-31 ». */
export const isoDateSchema = z.iso.date();

/** Code postal français à 5 chiffres. */
/** Le message d'un code postal mal écrit (traduit dans l'app via errorKeyOf). */
export const POSTAL_CODE_MESSAGE = 'Code postal à 5 chiffres';
export const postalCodeSchema = z.string().regex(/^\d{5}$/, POSTAL_CODE_MESSAGE);

/** Coordonnées GPS, pour calculer les distances (et plus tard la carte). */
export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * Champs présents sur toutes les entités : on les ajoute avec `.extend(timestamps)`.
 * Au lieu de les répéter partout.
 */
export const timestamps = {
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
};

/**
 * Une page de résultats (recherche, listes d'admin…).
 * `paginated(providerCardSchema)` décrit { items: ProviderCard[], total, page, pageSize }.
 */
export function paginated<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  });
}

/** Texte saisi par un humain : espaces retirés aux extrémités, longueur bornée. */
export function text(min: number, max: number, tooShort: string) {
  return z.string().trim().min(min, tooShort).max(max, `${max} caractères maximum`);
}
