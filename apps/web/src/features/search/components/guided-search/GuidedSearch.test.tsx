import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderRoute';
import { upcomingSaturday, useHeroSearchInView } from '../../lib/searchDraft';

/** La pilule du hero (tablette et ordinateur) : le formulaire « Rechercher un prestataire ». */
async function heroPill() {
  return screen.findByRole('search', { name: 'Rechercher un prestataire' });
}

describe('Recherche en pilule (ordinateur)', () => {
  it('Quoi → Où → Quand : chaque choix passe à l’étape suivante, puis mène aux résultats', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/');
    const pill = await heroPill();

    // « Quoi ? » : on tape, les prestations correspondantes s'affichent.
    await user.click(within(pill).getByLabelText('Quoi ?'));
    expect(pill).toHaveAttribute('data-open', 'what');
    await user.type(within(pill).getByLabelText('Quoi ?'), 'trait');
    await user.click(await within(pill).findByRole('option', { name: /^Traiteurs/ }));

    // On passe tout seul à « Où ? ».
    const where = within(pill).getByLabelText('Où ?');
    await waitFor(() => expect(where).toHaveFocus());
    expect(pill).toHaveAttribute('data-open', 'where');
    expect(within(pill).getByLabelText('Quoi ?')).toHaveValue('Traiteurs');
    await user.click(within(pill).getByRole('option', { name: /Paris/ }));

    // Puis à « Quand ? » : le calendrier et ses raccourcis.
    expect(pill).toHaveAttribute('data-open', 'when');
    const calendar = within(pill).getByRole('dialog', { name: 'Choisir la date de l’événement' });
    await user.click(within(calendar).getByRole('button', { name: 'Ce samedi' }));
    expect(within(calendar).getByRole('button', { name: 'Ce samedi' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(within(pill).getByRole('button', { name: 'Rechercher' }));
    await screen.findByRole('heading', { level: 1, name: 'Rechercher un prestataire' });
    expect(router.state.location.pathname).toBe('/recherche');
    expect(router.state.location.search).toBe(
      `?categorie=traiteurs&ville=Paris&date=${upcomingSaturday()}`,
    );
  });

  it('au clavier : flèches pour choisir, Entrée pour valider, Échap pour fermer', async () => {
    const user = userEvent.setup();
    renderRoute('/');
    const pill = await heroPill();

    await user.click(within(pill).getByLabelText('Où ?'));
    await user.keyboard('{ArrowDown}');
    const where = within(pill).getByLabelText('Où ?');
    expect(where).toHaveAttribute('aria-activedescendant');
    expect(within(pill).getByRole('option', { name: /Paris/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.keyboard('{Enter}');
    expect(where).toHaveValue('Paris');
    expect(pill).toHaveAttribute('data-open', 'when');

    await user.keyboard('{Escape}');
    expect(pill).not.toHaveAttribute('data-open');
    await waitFor(() => expect(within(pill).queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('un texte libre sans catégorie devient une recherche par mot-clé ; une ville hors liste reste possible', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/');
    const pill = await heroPill();

    await user.type(within(pill).getByLabelText('Quoi ?'), 'mafé');
    await user.click(within(pill).getByLabelText('Où ?'));
    await user.type(within(pill).getByLabelText('Où ?'), 'Rouen');
    expect(within(pill).getByRole('option', { name: /Rouen/ })).toHaveTextContent(
      'Chercher dans cette ville',
    );
    await user.click(within(pill).getByRole('button', { name: 'Rechercher' }));

    await screen.findByRole('heading', { level: 1, name: 'Rechercher un prestataire' });
    expect(router.state.location.search).toBe('?q=maf%C3%A9&ville=Rouen');
  });

  it('la croix efface un champ ; sans critère, on voit toutes les annonces', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/');
    const pill = await heroPill();

    await user.type(within(pill).getByLabelText('Où ?'), 'Paris');
    await user.click(within(pill).getByRole('button', { name: 'Effacer le lieu' }));
    expect(within(pill).getByLabelText('Où ?')).toHaveValue('');

    await user.click(within(pill).getByRole('button', { name: 'Rechercher' }));
    await screen.findByRole('heading', { level: 1, name: 'Rechercher un prestataire' });
    expect(router.state.location.search).toBe('');
  });

  it('les univers s’affichent tant que rien n’est tapé ; aucun résultat : un message d’aide', async () => {
    const user = userEvent.setup();
    renderRoute('/');
    const pill = await heroPill();

    await user.click(within(pill).getByLabelText('Quoi ?'));
    const list = await within(pill).findByRole('listbox', { name: 'Prestations proposées' });
    expect(within(list).getAllByRole('option')).toHaveLength(8);
    expect(within(list).getByRole('option', { name: 'Beauté & soins' })).toBeInTheDocument();

    await user.type(within(pill).getByLabelText('Quoi ?'), 'zzzz');
    expect(within(pill).getByText(/Aucune prestation ne correspond/)).toBeInTheDocument();
  });
});

describe('Recherche plein écran (téléphone)', () => {
  it('s’ouvre par étapes et mène aux résultats', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/');

    await user.click(await screen.findByRole('button', { name: /Que recherchez-vous/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Votre recherche' });
    expect(within(dialog).getByRole('heading', { name: 'Que recherchez-vous ?' })).toBeVisible();

    await user.click(within(dialog).getByRole('option', { name: 'Traiteur & boissons' }));
    expect(
      await within(dialog).findByRole('heading', { name: 'Où se passe l’événement ?' }),
    ).toBeInTheDocument();
    // L'étape « Quoi » est repliée et résume le choix.
    expect(
      within(dialog).getByRole('button', { name: /Quoi\s*Traiteur & boissons/ }),
    ).toBeVisible();

    await user.type(within(dialog).getByLabelText('Ville de l’événement'), 'Mont');
    await user.click(within(dialog).getByRole('option', { name: /Montreuil/ }));
    expect(
      await within(dialog).findByRole('heading', { name: 'Quand a lieu l’événement ?' }),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Rechercher' }));
    await screen.findByRole('heading', { level: 1, name: 'Rechercher un prestataire' });
    expect(router.state.location.search).toBe('?categorie=traiteur-boissons&ville=Montreuil');
  });

  it('« Tout effacer » vide la recherche et revient à « Quoi »', async () => {
    const user = userEvent.setup();
    renderRoute('/');

    await user.click(await screen.findByRole('button', { name: /Que recherchez-vous/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Votre recherche' });
    await user.click(within(dialog).getByRole('button', { name: /^Où/ }));
    await user.type(within(dialog).getByLabelText('Ville de l’événement'), 'Paris');
    await user.click(within(dialog).getByRole('button', { name: 'Tout effacer' }));

    expect(
      await within(dialog).findByRole('heading', { name: 'Que recherchez-vous ?' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Où\s*Partout/ })).toBeInTheDocument();
  });
});

describe('Recherche de l’en-tête (accueil, après le hero)', () => {
  it('remplace les liens par une recherche compacte qui se déplie sur l’étape cliquée', async () => {
    const user = userEvent.setup();
    renderRoute('/');
    await heroPill();
    const header = screen.getByRole('banner');
    expect(within(header).queryByRole('group', { name: 'Recherche rapide' })).toBeNull();

    // La recherche du hero sort de l'écran.
    act(() => useHeroSearchInView.getState().setInView(false));
    const compact = await within(header).findByRole('group', { name: 'Recherche rapide' });
    expect(within(header).getAllByRole('navigation', { hidden: true })[0]).toHaveAttribute(
      'aria-hidden',
      'true',
    );

    await user.click(within(compact).getByRole('button', { name: 'Où : Partout' }));
    const expanded = await within(header).findByRole('search', {
      name: 'Rechercher un prestataire',
    });
    expect(expanded).toHaveAttribute('data-variant', 'header');
    await waitFor(() => expect(within(expanded).getByLabelText('Où ?')).toHaveFocus());

    // Échap referme et la recherche compacte revient.
    await user.keyboard('{Escape}');
    expect(await within(header).findByRole('group', { name: 'Recherche rapide' })).toBeVisible();
  });

  it('sur téléphone, une loupe ouvre la recherche plein écran', async () => {
    const user = userEvent.setup();
    renderRoute('/');
    await heroPill();
    act(() => useHeroSearchInView.getState().setInView(false));

    const header = screen.getByRole('banner');
    await user.click(within(header).getByRole('button', { name: 'Rechercher un prestataire' }));
    expect(await screen.findByRole('dialog', { name: 'Votre recherche' })).toBeInTheDocument();
  });
});
