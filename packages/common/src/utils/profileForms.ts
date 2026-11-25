import { z } from 'zod';
import { pricingTypeSchema } from '../schemas/catalogue';
import { POSTAL_CODE_MESSAGE } from '../schemas/common';
import { cancellationPolicySchema, legalTypeSchema } from '../schemas/provider';
import type {
  Offering,
  OfferingInput,
  ProviderProfile,
  UpdateProviderProfileInput,
} from '../types';
import { centsToEuros, eurosToCents } from './money';

/*
 * Les formulaires du profil prestataire (site : onboarding S1 et « Modifier mon profil » S7 ;
 * app : « Mon profil », lot M15c). Comme pour les devis, ils sont séparés des schémas de
 * l'API : un champ contient toujours du texte (« 30 », « 12,50 »), l'API attend des nombres.
 */

/** Les messages d'erreur des formulaires du profil (traduits via errorKeyOf, voir i18n/fr.ts). */
export const profileFormMessages = {
  optionalCount: 'Un nombre entier, ou rien',
  displayNameTooShort: 'Le nom commercial est trop court',
  siretFormat: 'Le SIRET contient 14 chiffres',
  categoriesRequired: 'Choisis au moins une catégorie',
  fiveMax: '5 maximum',
  languagesRequired: 'Choisis au moins une langue',
  cityRequired: 'Indique ta ville',
  travelRadiusRange: 'Entre 0 et 1 000 km',
  bioTooLong: '3 000 caractères maximum',
  maxBookingsRange: 'Entre 1 et 20',
  categoryRequired: 'Choisis une catégorie',
  offeringTitleTooShort: 'Le titre est trop court',
  priceRequired: 'Indique un prix (ou choisis « sur devis »)',
  guestsOrder: 'Le maximum doit être supérieur ou égal au minimum',
} as const;
const m = profileFormMessages;

const wholeNumber = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, message)
    .refine((value) => Number(value) >= min && Number(value) <= max, message);

/** Champ facultatif : vide, ou un entier positif. */
const optionalCount = z
  .string()
  .trim()
  .regex(/^(\d+)?$/, m.optionalCount)
  .refine((value) => value === '' || Number(value) > 0, m.optionalCount);

// ------------------------------------------------------------------ Étape 1 : identité

export const identityFormSchema = z.object({
  displayName: z.string().trim().min(2, m.displayNameTooShort).max(80),
  legalType: legalTypeSchema,
  siret: z
    .string()
    .transform((value) => value.replace(/\s/g, ''))
    .pipe(z.string().regex(/^(\d{14})?$/, m.siretFormat)),
});
export type IdentityFormValues = z.input<typeof identityFormSchema>;

export const identityDefaults = (p: ProviderProfile): IdentityFormValues => ({
  displayName: p.displayName,
  legalType: p.legalType,
  siret: p.siret ?? '',
});

export function toIdentityInput(values: IdentityFormValues): UpdateProviderProfileInput {
  const { displayName, legalType, siret } = identityFormSchema.parse(values);
  return { displayName, legalType, ...(siret && { siret }) };
}

// ------------------------------------------------------- Étape 2 : catégories et origines

export const categoriesFormSchema = z.object({
  categoryIds: z.array(z.string()).min(1, m.categoriesRequired).max(5, m.fiveMax),
  culturalOriginIds: z.array(z.string()).max(5, m.fiveMax),
  languages: z.array(z.string()).min(1, m.languagesRequired),
});
export type CategoriesFormValues = z.infer<typeof categoriesFormSchema>;

export const categoriesDefaults = (p: ProviderProfile): CategoriesFormValues => ({
  categoryIds: p.categoryIds,
  culturalOriginIds: p.culturalOriginIds,
  languages: p.languages,
});

// ------------------------------------------------------------------ Étape 3 : zone

export const areaFormSchema = z.object({
  city: z.string().trim().min(1, m.cityRequired).max(80),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, POSTAL_CODE_MESSAGE),
  travelRadiusKm: wholeNumber(0, 1000, m.travelRadiusRange),
});
export type AreaFormValues = z.infer<typeof areaFormSchema>;

export const areaDefaults = (p: ProviderProfile): AreaFormValues => ({
  city: p.city,
  postalCode: p.postalCode,
  travelRadiusKm: String(p.travelRadiusKm),
});

export const toAreaInput = (v: AreaFormValues): UpdateProviderProfileInput => ({
  city: v.city.trim(),
  postalCode: v.postalCode.trim(),
  travelRadiusKm: Number(v.travelRadiusKm),
});

// ----------------------------------------------------------- Étape 4 : présentation

export const presentationFormSchema = z.object({
  bio: z.string().max(3000, m.bioTooLong),
});
export type PresentationFormValues = z.infer<typeof presentationFormSchema>;

// ---------------------------------------------------------- Étape 6 : disponibilités

export const availabilityFormSchema = z.object({
  maxBookingsPerDay: wholeNumber(1, 20, m.maxBookingsRange),
});
export type AvailabilityFormValues = z.infer<typeof availabilityFormSchema>;

// -------------------------------------------------------------- Étape 7 : annulation

export const policyFormSchema = z.object({ cancellationPolicy: cancellationPolicySchema });
export type PolicyFormValues = z.infer<typeof policyFormSchema>;

// ------------------------------------------------------------------- Formules

export const offeringFormSchema = z
  .object({
    categoryId: z.string().min(1, m.categoryRequired),
    title: z.string().trim().min(3, m.offeringTitleTooShort).max(100),
    description: z.string().max(2000),
    pricingType: pricingTypeSchema,
    price: z.string(),
    minGuests: optionalCount,
    maxGuests: optionalCount,
    isActive: z.boolean(),
  })
  .superRefine((o, ctx) => {
    if (o.pricingType !== 'on_quote') {
      const cents = eurosToCents(o.price);
      if (cents === undefined || cents <= 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['price'],
          message: m.priceRequired,
        });
      }
    }
    if (o.minGuests && o.maxGuests && Number(o.minGuests) > Number(o.maxGuests)) {
      ctx.addIssue({
        code: 'custom',
        path: ['maxGuests'],
        message: m.guestsOrder,
      });
    }
  });
export type OfferingFormValues = z.infer<typeof offeringFormSchema>;

export function offeringDefaults(categoryId: string, offering?: Offering): OfferingFormValues {
  return {
    categoryId: offering?.categoryId ?? categoryId,
    title: offering?.title ?? '',
    description: offering?.description ?? '',
    pricingType: offering?.pricingType ?? 'per_person',
    price: offering?.price === undefined ? '' : centsToEuros(offering.price),
    minGuests: offering?.minGuests?.toString() ?? '',
    maxGuests: offering?.maxGuests?.toString() ?? '',
    isActive: offering?.isActive ?? true,
  };
}

export function toOfferingInput(v: OfferingFormValues): OfferingInput {
  const price = v.pricingType === 'on_quote' ? undefined : eurosToCents(v.price);
  return {
    categoryId: v.categoryId,
    title: v.title.trim(),
    description: v.description.trim(),
    pricingType: v.pricingType,
    isActive: v.isActive,
    ...(price !== undefined && { price }),
    ...(v.minGuests && { minGuests: Number(v.minGuests) }),
    ...(v.maxGuests && { maxGuests: Number(v.maxGuests) }),
  };
}
