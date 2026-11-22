import { z } from 'zod';
import {
  amountInCentsSchema,
  idSchema,
  isoDateSchema,
  isoDateTimeSchema,
  percentSchema,
  text,
  timestamps,
} from './common';
import { cancellationPolicySchema } from './provider';

/**
 * En mode « offline » (lancement) : confirmed → completed après la date.
 * Les étapes deposit_paid / fully_paid servent au paiement en ligne (plus tard).
 */
export const bookingStatusSchema = z.enum([
  'confirmed',
  'deposit_paid',
  'fully_paid',
  'completed',
  'cancelled',
  'disputed',
]);

export const paymentModeSchema = z.enum(['offline', 'online']);

export const cancelledBySchema = z.enum(['client', 'provider', 'admin']);

/**
 * Une réservation : créée quand le client accepte un devis.
 * Montants et politique d'annulation sont COPIÉS : une réservation est un
 * engagement figé, elle ne bouge pas si le prestataire change ses prix demain.
 */
export const bookingSchema = z.object({
  id: idSchema,
  quoteId: idSchema,
  quoteRequestId: idSchema,
  clientId: idSchema,
  providerId: idSchema,
  eventDate: isoDateSchema,
  /** Révélée aux deux parties seulement maintenant. */
  eventAddress: z.string().min(1),
  totalAmount: amountInCentsSchema,
  depositAmount: amountInCentsSchema,
  paymentMode: paymentModeSchema,
  /** 0 au lancement (gratuit pour les prestataires). */
  commissionRate: percentSchema,
  cancellationPolicy: cancellationPolicySchema,
  status: bookingStatusSchema,
  cancelledBy: cancelledBySchema.optional(),
  cancelReason: z.string().optional(),
  cancelledAt: isoDateTimeSchema.optional(),
  ...timestamps,
});

export const cancelBookingInputSchema = z.object({
  reason: text(3, 500, 'Indique un motif d’annulation'),
});
