import { z } from 'zod';
import {
  amountInCentsSchema,
  idSchema,
  isoDateTimeSchema,
  locationSchema,
  postalCodeSchema,
  slugSchema,
  text,
  timestamps,
} from './common';

/** Cycle de vie d'un profil (voir le diagramme de l'étape 2). Seuls les « published » sont visibles. */
export const providerStatusSchema = z.enum([
  'draft',
  'pending_review',
  'changes_requested',
  'published',
  'rejected',
  'paused',
  'suspended',
]);

export const legalTypeSchema = z.enum(['individual', 'company', 'association']);

/** Politique d'annulation, choisie dans une liste fixe (voir la règle n° 9). */
export const cancellationPolicySchema = z.enum(['flexible', 'moderate', 'strict']);

/** SIRET : 14 chiffres (les espaces sont tolérés à la saisie). */
export const siretSchema = z
  .string()
  .transform((value) => value.replace(/\s/g, ''))
  .pipe(z.string().regex(/^\d{14}$/, 'Le SIRET contient 14 chiffres'));

/** La « vitrine » complète d'un prestataire, telle qu'elle est stockée. */
export const providerProfileSchema = z.object({
  id: idSchema,
  /** Le propriétaire (relation 1 à 1 avec User). */
  userId: idSchema,
  displayName: z.string().min(1),
  slug: slugSchema,
  bio: z.string(),
  coverUrl: z.url().optional(),
  legalType: legalTypeSchema,
  siret: z
    .string()
    .regex(/^\d{14}$/)
    .optional(),
  /** Badge « pro vérifié », mis par un admin après contrôle du SIRET. */
  isProVerified: z.boolean(),
  categoryIds: z.array(idSchema),
  culturalOriginIds: z.array(idSchema),
  languages: z.array(z.string().min(2)),
  city: z.string(),
  postalCode: z.union([postalCodeSchema, z.literal('')]),
  location: locationSchema.optional(),
  travelRadiusKm: z.number().int().min(0).max(1000),
  /** « À partir de », calculé depuis les formules (voir computePriceFrom). */
  priceFrom: amountInCentsSchema.optional(),
  maxBookingsPerDay: z.number().int().min(1).max(20),
  cancellationPolicy: cancellationPolicySchema,
  status: providerStatusSchema,
  /** Message de l'admin quand il demande des corrections ou refuse. */
  rejectionReason: z.string().optional(),
  /** Pour reprendre l'onboarding là où il s'est arrêté (0 = pas commencé). */
  onboardingStep: z.number().int().min(0),
  /** Recalculés à chaque avis (règle n° 8). */
  ratingAverage: z.number().min(0).max(5),
  ratingCount: z.number().int().nonnegative(),
  responseTimeHours: z.number().nonnegative().optional(),
  /** Mise en avant payante (V2). */
  featuredUntil: isoDateTimeSchema.optional(),
  /** Paiement en ligne (après le MVP). */
  stripeAccountId: z.string().optional(),
  ...timestamps,
});

/**
 * Ce que tout le monde peut voir d'un profil : on retire les champs internes
 * (SIRET, motif de refus, compte Stripe…).
 */
export const publicProviderProfileSchema = providerProfileSchema.omit({
  siret: true,
  rejectionReason: true,
  onboardingStep: true,
  stripeAccountId: true,
  featuredUntil: true,
});

/**
 * Version allégée d'un profil prestataire, telle que l'API la renvoie
 * pour les listes (accueil, résultats de recherche).
 */
export const providerCardSchema = z.object({
  id: idSchema,
  slug: z.string().min(1),
  displayName: z.string().min(1),
  coverUrl: z.url().optional(),
  city: z.string().min(1),
  categoryIds: z.array(idSchema).min(1),
  culturalOriginIds: z.array(idSchema),
  /** Prix « à partir de », en centimes. Absent si tout est sur devis. */
  priceFrom: amountInCentsSchema.optional(),
  ratingAverage: z.number().min(0).max(5),
  ratingCount: z.number().int().nonnegative(),
  isProVerified: z.boolean(),
});

/**
 * Formulaire de profil (onboarding S1 et « Modifier mon profil » S7).
 * Tous les champs sont facultatifs : on enregistre étape par étape.
 * C'est au moment de l'envoi en validation que la règle n° 2 vérifie que tout est là.
 */
export const updateProviderProfileInputSchema = z
  .object({
    displayName: text(2, 80, 'Le nom commercial est trop court'),
    bio: text(0, 3000, ''),
    coverUrl: z.url(),
    legalType: legalTypeSchema,
    siret: siretSchema,
    categoryIds: z.array(idSchema).max(5, '5 catégories maximum'),
    culturalOriginIds: z.array(idSchema).max(5, '5 origines maximum'),
    languages: z.array(z.string().min(2)),
    city: text(1, 80, 'Indique ta ville'),
    postalCode: postalCodeSchema,
    travelRadiusKm: z.number().int().min(0).max(1000),
    maxBookingsPerDay: z.number().int().min(1).max(20),
    cancellationPolicy: cancellationPolicySchema,
    onboardingStep: z.number().int().min(0),
  })
  .partial();

/** Décision de l'admin sur un profil en attente (A2). */
export const moderateProviderInputSchema = z.discriminatedUnion('decision', [
  z.object({ decision: z.literal('validate'), isProVerified: z.boolean() }),
  z.object({
    decision: z.literal('request_changes'),
    reason: text(10, 1000, 'Explique ce qu’il faut corriger (10 caractères minimum)'),
  }),
  z.object({
    decision: z.literal('reject'),
    reason: text(10, 1000, 'Explique le refus (10 caractères minimum)'),
  }),
]);
