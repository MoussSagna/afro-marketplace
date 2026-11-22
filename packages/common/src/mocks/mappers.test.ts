import { describe, expect, it } from 'vitest';
import { publicUserSchema } from '../schemas';
import { toPublicUser } from './mappers';

const user = {
  id: 'user-1',
  firstName: 'Aïssatou',
  lastName: 'Ndiaye',
  status: 'active' as const,
};

describe('toPublicUser', () => {
  it('ne montre que le prénom et l’initiale du nom', () => {
    expect(toPublicUser(user)).toEqual({
      id: 'user-1',
      firstName: 'Aïssatou',
      lastNameInitial: 'N.',
      avatarUrl: undefined,
    });
    expect(publicUserSchema.safeParse(toPublicUser(user)).success).toBe(true);
  });

  it('anonymise un compte supprimé', () => {
    expect(toPublicUser({ ...user, status: 'deleted' })).toEqual({
      id: 'user-1',
      firstName: 'Compte supprimé',
      lastNameInitial: '',
    });
  });
});
