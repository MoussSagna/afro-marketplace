import { describe, expect, it } from 'vitest';
import { defaultSpaceFor } from './session';

describe('defaultSpaceFor', () => {
  it('envoie l’admin dans l’administration', () => {
    expect(defaultSpaceFor(['client', 'admin'])).toBe('admin');
  });

  it('envoie un prestataire dans son espace pro', () => {
    expect(defaultSpaceFor(['client', 'provider'])).toBe('provider');
  });

  it('envoie un client dans son espace client', () => {
    expect(defaultSpaceFor(['client'])).toBe('client');
  });
});
