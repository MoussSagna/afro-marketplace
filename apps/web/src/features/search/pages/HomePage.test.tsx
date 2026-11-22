import { FEATURED_PROVIDERS_COUNT } from '@afro/common/mocks';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('affiche les catégories principales', async () => {
    renderRoute('/');

    const categories = await screen.findByRole('list', { name: 'Catégories' });
    expect(await within(categories).findByText(/Nourriture/)).toBeInTheDocument();
    expect(categories).toHaveTextContent('Spectacle');
    expect(categories).not.toHaveTextContent('Traiteur'); // sous-catégorie
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

describe('Recherche de l’accueil', () => {
  it('mène aux résultats avec la catégorie, la ville et la date choisies', async () => {
    const { router } = renderRoute('/');

    const form = await screen.findByRole('search', { name: 'Rechercher un prestataire' });
    // On attend que les catégories soient chargées dans la liste.
    await within(form).findByRole('option', { name: 'Traiteur' });
    await userEvent.selectOptions(within(form).getByLabelText('Quoi ?'), 'traiteurs');
    await userEvent.type(within(form).getByLabelText('Où ?'), 'Paris');
    await userEvent.type(within(form).getByLabelText('Quand ?'), '2027-06-12');
    await userEvent.click(within(form).getByRole('button', { name: 'Rechercher' }));

    await screen.findByRole('heading', { level: 1, name: 'Rechercher un prestataire' });
    expect(router.state.location.pathname).toBe('/recherche');
    expect(router.state.location.search).toBe('?categorie=traiteurs&ville=Paris&date=2027-06-12');
  });

  it('les catégories mènent à leur page', async () => {
    renderRoute('/');

    const categories = await screen.findByRole('list', { name: 'Catégories' });
    expect(await within(categories).findByRole('link', { name: /Nourriture/ })).toHaveAttribute(
      'href',
      '/categories/nourriture',
    );
  });

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
