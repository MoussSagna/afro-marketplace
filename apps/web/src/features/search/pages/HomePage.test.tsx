import { FEATURED_PROVIDERS_COUNT } from '@afro/common/mocks';
import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/server';
import { renderRoute } from '@/test/renderRoute';

describe("Page d'accueil", () => {
  it('affiche les prestataires à la une', async () => {
    renderRoute('/');

    expect(await screen.findByRole('heading', { name: 'Saveurs de Dakar' })).toBeInTheDocument();
    const featured = screen.getByRole('region', { name: 'Prestataires à la une' });
    expect(within(featured).getAllByRole('heading', { level: 3 })).toHaveLength(
      FEATURED_PROVIDERS_COUNT,
    );
  });

  it("affiche « Sur devis » quand le prestataire n'a pas de prix indicatif", async () => {
    renderRoute('/');

    const card = (await screen.findByRole('heading', { name: /Awa Diallo/ })).closest('li');
    expect(card).toHaveTextContent('Sur devis');
  });

  it("affiche un message clair si l'API échoue", async () => {
    server.use(http.get('*/api/providers/featured', () => new HttpResponse(null, { status: 500 })));
    renderRoute('/');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Impossible de charger les prestataires',
    );
  });
});

describe('Prestataires à la une', () => {
  it('une carte mène au profil du prestataire', async () => {
    renderRoute('/');

    expect(await screen.findByRole('link', { name: 'Saveurs de Dakar' })).toHaveAttribute(
      'href',
      '/prestataires/saveurs-de-dakar',
    );
  });
});

describe('Page introuvable', () => {
  it('affiche une 404 pour une URL inconnue', async () => {
    renderRoute('/nimporte-quoi');

    expect(await screen.findByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument();
  });
});
