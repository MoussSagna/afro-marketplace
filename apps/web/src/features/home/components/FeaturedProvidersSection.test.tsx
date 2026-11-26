import { FEATURED_PROVIDERS_COUNT } from '@afro/common/mocks';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/server';
import { renderRoute } from '@/test/renderRoute';

function getSection() {
  return screen.getByRole('region', { name: 'Des talents qui font la différence.' });
}

describe('Section « Prestataires à la une »', () => {
  it('affiche le surtitre, le titre (fin mise en valeur) et une carte par prestataire', async () => {
    renderRoute('/');

    expect(await screen.findByRole('heading', { name: 'Saveurs de Dakar' })).toBeInTheDocument();
    const section = getSection();
    expect(within(section).getByText('Prestataires à la une')).toBeInTheDocument();
    expect(within(section).getByText('la différence.')).toHaveClass('text-title-accent');
    expect(within(section).getAllByRole('article')).toHaveLength(FEATURED_PROVIDERS_COUNT);
  });

  it('une carte montre la catégorie, la ville, et « Pro vérifié » si le pro est vérifié', async () => {
    renderRoute('/');

    const card = (await screen.findByRole('heading', { name: 'Saveurs de Dakar' })).closest(
      'article',
    )!;
    expect(within(card).getByRole('img', { name: /Note :/ })).toBeInTheDocument();
    expect(getSection().querySelectorAll('article .bg-accent').length).toBeGreaterThan(0);
    expect(within(getSection()).getAllByText('Pro vérifié').length).toBeGreaterThan(0);
  });

  it("affiche « Sur devis » quand le prestataire n'a pas de prix indicatif", async () => {
    renderRoute('/');

    const card = (await screen.findByRole('heading', { name: /Awa Diallo/ })).closest('li');
    expect(card).toHaveTextContent('Sur devis');
  });

  it('une carte mène au profil du prestataire', async () => {
    const { router } = renderRoute('/');

    const link = await screen.findByRole('link', { name: 'Saveurs de Dakar' });
    expect(link).toHaveAttribute('href', '/prestataires/saveurs-de-dakar');
    await userEvent.click(link);
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/prestataires/saveurs-de-dakar'),
    );
  });

  it('« Voir tous les prestataires » mène à la recherche', async () => {
    renderRoute('/');

    await screen.findByRole('heading', { name: 'Saveurs de Dakar' });
    expect(
      within(getSection()).getByRole('link', { name: 'Voir tous les prestataires' }),
    ).toHaveAttribute('href', '/recherche');
  });

  it("affiche un message clair si l'API échoue", async () => {
    server.use(http.get('*/api/providers/featured', () => new HttpResponse(null, { status: 500 })));
    renderRoute('/');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Impossible de charger les prestataires',
    );
  });
});

describe('Carte à la une', () => {
  it("affiche l'initiale si la photo de couverture ne se charge pas", async () => {
    renderRoute('/');

    const card = (await screen.findByRole('heading', { name: 'Saveurs de Dakar' })).closest(
      'article',
    )!;
    const img = card.querySelector('img');
    if (img) fireEvent.error(img);
    expect(card.querySelector('img')).toBeNull();
    expect(card).toHaveTextContent(/^S/);
  });
});
