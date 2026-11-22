import type { CreateReviewInput } from '@afro/common';
import { z } from 'zod';

/** 0 = « pas encore choisi ». Les étoiles vont de 1 à 5. */
const stars = z.number().int().min(0).max(5);

/**
 * Le formulaire C6. Il diffère un peu du schéma de l'API :
 * - la note générale est obligatoire (0 → message d'erreur) ;
 * - les sous-notes sont facultatives, mais c'est « tout ou rien » :
 *   l'API attend les trois ensemble.
 */
export const reviewFormSchema = z
  .object({
    rating: stars.refine((value) => value >= 1, 'Choisis une note de 1 à 5 étoiles'),
    quality: stars,
    punctuality: stars,
    value: stars,
    comment: z.string().max(2000, '2 000 caractères maximum'),
  })
  .refine(
    ({ quality, punctuality, value }) => {
      const filled = [quality, punctuality, value].filter((n) => n > 0).length;
      return filled === 0 || filled === 3;
    },
    { message: 'Note les trois critères, ou aucun', path: ['value'] },
  );

export type ReviewFormValues = z.infer<typeof reviewFormSchema>;

export const initialReviewForm: ReviewFormValues = {
  rating: 0,
  quality: 0,
  punctuality: 0,
  value: 0,
  comment: '',
};

export function toCreateReviewInput(bookingId: string, form: ReviewFormValues): CreateReviewInput {
  const comment = form.comment.trim();
  return {
    bookingId,
    rating: form.rating,
    ...(form.quality > 0 && {
      subRatings: { quality: form.quality, punctuality: form.punctuality, value: form.value },
    }),
    ...(comment && { comment }),
  };
}
