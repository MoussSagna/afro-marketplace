import { cn, formatRating, initials } from './cn';

describe('cn', () => {
  it('assemble les classes et ignore les valeurs vides', () => {
    expect(cn('px-4', false, undefined, 'py-2')).toBe('px-4 py-2');
  });

  it('garde la dernière classe quand deux se contredisent', () => {
    expect(cn('bg-primary', 'bg-cta')).toBe('bg-cta');
  });
});

describe('formatRating', () => {
  it('écrit la note avec une virgule et une décimale', () => {
    expect(formatRating(4.9)).toBe('4,9');
    expect(formatRating(4)).toBe('4,0');
    expect(formatRating(4.86)).toBe('4,9');
  });
});

describe('initials', () => {
  it('prend la première lettre du prénom et du nom', () => {
    expect(initials('Aïssatou Diallo')).toBe('AD');
  });

  it('prend le dernier mot pour un nom composé', () => {
    expect(initials('Koffi Jean N’Guessan')).toBe('KN');
  });

  it('gère un seul mot et les espaces en trop', () => {
    expect(initials('  moussa ')).toBe('M');
    expect(initials('')).toBe('');
  });
});
