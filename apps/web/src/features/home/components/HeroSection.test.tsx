import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderRoute';

describe("Hero de l'accueil", () => {
  it('affiche le surtitre, le titre (avec « vos événements » mis en valeur) et la description', async () => {
    renderRoute('/');

    const title = await screen.findByRole('heading', {
      level: 1,
      name: 'Trouvez les talents qui subliment vos événements.',
    });
    expect(within(title).getByText('vos événements.')).toHaveClass('text-cta');
    expect(screen.getByText('La marketplace afro et caribéenne en France')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Traiteurs, artistes, DJ, danseurs, beauté, mode, décoration et bien plus encore.',
      ),
    ).toBeInTheDocument();
  });

  it('les 8 catégories populaires mènent à la recherche correspondante', async () => {
    const { router } = renderRoute('/');

    const shortcuts = await screen.findByRole('navigation', { name: 'Catégories populaires' });
    const links = within(shortcuts).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      'Traiteur',
      'Danse',
      'Musique & DJ',
      'Show',
      'Speaker',
      'Beauté',
      'Mode',
      'Décoration',
    ]);
    expect(within(shortcuts).getByRole('link', { name: 'Musique & DJ' })).toHaveAttribute(
      'href',
      '/recherche?categorie=dj',
    );

    await userEvent.click(within(shortcuts).getByRole('link', { name: 'Traiteur' }));
    await screen.findByRole('heading', { level: 1, name: 'Rechercher un prestataire' });
    expect(router.state.location.search).toBe('?categorie=traiteurs');
  });

  it('la pagination change de photo, au clic et aux flèches du clavier', async () => {
    renderRoute('/');

    const dots = await screen.findByRole('group', { name: 'Choisir une ambiance' });
    const [first, second, third] = within(dots).getAllByRole('button');
    expect(first).toHaveAttribute('aria-current', 'true');
    expect(first).toHaveAccessibleName('1 sur 3 : Mariage afro et caribéen');

    await userEvent.click(second!);
    expect(second).toHaveAttribute('aria-current', 'true');
    expect(first).not.toHaveAttribute('aria-current');

    fireEvent.keyDown(second!, { key: 'ArrowRight' });
    expect(third).toHaveAttribute('aria-current', 'true');
    fireEvent.keyDown(third!, { key: 'ArrowRight' });
    expect(first).toHaveAttribute('aria-current', 'true'); // retour au début
    fireEvent.keyDown(first!, { key: 'ArrowLeft' });
    expect(third).toHaveAttribute('aria-current', 'true');
  });

  it('le bouton pause arrête le diaporama et peut le relancer', async () => {
    renderRoute('/');

    const pause = await screen.findByRole('button', { name: 'Mettre en pause le diaporama' });
    await userEvent.click(pause);
    expect(screen.getByRole('button', { name: 'Relancer le diaporama' })).toBeInTheDocument();
  });
});

describe('SearchBar du hero', () => {
  it('mène aux résultats avec la prestation, le lieu et la date choisis', async () => {
    const { router } = renderRoute('/');

    const form = await screen.findByRole('search', { name: 'Rechercher un prestataire' });
    // On attend que les catégories soient chargées dans la liste.
    await within(form).findByRole('option', { name: 'Traiteur' });
    await userEvent.selectOptions(
      within(form).getByLabelText('Que recherchez-vous ?'),
      'traiteurs',
    );
    await userEvent.type(within(form).getByLabelText('Où ?'), 'Paris');
    fireEvent.change(within(form).getByLabelText('Quand ?'), { target: { value: '2027-06-12' } });
    await userEvent.click(within(form).getByRole('button', { name: 'Rechercher' }));

    await screen.findByRole('heading', { level: 1, name: 'Rechercher un prestataire' });
    expect(router.state.location.pathname).toBe('/recherche');
    expect(router.state.location.search).toBe('?categorie=traiteurs&ville=Paris&date=2027-06-12');
  });

  it('sans critère, mène à toutes les annonces', async () => {
    const { router } = renderRoute('/');

    const form = await screen.findByRole('search', { name: 'Rechercher un prestataire' });
    await userEvent.click(within(form).getByRole('button', { name: 'Rechercher' }));

    await screen.findByRole('heading', { level: 1, name: 'Rechercher un prestataire' });
    expect(router.state.location.search).toBe('');
  });

  it('affiche les textes d’aide et désactive la liste tant que les catégories chargent', async () => {
    renderRoute('/');

    const form = await screen.findByRole('search', { name: 'Rechercher un prestataire' });
    const what = within(form).getByLabelText('Que recherchez-vous ?');
    expect(what).toBeDisabled();
    expect(within(form).getByPlaceholderText('Ville, région…')).toBeInTheDocument();
    expect(within(form).getByText('Date de votre événement')).toBeInTheDocument();
    expect(
      within(form).getByRole('option', { name: 'Traiteur, DJ, danseur…' }),
    ).toBeInTheDocument();
    await within(form).findByRole('option', { name: 'Traiteur' });
    expect(what).toBeEnabled();
  });
});
