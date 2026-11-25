import { z } from 'zod';
import { errorsOf } from './formErrors';

describe('errorsOf', () => {
  const schema = z.object({
    city: z.string().min(1, 'Ville'),
    km: z.string().regex(/^\d+$/, 'Km'),
  });

  it('range le premier message de chaque champ', () => {
    expect(errorsOf(schema, { city: '', km: 'x' })).toEqual({ city: 'Ville', km: 'Km' });
  });

  it('ne renvoie rien quand tout est valide', () => {
    expect(errorsOf(schema, { city: 'Paris', km: '30' })).toEqual({});
  });
});
