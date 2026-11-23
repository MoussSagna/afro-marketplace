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

describe('Recherche (P2)', () => {
  it('affiche les prestataires publiés et leur nombre', async () => {
    renderRoute('/recherche');

    expect(await screen.findByText('22 prestataires')).toBeInTheDocument();
    expect(await resultNames()).toHaveLength(12); // première page
  });

  it('cocher « Sénégal » filtre les résultats et l’écrit dans l’adresse', async () => {
    const { router } = renderRoute('/recherche');
    await screen.findByText('22 prestataires');

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Sénégal' }));

    expect(await screen.findByText('4 prestataires')).toBeInTheDocument();
    expect(await resultNames()).toContain('Saveurs de Dakar');
    expect(router.state.location.search).toBe('?origines=senegal');
  });

  it('lit les filtres depuis l’adresse (lien partagé)', async () => {
    renderRoute('/recherche?categorie=dj&tri=prix-croissant');

    expect(await screen.findByText('2 prestataires')).toBeInTheDocument();
    expect(await resultNames()).toEqual(['Afro Beats by Kofi', 'DJ Makossa Vibes']);
    expect(screen.getByLabelText('Trier par')).toHaveValue('price_asc');
  });

  it('applique la ville quand on valide le champ', async () => {
    const { router } = renderRoute('/recherche');
    await screen.findByText('22 prestataires');

    await userEvent.type(screen.getByLabelText('Ville'), 'Créteil{Enter}');

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
    expect(await screen.findByText('22 prestataires')).toBeInTheDocument();
  });

  it('affiche un message clair si l’API échoue', async () => {
    server.use(http.get('*/api/providers', () => new HttpResponse(null, { status: 500 })));
    renderRoute('/recherche');

    expect(await screen.findByRole('alert')).toHaveTextContent('La recherche n’a pas pu aboutir');
  });

  it('passe à la page suivante', async () => {
    const { router } = renderRoute('/recherche');
    const firstPage = await resultNames();

    await userEvent.click(screen.getByRole('button', { name: 'Suivant' }));

    await waitFor(() => expect(router.state.location.search).toBe('?page=2'));
    expect(await screen.findByText('Page 2 sur 2')).toBeInTheDocument();
    await waitFor(async () => expect((await resultNames())[0]).not.toBe(firstPage[0]));
    expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled();
  });

  it('changer un filtre revient à la première page', async () => {
    const { router } = renderRoute('/recherche?page=2');
    await screen.findByText('Page 2 sur 2');

    await userEvent.click(
      await screen.findByRole('checkbox', { name: 'Pros vérifiés uniquement' }),
    );

    await waitFor(() => expect(router.state.location.search).toBe('?verifie=1'));
  });
});

describe('Page catégorie (P4)', () => {
  it('affiche le titre, les sous-catégories et les prestataires de la catégorie', async () => {
    renderRoute('/categories/spectacle');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Spectacle afro en Île-de-France' }),
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

  it('donne un titre à l’onglet pour Google', async () => {
    renderRoute('/categories/traiteurs');

    await screen.findByRole('heading', { level: 1, name: 'Traiteur afro en Île-de-France' });
    await waitFor(() => expect(document.title).toBe('Traiteur afro en Île-de-France · Wenzee'));
  });

  it('affiche une 404 pour une catégorie inconnue', async () => {
    renderRoute('/categories/nimporte-quoi');

    expect(await screen.findByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument();
  });
});
