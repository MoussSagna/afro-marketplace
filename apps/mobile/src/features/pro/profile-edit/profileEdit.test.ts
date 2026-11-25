import { isProfileSection, toggle } from './profileEdit';

describe('profileEdit', () => {
  it('toggle ajoute, retire, et respecte le maximum', () => {
    expect(toggle(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggle(['a', 'b'], 'a')).toEqual(['b']);
    expect(toggle(['a', 'b'], 'c', 2)).toEqual(['a', 'b']);
  });

  it('reconnaît les sections modifiables dans l’app', () => {
    expect(isProfileSection('zone')).toBe(true);
    expect(isProfileSection('photos')).toBe(false);
    expect(isProfileSection('toString')).toBe(false);
  });
});
