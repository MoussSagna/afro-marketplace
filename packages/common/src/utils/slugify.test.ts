import { describe, expect, it } from 'vitest';
import { slugify, uniqueSlug } from './slugify';

describe('slugify', () => {
  it('retire les accents, les apostrophes et la ponctuation', () => {
    expect(slugify('Saveurs de Dakar')).toBe('saveurs-de-dakar');
    expect(slugify('  Glow by Aminata !')).toBe('glow-by-aminata');
    expect(slugify('Douceurs Créoles & Cie')).toBe('douceurs-creoles-cie');
    expect(slugify('L’atelier d’Awa')).toBe('latelier-dawa');
  });

  it('numérote une adresse déjà prise', () => {
    expect(uniqueSlug('Awa', new Set())).toBe('awa');
    expect(uniqueSlug('Awa', new Set(['awa', 'awa-2']))).toBe('awa-3');
    expect(uniqueSlug('!!!', new Set())).toBe('prestataire');
  });
});
