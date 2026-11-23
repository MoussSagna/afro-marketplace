import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderRoute';

describe('Marque Wenzee (logo)', () => {
  it("l'en-tête affiche le logo, qui ramène à l'accueil", async () => {
    renderRoute('/faq');
    const home = await screen.findByRole('link', { name: 'Wenzee, accueil' });
    expect(home).toHaveAttribute('href', '/');
    expect(within(home).getByRole('img', { name: 'Wenzee' })).toHaveAttribute(
      'src',
      '/wenzee-logo.svg',
    );
  });

  it('le pied de page des pages publiques reprend le logo', async () => {
    renderRoute('/faq');
    const footer = await screen.findByRole('contentinfo');
    expect(within(footer).getByRole('img', { name: 'Wenzee' })).toBeInTheDocument();
  });
});
