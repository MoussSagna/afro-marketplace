import { z } from 'zod';
import { idSchema, isoDateTimeSchema, text, timestamps } from './common';

/** Une conversation par demande de devis, entre le client et le prestataire. */
export const conversationSchema = z.object({
  id: idSchema,
  quoteRequestId: idSchema,
  clientId: idSchema,
  /** L'utilisateur propriétaire du profil prestataire. */
  providerUserId: idSchema,
  lastMessageAt: isoDateTimeSchema,
  unreadCountClient: z.number().int().nonnegative(),
  unreadCountProvider: z.number().int().nonnegative(),
  ...timestamps,
});

/** « system » = message automatique (« Devis envoyé », « Réservation confirmée »). */
export const messageKindSchema = z.enum(['text', 'attachment', 'system']);

export const attachmentSchema = z.object({
  url: z.url(),
  name: z.string().min(1),
  mimeType: z.string().min(1),
});

export const messageSchema = z.object({
  id: idSchema,
  conversationId: idSchema,
  senderId: idSchema,
  kind: messageKindSchema,
  body: z.string(),
  attachments: z.array(attachmentSchema).optional(),
  /** true si un téléphone ou un email a été masqué (règle n° 7). */
  hasMaskedContent: z.boolean(),
  readAt: isoDateTimeSchema.optional(),
  ...timestamps,
});

export const sendMessageInputSchema = z.object({
  body: text(1, 2000, 'Le message est vide'),
});
