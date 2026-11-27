import { z } from 'zod';
import {
  idSchema,
  isoDateSchema,
  isoDateTimeSchema,
  postalCodeSchema,
  text,
  timestamps,
} from './common';

/**
 * Le planificateur d'événements (page « Événements », 27/11/2026) : le client crée ses événements,
 * y ajoute des prestataires, leur envoie des demandes de devis et retient ceux qu'il veut.
 * Pas de réservation ni de paiement ici : « retenu » n'est pas « réservé ».
 */

/** Les messages d'erreur du formulaire d'événement (tutoiement, comme tous les schémas). */
export const eventMessages = {
  typeRequired: 'Choisis un type d’événement',
  nameTooShort: 'Donne un nom à ton événement (3 caractères minimum)',
  dateRequired: 'Choisis la date de l’événement',
  dateInPast: 'Choisis une date à venir',
  cityRequired: 'Indique la ville de l’événement',
  guestRange: 'Entre 1 et 5 000 invités',
} as const;

/**
 * Le type d'un événement planifié (étape 1 du formulaire). Distinct de `eventTypeSchema`
 * (demandes de devis) : « Soirée » et « Conférence » n'y existent pas ; `toQuoteEventType`
 * fait la correspondance au moment de demander un devis.
 */
export const plannedEventTypeSchema = z.enum([
  'wedding',
  'party',
  'baptism',
  'birthday',
  'conference',
  'other',
]);

/** Le budget indicatif, en fourchettes (facultatif). */
export const eventBudgetSchema = z.enum([
  'under_1000',
  '1000_3000',
  '3000_5000',
  '5000_10000',
  '10000_20000',
  'over_20000',
  'undecided',
]);

export const eventSchema = z.object({
  id: idSchema,
  clientId: idSchema,
  type: plannedEventTypeSchema,
  name: z.string().min(1),
  date: isoDateSchema,
  city: z.string().min(1),
  postalCode: postalCodeSchema,
  guestCount: z.number().int().positive(),
  budget: eventBudgetSchema.optional(),
  description: z.string(),
  /** Suppression « douce » : l'événement disparaît mais peut être restauré (« Annuler »). */
  deletedAt: isoDateTimeSchema.optional(),
  ...timestamps,
});

/**
 * Un prestataire ajouté à un événement. Son statut n'est PAS stocké : il se calcule à partir
 * de la demande de devis liée (voir `computeEventProviderStatus`), sauf « retenu », qui est un
 * choix du client.
 */
export const eventProviderSchema = z.object({
  id: idSchema,
  eventId: idSchema,
  providerId: idSchema,
  /** La demande de devis envoyée depuis l'événement, s'il y en a une. */
  quoteRequestId: idSchema.optional(),
  /** Le client a retenu ce prestataire (après avoir reçu son devis). */
  retained: z.boolean(),
  ...timestamps,
});

/**
 * Le statut d'un prestataire dans l'événement, calculé :
 * added (ajouté) → requested (devis demandé) → received (devis reçu) → retained (retenu).
 * booked : devis accepté ailleurs (réservation) ; closed : demande déclinée, expirée ou annulée.
 */
export const eventProviderStatusSchema = z.enum([
  'added',
  'requested',
  'received',
  'retained',
  'booked',
  'closed',
]);

/** Le statut d'un événement, calculé. */
export const eventStatusSchema = z.enum(['preparation', 'quotes', 'past']);

/** Formulaire de création et de modification (même formulaire, trois étapes). */
export const eventInputSchema = z.object({
  type: z.enum(plannedEventTypeSchema.options, { error: eventMessages.typeRequired }),
  name: text(3, 80, eventMessages.nameTooShort),
  date: z.iso.date({ error: eventMessages.dateRequired }),
  city: text(1, 80, eventMessages.cityRequired),
  postalCode: postalCodeSchema,
  guestCount: z
    .number({ error: eventMessages.guestRange })
    .int(eventMessages.guestRange)
    .min(1, eventMessages.guestRange)
    .max(5000, eventMessages.guestRange),
  budget: eventBudgetSchema.optional(),
  description: text(0, 600, '').optional(),
});

/** Ajouter un prestataire à un événement. */
export const addEventProviderInputSchema = z.object({ providerId: idSchema });

/** Demander les devis en une fois (une demande par prestataire). */
export const requestEventQuotesInputSchema = z.object({
  providerIds: z.array(idSchema).min(1, 'Sélectionne au moins un prestataire'),
  message: text(0, 2000, '').optional(),
});

/** Retenir un prestataire, ou ne plus le retenir. */
export const setEventProviderRetainedInputSchema = z.object({ retained: z.boolean() });

export const eventCountsSchema = z.object({
  providers: z.number().int().nonnegative(),
  requested: z.number().int().nonnegative(),
  received: z.number().int().nonnegative(),
  retained: z.number().int().nonnegative(),
});

/** Le résultat d'un envoi groupé : ce qui est parti, ce qui a été refusé (et pourquoi). */
export const requestEventQuotesResultSchema = z.object({
  sent: z.array(z.object({ providerId: idSchema, quoteRequestId: idSchema })),
  failed: z.array(z.object({ providerId: idSchema, code: z.string(), message: z.string() })),
});
