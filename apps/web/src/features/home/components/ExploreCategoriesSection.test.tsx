import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderRoute';

async function findSection() {
  const title = await screen.findByRole('heading', {
    level: 2,
    name: 'Découvrez nos univers événementiels',
  });
  return title.closest('section')!;
}

describe('Section « Explorez nos univers »', () => {
  it('affiche le surtitre, le titre (« événementiels » mis en valeur) et la description', async () => {
    renderRoute('/');

    const section = await findSection();
    expect(within(section).getByText('Explorez nos catégories')).toBeInTheDocument();
    expect(within(section).getByText('événementiels')).toHaveClass('text-title-accent');
    expect(
      within(section).getByText(
        'Des prestataires de confiance pour tous vos événements, selon vos envies et votre culture.',
      ),
    ).toBeInTheDocument();
  });

  it('les 8 cartes photo mènent à la recherche de leur catégorie, DJ en premier', async () => {
    renderRoute('/');

    const mosaic = within(await findSection()).getByRole('list', { name: 'Univers Wenzee' });
    const links = within(mosaic).getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Musique & DJ', '/recherche?categorie=dj'],
      ['Traiteur', '/recherche?categorie=traiteurs'],
      ['Danse', '/recherche?categorie=danse'],
      ['Beauté', '/recherche?categorie=beaute'],
      ['Mode', '/recherche?categorie=location-de-tenues'],
      ['Speaker', '/recherche?categorie=speakers'],
      ['Show', '/recherche?categorie=spectacle'],
      ['Décoration', '/recherche?categorie=decoration'],
    ]);
  });

  it('la carte DJ est la grande carte ; photos chargées à la demande, sans icône', async () => {
    renderRoute('/');

    const mosaic = within(await findSection()).getByRole('list', { name: 'Univers Wenzee' });
    const [first, second] = within(mosaic).getAllByRole('listitem');
    expect(first).toHaveClass('md:row-span-2');
    expect(second).not.toHaveClass('md:row-span-2');

    for (const image of mosaic.querySelectorAll('img')) {
      expect(image).toHaveAttribute('loading', 'lazy');
      expect(image).toHaveAttribute('alt', ''); // décorative : le nom de la carte suffit
    }
    // Les icônes de catégories sont dans le hero, pas ici.
    expect(mosaic.querySelector('svg')).toBeNull();
  });

  it('une carte ouvre la recherche filtrée', async () => {
    const { router } = renderRoute('/');

    const mosaic = within(await findSection()).getByRole('list', { name: 'Univers Wenzee' });
    await userEvent.click(within(mosaic).getByRole('link', { name: 'Danse' }));

    await screen.findByRole('heading', { level: 1, name: 'Rechercher un prestataire' });
    expect(router.state.location.search).toBe('?categorie=danse');
  });

  it('« Voir toutes les catégories » mène à la recherche', async () => {
    renderRoute('/');

    expect(
      within(await findSection()).getByRole('link', { name: 'Voir toutes les catégories' }),
    ).toHaveAttribute('href', '/recherche');
  });
});
