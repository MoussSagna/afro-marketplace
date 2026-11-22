import { describe, expect, it } from 'vitest';
import { initialReviewForm, reviewFormSchema, toCreateReviewInput } from './reviewForm';

describe('formulaire « Laisser un avis »', () => {
  it('exige une note générale', () => {
    const result = reviewFormSchema.safeParse(initialReviewForm);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Choisis une note de 1 à 5 étoiles');
  });

  it('les sous-notes : les trois ou aucune', () => {
    const base = { ...initialReviewForm, rating: 4 };
    expect(reviewFormSchema.safeParse(base).success).toBe(true);
    expect(reviewFormSchema.safeParse({ ...base, quality: 5 }).success).toBe(false);
    expect(
      reviewFormSchema.safeParse({ ...base, quality: 5, punctuality: 4, value: 3 }).success,
    ).toBe(true);
  });

  it('n’envoie que ce qui est rempli', () => {
    expect(toCreateReviewInput('b1', { ...initialReviewForm, rating: 5, comment: '  ' })).toEqual({
      bookingId: 'b1',
      rating: 5,
    });
    expect(
      toCreateReviewInput('b1', {
        rating: 4,
        quality: 5,
        punctuality: 3,
        value: 4,
        comment: ' Super ! ',
      }),
    ).toEqual({
      bookingId: 'b1',
      rating: 4,
      subRatings: { quality: 5, punctuality: 3, value: 4 },
      comment: 'Super !',
    });
  });
});
