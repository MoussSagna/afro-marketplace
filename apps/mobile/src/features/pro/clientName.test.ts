import { clientName } from './clientName';

describe('clientName', () => {
  it('prénom et initiale (qui porte déjà son point)', () => {
    expect(clientName({ firstName: 'Aïssatou', lastNameInitial: 'D.' })).toBe('Aïssatou D.');
  });

  it('compte supprimé : pas d’initiale, pas d’espace en trop', () => {
    expect(clientName({ firstName: 'Compte supprimé', lastNameInitial: '' })).toBe(
      'Compte supprimé',
    );
  });
});
