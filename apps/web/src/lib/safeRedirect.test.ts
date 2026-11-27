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
    expect(safeRedirect('/connexion', '/')).toBe('/');
  });

  it('ne renvoie pas vers l’inscription ni le mot de passe oublié', () => {
    expect(safeRedirect('/inscription', '/')).toBe('/');
    expect(safeRedirect('/inscription?retour=/pro', '/')).toBe('/');
    expect(safeRedirect('/mot-de-passe-oublie', '/')).toBe('/');
    // Une autre page qui commence pareil reste permise.
    expect(safeRedirect('/inscriptions-ouvertes', '/')).toBe('/inscriptions-ouvertes');
  });
});
