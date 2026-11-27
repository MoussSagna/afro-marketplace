import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderRoute';
import { server } from '@/test/server';

/** Les noms des prestataires affichés dans les résultats. */
async function resultNames() {
  const results = await screen.findByRole('region', { name: 'Résultats' });
  await within(results).findAllByRole('heading', { level: 3 });
  return within(results)
    .getAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent);
}

/** La recherche du haut (la pilule de l'accueil, tablette et ordinateur). */
function topSearch() {
  return screen.getByRole('search', { name: 'Rechercher un prestataire' });
}

describe('Recherche (P2)', () => {
  it('affiche les prestataires publiés et leur nombre', async () => {
    renderRoute('/recherche');

    expect(await screen.findByText('33 prestataires')).toBeInTheDocument();
    expect(await resultNames()).toHaveLength(12); // première page
  });

  it('cocher « Sénégal » filtre les résultats et l’écrit dans l’adresse', async () => {
    const { router } = renderRoute('/recherche');
    await screen.findByText('33 prestataires');

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Sénégal' }));

    expect(await screen.findByText('6 prestataires')).toBeInTheDocument();
    expect(await resultNames()).toContain('Saveurs de Dakar');
    expect(router.state.location.search).toBe('?origines=senegal');
  });

  it('lit les filtres depuis l’adresse (lien partagé)', async () => {
    renderRoute('/recherche?categorie=dj&tri=prix-croissant');

    expect(await screen.findByText('2 prestataires')).toBeInTheDocument();
    expect(await resultNames()).toEqual(['Afro Beats by Kofi', 'DJ Makossa Vibes']);
    expect(screen.getByLabelText('Trier par')).toHaveValue('price_asc');
  });

  it('applique la ville choisie dans la recherche du haut', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/recherche');
    await screen.findByText('33 prestataires');
    const pill = topSearch();

    await user.click(within(pill).getByLabelText('Où ?'));
    await user.type(within(pill).getByLabelText('Où ?'), 'Cré');
    await user.click(within(pill).getByRole('option', { name: /Créteil/ }));
    await user.click(within(pill).getByRole('button', { name: 'Rechercher' }));

    expect(await screen.findByText('1 prestataire')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?ville=Cr%C3%A9teil');
  });

  it('affiche un message et un bouton quand rien ne correspond', async () => {
    renderRoute('/recherche?q=introuvable');

    expect(
      await screen.findByRole('heading', { name: 'Aucun prestataire ne correspond' }),
    ).toBeInTheDocument();
    await userEvent.click(
      within(screen.getByRole('region', { name: 'Résultats' })).getByRole('button', {
        name: 'Effacer les filtres',
      }),
    );
    expect(await screen.findByText('33 prestataires')).toBeInTheDocument();
  });

  it('affiche un message clair si l’API échoue', async () => {
    server.use(http.get('*/api/providers', () => new HttpResponse(null, { status: 500 })));
    renderRoute('/recherche');

    expect(await screen.findByRole('alert')).toHaveTextContent('La recherche n’a pas pu aboutir');
  });

  it('passe à la page suivante', async () => {
    const { router } = renderRoute('/recherche?page=2');
    await screen.findByText('Page 2 sur 3');
    const firstPage = await resultNames();

    await userEvent.click(screen.getByRole('button', { name: 'Suivant' }));

    await waitFor(() => expect(router.state.location.search).toBe('?page=3'));
    expect(await screen.findByText('Page 3 sur 3')).toBeInTheDocument();
    await waitFor(async () => expect((await resultNames())[0]).not.toBe(firstPage[0]));
    expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled();
  });

  it('changer un filtre revient à la première page', async () => {
    const { router } = renderRoute('/recherche?page=2');
    await screen.findByText('Page 2 sur 3');

    await userEvent.click(
      await screen.findByRole('checkbox', { name: 'Pros vérifiés uniquement' }),
    );

    await waitFor(() => expect(router.state.location.search).toBe('?verifie=1'));
  });
});

describe('Recherche (P2) : présentation des résultats', () => {
  it('la recherche du haut est celle de l’accueil et garde les autres filtres', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/recherche?origines=senegal&tri=note');
    await screen.findByText('6 prestataires');
    const pill = topSearch();

    await user.click(within(pill).getByLabelText('Quoi ?'));
    await user.type(within(pill).getByLabelText('Quoi ?'), 'trait');
    await user.click(await within(pill).findByRole('option', { name: /^Traiteurs/ }));
    await user.click(within(pill).getByRole('option', { name: /Paris/ }));
    await user.click(within(pill).getByRole('button', { name: 'Rechercher' }));

    await waitFor(() =>
      expect(router.state.location.search).toBe(
        '?categorie=traiteurs&origines=senegal&ville=Paris&tri=note',
      ),
    );
    expect(router.state.location.pathname).toBe('/recherche');
  });

  it('reprend la prestation, le mot-clé et la ville de l’adresse', async () => {
    renderRoute('/recherche?categorie=dj&ville=Paris');
    const pill = await screen.findByRole('search', { name: 'Rechercher un prestataire' });
    await waitFor(() => expect(within(pill).getByLabelText('Quoi ?')).toHaveValue('DJ'));
    expect(within(pill).getByLabelText('Où ?')).toHaveValue('Paris');
  });

  it('reprend un mot-clé libre dans « Quoi ? »', async () => {
    renderRoute('/recherche?q=Dakar');
    await waitFor(() => expect(within(topSearch()).getByLabelText('Quoi ?')).toHaveValue('Dakar'));
  });

  it('une carte montre la note, la ville, une phrase et les spécialités, sans prix', async () => {
    renderRoute('/recherche?q=Dakar');
    const results = await screen.findByRole('region', { name: 'Résultats' });
    const card = (await within(results).findByRole('link', { name: 'Saveurs de Dakar' })).closest(
      'article',
    )!;

    expect(within(card).getByRole('img', { name: /^Note : / })).toBeInTheDocument();
    expect(within(card).getByText('Paris')).toBeInTheDocument();
    expect(within(card).getByText(/Traiteur sénégalais depuis 2015/)).toBeInTheDocument();
    expect(within(card).getByRole('list', { name: 'Spécialités' })).toHaveTextContent('Sénégal');
    expect(card).not.toHaveTextContent(/€|Sur devis/);
    expect(within(card).queryByRole('link', { name: /Voir le profil/ })).not.toBeInTheDocument();
    // Toute la carte mène au profil : un seul lien.
    expect(within(card).getByRole('link')).toHaveAttribute(
      'href',
      '/prestataires/saveurs-de-dakar',
    );
  });

  it('le cœur ajoute un favori sans ouvrir le profil, et le garde au rechargement', async () => {
    const { router } = renderRoute('/recherche?q=Dakar');
    const heart = await screen.findByRole('button', { name: 'Favori : Saveurs de Dakar' });
    expect(heart).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(heart);

    expect(heart).toHaveAttribute('aria-pressed', 'true');
    expect(router.state.location.pathname).toBe('/recherche');
    expect(localStorage.getItem('afro-marketplace:favorites')).toContain('prov-saveurs-de-dakar');

    await userEvent.click(heart);
    expect(heart).toHaveAttribute('aria-pressed', 'false');
  });

  it('passe en liste puis en grille sans toucher à la recherche', async () => {
    const { router } = renderRoute('/recherche?origines=senegal&page=1');
    await screen.findByText('6 prestataires');
    const grid = screen.getByRole('button', { name: 'Grille' });
    const list = screen.getByRole('button', { name: 'Liste' });
    expect(grid).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(list);

    expect(list).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('region', { name: 'Résultats' }).querySelector('ul')).toHaveAttribute(
      'data-view',
      'list',
    );
    expect(router.state.location.search).toBe('?origines=senegal&page=1');
    expect(await resultNames()).toHaveLength(6);
    // Le choix est retenu pour la prochaine visite.
    expect(localStorage.getItem('afro-marketplace:results-view')).toContain('"list"');

    await userEvent.click(grid);
    expect(grid).toHaveAttribute('aria-pressed', 'true');
  });

  it('va directement à une page avec son numéro', async () => {
    const { router } = renderRoute('/recherche');
    await screen.findByText('Page 1 sur 3');
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Précédent' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Page 3' }));

    await waitFor(() => expect(router.state.location.search).toBe('?page=3'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute(
        'aria-current',
        'page',
      ),
    );
  });

  it('choisit une note minimale', async () => {
    const { router } = renderRoute('/recherche');
    await screen.findByText('33 prestataires');

    await userEvent.click(screen.getByRole('radio', { name: '4,5 et plus' }));

    await waitFor(() => expect(router.state.location.search).toBe('?note=4.5'));
    expect(screen.getByRole('radio', { name: '4,5 et plus' })).toBeChecked();
  });

  it('« Réinitialiser » efface tous les filtres', async () => {
    const { router } = renderRoute('/recherche?origines=senegal&ville=Paris&note=4');
    await screen.findByText(/^\d+ prestataires?$/);

    await userEvent.click(screen.getByRole('button', { name: 'Réinitialiser' }));

    await waitFor(() => expect(router.state.location.search).toBe(''));
    await waitFor(() => expect(within(topSearch()).getByLabelText('Où ?')).toHaveValue(''));
  });

  it('« Voir plus » déplie toutes les origines', async () => {
    renderRoute('/recherche');
    const more = await screen.findByRole('button', { name: /^Voir plus/ });
    expect(screen.queryByRole('checkbox', { name: 'Haïti' })).not.toBeInTheDocument();

    await userEvent.click(more);

    expect(screen.getByRole('checkbox', { name: 'Haïti' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Voir moins/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });
});

describe('Page catégorie (P4)', () => {
  it('affiche le titre, les sous-catégories et les prestataires de la catégorie', async () => {
    renderRoute('/categories/musique-animation');

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Musique & animation afro en Île-de-France',
      }),
    ).toBeInTheDocument();
    const subCategories = screen.getByRole('list', { name: 'Sous-catégories' });
    expect(within(subCategories).getByRole('link', { name: 'DJ' })).toHaveAttribute(
      'href',
      '/categories/dj',
    );
    const names = await resultNames();
    expect(names).toContain('DJ Makossa Vibes');
    expect(names).not.toContain('Saveurs de Dakar');
    // La catégorie est imposée : pas de liste « Catégorie » dans les filtres.
    expect(screen.queryByLabelText('Catégorie')).not.toBeInTheDocument();
  });

  it('« Rechercher » avec la même prestation reste sur la page catégorie', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/categories/traiteurs');
    await resultNames();
    const pill = topSearch();
    await waitFor(() => expect(within(pill).getByLabelText('Quoi ?')).toHaveValue('Traiteurs'));

    await user.click(within(pill).getByLabelText('Où ?'));
    await user.click(within(pill).getByRole('option', { name: /Paris/ }));
    await user.click(within(pill).getByRole('button', { name: 'Rechercher' }));

    await waitFor(() => expect(router.state.location.search).toBe('?ville=Paris'));
    expect(router.state.location.pathname).toBe('/categories/traiteurs');
  });

  it('« Rechercher » avec une autre prestation mène à la recherche générale', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/categories/traiteurs?origines=senegal');
    await resultNames();
    const pill = topSearch();

    await user.click(within(pill).getByLabelText('Quoi ?'));
    await user.clear(within(pill).getByLabelText('Quoi ?'));
    await user.type(within(pill).getByLabelText('Quoi ?'), 'DJ');
    await user.click(await within(pill).findByRole('option', { name: /^DJ/ }));
    await user.click(within(pill).getByRole('button', { name: 'Rechercher' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/recherche'));
    expect(router.state.location.search).toBe('?categorie=dj&origines=senegal');
  });

  it('donne un titre à l’onglet pour Google', async () => {
    renderRoute('/categories/traiteurs');

    await screen.findByRole('heading', { level: 1, name: 'Traiteurs afro en Île-de-France' });
    await waitFor(() => expect(document.title).toBe('Traiteurs afro en Île-de-France · Wenzee'));
  });

  it('affiche une 404 pour une catégorie inconnue', async () => {
    renderRoute('/categories/nimporte-quoi');

    expect(await screen.findByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument();
  });
});
