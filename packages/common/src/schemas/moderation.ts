import { z } from 'zod';
import { idSchema, isoDateTimeSchema, text, timestamps } from './common';
import { userStatusSchema } from './user';

export const reportTargetTypeSchema = z.enum(['provider', 'review', 'message', 'media', 'user']);
export const reportReasonSchema = z.enum([
  'fraud',
  'inappropriate',
  'spam',
  'fake_review',
  'other',
]);
export const reportStatusSchema = z.enum(['open', 'resolved', 'dismissed']);

/**
 * Un signalement. targetType dit dans quelle entité chercher targetId
 * (on appelle ça une relation « polymorphe »).
 */
export const reportSchema = z.object({
  id: idSchema,
  reporterId: idSchema,
  targetType: reportTargetTypeSchema,
  targetId: idSchema,
  reason: reportReasonSchema,
  details: z.string().optional(),
  status: reportStatusSchema,
  ...timestamps,
});

export const createReportInputSchema = z.object({
  targetType: reportTargetTypeSchema,
  targetId: idSchema,
  reason: reportReasonSchema,
  details: text(0, 1000, '').optional(),
});

/** Ce que l'admin fait d'un signalement (A3). */
export const resolveReportInputSchema = z.object({
  outcome: z.enum(['dismiss', 'hide_content', 'suspend_user']),
  note: text(0, 1000, '').optional(),
});

/** L'admin change le statut d'un compte (A4). */
export const setUserStatusInputSchema = z.object({
  status: userStatusSchema.exclude(['deleted']),
  note: text(3, 1000, 'Indique un motif'),
});

export const moderationActionTypeSchema = z.enum([
  'validate_profile',
  'request_changes',
  'reject_profile',
  'hide_content',
  'dismiss_report',
  'suspend_user',
  'ban_user',
  'reactivate_user',
]);

/**
 * Le journal des actions d'admin. Jamais modifié ni supprimé :
 * il sert de preuve en cas de contestation (d'où l'absence d'updatedAt).
 */
export const moderationActionSchema = z.object({
  id: idSchema,
  adminId: idSchema,
  action: moderationActionTypeSchema,
  targetType: z.enum(['provider', 'review', 'message', 'media', 'user', 'report']),
  targetId: idSchema,
  note: z.string().optional(),
  createdAt: isoDateTimeSchema,
});
