import { describe, expect, it } from 'vitest';
import { safeRedirect } from './safeRedirect';

describe('safeRedirect', () => {
  it('garde un chemin interne, avec ses paramètres', () => {
    expect(safeRedirect('/espace/demandes?onglet=en-cours', '/')).toBe(
      '/espace/demandes?onglet=en-cours',
    );
  });

  it.each([
    'https://site-pirate.com',
    '//site-pirate.com',
    '/\\site-pirate.com',
    'javascript:alert(1)',
    'espace/demandes',
  ])('refuse « %s » et renvoie la valeur par défaut', (target) => {
    expect(safeRedirect(target, '/pro')).toBe('/pro');
  });

  it('utilise la valeur par défaut sans retour', () => {
    expect(safeRedirect(null, '/admin')).toBe('/admin');
    expect(safeRedirect('', '/admin')).toBe('/admin');
  });

  it('ne renvoie pas vers la page de connexion', () => {
    expect(safeRedirect('/connexion?retour=/pro', '/')).toBe('/');
  });
});
