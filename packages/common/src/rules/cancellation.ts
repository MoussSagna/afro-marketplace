import type { CancellationPolicy, CancelledBy } from '../types';
import { daysBetween } from '../utils/dates';

/**
 * Une tranche de remboursement : si on annule au moins `minDaysBefore` jours
 * avant l'événement, on récupère `refundPercent` % de ce qu'on a payé.
 */
export interface RefundTier {
  minDaysBefore: number;
  refundPercent: number;
}

/**
 * Les trois politiques d'annulation (validées par Mouss le 22/11/2026).
 * Les tranches sont rangées de la plus favorable à la moins favorable.
 * En dessous de la dernière tranche, rien n'est remboursé.
 */
export const CANCELLATION_POLICIES: Record<
  CancellationPolicy,
  { label: string; tiers: readonly RefundTier[] }
> = {
  flexible: {
    label: 'Souple',
    tiers: [
      { minDaysBefore: 7, refundPercent: 100 },
      { minDaysBefore: 2, refundPercent: 50 },
    ],
  },
  moderate: {
    label: 'Modérée',
    tiers: [
      { minDaysBefore: 30, refundPercent: 100 },
      { minDaysBefore: 14, refundPercent: 50 },
    ],
  },
  strict: {
    label: 'Stricte',
    tiers: [
      { minDaysBefore: 60, refundPercent: 100 },
      { minDaysBefore: 30, refundPercent: 50 },
    ],
  },
};

export interface CancellationRefundInput {
  /** La politique COPIÉE dans la réservation (pas celle du profil aujourd'hui). */
  policy: CancellationPolicy;
  /** Ce que le client a déjà payé, en centimes. */
  amountPaid: number;
  eventDate: string;
  /** Le jour de l'annulation (« 2026-11-22 »). */
  cancelledOn: string;
  cancelledBy: CancelledBy;
}

export interface CancellationRefund {
  daysBeforeEvent: number;
  refundPercent: number;
  refundAmount: number;
}

/**
 * Règle n° 9 : combien rembourser quand une réservation est annulée ?
 * - Si c'est le prestataire (ou l'admin) qui annule, le client est remboursé en entier.
 * - Si c'est le client, ça dépend de la politique et du nombre de jours avant l'événement.
 *
 * En mode « offline » (lancement), rien ne passe par la plateforme : on s'en sert
 * pour AFFICHER les conditions. Le vrai remboursement viendra avec Stripe.
 */
export function computeCancellationRefund({
  policy,
  amountPaid,
  eventDate,
  cancelledOn,
  cancelledBy,
}: CancellationRefundInput): CancellationRefund {
  const daysBeforeEvent = daysBetween(cancelledOn, eventDate);

  const refundPercent =
    cancelledBy !== 'client'
      ? 100
      : (CANCELLATION_POLICIES[policy].tiers.find((tier) => daysBeforeEvent >= tier.minDaysBefore)
          ?.refundPercent ?? 0);

  return {
    daysBeforeEvent,
    refundPercent,
    refundAmount: Math.round((amountPaid * refundPercent) / 100),
  };
}

/**
 * Les conditions d'une politique en phrases, pour la page profil et le devis.
 * describeCancellationPolicy('flexible') →
 *   ['Remboursement intégral jusqu’à 7 jours avant', '50 % remboursés jusqu’à 2 jours avant', …]
 */
export function describeCancellationPolicy(policy: CancellationPolicy): string[] {
  const { tiers } = CANCELLATION_POLICIES[policy];
  const lines = tiers.map((tier) =>
    tier.refundPercent === 100
      ? `Remboursement intégral jusqu’à ${tier.minDaysBefore} jours avant l’événement`
      : `${tier.refundPercent} % remboursés jusqu’à ${tier.minDaysBefore} jours avant l’événement`,
  );
  const last = tiers[tiers.length - 1];
  if (last) lines.push(`Aucun remboursement à moins de ${last.minDaysBefore} jours`);
  return lines;
}
