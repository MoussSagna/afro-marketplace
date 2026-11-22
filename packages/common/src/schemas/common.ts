import { z } from 'zod';

/** Identifiant unique (UUID ou slug technique dans les mocks). */
export const idSchema = z.string().min(1);

/**
 * Montant en centimes d'euro (entier positif).
 * 90000 = 900,00 €. On évite ainsi les erreurs d'arrondi des nombres à virgule.
 */
export const amountInCentsSchema = z.number().int().nonnegative();

/** Date et heure au format ISO, ex. « 2026-11-22T10:00:00Z ». */
export const isoDateTimeSchema = z.iso.datetime();

/** Jour au format ISO, ex. « 2026-12-31 ». */
export const isoDateSchema = z.iso.date();
